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
