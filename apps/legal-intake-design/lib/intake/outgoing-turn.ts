/**
 * What counts as a turn worth sending, and what the model is told when the
 * client sends documents and no words.
 *
 * Here rather than inside `use-conversation.ts` for the reason the phase rules
 * are in `phase.ts`: both of these are decisions, one of them was wrong, and
 * the wrong one cost a whole opening move — a client who dropped a contract and
 * pressed send watched the attachment disappear and the screen not change,
 * because the guard asked only whether they had typed anything.
 */

/**
 * Whether there is anything to send.
 *
 * Documents on their own are enough, which is the fix. The composer already
 * enables Send on a docked attachment with an empty field (ChatGPT/Claude
 * style), so refusing the turn here meant the button lied: the files were
 * staged, the dock was cleared, the documents were read, and then nothing was
 * said.
 *
 * Words on their own are enough too, obviously. Neither is not.
 */
export function isSendable({
  text,
  documents,
}: {
  text: string;
  /** How many files ride with the turn. */
  documents: number;
}): boolean {
  return text.trim() !== '' || documents > 0;
}

/**
 * The client-message slot for a turn that is documents and nothing else.
 *
 * The turn route rejects an empty message, and it should: a turn with nothing
 * in it is a turn with nothing to answer. But the answer is not to invent a
 * sentence for the client. What happened is that documents arrived without a
 * message, so that is what the model is told, in brackets, so it reads as a
 * note about the event rather than as something the client said. The bubble on
 * screen stays wordless and shows the files, which is what the client actually
 * did.
 *
 * English in the source rather than a key in `en.json`, deliberately: this is a
 * prompt, not copy. Nobody reads it and no translator should be asked to.
 */
export function documentsOnlyMessage(names: readonly string[]): string {
  const listed = names.join(', ');
  const count = names.length === 1 ? 'a document' : `${names.length} documents`;
  return `[The client sent ${count} with no message: ${listed}. Reply to what the documents say.]`;
}
