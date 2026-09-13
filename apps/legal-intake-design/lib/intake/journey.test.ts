import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { INTAKE_PHASES, type IntakePhase } from './phase';
import { JOURNEY_STEPS, journeyStepDone, journeyStepFor } from './journey';

/**
 * The stepper's position, which is the whole of what it claims.
 *
 * A stepper is a promise about where you are, so the failure mode worth testing
 * is not that it renders — it is that it points at the wrong step. Two of the
 * four pieces of feedback in the brief are orientation complaints, and a
 * stepper that says "Step 2 of 4" while the client is still typing would make
 * both of them worse rather than better.
 */

describe('the four steps', () => {
  it('are the four things the client actually experiences', () => {
    expect(JOURNEY_STEPS).toEqual(['brief', 'quote', 'lawyer', 'document']);
  });

  /*
   * Four, not the pipeline's seven. Drafting and both QA passes are "not shown
   * on the platform", so steps for them would sit still for hours and read as
   * stalled. See `journey.ts`.
   */
  it('is a short list, so a step moving means something', () => {
    expect(JOURNEY_STEPS.length).toBeLessThanOrEqual(4);
  });
});

describe('which step the client is on', () => {
  /* Everything before the button is step one: they are still writing it. */
  it.each(['start', 'building', 'review'] as const)(
    '%s is still the brief',
    (phase) => {
      expect(journeyStepFor(phase)).toBe(0);
    },
  );

  /*
   * ⭐ The submit boundary. "People do not understand when a case has actually
   * been submitted" is the first complaint in the brief, and this is the one
   * place the stepper answers it: the marker moves off Brief the moment they
   * press send.
   */
  it.each(['sending', 'sent'] as const)('%s has moved on', (phase) => {
    expect(journeyStepFor(phase)).toBe(1);
    expect(journeyStepDone(phase, 0)).toBe(true);
  });

  /*
   * The quote has arrived but the client still has to decide on it, and a
   * lawyer is assigned after they accept. Advancing here would promise a person
   * who has not been assigned.
   */
  it('stays on the quote once the quote is back', () => {
    expect(journeyStepFor('quoted')).toBe(1);
  });

  /* No phase can claim a step this flow does not deliver. */
  it('never points past the quote', () => {
    for (const phase of INTAKE_PHASES) {
      expect(journeyStepFor(phase as IntakePhase)).toBeLessThanOrEqual(1);
    }
  });

  /* Total, so a new phase cannot fall through to a default. */
  it('has an answer for every phase', () => {
    for (const phase of INTAKE_PHASES) {
      const index = journeyStepFor(phase as IntakePhase);
      expect(Number.isInteger(index)).toBe(true);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(JOURNEY_STEPS.length);
    }
  });
});

describe('which steps are ticked', () => {
  /*
   * A tick on the step you are working on is the "did it submit?" confusion in
   * a new place, so current is never done.
   */
  it('never ticks the current step', () => {
    for (const phase of INTAKE_PHASES) {
      const current = journeyStepFor(phase as IntakePhase);
      expect(journeyStepDone(phase as IntakePhase, current)).toBe(false);
    }
  });

  it('ticks nothing at all while the brief is being written', () => {
    for (const index of JOURNEY_STEPS.keys()) {
      expect(journeyStepDone('building', index)).toBe(false);
    }
  });

  it('leaves the lawyer and the document as what comes next', () => {
    for (const phase of INTAKE_PHASES) {
      expect(journeyStepDone(phase as IntakePhase, 2)).toBe(false);
      expect(journeyStepDone(phase as IntakePhase, 3)).toBe(false);
    }
  });
});

describe('the stepper, read as source', () => {
  const source = readFileSync(
    join(process.cwd(), 'components/design/intake-v2/brief-stepper.tsx'),
    'utf8',
  )
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  /* "Step 1 of 4" is the sentence the feedback was asking for. */
  it('says the position in words, not only in markers', () => {
    expect(source).toContain("t('position'");
    expect(source).toContain('step: current + 1');
  });

  it('marks the current step for assistive tech', () => {
    expect(source).toContain("aria-current={isCurrent ? 'step' : undefined}");
    expect(source).toContain('aria-live="polite"');
  });

  /* An ordered list of stages is an `ol`. */
  it('is an ordered list', () => {
    expect(source).toContain('<ol');
    expect(source).toContain('<li');
  });

  /*
   * Equal columns whatever the labels say. With flex, "Document" would take
   * more room than "Brief" and the markers would stop lining up.
   */
  it('lays the steps out in equal columns', () => {
    expect(source).toContain('grid-cols-4');
  });

  it('reads its position from journey.ts rather than the phase directly', () => {
    expect(source).toContain('journeyStepFor');
    expect(source).toContain('journeyStepDone');
    // No phase names in the component: the mapping lives in one place.
    expect(source).not.toContain("'building'");
    expect(source).not.toContain("'sent'");
  });
});

describe('where the stepper sits', () => {
  const intake = readFileSync(
    join(process.cwd(), 'components/design/intake-v2/intake-v2.tsx'),
    'utf8',
  ).replace(/\/\*[\s\S]*?\*\//g, '');

  /*
   * In the sticky footer, above the sentence about what happens next and the
   * button that starts it — the one part of the panel that does not scroll
   * away, and next to the decision it informs.
   */
  /* One copy, in the footer. */
  it('is not duplicated at the top of the panel', () => {
    expect(intake).not.toContain('beneathTitle');
    expect(intake.match(/<BriefStepper/g)).toHaveLength(1);
  });

  it('is inside the brief footer, above the send sentence', () => {
    const footer = intake.slice(
      intake.indexOf('const briefFooter = ('),
      intake.indexOf('const briefPanel = ('),
    );
    expect(footer).toContain('<BriefStepper');
    expect(footer.indexOf('<BriefStepper')).toBeLessThan(
      footer.indexOf('FOOTER_SENTENCE[phase]'),
    );
  });
});
