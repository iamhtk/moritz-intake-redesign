/**
 * The redline: what one version did to a clause, word by word.
 *
 * A version stores the clause before it and the clause after it, which is
 * enough to work out the edit itself rather than making the reader compare two
 * paragraphs by eye. The result is the shape a legal redline takes on paper —
 * struck-out words where the old wording went, underlined words where the new
 * wording arrived, everything else untouched.
 */

export type RedlineSegment = {
  kind: 'same' | 'inserted' | 'deleted';
  text: string;
};

/** One paragraph of a clause, cut into runs of unchanged, added and removed. */
export type RedlineBlock = RedlineSegment[];

/**
 * Clauses are a paragraph or two, so the table is a few thousand cells at
 * worst. The guard is only there so a pathological body can never lock the
 * page up: past it, the clause is shown as a wholesale replacement.
 */
const MAX_TOKENS = 400;

/**
 * Below this much wording in common, the agent did not edit the clause — it
 * wrote a new one. Threading a word-level redline through a rewrite produces
 * an unreadable stutter of struck and underlined single words, so the clause
 * is shown the way a lawyer would mark it: the old one out, the new one in.
 */
const REWRITE_THRESHOLD = 0.5;

/**
 * A word or two surviving between two edits is not worth breaking the mark-up
 * for. Word bridges those gaps as well, so an edit reads as one continuous
 * phrase rather than a stutter.
 */
const BRIDGE_WORDS = 2;

/**
 * The wording each side of a change, as blocks of text.
 *
 * A clause is usually plain prose, but the later ones in the document carry
 * light markup. Reducing each paragraph to its text is what lets an old side
 * with markup diff against a new side without: the comparison is about the
 * words, and a redlined clause is rendered from these blocks rather than from
 * its original HTML.
 */
export function toBlocks(body: string): string[] {
  if (!body.includes('<')) {
    return body
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  const blocks = body
    .split(/<\/(?:p|li|h[1-6])>/i)
    .map((chunk) => stripTags(chunk))
    .filter(Boolean);

  return blocks.length > 0 ? blocks : [stripTags(body)].filter(Boolean);
}

function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The edit a version made to one clause, paragraph by paragraph.
 *
 * Paragraphs are paired in order: a clause that gained one shows it wholly
 * inserted, one that lost a paragraph shows it wholly struck out. Within a
 * pair, the diff is word-level.
 */
export function redlineBlocks(
  previousBody: string,
  body: string,
): RedlineBlock[] {
  const before = toBlocks(previousBody);
  const after = toBlocks(body);
  const blocks: RedlineBlock[] = [];

  for (let index = 0; index < Math.max(before.length, after.length); index++) {
    const previous = before[index];
    const next = after[index];

    if (previous === undefined) {
      blocks.push([{ kind: 'inserted', text: next! }]);
      continue;
    }
    if (next === undefined) {
      blocks.push([{ kind: 'deleted', text: previous }]);
      continue;
    }
    blocks.push(diffWords(previous, next));
  }

  return blocks;
}

/** Words and the whitespace between them, so a rebuilt line spaces correctly. */
function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((token) => token !== '');
}

function diffWords(previous: string, next: string): RedlineBlock {
  const before = tokenize(previous);
  const after = tokenize(next);

  if (before.length > MAX_TOKENS || after.length > MAX_TOKENS) {
    return replaceWholly(previous, next);
  }

  // Longest common subsequence over tokens: the words both versions share, in
  // order. Whatever is not on that path is what the version added or removed.
  const rows = before.length;
  const columns = after.length;
  const table: number[][] = Array.from({ length: rows + 1 }, () =>
    new Array<number>(columns + 1).fill(0),
  );

  for (let row = rows - 1; row >= 0; row--) {
    for (let column = columns - 1; column >= 0; column--) {
      table[row]![column] =
        before[row] === after[column]
          ? table[row + 1]![column + 1]! + 1
          : Math.max(table[row + 1]![column]!, table[row]![column + 1]!);
    }
  }

  const segments: RedlineSegment[] = [];
  let row = 0;
  let column = 0;

  while (row < rows && column < columns) {
    if (before[row] === after[column]) {
      segments.push({ kind: 'same', text: before[row]! });
      row++;
      column++;
    } else if (table[row + 1]![column]! >= table[row]![column + 1]!) {
      segments.push({ kind: 'deleted', text: before[row]! });
      row++;
    } else {
      segments.push({ kind: 'inserted', text: after[column]! });
      column++;
    }
  }
  while (row < rows) segments.push({ kind: 'deleted', text: before[row++]! });
  while (column < columns) {
    segments.push({ kind: 'inserted', text: after[column++]! });
  }

  const kept = countWords(
    segments.filter((segment) => segment.kind === 'same'),
  );
  const survived =
    kept / Math.max(wordsIn(previous), wordsIn(next), 1) >= REWRITE_THRESHOLD;

  return survived ? group(segments) : replaceWholly(previous, next);
}

/** The clause as it was, then the clause as it now reads. */
function replaceWholly(previous: string, next: string): RedlineBlock {
  return [
    { kind: 'deleted', text: previous },
    // Unmarked, so the sentence that was cut and the one that replaced it do
    // not run into each other.
    { kind: 'same', text: ' ' },
    { kind: 'inserted', text: next },
  ];
}

/**
 * Collects loose tokens into the phrases a reader actually sees.
 *
 * Everything an edit touched, plus the odd word that survived in the middle of
 * it, becomes one struck-out phrase followed by one underlined phrase — the
 * order a redline is read in. Whitespace at the edge of an edit is left with
 * the unchanged text so the page never shows a struck-out space.
 */
function group(segments: RedlineSegment[]): RedlineBlock {
  const bridged = (index: number) => {
    const segment = segments[index];
    if (!segment || segment.kind !== 'same') return false;
    if (wordsIn(segment.text) > BRIDGE_WORDS) return false;
    // Only worth bridging if there is another edit on the far side of it.
    const next = segments[index + 1];
    return Boolean(next && next.kind !== 'same');
  };

  const out: RedlineSegment[] = [];
  let index = 0;

  while (index < segments.length) {
    const segment = segments[index]!;
    if (segment.kind === 'same' && !bridged(index)) {
      out.push({ ...segment });
      index++;
      continue;
    }

    let deleted = '';
    let inserted = '';
    while (
      index < segments.length &&
      (segments[index]!.kind !== 'same' || bridged(index))
    ) {
      const part = segments[index]!;
      if (part.kind !== 'inserted') deleted += part.text;
      if (part.kind !== 'deleted') inserted += part.text;
      index++;
    }

    // Spacing stays wherever the diff put it: a deletion that swallowed the
    // space after it keeps that space struck through, which is how the words
    // either side of an edit stay apart.
    if (!deleted.trim() && !inserted.trim()) {
      out.push({ kind: 'same', text: inserted || deleted });
      continue;
    }
    // One side being nothing but a space means a word was simply added or
    // simply removed. Marking that space would draw a rule across the page
    // for no edit at all, so it goes to the side that has the words.
    if (!inserted.trim()) {
      out.push({ kind: 'deleted', text: keepSpacing(deleted, inserted) });
      continue;
    }
    if (!deleted.trim()) {
      out.push({ kind: 'inserted', text: keepSpacing(inserted, deleted) });
      continue;
    }
    out.push({ kind: 'deleted', text: deleted });
    out.push({ kind: 'inserted', text: inserted });
  }

  return merge(out);
}

/** Runs of the same kind become one mark. */
function merge(segments: RedlineSegment[]): RedlineBlock {
  const merged: RedlineSegment[] = [];
  segments.forEach((segment) => {
    const last = merged[merged.length - 1];
    if (last && last.kind === segment.kind) last.text += segment.text;
    else merged.push({ ...segment });
  });
  return merged.filter((segment) => segment.text !== '');
}

/** Keeps the words on either side of a dropped gap from running together. */
function keepSpacing(kept: string, dropped: string): string {
  if (!dropped || /^\s|\s$/.test(kept)) return kept;
  return `${kept}${dropped}`;
}

function wordsIn(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countWords(segments: RedlineSegment[]): number {
  return segments.reduce((total, segment) => total + wordsIn(segment.text), 0);
}

/** How much of the clause moved, for the note that explains it. */
export function redlineCounts(blocks: RedlineBlock[]) {
  let added = 0;
  let removed = 0;

  blocks.forEach((block) =>
    block.forEach((segment) => {
      if (segment.kind === 'same') return;
      const words = segment.text.trim().split(/\s+/).filter(Boolean).length;
      if (segment.kind === 'inserted') added += words;
      else removed += words;
    }),
  );

  return { added, removed };
}
