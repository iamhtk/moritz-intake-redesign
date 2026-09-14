/**
 * The timestamp on the brief's signature line (item 14).
 *
 * A file note is dated. That is most of what makes it a file note rather than a
 * caption, and it is the detail that tells a client the thing they are looking
 * at is a document with a history rather than a screen that happens to list
 * their answers.
 *
 * Written out long ("12 September 2026") rather than numerically. `12/09/2026`
 * and `09/12/2026` are the same eight characters and two different days, and
 * this product has clients and co-counsel on both sides of that convention.
 * Spelling the month is the only format nobody has to decode.
 *
 * The clock is the reader's own, and says nothing about the firm. Worth being
 * explicit about, because an earlier version of the confirmation computed the
 * hour in Oslo and built a promise around it, which had to come out: we do not
 * know where the lawyers sit. A file note carries no such claim, it records
 * when the client and Moritz worked on this, which is a fact about them.
 */

/**
 * @param at epoch milliseconds, normally the moment the brief was last saved.
 *
 * Takes the instant rather than reading the clock, so the signature is stable
 * for a given save instead of changing on every render, and so it can be tested
 * at a fixed date.
 */
export function fileNoteTimestamp(at: number): string {
  const date = new Date(at);
  // `en-GB` for day-month-year with the month spelled out. Not the active
  // locale: this is a legal file note, and the intake ships in English only, so
  // reading the UI locale here would produce a format nothing else on the page
  // uses the day a second locale is added.
  const day = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return `${day}, ${time}`;
}
