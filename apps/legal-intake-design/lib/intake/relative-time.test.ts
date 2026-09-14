import { describe, expect, it } from 'vitest';
import { clockTime, describeWhen, msUntilChange } from './relative-time';

const MINUTE = 60_000;
/** A fixed instant, so the boundaries are asserted *at* rather than near. */
const NOW = new Date('2026-09-12T14:32:00Z').getTime();

describe('describing when something happened', () => {
  it('reads as the present tense under a minute', () => {
    expect(describeWhen(NOW, NOW)).toEqual({ kind: 'just-now' });
    expect(describeWhen(NOW - 59_999, NOW)).toEqual({ kind: 'just-now' });
  });

  it('counts whole minutes up to an hour', () => {
    expect(describeWhen(NOW - MINUTE, NOW)).toEqual({
      kind: 'minutes',
      minutes: 1,
    });
    expect(describeWhen(NOW - 90_000, NOW)).toEqual({
      kind: 'minutes',
      minutes: 1,
    });
    expect(describeWhen(NOW - 59 * MINUTE, NOW)).toEqual({
      kind: 'minutes',
      minutes: 59,
    });
  });

  /*
   * The tier boundary. Counting minutes stops helping at an hour, and "173
   * minutes ago" is worse than the clock — this is reachable because the whole
   * flow assumes the client goes off to find a contract and comes back.
   */
  it('switches to the clock at an hour', () => {
    const described = describeWhen(NOW - 60 * MINUTE, NOW);
    expect(described.kind).toBe('clock');
    expect(described).toHaveProperty('time', clockTime(NOW - 60 * MINUTE));
  });

  /*
   * Should not happen; happens when the clock is corrected between two reads.
   * "in -1 minutes" on a client's brief is a worse outcome than rounding to
   * the present.
   */
  it('treats a future instant as the present', () => {
    expect(describeWhen(NOW + 5 * MINUTE, NOW)).toEqual({ kind: 'just-now' });
  });
});

describe('the clock reading', () => {
  it('is 24-hour and zero-padded', () => {
    expect(clockTime(new Date('2026-09-12T09:05:00Z').getTime())).toMatch(
      /^\d{2}:\d{2}$/,
    );
  });
});

/**
 * The half that stops relative time being a lie.
 *
 * A label rendered once says "just now" for the rest of the afternoon, on the
 * row whose entire job is to record what the client did. These assert that a
 * caller is told when to look again, and — just as importantly — when to stop.
 */
describe('when the description next changes', () => {
  it('waits for the next whole-minute boundary', () => {
    expect(msUntilChange(NOW, NOW)).toBe(MINUTE);
    expect(msUntilChange(NOW - 20_000, NOW)).toBe(40_000);
    expect(msUntilChange(NOW - 90_000, NOW)).toBe(30_000);
  });

  it('never asks to be woken immediately', () => {
    // Exactly on a boundary: the naive answer is 0, which is a render loop.
    expect(msUntilChange(NOW - MINUTE, NOW)).toBeGreaterThanOrEqual(250);
  });

  it('stops once the label has settled on a clock time', () => {
    expect(msUntilChange(NOW - 60 * MINUTE, NOW)).toBe(null);
    expect(msUntilChange(NOW - 5 * 60 * MINUTE, NOW)).toBe(null);
  });
});
