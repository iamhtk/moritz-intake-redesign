/**
 * What happens between the click and the case existing, named (item 38).
 *
 * This is the last unbuilt piece of the brief's first complaint. The send used
 * to be one spinner and one sentence, sized for the couple of seconds the
 * prototype's stub actually takes — and Garzai's answer says that is not the
 * wait the design has to survive:
 *
 *   "the intake agent does a final pass over the case: it closes out the
 *   checklist, writes up case notes, and hands those to the drafting agent.
 *   Today that pass takes a few minutes, and the client sees a screen telling
 *   them we are working on it, with progress written in our internal language,
 *   for example 'Closing a goal'."
 *
 * Two failures in one sentence, and they pull in opposite directions. A single
 * spinner held for three minutes reads as broken, which is complaint one
 * arriving at the exact moment the flow was supposed to answer it. But the fix
 * is not more words: "Closing a goal" is *more* informative than a spinner and
 * worse than one, because a client cannot tell whether a goal closing is
 * progress or an error.
 *
 * So the steps are the firm's real final pass, in the client's language rather
 * than ours, taken from Garzai's own list: close out the checklist, write up
 * the notes, hand them over. Three things, each of which a client can tell is
 * good news.
 *
 * ## Why this one is allowed to run on a timer
 *
 * `case-stages.ts` refuses to do this, and the difference matters. That rail
 * describes work by other people over hours, so a clock there would be an
 * invention. These three steps are one request the client is waiting on right
 * now: the wait is real, the work behind it is real and sequential, and the
 * only manufactured part is its length, because submission is stubbed in this
 * prototype. When there is a backend, `SENDING_TOTAL_MS` goes away and the
 * steps advance on events from the final pass — the copy and the component do
 * not change.
 */

/** The key under `intake` that names each step. */
export type SendingStep = {
  /** Stable id, for the test's failure messages. */
  id: string;
  copyKey: string;
};

export const SENDING_STEPS: readonly SendingStep[] = [
  { id: 'checklist', copyKey: 'send.sendingStep.checklist' },
  { id: 'notes', copyKey: 'send.sendingStep.notes' },
  { id: 'handover', copyKey: 'send.sendingStep.handover' },
];

/**
 * How long the sending state is on screen (Decision 8, Decision 11).
 *
 * Submission is stubbed, so this gap is manufactured — but the gap itself is
 * not a fiction, and the old value made it one. At 1.8 seconds the state was
 * a flash: long enough to render, too short to read, and far too short to be
 * the thing Garzai described. A reviewer never saw it, so nobody ever reviewed
 * the screen that has to carry a multi-minute wait.
 *
 * Nine seconds is a compromise and worth naming as one. It is long enough that
 * a single spinner would start to feel wrong — which is the point being
 * demonstrated — and short enough that a reviewer clicking through the flow
 * four times does not resent it. The real wait is minutes; this is a prototype
 * showing how minutes would be spent, not pretending to take them.
 */
export const SENDING_TOTAL_MS = 9000;

/** Each step gets an equal share. */
export const SENDING_STEP_MS = SENDING_TOTAL_MS / SENDING_STEPS.length;
