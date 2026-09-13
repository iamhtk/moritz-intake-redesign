import { describe, expect, it } from 'vitest';
import { fileNoteTimestamp } from './file-note';

/**
 * The signature is the one line on the brief a client might screenshot and
 * forward, so the format is worth pinning: an ambiguous date on a legal file
 * note is the kind of detail that costs a firm a deadline.
 *
 * Every instant here is built in LOCAL time, not from a UTC string. The
 * timestamp is deliberately the reader's own clock, so a fixture written as
 * `2026-09-12T05:42:00Z` renders as the 11th on a machine in California and the
 * 12th on one in Oslo, and the test would be asserting the CI region rather
 * than the format.
 */
describe('fileNoteTimestamp', () => {
  /** 12 September 2026, 05:42, wherever this is running. */
  const noon = new Date(2026, 8, 12, 5, 42).getTime();

  it('spells the month out, so the date cannot be read two ways', () => {
    const stamp = fileNoteTimestamp(noon);
    expect(stamp).toContain('September');
    expect(stamp).toContain('2026');
    // The failure this exists to prevent: a numeric month.
    expect(stamp).not.toMatch(/\d{1,2}\/\d{1,2}/);
  });

  it('reads day, month, year, then the time', () => {
    expect(fileNoteTimestamp(noon)).toBe('12 September 2026, 05:42');
  });

  it('uses a 24 hour clock with a padded hour and no meridiem', () => {
    expect(fileNoteTimestamp(new Date(2026, 8, 12, 13, 5).getTime())).toBe(
      '12 September 2026, 13:05',
    );
    expect(
      fileNoteTimestamp(new Date(2026, 8, 12, 13, 5).getTime()).toLowerCase(),
    ).not.toContain('pm');
  });

  it('pads midnight rather than calling it 24:00', () => {
    expect(fileNoteTimestamp(new Date(2026, 8, 12, 0, 7).getTime())).toBe(
      '12 September 2026, 00:07',
    );
  });

  it('renders the first of a month without padding the day', () => {
    expect(fileNoteTimestamp(new Date(2026, 2, 1, 9, 0).getTime())).toBe(
      '1 March 2026, 09:00',
    );
  });

  it('is stable for the same instant', () => {
    expect(fileNoteTimestamp(noon)).toBe(fileNoteTimestamp(noon));
  });
});
