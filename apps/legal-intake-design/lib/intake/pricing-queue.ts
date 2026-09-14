/**
 * How many matters are ahead of this one, waiting to be priced (item 18).
 *
 * The confirmation email promises a quote. This is the one honest thing that
 * can be said about when: not a time of day, not a location, just how long the
 * line in front of them is. It is the difference between "we will get to it"
 * and "you are third", and the second is the sentence a person writes.
 *
 * Read off `MOCK_QUOTE_ROUNDS` rather than hardcoded, so the number cannot
 * quietly become a lie the day the mock data changes. Which also means it is
 * whatever the mock data actually says: today that is one matter, not three.
 * The copy pluralises rather than assuming.
 *
 * `NONE` is the whole rule, and it is narrower than "every open round" on
 * purpose. A round already `SUBMITTED` has been priced, so it is not ahead of
 * anyone; a `CONFLICT` round is not being priced by this firm at all. Counting
 * either would pad the queue with work nobody is doing, which is the kind of
 * number that makes a client feel informed and is not information.
 */

import { MOCK_QUOTE_ROUNDS } from '@/lib/mocks/quotes';

/**
 * Matters in front of this one in the pricing queue.
 *
 * Takes its rounds so the count can be tested at a known queue depth, rather
 * than only at whatever the fixture happens to hold.
 */
export function mattersAhead(
  rounds: readonly { yourQuoteStatus: string }[] = MOCK_QUOTE_ROUNDS,
): number {
  return rounds.filter((round) => round.yourQuoteStatus === 'NONE').length;
}
