import { describe, expect, it } from 'vitest';
import { answersOutstandingQuestion } from './panel-announcement';

/**
 * The loop this closes, written down as a test.
 *
 * Upload a document, then work down the panel agreeing with what it extracted.
 * Every tap used to send a turn, every turn asks for what is still missing, and
 * `urgency` is never in a document, so the transcript filled up with the same
 * question and the same four chips once per tap.
 */
describe('answersOutstandingQuestion', () => {
  it('speaks when the tap answers what was asked', () => {
    expect(answersOutstandingQuestion(['urgency'], 'urgency')).toBe(true);
  });

  it('speaks when one tap in a batch answers what was asked', () => {
    expect(answersOutstandingQuestion(['employer', 'urgency'], 'urgency')).toBe(
      true,
    );
  });

  // The bug: confirming extracted values while a different question is open.
  it('stays quiet while the client agrees with values nobody asked about', () => {
    expect(
      answersOutstandingQuestion(
        ['employer', 'other-side', 'matter-type'],
        'urgency',
      ),
    ).toBe(false);
  });

  /*
   * An empty `askingAbout` is a reply that asked about no field at all. The
   * panel must not start a turn of its own there: with the old rule, a client
   * tidying the brief after Moritz stopped asking questions could keep the
   * conversation going indefinitely on their own taps.
   */
  it('stays quiet when no question is on the table', () => {
    expect(answersOutstandingQuestion(['urgency'], '')).toBe(false);
    expect(answersOutstandingQuestion([], '')).toBe(false);
  });

  it('stays quiet on an empty batch', () => {
    expect(answersOutstandingQuestion([], 'urgency')).toBe(false);
  });
});
