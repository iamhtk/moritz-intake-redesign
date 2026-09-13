import { describe, expect, it } from 'vitest';
import { createTranslator } from 'next-intl';
import messages from '@/messages/en.json';
import { INTAKE_WAITS } from './waits';
import {
  doneStep,
  finishStep,
  isWorthKeeping,
  runningStep,
  startStep,
  type TimelineStep,
} from './timeline';

const translator = createTranslator({
  locale: 'en',
  messages: { intake: messages.intake },
  namespace: 'intake',
});
const t = translator as unknown as (
  key: string,
  values?: Record<string, unknown>,
) => string;

function running(waitId: string, label: string): TimelineStep {
  return { waitId, label, state: 'running', at: 1 };
}

describe('a step starting', () => {
  it('lands as the running one', () => {
    const steps = startStep([], { waitId: 'later-turn', label: 'Checking' });
    expect(runningStep(steps)?.waitId).toBe('later-turn');
    expect(steps).toHaveLength(1);
  });

  it('keeps the steps before it and leaves them alone', () => {
    const first = doneStep({
      waitId: 'read-documents',
      label: 'Reading',
      detail: 'two values traced',
    });
    const steps = startStep([first], {
      waitId: 'later-turn',
      label: 'Checking',
    });
    expect(steps[0]).toEqual(first);
    expect(steps[1]?.state).toBe('running');
  });

  /*
   * The defect this guards is a spinner that never stops. Two steps on one turn
   * run in sequence, so a second one starting while the first is still going
   * means a caller lost track of it — and the visible result of getting that
   * wrong is a rail with two live spinners on it, one of which is never coming
   * back.
   */
  it('closes a step a caller forgot to finish', () => {
    const steps = startStep([running('read-documents', 'Reading')], {
      waitId: 'later-turn',
      label: 'Checking',
    });
    expect(steps.filter((step) => step.state === 'running')).toHaveLength(1);
    expect(steps[0]?.state).toBe('done');
    expect(steps[0]?.detail).toBeUndefined();
  });
});

describe('a step finishing', () => {
  it('ticks off and takes the count', () => {
    const steps = finishStep(
      [running('later-turn', 'Checking')],
      'two fields written',
    );
    expect(steps[0]?.state).toBe('done');
    expect(steps[0]?.detail).toBe('two fields written');
  });

  it('takes no count when there is no honest number to give', () => {
    for (const nothing of [undefined, null, '']) {
      const steps = finishStep([running('later-turn', 'Checking')], nothing);
      expect(steps[0]?.state).toBe('done');
      expect(steps[0]).not.toHaveProperty('detail');
    }
  });

  it('gives the count to the newest running step, not an older stray', () => {
    const steps = finishStep(
      [running('read-documents', 'Reading'), running('later-turn', 'Checking')],
      'two fields written',
    );
    expect(steps[0]?.detail).toBeUndefined();
    expect(steps[1]?.detail).toBe('two fields written');
    expect(steps[1]?.state).toBe('done');
  });

  it('does nothing to a rail that has already settled', () => {
    const settled = [doneStep({ waitId: 'later-turn', label: 'Checking' })];
    expect(finishStep(settled, 'two fields written')).toEqual(settled);
  });
});

describe('whether a finished rail is worth offering', () => {
  it('is not, for one step that learned nothing', () => {
    expect(
      isWorthKeeping([doneStep({ waitId: 'later-turn', label: 'Checking' })]),
    ).toBe(false);
  });

  it('is, for one step that learned a number', () => {
    expect(
      isWorthKeeping([
        doneStep({
          waitId: 'read-documents',
          label: 'Reading',
          detail: 'two values traced',
        }),
      ]),
    ).toBe(true);
  });

  it('is, for two steps', () => {
    expect(
      isWorthKeeping([
        doneStep({ waitId: 'read-documents', label: 'Reading' }),
        doneStep({ waitId: 'later-turn', label: 'Checking' }),
      ]),
    ).toBe(true);
  });

  it('is not, for nothing', () => {
    expect(isWorthKeeping([])).toBe(false);
  });
});

/**
 * The rail may only name waits that are in the registry (L24).
 *
 * This is the test that stops the timeline becoming the thing it was built to
 * replace. A rail is a tempting place to add a reassuring line that no response
 * produced, and the way that happens is a `startStep` call with a `waitId`
 * invented at the call site. Every id the app uses is asserted against
 * `INTAKE_WAITS`, which is the list with the no-shared-sentence test on it.
 */
describe('the ids the timeline uses', () => {
  const registered = new Set(INTAKE_WAITS.map((wait) => wait.id));

  it.each(['first-turn', 'later-turn', 'read-documents'])(
    '%s is a listed wait',
    (waitId) => {
      expect(registered.has(waitId)).toBe(true);
    },
  );

  it('resolves each of those ids to real copy', () => {
    for (const waitId of ['first-turn', 'later-turn', 'read-documents']) {
      const wait = INTAKE_WAITS.find((one) => one.id === waitId);
      expect(wait).toBeDefined();
      const text = t(wait!.copyKey, { count: 1 });
      expect(text).not.toBe(wait!.copyKey);
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });
});
