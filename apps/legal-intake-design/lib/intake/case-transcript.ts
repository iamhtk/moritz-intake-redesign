/**
 * The intake conversation, as the case has to remember it (Decision 8).
 *
 * The case page's chat already knows how to show this: `Message.phase` exists
 * precisely to mark "the original AI chatbot conversation captured before
 * counsel joined", and four of the mock cases ship with one. The case the
 * intake submits shipped with none, so a client who had just spent ten minutes
 * explaining their matter opened their case and found an empty thread — and the
 * lawyer picking it up got the brief with nothing behind it.
 *
 * So the transcript is carried over with the submission. Two steps, both pure
 * and both here rather than in a component: the intake's own turns reduced to
 * what is worth keeping, and that turned into the case's `Message` shape.
 */

import type { Document, Message, ParticipantRef } from '@/lib/types';

/**
 * One kept turn of the intake conversation.
 *
 * Roles are named for the case rather than for the model: `user`/`assistant` is
 * the vocabulary of the API call that produced the reply, and what the case
 * stores is who spoke.
 */
export type TranscriptTurn = {
  role: 'client' | 'moritz';
  text: string;
  /** ISO. When the turn was said. */
  at: string;
  /** Names of the files sent with a client turn. */
  attachments?: string[];
  /**
   * Set on the client turn that left the conversation for a human (V22, G6).
   *
   * Set by the two paths that put one on a case, both of which come from the
   * `/client/talk` screen rather than from the intake conversation:
   * `carryPersonMessagesToCase` at submission, and `addSubmittedCaseTurns` for
   * a message sent once the case already exists.
   *
   * Carried as a flag rather than derived later because it is not something the
   * text can be read for: "I would rather explain this on a call" is a handoff
   * and "the contract renews in March" is not, and no amount of inspecting the
   * sentence tells them apart. `toCaseTranscript` turns it into the card the
   * client sees on their case.
   *
   * Optional, and safe to be absent: submissions written before this existed
   * come back out of `localStorage` without it and render as they always did.
   */
  handoff?: {
    /** Roster id of whoever it was put in front of, when the matter was known. */
    lawyerId?: string;
    /** What the client was told would happen next. */
    acknowledgement?: string;
  };
};

/**
 * The shape of an intake turn this needs. `ChatMessage` from
 * `use-conversation.ts` satisfies it structurally, which is what keeps this
 * module free of the component it is fed by.
 */
export type IntakeTurn = {
  role: 'user' | 'assistant';
  text: string;
  /** Epoch ms. Absent on a turn restored from a session saved before it existed. */
  at?: number;
  pending?: boolean;
  /** A sentence said as part of the turn without being part of the answer. */
  aside?: string;
  attachments?: { name: string }[];
};

/**
 * What of the live conversation is worth keeping.
 *
 * `sentAt` is the fallback for a turn with no time on it, which happens for a
 * session that was saved before turns carried one. Collapsing those onto the
 * moment of sending is the honest reading: the transcript order is known, the
 * clock is not, and inventing a spread of plausible times would put made-up
 * timestamps on a record a lawyer reads.
 */
export function toTranscript(
  turns: readonly IntakeTurn[],
  sentAt: number,
): TranscriptTurn[] {
  const kept: TranscriptTurn[] = [];

  for (const turn of turns) {
    // A reply still being written is not something that was said. On the next
    // read it would look like Moritz stopped mid-sentence — the same reason the
    // session itself never persists a pending turn.
    if (turn.pending) continue;

    /*
     * The aside is a second paragraph of the same turn, not a separate one.
     *
     * In the intake it is rendered apart from the prose because it asks for
     * something the question above it did not (item 7), and a chat bubble in a
     * case thread has no such slot. Dropping it would lose a request the client
     * was actually made, so it joins the turn it belonged to.
     */
    const text = [turn.text, turn.aside]
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part))
      .join('\n\n');
    if (!text) continue;

    const names = (turn.attachments ?? [])
      .map((one) => one.name)
      .filter(Boolean);

    kept.push({
      role: turn.role === 'user' ? 'client' : 'moritz',
      text,
      at: new Date(turn.at ?? sentAt).toISOString(),
      ...(names.length > 0 ? { attachments: names } : {}),
    });
  }

  return kept;
}

/**
 * The kept turns as the case's own messages.
 *
 * Ids are derived from the case and the position, so reading the same
 * submission twice produces the same messages. That is not tidiness: the case
 * shell holds its document list in state and merges arriving records by id, and
 * a transcript that generated fresh ids on every read would add the same files
 * again on every render.
 *
 * A turn's files are looked up among the case's own documents rather than
 * rebuilt, so the chip in the bubble and the row in the Documents tab are one
 * record. Two records with the same name is how a client ends up wondering
 * whether they sent the contract once or twice.
 */
export function toCaseTranscript({
  caseId,
  turns,
  client,
  documents = [],
}: {
  caseId: string;
  turns: readonly TranscriptTurn[];
  /** Who the client is on this case, so the thread attributes their own words to them. */
  client: ParticipantRef;
  documents?: readonly Document[];
}): Message[] {
  return turns.map((turn, index) => {
    const attachments = (turn.attachments ?? [])
      .map((name) => documents.find((document) => document.name === name))
      .filter((document): document is Document => document !== undefined);

    return {
      id: `${caseId}_intake_${index + 1}`,
      caseId,
      body: turn.text,
      createdAt: turn.at,
      author: turn.role === 'client' ? client : MORITZ_AI,
      phase: 'intake',
      // The client's own turns were read the moment they were sent: the intake
      // answered them. A thread showing "Delivered" against a question that was
      // visibly answered would read as broken.
      ...(turn.role === 'client' ? { readAt: turn.at } : {}),
      ...(attachments.length > 0 ? { attachments } : {}),
      // The one turn in the thread that is not a chat bubble.
      ...(turn.handoff ? { handoffEvent: turn.handoff } : {}),
    };
  });
}

/**
 * Moritz as the intake, in a case thread.
 *
 * `actor: 'ai'` is what the chat renders as "Moritz AI" and what keeps a
 * headshot off the bubble: nobody at the firm had the case yet.
 */
export const MORITZ_AI: ParticipantRef = {
  id: 'usr_ai_moritz',
  name: 'Moritz',
  email: '',
  image: null,
  actor: 'ai',
  companyName: 'Moritz',
};
