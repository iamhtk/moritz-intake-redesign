/**
 * A page's text, as one string with a map back to where each run of it sits.
 *
 * Search needs two different things and they pull in opposite directions. To
 * count matches across a document it needs plain text for every page, cheaply,
 * without rendering any of them. To draw a match it needs to know which
 * on-screen glyphs the match covers. So the text index below carries only the
 * first — a string, and the offsets of the pdf.js text items inside it — and
 * the page component turns an offset range into rectangles by asking the
 * browser, once that page is actually on screen. Nothing here guesses at
 * geometry from font metrics.
 */

import type { PDFDocumentProxy, PDFPageProxy } from 'unpdf/pdfjs';

import type { DocumentHighlight } from './types';

/** One pdf.js text item's slice of the page string. */
export type TextRun = { start: number; end: number };

export type PageTextIndex = {
  page: number;
  /** Every item's `str`, joined — see `joinItems` for the spacing rule. */
  text: string;
  runs: readonly TextRun[];
};

/**
 * Joins text items into one string, inserting the spaces the PDF left implicit.
 *
 * pdf.js hands back the runs a PDF's content stream actually contains, and a
 * PDF is not obliged to put a space in one. A line break is usually its own
 * item with `hasEOL`, and a phrase can be split mid-way where the typesetter
 * kerned it, so joining blindly produces "noticeperiod" — which no client will
 * ever search for. A space goes in wherever neither side already has one, and
 * that space belongs to the run before it so no offset ever points into a
 * character that is not in the document.
 */
/**
 * One of pdf.js's text items, as its own types describe them.
 *
 * Derived from the method's return type rather than imported: pdf.js exports
 * `TextItem` from its internals but not from the entry point this app reaches
 * it through, and re-declaring the shape by hand is how the two drift.
 */
type TextContentItem = Awaited<
  ReturnType<PDFPageProxy['getTextContent']>
>['items'][number];

export type TextItemLike = Extract<TextContentItem, { str: string }>;

/**
 * The page string and its runs, from the items pdf.js returned.
 *
 * Exported because two callers must agree on it down to the character. The
 * search index is built from it here, and `PdfPage` builds its text layer from
 * the same items — a highlight is an offset into this string resolved against
 * those spans, so a spacing rule applied in one place and not the other would
 * draw every highlight a few characters out.
 */
export function buildPageIndex(
  page: number,
  items: readonly TextItemLike[],
): PageTextIndex {
  return { page, ...joinItems(items) };
}

function joinItems(items: readonly TextItemLike[]): {
  text: string;
  runs: TextRun[];
} {
  let text = '';
  const runs: TextRun[] = [];

  items.forEach((item, index) => {
    const start = text.length;
    text += item.str;
    const next = items[index + 1];
    const needsGap =
      next !== undefined &&
      item.str !== '' &&
      !/\s$/.test(item.str) &&
      !/^\s/.test(next.str);
    if (item.hasEOL === true) text += '\n';
    else if (needsGap) text += ' ';
    runs.push({ start, end: text.length });
  });

  return { text, runs };
}

/** Drops the marked-content markers, which carry no text. */
export function textItemsOf(items: readonly TextContentItem[]): TextItemLike[] {
  return items.filter((item): item is TextItemLike => 'str' in item);
}

export async function pageTextIndex(
  doc: PDFDocumentProxy,
  page: number,
): Promise<PageTextIndex> {
  const proxy = await doc.getPage(page);
  const content = await proxy.getTextContent();
  return buildPageIndex(page, textItemsOf(content.items));
}

/**
 * The page string, folded for matching, with a way back to the original.
 *
 * Case and whitespace are the two things a client will get wrong about a
 * quotation and the two things a PDF will disagree with them about: a clause
 * broken over two lines contains a newline where they typed a space. Both are
 * folded away — but folding changes lengths, so every folded character records
 * the original index it came from. Without that map a match would be found in
 * one string and drawn in another.
 */
type FoldedText = { folded: string; origin: number[] };

function fold(text: string): FoldedText {
  const folded: string[] = [];
  const origin: number[] = [];
  let lastWasSpace = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]!;
    if (/\s/.test(char)) {
      if (lastWasSpace || folded.length === 0) continue;
      folded.push(' ');
      origin.push(index);
      lastWasSpace = true;
      continue;
    }
    folded.push(char.toLowerCase());
    origin.push(index);
    lastWasSpace = false;
  }

  return { folded: folded.join(''), origin };
}

/** What the client typed, folded the same way so the two can be compared. */
function foldQuery(query: string): string {
  return query.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Ignores single keystrokes, so typing does not light up the whole document. */
export const MIN_QUERY_LENGTH = 2;

/**
 * Every occurrence of `query` across the pages indexed so far, in reading
 * order.
 *
 * Returns highlights carrying character ranges rather than rectangles: the
 * pages that are not on screen have no geometry yet, and the count in the
 * toolbar must not wait for them to be rendered to be right.
 */
export function findMatches(
  indexes: readonly PageTextIndex[],
  query: string,
  kind: DocumentHighlight['kind'] = 'find',
): DocumentHighlight[] {
  const needle = foldQuery(query);
  if (needle.length < MIN_QUERY_LENGTH) return [];

  const matches: DocumentHighlight[] = [];

  for (const index of [...indexes].sort((a, b) => a.page - b.page)) {
    const { folded, origin } = fold(index.text);
    let at = folded.indexOf(needle);
    while (at !== -1) {
      const start = origin[at];
      const end = origin[at + needle.length - 1];
      if (start !== undefined && end !== undefined) {
        matches.push({
          id: `m_${index.page}_${start}`,
          page: index.page,
          kind,
          range: { start, end: end + 1 },
        });
      }
      at = folded.indexOf(needle, at + Math.max(1, needle.length));
    }
  }

  return matches;
}

/**
 * The first place a verified quote sits in the document.
 *
 * This is the function the evidence seam will call (see `EvidenceAnchor`): the
 * extractor already returns the exact words it read a value from, and finding
 * those words is the same operation as finding what a client typed. Long quotes
 * are the normal case and they are the ones that break — a quote lifted across
 * a page boundary exists in neither page's text — so a failed exact search
 * falls back to the quote's first clause, which is what `locateQuote` does
 * server-side for the same reason.
 */
export function findQuote(
  indexes: readonly PageTextIndex[],
  quote: string,
): DocumentHighlight | null {
  const exact = findMatches(indexes, quote, 'evidence');
  if (exact.length > 0) return exact[0] ?? null;

  const head = quote
    .split(/[;,.]|\s+—\s+/)
    .map((part) => part.trim())
    .find((part) => part.length >= 12);
  if (head === undefined) return null;

  return findMatches(indexes, head, 'evidence')[0] ?? null;
}
