import { describe, expect, it } from 'vitest';
import { MOCK_QUOTE_ROUNDS } from '@/lib/mocks/quotes';
import { mattersAhead } from './pricing-queue';

/**
 * The queue line in the confirmation email is a claim about the firm's own
 * workload, printed in something the client keeps. So the rule that produces
 * the number is worth pinning down: the failure mode is not a crash, it is an
 * email that overstates how busy the firm is and undersells the turnaround
 * promised two paragraphs above it.
 */
describe('mattersAhead', () => {
  it('counts only rounds nobody has priced yet', () => {
    expect(
      mattersAhead([
        { yourQuoteStatus: 'NONE' },
        { yourQuoteStatus: 'NONE' },
        { yourQuoteStatus: 'NONE' },
      ]),
    ).toBe(3);
  });

  // A priced round is behind the client, not ahead of them.
  it('does not count a round that has already been quoted', () => {
    expect(
      mattersAhead([
        { yourQuoteStatus: 'SUBMITTED' },
        { yourQuoteStatus: 'WON' },
        { yourQuoteStatus: 'LOST' },
        { yourQuoteStatus: 'WITHDRAWN' },
      ]),
    ).toBe(0);
  });

  // Nobody at this firm is pricing a conflicted round, so it is not in the way.
  it('does not count a conflicted round', () => {
    expect(mattersAhead([{ yourQuoteStatus: 'CONFLICT' }])).toBe(0);
  });

  it('is zero on an empty queue, so the copy can say they are first', () => {
    expect(mattersAhead([])).toBe(0);
  });

  /*
   * Against the real fixture, which is what the email actually prints. Asserted
   * as "matches the filter" rather than as a literal, so adding a round to the
   * mocks does not fail this test, it just changes the sentence.
   */
  it('agrees with the mock data it defaults to', () => {
    const expected = MOCK_QUOTE_ROUNDS.filter(
      (round) => round.yourQuoteStatus === 'NONE',
    ).length;
    expect(mattersAhead()).toBe(expected);
    expect(mattersAhead()).toBeLessThanOrEqual(MOCK_QUOTE_ROUNDS.length);
  });
});
