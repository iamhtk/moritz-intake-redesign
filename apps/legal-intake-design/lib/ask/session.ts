/**
 * The Ask conversation, held outside React (task N6).
 *
 * Ported from the source's `lib/chat-session.ts`, whose reason for existing is
 * the same here: **opening Ask from the command palette mounts and unmounts a
 * dialog.** If the transcript lived in the panel's own `useState`, the palette
 * closing would take the thread with it, and a reader who asked a question,
 * pressed ⌘K to go and look at the case, then came back, would find an empty
 * panel. Module-level state outlives the component tree that renders it.
 *
 * Not `localStorage`, deliberately. The intake flow persists a draft because
 * losing a half-written matter is expensive; a question already answered is
 * not, and a transcript restored across a reload would put a stale answer —
 * computed against yesterday's cases — back on screen looking current.
 * Surviving a remount is the requirement. Surviving a reload is not.
 *
 * **Two isolated histories** (§8.6). `cases` and `general` never share a
 * transcript, and this is where that is enforced rather than in the UI. The
 * risk is specific to this app: a general-information sentence sitting in the
 * same thread as an answer grounded in the reader's own file becomes citable as
 * the basis for it, and where the source was internal-facing, ours is
 * client-facing — so the confusion is not an inconvenience, it is a client
 * believing they have been advised.
 *
 * The grounded mode is named `cases` rather than `firm`. The old name came from
 * the admin app this was ported from, where "the firm's data" was the accurate
 * description of what the tab read. Here the tab reads the client's own cases,
 * and a client is not the firm.
 */

import type { AskAction } from './actions';
import type { FailureKind } from '@/lib/intake/failure';

export type AskMode = 'cases' | 'general';

export type AskTurn = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  /** Proposed destinations, on a settled assistant turn only. */
  actions?: AskAction[];
  /** How many in-scope cases the answer leaned on (§8.6 rule 3). */
  citedCases?: number;
  /** Set when this turn failed. Renders copy, never a provider string. */
  error?: FailureKind;
};

/** One transcript per mode. Never merged, never read across. */
const transcripts: Record<AskMode, AskTurn[]> = {
  cases: [],
  general: [],
};

let mode: AskMode = 'cases';

export function readTranscript(which: AskMode): AskTurn[] {
  return transcripts[which];
}

export function writeTranscript(which: AskMode, next: AskTurn[]): void {
  transcripts[which] = next;
}

export function readAskMode(): AskMode {
  return mode;
}

export function writeAskMode(next: AskMode): void {
  mode = next;
}

/** Clears one mode's thread. The other is untouched, by definition. */
export function clearTranscript(which: AskMode): void {
  transcripts[which] = [];
}

/**
 * Resets everything. Only for tests — module state persists between them
 * otherwise, and a leaked transcript makes the next test pass or fail for a
 * reason that is not in it.
 */
export function resetAskSession(): void {
  transcripts.cases = [];
  transcripts.general = [];
  mode = 'cases';
}
