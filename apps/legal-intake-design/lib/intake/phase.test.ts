import { describe, expect, it } from 'vitest';
import { applyFieldUpdates, confirmField, createBrief } from './brief';
import {
  canEnterReview,
  canSend,
  hasConfirmation,
  INTAKE_PHASES,
  intakePhase,
  isSealed,
  isSubmitted,
  splitFor,
  type IntakePhase,
  type IntakeStage,
} from './phase';

const DEFS = [
  { key: 'matter-type', label: 'Matter type', required: true },
  { key: 'situation', label: 'Situation', required: true },
  { key: 'note', label: 'Note', required: false },
];

function brief() {
  return createBrief('contract', DEFS);
}

/** Every required field filled, none of them agreed with yet. */
function filled() {
  return applyFieldUpdates(brief(), [
    {
      key: 'matter-type',
      value: 'Contract',
      source: 'document',
      confidence: 5,
    },
    {
      key: 'situation',
      value: 'Exiting an MSA early',
      source: 'document',
      confidence: 5,
    },
  ]);
}

describe('intakePhase', () => {
  it('splits the intake stage by whether anything has been said', () => {
    expect(intakePhase('intake', false)).toBe('start');
    expect(intakePhase('intake', true)).toBe('building');
  });

  it('passes every later stage through unchanged', () => {
    expect(intakePhase('review', true)).toBe('review');
    expect(intakePhase('sending', true)).toBe('sending');
    expect(intakePhase('sent', true)).toBe('sent');
  });

  /*
   * The transcript is cleared by "delete case", and a sent case must not fall
   * back to the opening screen because of it — the confirmation is the whole
   * point of that phase.
   */
  it('keeps a later stage even with an empty transcript', () => {
    expect(intakePhase('sent', false)).toBe('sent');
    expect(intakePhase('review', false)).toBe('review');
  });
});

describe('splitFor', () => {
  it('gives the room to one pane per phase', () => {
    expect(splitFor('start')).toBe('single');
    expect(splitFor('building')).toBe('chat-led');
    expect(splitFor('review')).toBe('brief-led');
  });

  // Decision 18: one transition per boundary. Sending must not move the brief
  // out from under the client at the moment they press the button.
  it('does not move the panes again after review', () => {
    expect(splitFor('sending')).toBe(splitFor('review'));
    expect(splitFor('sent')).toBe(splitFor('review'));
  });
});

describe('isSubmitted', () => {
  it('is true from the click onwards, not before', () => {
    expect(isSubmitted('building')).toBe(false);
    expect(isSubmitted('review')).toBe(false);
    expect(isSubmitted('sending')).toBe(true);
    expect(isSubmitted('sent')).toBe(true);
  });
});

describe('hasConfirmation', () => {
  /*
   * ⭐ One phase later than `isSubmitted`, and `sending` is the gap.
   *
   * The two were read as one boundary and the brief folded away during the
   * wait, leaving a column that was empty apart from a "Show" link at the
   * exact moment the client was watching for a sign that anything was
   * happening. Sealing the brief happens on the click; folding it happens
   * when there is something to fold behind.
   */
  it('waits for the confirmation, which sending does not have', () => {
    expect(hasConfirmation('building')).toBe(false);
    expect(hasConfirmation('review')).toBe(false);
    expect(hasConfirmation('sending')).toBe(false);
    expect(hasConfirmation('sent')).toBe(true);
    expect(hasConfirmation('quoted')).toBe(true);
  });

  /* Strictly behind `isSubmitted`: everything confirmed is also submitted. */
  it('never runs ahead of the seal', () => {
    for (const phase of INTAKE_PHASES) {
      if (hasConfirmation(phase as IntakePhase)) {
        expect(isSubmitted(phase as IntakePhase)).toBe(true);
      }
    }
  });
});

describe('canEnterReview', () => {
  it('needs every required field filled', () => {
    expect(canEnterReview(brief())).toBe(false);
  });

  /*
   * Filled is no longer enough, and this reverses the earlier reading that
   * "the point of review is the unconfirmed fields".
   *
   * *Review and send* sits next to the progress bar, and the bar counts
   * confirmations. Opening the button on merely-filled rows meant the two
   * disagreed: a client could read 20% beside a live button, or 80% beside one
   * that had been live for a while. The confirming happens inline on the rows,
   * where the value and its source are; review reads the finished brief.
   */
  it('also needs them confirmed, so it agrees with the bar', () => {
    const b = filled();
    expect(canSend(b)).toBe(false);
    expect(canEnterReview(b)).toBe(false);
  });

  /* And the two open together, which is the property that matters. */
  it('opens at exactly the same point as canSend', () => {
    const b = confirmField(confirmField(filled(), 'matter-type'), 'situation');
    expect(canSend(b)).toBe(true);
    expect(canEnterReview(b)).toBe(true);
  });
});

describe('canSend', () => {
  it('stays shut while a required field is unconfirmed', () => {
    const b = confirmField(filled(), 'matter-type');
    expect(canSend(b)).toBe(false);
  });

  it('opens once every required field is filled and confirmed', () => {
    const b = confirmField(confirmField(filled(), 'matter-type'), 'situation');
    expect(canSend(b)).toBe(true);
  });

  it('does not wait on an optional field nobody filled', () => {
    const b = confirmField(confirmField(filled(), 'matter-type'), 'situation');
    expect(b.fields.find((field) => field.key === 'note')?.value).toBeNull();
    expect(canSend(b)).toBe(true);
  });
});

/*
 * The gate on saving. It has to agree with `isSubmitted` for every stage,
 * whatever the transcript says, because the two are read a few lines apart in
 * the same component: one decides that the brief is a record, the other decides
 * that it is no longer worth writing to localStorage, and a stage where they
 * disagree is a sent case that saves itself back as a draft.
 */
describe('isSealed', () => {
  const STAGES: IntakeStage[] = [
    'intake',
    'review',
    'sending',
    'sent',
    'quoted',
  ];

  it('matches isSubmitted for every stage, started or not', () => {
    for (const stage of STAGES) {
      for (const started of [false, true]) {
        expect(isSealed(stage), `${stage} / started=${started}`).toBe(
          isSubmitted(intakePhase(stage, started)),
        );
      }
    }
  });

  it('is shut while the client is still telling Moritz about the matter', () => {
    expect(isSealed('intake')).toBe(false);
    expect(isSealed('review')).toBe(false);
  });

  it('is open from the click, not from the confirmation', () => {
    expect(isSealed('sending')).toBe(true);
    expect(isSealed('sent')).toBe(true);
  });
});

/**
 * The quote stage (G3, G2).
 *
 * A sixth stage rather than a flag on `sent`, because the client has a live
 * decision on it. The thing worth pinning is that it still seals the brief: the
 * work has been priced against those values, so a client quietly editing one
 * afterwards would leave the quote describing a matter that no longer exists.
 */
describe('the quote stage', () => {
  it('is its own phase, whatever the transcript says', () => {
    expect(intakePhase('quoted', true)).toBe('quoted');
    expect(intakePhase('quoted', false)).toBe('quoted');
  });

  it('gives the room to the brief, like every phase after review', () => {
    expect(splitFor('quoted')).toBe(splitFor('sent'));
  });

  /*
   * Both of these, and they are not the same claim. `isSubmitted` freezes the
   * brief; `isSealed` stops the draft being saved. A quote has arrived, so
   * there is no draft to resume and nothing on the brief left to edit.
   */
  it('freezes the brief and keeps no draft', () => {
    expect(isSubmitted('quoted')).toBe(true);
    expect(isSealed('quoted')).toBe(true);
  });
});
