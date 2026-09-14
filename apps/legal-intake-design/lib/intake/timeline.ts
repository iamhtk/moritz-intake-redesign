/**
 * The persisting record of what Moritz actually did on a turn (L1, V24).
 *
 * `waits.ts` fixed the counting failure: every wait in the intake is listed,
 * and a test fails the build if two of them share a sentence. What it did not
 * fix is that a wait is *transient*. Each of those five sentences is a label
 * shown while work happens and then thrown away, so a client who looks up
 * three turns later has no way to tell whether the contract was ever read, and
 * the only persisting record in the flow is the per-field receipt on a brief
 * row — which says the client accepted a value, not that anything was done to
 * produce it.
 *
 * So this is the same five sentences with a memory. A step is one of the waits
 * in `waits.ts`, stamped when it starts, ticked when it ends, and carrying one
 * line of the real count the work produced. It stays on the turn afterwards,
 * folded into a summary the client can open.
 *
 * Two rules, and both are the point rather than details:
 *
 *   1. **A step is a wait, not a stage.** One step per call that actually made
 *      the client wait. Nothing here is on a timer and nothing is invented to
 *      pad the rail out: the product this redesign is answering has a top bar
 *      that has said "Uploading" for twenty minutes across five screens, and
 *      the difference between that and this is not the visual treatment, it is
 *      that every line here is created by a response arriving.
 *
 *   2. **The count is nested, not a step of its own.** Writing four fields onto
 *      the brief is real work with a real number, and it takes no time at all —
 *      so it is a line *under* the step that produced it. A step that would
 *      flash for nought milliseconds is a progress bar with extra words.
 *
 * Kept as free functions over a readonly array rather than a class, because the
 * array lives on a `ChatMessage` in React state and every mutation has to
 * produce a new one anyway.
 */

/**
 * Whether a step is still happening.
 *
 * Two states, not three. There is no "failed" state, because a turn that fails
 * loses its bubble entirely (`runTurn`'s `failTurn`, and `dropSaying` for a
 * read): the failure is a sentence under the transcript with a retry beside
 * it, and leaving a half-finished rail on screen above it would be the turn
 * claiming to have done work it has nothing to show for.
 */
export type StepState = 'running' | 'done';

export type TimelineStep = {
  /**
   * The `INTAKE_WAITS` id this step is an instance of.
   *
   * Traceable on purpose: the sentence on screen comes from that registry, so a
   * reviewer reading a step here can find the one place it is written and the
   * test that stops it being reused.
   */
  waitId: string;
  /** The wait's sentence, already resolved through `t()` and its counts. */
  label: string;
  /**
   * The real number the work produced, as a sentence. Absent until the step
   * finishes, and absent afterwards when there is no honest number to give.
   */
  detail?: string;
  state: StepState;
  /** Epoch ms, stamped when the step starts. */
  at: number;
};

/**
 * Begin a step, settling anything still running.
 *
 * The settle is defensive rather than expected: two steps on one turn run in
 * sequence (a document is read, *then* the reply is written against what it
 * found), so a second one starting while the first is still going would mean a
 * caller had lost track. Leaving the first spinning forever is the worse of the
 * two outcomes, so it is closed without a count rather than left open.
 */
export function startStep(
  steps: readonly TimelineStep[],
  step: { waitId: string; label: string; at?: number },
): TimelineStep[] {
  return [
    ...steps.map((one) =>
      one.state === 'running' ? { ...one, state: 'done' as const } : one,
    ),
    {
      waitId: step.waitId,
      label: step.label,
      state: 'running',
      at: step.at ?? Date.now(),
    },
  ];
}

/**
 * Tick the running step off, with the count it produced.
 *
 * `detail` is optional and an empty string is treated as absent, because the
 * callers compute it from copy that can legitimately come back empty — a turn
 * where nothing new landed on the brief has no number worth printing, and
 * "0 fields written" is a sentence about the software.
 */
export function finishStep(
  steps: readonly TimelineStep[],
  detail?: string | null,
): TimelineStep[] {
  let settled = false;
  // Newest first: a turn's running step is always the last one added, and
  // walking from the end means a stale `running` left by a lost caller is not
  // the one that gets the count.
  const next = [...steps];
  for (let index = next.length - 1; index >= 0; index -= 1) {
    const step = next[index];
    if (step === undefined || step.state !== 'running' || settled) continue;
    next[index] = {
      ...step,
      state: 'done',
      ...(detail ? { detail } : {}),
    };
    settled = true;
  }
  return next;
}

/** Steps carried over from work that is already finished, for a seeded turn. */
export function doneStep(step: {
  waitId: string;
  label: string;
  detail?: string | null;
  at?: number;
}): TimelineStep {
  return {
    waitId: step.waitId,
    label: step.label,
    state: 'done',
    at: step.at ?? Date.now(),
    ...(step.detail ? { detail: step.detail } : {}),
  };
}

/** The step still happening, or `null`. What the spinner and shimmer follow. */
export function runningStep(
  steps: readonly TimelineStep[],
): TimelineStep | null {
  return steps.find((step) => step.state === 'running') ?? null;
}

/**
 * Whether a finished turn's rail is worth offering to the client.
 *
 * A single step with no count is the whole of what the client already saw
 * happen, so folding it into a "1 step" button they can open to read one line
 * they have already read is a control that costs a glance and returns nothing.
 * Two steps, or one that learned a number, is a record.
 */
export function isWorthKeeping(steps: readonly TimelineStep[]): boolean {
  if (steps.length === 0) return false;
  if (steps.length > 1) return true;
  return steps[0]?.detail !== undefined;
}
