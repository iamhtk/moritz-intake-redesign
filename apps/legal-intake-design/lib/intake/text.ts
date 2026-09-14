/**
 * Cleanup applied to every string a model produces before anyone reads it.
 *
 * The prompts ask for no em dashes. The prompts are not enough, models reach
 * for them constantly, and one slipping into a case title or a confirmation
 * email is exactly the kind of tell that makes a prototype read as generated.
 * So the rule is stated in the prompt and enforced here.
 *
 * Deliberately NOT applied to `sourceQuote`. That string is a verbatim
 * quotation checked against the real text of the document; rewriting its
 * punctuation would make the brief show something the document does not say.
 */

/**
 * Em dash, en dash, horizontal bar, and the two-hyphen shorthand.
 *
 * Written as escapes on purpose. A literal dash here is invisible in review and
 * one careless find-and-replace over this file turns the pattern into something
 * that matches commas, which fails silently and lets every dash through.
 */
const DASH_PATTERN = /\s*(?:[\u2014\u2013\u2015]|--)\s*/g;

export function stripDashes(text: string): string {
  return (
    text
      .replace(DASH_PATTERN, ', ')
      .replace(/ {2,}/g, ' ')
      // A dash standing in for a colon or a bracket can leave doubled-up
      // punctuation behind once it is swapped for a comma.
      .replace(/,\s*,/g, ',')
      .replace(/([,:;])\s*([.,:;])/g, '$2')
      .trim()
  );
}

/** The instruction that goes in every prompt, so the two never drift apart. */
export const NO_DASH_RULE = `Never use an em dash or an en dash. Not in a reply, not in a title, not in a
summary, not anywhere. Use a comma, a colon, parentheses, or the word "to" for
a range. This matters: a stray dash makes the writing read as machine-made.`;
