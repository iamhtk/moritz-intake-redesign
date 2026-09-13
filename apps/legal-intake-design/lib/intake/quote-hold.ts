/**
 * How long a quote is held for, as a date the client can act on (G3).
 *
 * A quote with no expiry is not a quote, it is an indication — and one of the
 * four paths off this card is "I want to think about it", which is only an
 * honest thing to offer if the client can see how long they actually have.
 *
 * Seven days. Not a real firm policy, because nobody has given us one, and the
 * card's own note says the figures on that screen come from this prototype's
 * data. What matters for the design is that the hold is *stated* rather than
 * implied, and that the "think about it" path can promise nothing is being
 * chased without that promise running out silently.
 *
 * Takes `from` rather than reading the clock, so the string is stable for a
 * given render and testable at a fixed date. Same rule as `fileNoteTimestamp`,
 * and the same long-form month for the same reason: `12/09/2026` and
 * `09/12/2026` are the same eight characters and two different days, and this
 * product has clients on both sides of that convention.
 */

/** Days a quote stays open. */
export const QUOTE_HOLD_DAYS = 7;

export function quoteHeldUntil(from: number): string {
  const until = new Date(from);
  until.setDate(until.getDate() + QUOTE_HOLD_DAYS);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(until);
}
