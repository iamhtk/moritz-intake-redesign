/**
 * Does this quote actually appear in the document?
 *
 * The model tells us where it read a value ("Notice period clause, page 3") and
 * quotes the exact words. Neither claim is trusted. We pull the real text out of
 * the PDF ourselves and check the quote against it. If it is not there, the
 * model made it up, and the field loses its source.
 *
 * Text pulled out of a PDF never matches a quote character for character, so
 * both sides are normalized the same way before comparing. Three things cause
 * almost every mismatch:
 *
 * ligatures "notiﬁcation" is one glyph in the PDF, two letters in the quote
 * hyphenation a word broken across a line break as "termi-\nnation"
 * smart quotes the PDF's curly quotes against the model's straight ones
 *
 * Tuned toward false negatives. Wrongly downgrading a correct extraction costs
 * the client one extra glance; wrongly accepting an invented quote is the exact
 * failure this whole rule exists to prevent.
 */

/**
 * Below this length a quote proves nothing, "Ltd" or "the Agreement" appears in
 * every contract ever written, so matching it is not evidence of anything.
 */
export const MINIMUM_QUOTE_LENGTH = 12;

export function normalizeForMatch(text: string): string {
  return (
    text
      // Ligatures and other compatibility forms: "ﬁ" becomes "fi".
      .normalize('NFKC')
      // Soft hyphens are invisible in the PDF and absent from the quote.
      .replace(/­/g, '')
      // A word split across a line break: "termi-\nnation" becomes "termination".
      .replace(/-[\r\n]+\s*/g, '')
      // Curly quotes and apostrophes.
      .replace(/[‘’‚‛]/g, "'")
      .replace(/[“”„‟]/g, '"')
      // En dash, em dash, minus sign and friends.
      .replace(/[‐-―−]/g, '-')
      // Any run of spaces, tabs or newlines becomes one space, so a quote that
      // spans a line break still matches.
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
  );
}

/** Last resort: compare letters and digits only, ignoring all punctuation. */
function alphanumericOnly(text: string): string {
  return text.replace(/[^\p{L}\p{N}]/gu, '');
}

/** One continuous run of words, checked against the document. */
function segmentAppears(segment: string, normalizedDocument: string): boolean {
  if (segment.length < MINIMUM_QUOTE_LENGTH) return false;
  if (normalizedDocument.includes(segment)) return true;

  const stripped = alphanumericOnly(segment);
  if (stripped.length < MINIMUM_QUOTE_LENGTH) return false;
  return alphanumericOnly(normalizedDocument).includes(stripped);
}

/**
 * True when the quote really is in the document.
 *
 * Models often cite two clauses at once and join them with an ellipsis ,
 * "clause 2.1 says X ... clause 9.1 says Y". That is two real quotes, not an
 * invented one, so each part is checked separately and every part must be
 * found. Requiring the whole thing to appear as one run would reject honest
 * citations, which is the failure mode that makes the confirm step feel like
 * nagging.
 *
 * Each part is matched twice: normalized text first, then letters-and-digits
 * only, for when the PDF and the model disagree about punctuation or spacing.
 */
export function verifySourceQuote(
  quote: string,
  documentText: string,
): boolean {
  if (typeof quote !== 'string' || typeof documentText !== 'string') {
    return false;
  }

  const normalizedDocument = normalizeForMatch(documentText);
  if (normalizedDocument === '') return false;

  const segments = normalizeForMatch(quote)
    .split(/\s*(?:\.{3,}|…)\s*/)
    .map((part) => part.trim())
    .filter((part) => part !== '');

  if (segments.length === 0) return false;

  // Every part must be found. One real quote plus one invented one is still a
  // fabrication.
  return segments.every((segment) =>
    segmentAppears(segment, normalizedDocument),
  );
}

/** One document's text layer, kept under its own name. */
export type DocumentText = { name: string; text: string };

/**
 * Which of several attached documents a quote actually came from.
 *
 * With one attachment, verification only had to answer "is this real". With a
 * bundle it has to answer "which file is this", and that is a different job
 * with a worse failure mode: naming the wrong file is more damaging than naming
 * none, because the client opens the order form looking for a clause that is in
 * the MSA, does not find it, and concludes the brief is wrong about everything.
 *
 * So the file is decided by content rather than by position. The model is never
 * asked which document it read, because it would be guessing at a label, and it
 * cannot be checked; a quote that appears in a document's real text can be.
 *
 * Documents with no text layer (photographs, scans) can never match, which is
 * correct: there is nothing to check against, so nothing is claimed.
 *
 * First match wins. Two files containing the same sentence is a near-duplicate
 * (a renewal beside the original it renews), and in that case either name is
 * true, so the earlier one is used rather than reporting both.
 */
export function findSourceDocument(
  quote: string,
  documents: readonly DocumentText[],
): DocumentText | null {
  return (
    documents.find(
      (document) =>
        document.text.trim() !== '' && verifySourceQuote(quote, document.text),
    ) ?? null
  );
}

/**
 * A verified quote, shown where it sits in the document (L3).
 *
 * Three verbatim slices of the real text: the sentence run the quote was found
 * in, and one sentence either side of it for context. All three come straight
 * out of the PDF's own text layer with no rewriting, because the entire value
 * of this is that it is the document rather than an account of it.
 */
/**
 * The confidentiality bound on a passage (V40).
 *
 * The rule, written where it is enforced: **this product never renders a
 * client's document at full length.** A verified quote earns the sentence it
 * sits in and one either side; it does not earn a page. That is a privacy
 * stance rather than a layout preference, and it holds in three places at once
 * — on screen, in the JSON that crosses the wire from `/api/extract`, and in any
 * screenshot of either. A contract is the most sensitive thing a client hands
 * over in this flow, and the amount of it this app is willing to show back is a
 * decision worth making once and keeping.
 *
 * `MAX_RUN_SENTENCES` is most of that bound. This is the part it does not
 * cover: a "sentence" is whatever the boundary rule found, and a PDF with no
 * terminators and no clause numbers — a scanned page run through OCR, a table
 * flattened into prose — can put thousands of characters into one. Without a
 * character cap the bound is "three sentences", which on that document is the
 * whole page.
 *
 * 600 characters is about a long clause with its neighbours, which is the unit
 * a client checks a value against. The truncation is marked rather than silent,
 * for the same reason the `+n` overflow elsewhere is stated: the client has to
 * be able to tell they are looking at an extract.
 */
const MAX_PASSAGE_CHARS = 600;

/** Says a slice was cut, rather than trailing off and implying it was not. */
const TRUNCATION = '…';

/**
 * Trim a slice to the bound, on a word boundary, marked.
 *
 * The *outer* slices are what get trimmed, and asymmetrically: `before` keeps
 * its end and `after` keeps its start, because the words nearest the quote are
 * the ones doing the work. Trimming both from the same side would throw away
 * the half that mattered.
 */
function bound(text: string, keep: 'start' | 'end'): string {
  if (text.length <= MAX_PASSAGE_CHARS) return text;
  if (keep === 'start') {
    const cut = text.slice(0, MAX_PASSAGE_CHARS);
    const lastSpace = cut.lastIndexOf(' ');
    return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}${TRUNCATION}`;
  }
  const cut = text.slice(text.length - MAX_PASSAGE_CHARS);
  const firstSpace = cut.indexOf(' ');
  return `${TRUNCATION}${(firstSpace >= 0 ? cut.slice(firstSpace + 1) : cut).trimStart()}`;
}

/**
 * The longest run of sentences a quote is allowed to span.
 *
 * Bounds the search, which is otherwise every contiguous run in the document
 * and re-normalises a growing slice on each one. Four is generous: a citation
 * spanning more than four sentences is not a quote, it is a page, and the
 * ellipsis-joined multi-clause form is handled separately above.
 */
const MAX_RUN_SENTENCES = 4;

export type SourcePassage = {
  /** The sentence before the match, or `''` at the start of the document. */
  before: string;
  /** The sentence run containing the quote. Never empty when this exists. */
  match: string;
  /** The sentence after the match, or `''` at the end of the document. */
  after: string;
};

/**
 * Sentence boundaries, as spans into the original text.
 *
 * Bounded by sentences rather than by a character window, and that is the
 * decision that makes the rest of this simple. The obvious implementation of
 * "show the quote in context" is to find the quote's offset and slice N
 * characters either side — but the quote is matched against a *normalised* copy
 * of the document (ligatures folded, hyphenation joined, whitespace collapsed),
 * so a position in that copy is not a position in the real text. Mapping back
 * means carrying an index map through `normalizeForMatch`, which is the one
 * function here that must not change: it is what decides whether a source is
 * believed at all.
 *
 * Splitting the *original* text into sentences and normalising each one for
 * comparison sidesteps the whole problem. Nothing is mapped back, because
 * nothing ever leaves the original: the slices returned are cut on boundaries
 * found in the real text. It also reads better than a character window, which
 * would routinely begin and end mid-word.
 *
 * **A newline is not automatically a boundary**, and getting that wrong is
 * visible in the output. A PDF's text layer breaks at every *visual line*, not
 * at every sentence, so treating `\n` as a boundary chops wrapped prose
 * mid-clause: run against the real demo contract, the passage ended at
 * "...to the Customer in accordance with" and the rest of the same sentence
 * became the line *after* it. Read as a citation, that is a quote stopping
 * before its own qualifier, which is precisely the cherry-picking this feature
 * exists to rule out.
 *
 * So a line break only ends a unit when something else says it does:
 *
 *   - a terminator before it — an ordinary sentence end;
 *   - a blank line — a paragraph break;
 *   - a clause number after it — "11.3 Late payment bears interest", which is
 *     a unit whether or not the line above ended in a period. Contracts are
 *     mostly this shape, which is why the rule is here at all.
 *
 * Anything else is a wrap, and a wrap is not a boundary. This also means a word
 * the PDF hyphenated across a line stays inside one unit, where
 * `normalizeForMatch` can rejoin it.
 */
function sentenceSpans(text: string): { start: number; end: number }[] {
  const spans: { start: number; end: number }[] = [];
  const boundary =
    /(?<=[.;:!?])[ \t\r\n]+|[\r\n]{2,}|[\r\n]+(?=[ \t]*\d+(?:\.\d+)*\.?[ \t])/g;
  let start = 0;
  for (const match of text.matchAll(boundary)) {
    const end = match.index;
    if (end > start && text.slice(start, end).trim() !== '') {
      spans.push({ start, end });
    }
    start = end + match[0].length;
  }
  if (start < text.length && text.slice(start).trim() !== '') {
    spans.push({ start, end: text.length });
  }
  return spans;
}

/**
 * Where in the document this quote actually sits.
 *
 * Finds the shortest run of consecutive sentences whose normalised text
 * contains the quote, then returns it with one sentence of padding either side.
 * `null` when the quote is not there, which for a field that reached the brief
 * should be impossible — `findSourceDocument` already refused it — but is the
 * honest return rather than an empty passage that would render as a blank
 * panel.
 *
 * **Only the first clause of a multi-clause citation.** A model citing two
 * clauses joined by an ellipsis is a real and accepted pattern
 * (`verifySourceQuote` checks each part), and this locates the first part only.
 * That is a deliberate limit rather than an oversight: the row already shows
 * the full quote including both clauses, and two expanding passages is more
 * panel than one line of a brief can hold. The client sees the first clause in
 * context and the second quoted, which is strictly more than they had.
 *
 * @param contextSentences how many sentences of padding either side. One. Two
 * turns a passage into a page, and the question being answered is "was this
 * cherry-picked", which the immediately surrounding sentence settles.
 */
export function locateQuote(
  quote: string,
  documentText: string,
  contextSentences = 1,
): SourcePassage | null {
  if (typeof quote !== 'string' || typeof documentText !== 'string') {
    return null;
  }

  const segment = normalizeForMatch(quote)
    .split(/\s*(?:\.{3,}|…)\s*/)
    .map((part) => part.trim())
    .find((part) => part !== '');
  if (segment === undefined || segment.length < MINIMUM_QUOTE_LENGTH) {
    return null;
  }

  const spans = sentenceSpans(documentText);
  if (spans.length === 0) return null;

  /*
   * Shortest run first: every single sentence, then every pair, and so on. A
   * quote usually sits inside one sentence, and starting wide would return a
   * whole paragraph for a quote that only needed a line.
   */
  for (
    let length = 1;
    length <= Math.min(MAX_RUN_SENTENCES, spans.length);
    length += 1
  ) {
    for (let first = 0; first + length <= spans.length; first += 1) {
      const last = first + length - 1;
      /*
       * Normalise the *contiguous original slice*, not a join of separately
       * normalised sentences.
       *
       * This is the one non-obvious line in the function and it is load-bearing.
       * `normalizeForMatch` rejoins a word the PDF hyphenated across a line
       * break ("termi-\nnation" becomes "termination") — and a newline is also
       * a sentence boundary here, so splitting first puts "termi-" at the end of
       * one sentence and "nation" at the start of the next, where that rule can
       * never fire. Joining the pieces afterwards gives "termi- nation", which
       * does not contain the quote.
       *
       * The consequence was the worst shape this feature could fail in: the
       * verifier accepts the quote (it normalises the whole document at once, so
       * the join works) and the locator then cannot find it — so the row shows
       * a source that will not open. Normalising a slice of the original means
       * the locator sees exactly what the verifier saw.
       */
      const run = normalizeForMatch(
        documentText.slice(spans[first]!.start, spans[last]!.end),
      );
      if (!run.includes(segment)) continue;

      const matchStart = spans[first]!.start;
      const matchEnd = spans[last]!.end;
      const beforeIndex = first - contextSentences;
      const afterIndex = last + contextSentences;

      /*
       * Every slice bounded (V40). The match is trimmed from its end and the
       * context slices from their far sides, so what survives is always the
       * text nearest the quote.
       */
      return {
        before:
          beforeIndex >= 0
            ? bound(
                documentText
                  .slice(spans[beforeIndex]!.start, matchStart)
                  .trim(),
                'end',
              )
            : '',
        match: bound(documentText.slice(matchStart, matchEnd).trim(), 'start'),
        after:
          afterIndex < spans.length
            ? bound(
                documentText.slice(matchEnd, spans[afterIndex]!.end).trim(),
                'start',
              )
            : '',
      };
    }
  }

  return null;
}
