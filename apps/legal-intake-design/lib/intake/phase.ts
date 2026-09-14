/**
 * Where the client is, and how much room each pane gets there (Decision 18).
 *
 * The layout is not a preference and not a drag handle — it is a readout of the
 * phase, so the shape of the page answers "where am I" without a word. That
 * makes it a state machine rather than a pile of booleans in the view, and it
 * lives here so the transitions can be tested without rendering anything.
 *
 * Five phases, four splits. `sending` and `sent` share the review split on
 * purpose: the brief the client was reading is the thing that gets submitted,
 * and moving it at the moment of the click would lose the one object on screen
 * they were tracking.
 */

import { canSubmit, type Brief } from './brief';

/**
 * What the client has done, as opposed to what the screen looks like.
 *
 * `intake` covers both the opening screen and the conversation because they are
 * one stage from the client's side: they are still telling Moritz about the
 * matter. The screen splits when there is something to split.
 */
export type IntakeStage =
  | 'intake'
  | 'review'
  | 'sending'
  | 'sent'
  /**
   * The quote has come back (G3, G2).
   *
   * After `sent`, and the only stage the client does not reach by doing
   * something: a person writes the quote, which in this prototype means it is
   * reachable from `?demo=quote` and `?demo=noquote` and from nowhere else. It
   * is a real stage rather than a flag on `sent` because the client has a
   * decision to make here, and `isSubmitted` is exactly the wrong answer to
   * "can they still act" — which is the question every gate in this file asks.
   */
  | 'quoted';

/**
 * Every phase, in order, as data.
 *
 * The type is derived from this rather than written beside it, so the two
 * cannot disagree. The list exists because several rules in here are
 * exhaustive over phases — which pane leads, which sentence the footer shows,
 * how far the pipeline rail has got — and each of them was at some point wrong
 * for exactly one phase that had been added to the union and forgotten
 * everywhere else. A phase that is not in this array is not a phase, which
 * means a test can walk all of them and a new one cannot slip past unexamined.
 */
export const INTAKE_PHASES = [
  'start',
  'building',
  'review',
  'sending',
  'sent',
  'quoted',
] as const;

export type IntakePhase = (typeof INTAKE_PHASES)[number];

/** Which pane the phase gives the room to. */
export type PhaseSplit = 'single' | 'chat-led' | 'brief-led';

export function intakePhase(stage: IntakeStage, started: boolean): IntakePhase {
  if (stage !== 'intake') return stage;
  return started ? 'building' : 'start';
}

/**
 * 1. Start — one column. The composer is the whole point of the screen.
 * 2. Building — chat leads. The conversation is where the warmth is, and a
 *    cramped chat reads as a form-filling helper.
 * 3. Review, sending, sent — the brief leads and the chat keeps a strip. The
 *    client's attention belongs on the document they are about to send, and
 *    afterwards on the one that was sent.
 */
export function splitFor(phase: IntakePhase): PhaseSplit {
  if (phase === 'start') return 'single';
  if (phase === 'building') return 'chat-led';
  // `quoted` falls through to brief-led with the rest. The decision the client
  // is making is about the work described in the brief, so the brief is what
  // has to be readable while they make it.
  return 'brief-led';
}

/**
 * Past the point of no return: the brief is read-only and the gate is closed.
 *
 * `quoted` is included, and it is the one that needed thinking about. The
 * client has a live decision on that screen, so "submitted" feels wrong — but
 * what this function actually controls is whether the *brief* is still an
 * editable form, and it is not: the work has been priced against it, so a
 * client quietly changing a value afterwards would leave the quote describing a
 * matter that no longer exists. Changing the matter at that point is a
 * conversation, not an edit, which is what the quote card's own paths are for.
 */
export function isSubmitted(phase: IntakePhase): boolean {
  return phase === 'sending' || phase === 'sent' || phase === 'quoted';
}

/**
 * Whether the confirmation has taken over the top of the panel.
 *
 * A third boundary, one phase later than `isSubmitted`, and the gap between
 * them is exactly `sending`.
 *
 * It exists because folding the brief away and sealing it are different
 * questions asked at different moments. `isSubmitted` is about editing, and
 * that closes on the click — the request is in flight and a value changing
 * underneath it would be a brief that no longer matches the case being
 * created. Folding is about whether the brief is still the thing on the
 * screen, and during the wait it emphatically is: the confirmation does not
 * exist yet, the sending steps are four lines in the footer, and folding the
 * document above them leaves a column that is empty apart from a "Show" link
 * — at the exact moment the client is watching to see that something is
 * happening.
 *
 * Reusing `isSubmitted` for both did that, and it looked broken.
 */
export function hasConfirmation(phase: IntakePhase): boolean {
  return phase === 'sent' || phase === 'quoted';
}

/**
 * The same boundary, read off the stage instead of the phase.
 *
 * `isSubmitted` needs a phase, and a phase needs to know whether the
 * conversation has started — which is a fact about the transcript. The hooks
 * that own the transcript need to know whether to keep saving it *before* any
 * of that is in hand, and the answer does not depend on it: once the client has
 * pressed send there is no draft to save, however the conversation got there.
 *
 * By construction `isSealed(stage) === isSubmitted(intakePhase(stage, any))`,
 * which is what the test pins.
 */
export function isSealed(stage: IntakeStage): boolean {
  return stage === 'sending' || stage === 'sent' || stage === 'quoted';
}

/**
 * The gate on the boundary out of `building`, i.e. on *Review and send*.
 *
 * This was `isComplete` — every required field merely *filled* — on the
 * reasoning that agreeing with the values is what the review step is for. It
 * left the button and the progress bar measuring different things: the bar
 * counts confirmations, so a client could be looking at 20% and a live *Review
 * and send*, or at 80% having already done everything the button was waiting
 * for. A control whose enabled state does not track the only number next to it
 * is a control the client cannot predict.
 *
 * So it is `canSubmit`, the same rule as `canSend`, which is the rule the bar
 * is drawn from: on a five-row brief with four required rows, all four agreed
 * to is 80% and is exactly when this opens.
 *
 * What review is for afterwards is reading the finished brief before it leaves
 * — which is what it was always *called* — rather than being the place the
 * confirming happens. The confirming happens inline, on the rows, which is
 * where the value and its source are.
 */
export function canEnterReview(brief: Brief): boolean {
  return canSubmit(brief);
}

/**
 * The gate on the boundary out of `review` (invariant 4, Decision 5).
 *
 * Deliberately just `canSubmit`: a second copy of the rule spelled out here is
 * how the button and the brief end up disagreeing about whether a case is ready.
 */
export function canSend(brief: Brief): boolean {
  return canSubmit(brief);
}
