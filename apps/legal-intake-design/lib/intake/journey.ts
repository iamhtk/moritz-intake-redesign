import type { IntakePhase } from './phase';

/**
 * The case as the client experiences it, in four steps.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY FOUR, WHEN THE PIPELINE HAS SEVEN.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The brief lists seven stages: intake, drafting, QA, lawyer assigned, lawyer
 * review, QA again, delivery. Three of them — drafting and both QA passes — are
 * explicitly "not shown on the platform". So a seven-step stepper would be
 * mostly steps the client can never see move, which is a worse answer to "where
 * am I" than no stepper: a bar that sits on step 2 of 7 for two hours while
 * three invisible stages churn behind it reads as stalled.
 *
 * What the brief says the client actually experiences is: *"they submit, then
 * nothing, then a lawyer appears in the chat, then a document arrives."* That is
 * four events, and these are those four:
 *
 *   brief      the part they drive themselves
 *   quote      submitted; a lawyer reads it and prices it
 *   lawyer     a named person takes the case and talks to them here
 *   document   drafted, checked, delivered as finished work
 *
 * The three invisible stages are folded into the two steps they happen inside,
 * which is the honest place for them: from the client's seat, "drafting" and
 * "QA" are not things they are waiting *through*, they are what "waiting for
 * the document" consists of.
 *
 * This answers the second complaint in the brief directly — *"People do not
 * understand the steps in the submission process, or where they are in it"* —
 * and it is deliberately the whole arc rather than the three phases of the
 * intake screen. A stepper reading "Describe → Check → Send" would tell the
 * client where they are on a screen they can already see, and nothing about
 * the thing they cannot: what happens after the button.
 */
export type JourneyStepId = 'brief' | 'quote' | 'lawyer' | 'document';

export const JOURNEY_STEPS: readonly JourneyStepId[] = [
  'brief',
  'quote',
  'lawyer',
  'document',
];

/**
 * Which step the client is on, as an index into `JOURNEY_STEPS`.
 *
 * The intake screen can only ever report the first two, and that is not a gap
 * to be papered over. `lawyer` and `document` happen after this flow hands the
 * case on — there is no backend here to move them — so they render as what they
 * are: what comes next. Showing them greyed is the point. It is the only place
 * the client is told that a person and a document are coming at all, which is
 * the "then nothing" the brief complains about.
 *
 * `quoted` stays on `quote` rather than advancing. The quote has arrived and the
 * client has a decision to make about it, so the step they are *in* is still
 * the quote; a lawyer is assigned after they accept, and moving the marker
 * early would promise a person who has not been assigned.
 */
export function journeyStepFor(phase: IntakePhase): number {
  switch (phase) {
    case 'start':
    case 'building':
    case 'review':
      return 0;
    case 'sending':
    case 'sent':
    case 'quoted':
      return 1;
  }
}

/**
 * Whether the brief step is behind the client.
 *
 * Split out because "done" and "current" are different marks and the first
 * step is the only one that can be done inside this flow. A tick on a step the
 * client is still working on is the "did my case submit?" confusion in a
 * different place.
 */
export function journeyStepDone(phase: IntakePhase, index: number): boolean {
  return index < journeyStepFor(phase);
}
