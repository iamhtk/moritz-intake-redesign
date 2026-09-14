import type { CaseStageId } from './case-stages';
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
 * The seven pipeline rows, nested inside the four steps they happen in.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS MAP EXISTS: THERE WERE TWO STEPPERS.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The flow used to show the four steps in the brief panel's footer and the
 * seven pipeline rows again under the confirmation, as if they were two
 * different things. They are not. The seven nest inside the four exactly, and
 * once you write the nesting down there is only one stepper: four headings, and
 * the rows that make up whichever heading you open.
 *
 * `brief` has no rows, and that is correct rather than a gap. It is the only
 * step the client performs themselves, so the thing it is made of is the screen
 * they are already looking at; a row saying "you are typing" under a heading
 * saying "Brief" would be the rail narrating the obvious. It carries a sentence
 * instead (`intake.journey.line.brief`).
 *
 * `quote` takes four of the seven because it is the only part of the pipeline
 * the client drives, and collapsing "we price it", "you get a price" and "you
 * pay" would hide the only step that is theirs. See `case-stages.ts`.
 */
export const JOURNEY_STAGES: Readonly<
  Record<JourneyStepId, readonly CaseStageId[]>
> = {
  brief: [],
  quote: ['sent', 'pricing', 'quote', 'paid'],
  lawyer: ['lawyer'],
  document: ['revision', 'delivered'],
};

/**
 * The sentence under a step, as a key under `intake.journey`.
 *
 * One function because two surfaces ask the same question and must not answer
 * it differently: the rail prints it under `brief`, and the horizontal bar
 * prints it for whichever step is active. A rule written twice is a rule that
 * gets fixed once.
 *
 * ⭐ `sending` is the only phase that overrides anything, and it is the other
 * half of the wait bug. `journeyStepFor` used to advance to `quote` on the
 * click, which was fixed; this said "You are telling us about the matter"
 * while the request was in flight, which is the same misreport one line lower
 * — they have finished telling us, and the thing the rail is describing is no
 * longer what is happening. The step is still `brief`, because the case has
 * not reached anybody yet. Only the sentence changes.
 */
export function journeyLineKey(
  step: JourneyStepId,
  phase: IntakePhase,
): string {
  if (step === 'brief' && phase === 'sending') return 'line.sending';
  return `line.${step}`;
}

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
 *
 * ⭐ `sending` is `brief`, not `quote`, and it used to be `quote`.
 *
 * That was a bug with the same shape as the complaint the stepper exists to
 * answer. The request is still open — the case has not reached anybody yet —
 * and the rail was already ticking Brief and pointing at Quote while the button
 * was still spinning. "People do not understand when a case has actually been
 * submitted" is the first complaint in the brief, and a stepper that advances
 * on the click rather than on the answer is that confusion rebuilt in the
 * component meant to fix it. The step moves when the case has gone, which is
 * `sent`. See `case-stages.ts` for the same rule applied to the seven rows.
 */
export function journeyStepFor(phase: IntakePhase): number {
  switch (phase) {
    case 'start':
    case 'building':
    case 'review':
    case 'sending':
      return 0;
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
