/**
 * The pipeline the client's case is actually in, and where in it they are.
 *
 * This is the half of the brief's second complaint that `waits.ts` and
 * `timeline.ts` did not touch. Those answer it at the scale of a turn: what is
 * Moritz doing for the four seconds I am waiting. The complaint is also being
 * made at the scale of the whole engagement, where Garzai's own summary of the
 * client's experience is "submit, a quote to pay, silence, a lawyer appears, a
 * document arrives". Three of the seven steps behind that are invisible on the
 * platform by design, and the gap between the quote and the lawyer was the
 * longest unexplained silence in the product.
 *
 * A separate module from `timeline.ts`, and the separation is load-bearing
 * rather than tidiness. A `TimelineStep` is created by a response arriving:
 * `timeline.test.ts` asserts every `waitId` the app uses is a registered wait,
 * and `StepState` has no third value precisely so that nothing can put a row on
 * that rail which has not happened. Those invariants are what make the turn
 * rail trustworthy, and a stage that has *not happened yet* would break both.
 * So the future gets its own type rather than a widened one.
 *
 * ## The rule this module exists to enforce
 *
 * A stage is `done` only where the client's own screen has evidence of it.
 * Everything else is `future`, including work we have been told is under way.
 *
 * That is why there is no timer in here and nothing derived from a clock. The
 * reference product this redesign is measured against has a top bar reading
 * "Uploading" across five screens and twenty-nine minutes of footage, and it
 * never resolves. A rail advancing on a `setInterval` would be the same defect
 * with better typography, and worse: it would be a law firm telling a client
 * their document had been drafted when nobody had opened the file.
 *
 * The one `current` row is the exception that proves the rule. It is not a
 * claim that a person is working this second, it is a statement of what the
 * case is waiting on, which is a fact about our own process rather than about
 * anybody's afternoon.
 *
 * ## Why drafting is a line on a row rather than a row
 *
 * The obvious shape for this was eight sequential rows, one per step of the
 * firm's pipeline, with drafting and QA sitting after the client accepts. That
 * shape was built and it was wrong, and Garzai's description of the back end is
 * what corrected it: *"the drafting agent starts on the first draft straight
 * away, currently 20 to 50 minutes, and a QA agent reviews it. Once the quote
 * is paid, a lawyer is assigned and takes over in the chat."*
 *
 * Steps 2 and 3 do not follow the quote. They run *alongside* it, in the exact
 * window the client experiences as silence. A linear rail cannot say that, and
 * faking it either way loses something real: putting drafting after acceptance
 * is false, and giving it a concurrent row of its own would need a second
 * `current` mark, which turns "where am I" into "which of these two am I in".
 *
 * So it is `detail` on the row it genuinely coincides with. That is the same
 * device `WorkRail` uses for a count it cannot give a row of its own, and here
 * it buys the single most valuable sentence on the screen: the answer to "what
 * is happening during those four hours" turns out to be "quite a lot, and some
 * of your document already exists".
 */

import type { IntakePhase } from './phase';

/**
 * `current` is what the case is waiting on. `future` has not happened.
 *
 * Three states where the turn rail has two, and the third is the whole point:
 * the client is being shown steps that are still ahead of them, which is the
 * only way a rail can answer "how many more of these are there".
 */
export type CaseStageState = 'done' | 'current' | 'future';

/**
 * Which side of the commercial gate a stage sits on.
 *
 * `quote` is everything up to and including the client paying. `work` is what
 * happens once they have.
 *
 * It used to drive a fold in `case-progress.tsx`: the `work` rows sat behind a
 * "show the 3 steps after you accept" disclosure, because a client who has
 * just pressed send has one question and it is about the price, and three more
 * rows about document review bury it.
 *
 * The left rail solves that with the 4-step nesting instead — `work` is split
 * across the `lawyer` and `document` headings, which are closed until asked
 * for — so the group is no longer a fold. It is kept because it is still the
 * commercial gate, and `case-stages.test.ts` pins the four-then-three split:
 * a row crossing it would change what a client sees before deciding to spend
 * money.
 */
export type CaseStageGroup = 'quote' | 'work';

/**
 * The seven stage ids, as a union rather than `string`.
 *
 * Named so that `JOURNEY_STAGES` in `journey.ts` can be typed against them:
 * the 4-step rail nests these seven rows inside its four headings, and the one
 * way that map can go wrong is silently — a renamed stage that still compiles
 * and quietly drops a row out of the rail. A union makes it a type error.
 */
export type CaseStageId =
  | 'sent'
  | 'pricing'
  | 'quote'
  | 'paid'
  | 'lawyer'
  | 'revision'
  | 'delivered';

export type CaseStage = {
  /**
   * Stable id, and the key its sentence lives under in `intake.journey`.
   */
  id: CaseStageId;
  group: CaseStageGroup;
  /**
   * Whether this stage has a second line under it (`stage.<id>.detail`).
   *
   * Only `pricing` does, and it carries the concurrent drafting work. Declared
   * here rather than discovered by the component looking for copy, so that a
   * detail line cannot be added to a stage by writing a string into `en.json`
   * and nowhere else: the reason `pricing` gets one is an argument recorded in
   * this file, and the next one should have to pass through here too.
   */
  hasDetail?: true;
};

/**
 * The seven-step pipeline as the client can honestly be shown it.
 *
 * Read against the firm's own numbering, the mapping is:
 *
 *   1 intake            -> `sent`
 *     (the quote)       -> `pricing`, `quote`, `paid`
 *   2 drafting          -> the detail line on `pricing`
 *   3 QA review         -> the same detail line
 *   4 lawyer assigned   -> `lawyer`
 *   5 lawyer review     -> `revision`
 *   6 QA review again   -> the same row as 5
 *   7 delivery          -> `delivered`
 *
 * Three decisions in that mapping worth stating.
 *
 * **Steps 2 and 3 are the detail on `pricing`**, because that is when they
 * happen. See the note above.
 *
 * **Step 6 shares a row with step 5.** The second QA pass is invisible on the
 * platform and is not something the client can act on; a row that never
 * visibly ticks teaches people to distrust the rail. Naming the check inside
 * the sentence is the honest amount of detail. It says the work is reviewed
 * before they see it, which is the reassuring part, without inventing a
 * milestone.
 *
 * **The quote is three rows, not one.** It is the only part of this pipeline
 * the client drives, and collapsing "we price it", "you get a price" and "you
 * pay" would hide the only step that is theirs. It is also where the firm most
 * needs to be unambiguous: the complaint that people could not tell whether
 * their case had been submitted and the complaint that they could not see the
 * steps are one confusion read two ways.
 */
export const CASE_STAGES: readonly CaseStage[] = [
  { id: 'sent', group: 'quote' },
  { id: 'pricing', group: 'quote', hasDetail: true },
  { id: 'quote', group: 'quote' },
  { id: 'paid', group: 'quote' },
  { id: 'lawyer', group: 'work' },
  { id: 'revision', group: 'work' },
  { id: 'delivered', group: 'work' },
];

/**
 * How far the rail has actually got, by phase.
 *
 * Only two phases reach this rail, and both are named rather than defaulted: a
 * phase this function has not been taught about gets nothing ticked, which
 * renders a rail of all-future rows. That is wrong-looking enough to be noticed
 * and still not a lie, which is the correct failure for a component whose
 * entire claim is that it does not overstate.
 *
 * `sending` is deliberately not here, and that gap matters more than it looks.
 * Garzai's answer says the final intake pass takes a few minutes today and that
 * the design has to survive the gap between the click and the case actually
 * being submitted, so `sending` is a real wait rather than a flash. It is
 * covered by the brief footer's own status line; a rail appearing at the same
 * moment would tick "your case reached us" before the request had returned,
 * which is precisely the complaint about not knowing whether a case was
 * submitted, reintroduced by the component built to fix it.
 */
function reached(phase: IntakePhase, accepted: boolean): number {
  // The case has gone and a lawyer is pricing it. `sent` is done, `pricing` is
  // what it is waiting on.
  if (phase === 'sent') return 1;
  /*
   * The quote is on screen, so `pricing` and `quote` are both done by the
   * evidence in front of the client, and the case is waiting on payment.
   *
   * Note what this does not do: it does not tick `paid`. The quote card is the
   * accept control, so a rail marking the payment as made while the button to
   * make it is still on screen would be the rail arguing with the page.
   */
  if (phase === 'quoted') {
    /*
     * ⭐ Accepting ticks `paid`, and that row is named "You accept it and
     * pay" — so the tick is making a claim about a payment that has not
     * happened. Worth stating rather than burying, because it is the one
     * place this file bends its own rule.
     *
     * The rule is that a stage is `done` only where the client's own screen
     * has evidence of it, and the reason is that a rail advancing on
     * anything else is a law firm telling a client their document had been
     * drafted when nobody had opened the file. Here the evidence is real:
     * the client pressed Accept. What is missing is the second half of a row
     * that covers two acts.
     *
     * Splitting the row would be the tidy fix and it is the wrong one.
     * Payment is out of scope in this prototype — it happens on Moritz's own
     * case page, which is where "Go to case" now lands — so a `paid` row that
     * could never tick would sit there for the rest of the flow reading as
     * stalled, which is the exact failure `case-progress` was built against.
     * Accepting is as far as the client can go here, and the row says their
     * part is done. The next row, the lawyer being assigned, becomes what the
     * case is waiting on, which is what the chat says too.
     */
    return accepted ? 4 : 3;
  }
  return 0;
}

export type CaseStageRow = CaseStage & { state: CaseStageState };

/**
 * The rail for a phase: everything before the mark is done, the mark is
 * current, everything after it is still ahead.
 *
 * Returns every stage every time rather than slicing to the reached ones,
 * because the future rows are the feature. A rail that showed only what had
 * happened would be a receipt, and the client already has one of those.
 */
export function caseStages(
  phase: IntakePhase,
  /**
   * Whether the client has accepted the quote (§3's Step E).
   *
   * A second argument rather than a phase of its own. Acceptance changes one
   * row on one rail and nothing else in the flow — not what the brief can do,
   * not what the composer is for, not which screen is up — and a sixth
   * `IntakePhase` would have to be answered for by `journeyStepFor`,
   * `isSubmitted`, `hasConfirmation`, `splitFor` and the footer map, all of
   * which would say exactly what `quoted` says.
   */
  accepted = false,
): CaseStageRow[] {
  /*
   * `-1` before the case has gone, so nothing is `current` either.
   *
   * `reached` returns 0 for every pre-submission phase, and 0 is also a real
   * mark — it means `sent` is what the case is waiting on. That ambiguity was
   * harmless while only `hasCaseProgress`-gated screens rendered these rows.
   * The left rail shows all seven from the first screen, greyed, so the
   * ambiguity became a lie: a client who has typed one sentence would have
   * read "Your case reached us — happening now".
   */
  const mark = hasCaseProgress(phase) ? reached(phase, accepted) : -1;
  return CASE_STAGES.map((stage, index) => ({
    ...stage,
    state:
      index < mark ? 'done' : index === mark ? 'current' : ('future' as const),
  }));
}

/**
 * Whether this phase has a rail at all.
 *
 * Read off `reached` rather than listing the phases a second time, so the two
 * cannot disagree about which phases are post-submission.
 */
export function hasCaseProgress(phase: IntakePhase): boolean {
  return reached(phase, false) > 0;
}
