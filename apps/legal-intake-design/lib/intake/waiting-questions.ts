/**
 * The three questions a waiting client actually has, offered as taps.
 *
 * `waiting-prompt.ts` gave Moritz a mode for answering questions about a sealed
 * case, and `intake-v2.tsx` routes the composer into it once the case is sent.
 * Both were true and neither was visible: what the client met on the
 * confirmation screen was an empty text box under a finished case, which reads
 * as furniture left behind rather than an offer. Nobody types a question into a
 * box that has just told them they are done.
 *
 * So the offer is made in the one currency that costs nothing to accept. The
 * same device opens the flow — `SuggestionChips` under the first composer, for
 * a client who does not know how to begin — and this is the same problem at the
 * other end: not knowing that beginning again is allowed.
 *
 * ## Why these three
 *
 * They are the three questions the prompt can answer completely, which is the
 * only sane basis for putting a question in someone's mouth. Each one maps to
 * a fact already on the screen or already given to us:
 *
 *   - how long -> the four hour quote turnaround, which the status row states
 *   - what the quote covers -> the brief, which the client just confirmed
 *   - adding a document -> the post-submit dropzone, two blocks below
 *
 * What is deliberately not here is "how much will it cost" and "do I have a
 * case". Those are the two things the prompt refuses, and offering a refusal as
 * a suggestion would be the product baiting somebody into being told no.
 *
 * ## Why the text is the message
 *
 * The label on the chip and the words sent as the client's turn are the same
 * string, rather than a short label expanding into a fuller question. The chips
 * are part of the transcript — a lawyer reads this thread — and a row that said
 * "Timing" while the transcript recorded "How long does this take, roughly?"
 * would put words in the client's mouth that they can see they did not choose.
 */

export type WaitingQuestion = {
  /** Stable id, and the key its sentence lives under in `intake.sent.ask`. */
  id: string;
};

export const WAITING_QUESTIONS: readonly WaitingQuestion[] = [
  { id: 'timing' },
  { id: 'covers' },
  { id: 'document' },
];

/**
 * The ones still worth offering.
 *
 * Asked questions are dropped rather than locked, which is the opposite of what
 * `SuggestionChips` does with a field's answers and right for the opposite
 * reason: those are one choice among alternatives, so the row has to keep
 * showing which was picked. These are three independent questions, and the
 * answer to an asked one is already in the transcript directly above. A locked
 * chip would be a dead control next to its own answer.
 */
export function remainingQuestions(
  asked: readonly string[],
): readonly WaitingQuestion[] {
  return WAITING_QUESTIONS.filter((question) => !asked.includes(question.id));
}
