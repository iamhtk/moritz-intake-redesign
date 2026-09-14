/**
 * Whether working the brief panel should say anything in the chat.
 *
 * The panel talks to the conversation so that one decision does not have to be
 * made twice: Moritz asks "I've got Apple as the employer, is that right?", the
 * client taps Accept on the right, and the chat should not then sit there
 * waiting for them to type "yes" as well.
 *
 * It used to announce *every* tap, and that turned the panel into a question
 * machine. Each announcement is a real turn, and a turn asks about whatever is
 * still missing. `urgency` is never in a document, so a client who uploads a
 * contract and then works down the panel confirming what was extracted gets
 * this: tap, "how time-sensitive is this?", tap, "how time-sensitive is this?",
 * tap, the same question a fifth time, each with its own row of chips. Nothing
 * they did answered it, because none of those fields was the one being asked
 * about, and accepting a value the model proposed is not news to the model in
 * the first place, the brief it is handed every turn already says so.
 *
 * So the rule is the original purpose stated precisely: the panel speaks when
 * it answers the question on the table, and stays quiet otherwise. Quiet is not
 * silence, the row keeps its own receipt ("Accepted, you, 14:02", with an
 * Undo), which is feedback where the action happened rather than a paragraph
 * somewhere else.
 *
 * @param keys the field keys touched since the last announcement
 * @param askingAbout the field the last reply said it was asking about, or ''
 */
export function answersOutstandingQuestion(
  keys: readonly string[],
  askingAbout: string,
): boolean {
  // No question on the table means nothing to answer. A turn fired here would
  // be the panel starting a conversation rather than continuing one.
  if (askingAbout === '') return false;
  return keys.includes(askingAbout);
}
