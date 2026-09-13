/**
 * Which sentence, if any, says that the work just got smaller (item 9).
 *
 * Extracted from the component because it is a rule with three branches and a
 * firing threshold, and it was wrong in one of them for as long as it was a
 * closure nothing could read. The bug is worth recording precisely, because it
 * is the kind that only a browser finds: on a turn that filled the last
 * required field while asking about the optional one, the note said "which is
 * all of them. Nothing left to ask" directly underneath a reply whose final
 * sentence was a question. One voice, two claims, and the confident one false.
 *
 * The counts themselves were right. What was wrong was a sentence asserting
 * completeness on behalf of a turn that had just asked for something, which is
 * the same class of error as a progress bar that reaches 100% while a spinner
 * is still going.
 *
 * ## Why the threshold is two
 *
 * On a single-field turn Moritz has already named the value he wrote down, in
 * his own reply. Following that with a count is the moment this stops sounding
 * like a person taking notes and starts sounding like a progress bar with a
 * voice. Two fields at once is a genuinely different event: the client said
 * something that did more work than they expected, and telling them so is
 * information rather than encouragement.
 *
 * ## What this does not do
 *
 * It does not count what the panel counts. The bar counts fields the client has
 * *confirmed*; this counts required fields a turn *filled*. They are different
 * numbers on purpose and the two surfaces say different things — "that covered
 * four" is about the message they just sent, "2 / 4" is about what they have
 * checked. Neither is progress towards the other, which is why the note never
 * claims the case is ready to send.
 */

export type ProgressNote = {
  /** The key under `intake` holding the sentence. */
  copyKey: string;
  /** Required fields this turn filled. */
  filled: number;
  /** Required fields in the brief. */
  total: number;
  /** Required fields still empty. Zero for the two `workDone` variants. */
  remaining: number;
};

export function progressNoteFor({
  filled,
  total,
  remaining,
  asking,
}: {
  filled: number;
  total: number;
  remaining: number;
  /** Whether the turn this note is attached to ended on a question. */
  asking: boolean;
}): ProgressNote | null {
  if (filled < 2) return null;

  if (remaining > 0) {
    return { copyKey: 'brief.workLeft', filled, total, remaining };
  }

  /*
   * The required set is complete. Whether that means "nothing left to ask"
   * depends entirely on the reply this sits under, which is why `asking` is a
   * parameter rather than something inferred from the brief: an optional field
   * being empty does not mean it is being asked about, and a turn can close
   * the last required gap without asking anything at all.
   */
  return {
    copyKey: asking ? 'brief.workDoneAsking' : 'brief.workDone',
    filled,
    total,
    remaining: 0,
  };
}
