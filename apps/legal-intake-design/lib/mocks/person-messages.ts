/**
 * Messages the client wrote to a named lawyer, from the *Talk to a person*
 * screen.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * HELD AT MODULE SCOPE, NOT IN `localStorage`. A REFRESH CLEARS THE SCREEN.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This started out persisted, and persisting it was wrong for two separate
 * reasons that point the same way.
 *
 * The first is what a reviewer actually sees. `NOTE.md` opens by promising the
 * documented demo URLs can be opened "in one tab, in any order", and records
 * that this was *not* true until the last day: an in-progress intake was saved,
 * the seed refused to run over a brief that already had values, and so the
 * second link you clicked showed you the first one's screen. `demo-session.ts`
 * exists to stop that. A screen that opens with two cards reading "somebody
 * reads this within four hours" — left there by whoever clicked it before you —
 * is the same defect in a new place, and worse here, because those cards look
 * like live commitments rather than stale state.
 *
 * The second is that the record is not worth keeping. `lib/ask/session.ts`
 * already settled this exact question for the Ask panel and the reasoning
 * transfers without amendment: "The intake flow persists a draft because losing
 * a half-written matter is expensive; a question already answered is not." A
 * half-written brief is ten minutes of the client's work. A message already
 * sent is already sent — restoring it across a reload recovers nothing, it just
 * puts an old promise back on screen looking current.
 *
 * **Surviving a remount is still the requirement.** Client-side navigation
 * keeps module state, so a client who sends a message, goes to look at their
 * cases and comes back still finds it — which is the case that would have felt
 * like a loss. Only a real reload clears it, and a real reload is the reviewer
 * starting again.
 *
 * The consequence worth naming: a message written mid-intake and then left
 * across a refresh is not carried onto the case at submission, because there is
 * nothing left to carry. That is the honest behaviour of a prototype with no
 * backend, and it is the same bargain every other in-memory surface here makes.
 *
 * Still its own store rather than part of `submitted-cases.ts`, for the reason
 * that file gives about `portal-notifications.ts`: that one is fixtures plus
 * the consequence of sending a case, and this is a different act with a
 * different lifetime. Merging them would mean a message to a lawyer had to
 * invent a case to hang off.
 */

import { useSyncExternalStore } from 'react';

/** One message, as sent. */
export type PersonMessage = {
  id: string;
  /** The client's own words, verbatim. */
  text: string;
  /** ISO. When they sent it. */
  at: string;
  /**
   * Roster id of the lawyer they picked, or `undefined` for "whoever fits".
   *
   * Optional because picking a specific person is a choice and not a
   * requirement: a client who does not know the names should not have to learn
   * them before they can ask for help.
   */
  lawyerId?: string;
  /**
   * The case it was landed on, once it has been. `undefined` is the common case
   * and not a gap: this screen's messages often belong to no case at all.
   */
  caseId?: string;
};

/*
 * A frozen empty array as the initial value, so the first `getSnapshot` and
 * `getServerSnapshot` agree by identity. Returning a fresh `[]` from either is
 * an infinite render loop, which is the trap this shape exists to avoid.
 */
const EMPTY: readonly PersonMessage[] = Object.freeze([]);
let messages: readonly PersonMessage[] = EMPTY;
const listeners = new Set<() => void>();

function write(next: readonly PersonMessage[]): void {
  messages = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Append one message. Oldest first, so the screen reads as a thread. */
export function recordPersonMessage(message: PersonMessage): void {
  const text = message.text.trim();
  if (text === '') return;
  write([...messages, { ...message, text }]);
}

export function readPersonMessages(): readonly PersonMessage[] {
  return messages;
}

/** `EMPTY` on the server, which is also the client's first paint. */
function getServerSnapshot(): readonly PersonMessage[] {
  return EMPTY;
}

export function usePersonMessages(): readonly PersonMessage[] {
  return useSyncExternalStore(subscribe, readPersonMessages, getServerSnapshot);
}

/**
 * Reset.
 *
 * A reload does this for free now, so there is no demo-link cleanup to run —
 * unlike `demo-session.ts`, which has to clear a *persisted* session left by a
 * different `?demo=` link. Kept for tests, where module state outlives the case
 * that created it.
 */
export function resetPersonMessages(): void {
  write(EMPTY);
}

/**
 * The messages not yet carried onto a case, as transcript turns.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS IS NEEDED AT ALL.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * *Talk to a person* is a screen rather than a dialog, so the client leaves the
 * intake to use it. That is better in every way except one: a handoff written
 * while the brief was still open used to ride onto the case with the rest of
 * the transcript at submission, because it *was* in the transcript. Written on
 * another screen, it is not.
 *
 * Left there, the exit would go nowhere again for precisely the client who
 * needs it most — the one who got stuck halfway and asked for a human before
 * they had sent anything. So the intake calls this at submission and folds
 * whatever is waiting into the case transcript.
 *
 * `caseId` is stamped as they go, so a second submission does not carry them
 * twice. Marking rather than removing, because the screen shows the client
 * their own messages and one vanishing the moment they sent their case would
 * look like it had been withdrawn.
 */
export function carryPersonMessagesToCase(caseId: string): {
  role: 'client';
  text: string;
  at: string;
  handoff: { lawyerId?: string; acknowledgement?: string };
}[] {
  const waiting = messages.filter((message) => message.caseId === undefined);
  if (waiting.length === 0) return [];

  const carried = new Set(waiting.map((message) => message.id));
  write(
    messages.map((message) =>
      carried.has(message.id) ? { ...message, caseId } : message,
    ),
  );

  return waiting.map((message) => ({
    role: 'client' as const,
    text: message.text,
    at: message.at,
    handoff: {
      ...(message.lawyerId ? { lawyerId: message.lawyerId } : {}),
    },
  }));
}
