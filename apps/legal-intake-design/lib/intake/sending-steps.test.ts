import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import messages from '@/messages/en.json';
import {
  SENDING_STEPS,
  SENDING_STEP_MS,
  SENDING_TOTAL_MS,
} from './sending-steps';

/**
 * The named wait between the click and the case existing.
 *
 * The rule these assert is the one the whole loading design rests on: a wait is
 * described by what is being done, in the client's language, and no two waits
 * say the same thing. Garzai's own account of the current screen is the
 * counter-example being tested against — "progress written in our internal
 * language, for example 'Closing a goal'" — which is more informative than a
 * spinner and worse than one, because a client cannot tell whether a goal
 * closing is progress or a failure.
 */
const translator = createTranslator({
  locale: 'en',
  messages: { intake: messages.intake },
  namespace: 'intake',
});

const t = translator as unknown as (key: string) => string;

describe('the sending steps', () => {
  it('are the firm’s real final pass, in order', () => {
    // Taken from Garzai's description of what the intake agent actually does
    // after submit: closes out the checklist, writes up case notes, hands them
    // to the drafting agent. Three things, not three inventions.
    expect(SENDING_STEPS.map((step) => step.id)).toEqual([
      'checklist',
      'notes',
      'handover',
    ]);
  });

  it('names every step, and no two of them the same', () => {
    const sentences = SENDING_STEPS.map((step) => t(step.copyKey));
    for (const sentence of sentences)
      expect(sentence.length).toBeGreaterThan(0);
    expect(new Set(sentences).size).toBe(sentences.length);
  });

  it('says each step in words a client can read as good news', () => {
    /*
     * The "Closing a goal" test, as close as a unit test can get to it: no step
     * may be phrased in the firm's internal vocabulary. Checked as a blocklist
     * of the words that would mean the internal language had leaked back, which
     * is a narrow test of a real failure rather than a broad test of tone.
     */
    const internal = ['goal', 'checklist item', 'agent', 'queue', 'pipeline'];
    for (const step of SENDING_STEPS) {
      const sentence = t(step.copyKey).toLowerCase();
      for (const word of internal) expect(sentence).not.toContain(word);
    }
  });

  it('does not reuse the label of the wait it sits inside', () => {
    /*
     * `send.sending` is the status line in the brief footer and these three are
     * what the client reads while it is showing. A step that borrowed that
     * sentence would be the shared-spinner failure at one level down.
     */
    const outer = t('send.sending');
    for (const step of SENDING_STEPS) expect(t(step.copyKey)).not.toBe(outer);
  });

  it('divides the wait evenly, with no step left without time', () => {
    expect(SENDING_STEPS.length).toBeGreaterThan(0);
    expect(SENDING_STEP_MS * SENDING_STEPS.length).toBe(SENDING_TOTAL_MS);
    expect(SENDING_STEP_MS).toBeGreaterThan(0);
  });

  it('is long enough that a single spinner would read as broken', () => {
    /*
     * The reason the total is what it is. Under about four seconds the state is
     * a flash a reviewer never sees, which is how the screen that has to carry
     * a multi-minute wait went unreviewed. This is a floor, not the real wait:
     * Garzai says the real one is minutes.
     */
    expect(SENDING_TOTAL_MS).toBeGreaterThanOrEqual(4000);
  });
});
