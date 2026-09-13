import { describe, expect, it } from 'vitest';
import { QUOTE_HOLD_DAYS, quoteHeldUntil } from './quote-hold';

describe('how long a quote is held', () => {
  it('is a week out, written long', () => {
    const from = new Date('2026-09-12T09:00:00Z').getTime();
    expect(quoteHeldUntil(from)).toBe('19 September 2026');
  });

  it('spells the month, so no reader has to decode a numeric date', () => {
    const from = new Date('2026-09-12T09:00:00Z').getTime();
    expect(quoteHeldUntil(from)).not.toMatch(/\d{1,2}\/\d{1,2}/);
  });

  /*
   * Adding days rather than milliseconds, so the date is right across a month
   * end and across a daylight-saving change. `+7 * 86_400_000` is the version
   * that is wrong twice a year.
   */
  it('crosses a month end correctly', () => {
    const from = new Date('2026-09-28T09:00:00Z').getTime();
    expect(quoteHeldUntil(from)).toBe('5 October 2026');
  });

  it('crosses a year end correctly', () => {
    const from = new Date('2026-12-29T09:00:00Z').getTime();
    expect(quoteHeldUntil(from)).toBe('5 January 2027');
  });

  it('holds the quote for a stated number of days rather than a vague while', () => {
    expect(QUOTE_HOLD_DAYS).toBeGreaterThan(0);
  });
});
