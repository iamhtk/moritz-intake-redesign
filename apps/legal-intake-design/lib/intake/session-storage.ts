/**
 * Where an in-progress intake lives between visits.
 *
 * Two keys rather than one object, because the brief and the transcript are
 * written at different moments and a single blob would make every keystroke
 * rewrite the whole session. They are cleared together, a brief without its
 * conversation, or the reverse, is worse than a clean start.
 *
 * The `v3` suffix was a new namespace, not a bump: the old flow stored a
 * different shape under `v1`/`v2`, and rehydrating that here would produce a
 * half-broken session rather than an empty one. `v4` is a real bump — the brief
 * field now carries a pinned `confidenceScore`, and a session saved before that
 * would come back with no reading on any row. `v5` is another real bump: the
 * brief now carries `observation` and `documentsSuggested`, and a session
 * restored without them would have `undefined` where the code expects `null`
 * and `false`, which is the difference between "no observation yet" and "the
 * at-most-one check cannot tell". Bumping is cheaper than defaulting on read
 * in five places. `v6` is a real bump for the same class of reason: the
 * field's `confidence` went from a `'sure'`/`'unsure'` string to a 1 to 10
 * number, and a restored session would carry a string into arithmetic and
 * render a row whose reading disagrees with its own rating.
 */

import { forgetAllDocuments } from './document-store';

export const BRIEF_STORAGE_KEY = 'moritz.intake.brief.v6';
export const MESSAGES_STORAGE_KEY = 'moritz.intake.messages.v6';
/**
 * The names of the documents handed over, which the brief does not hold.
 *
 * A field records the document it was read from, but only if it produced a
 * field: a contract the model could make nothing of leaves no trace on the
 * brief at all. The list of what was handed over is a separate fact from what
 * was read out of it, and the submitted case needs the former.
 */
export const DOCUMENTS_STORAGE_KEY = 'moritz.intake.documents.v6';

/**
 * Which documents the panel had open, and whether it was open at all.
 *
 * Separate from the bytes, which are too big for this storage and live in
 * IndexedDB (`document-store.ts`). This key holds only the arrangement: the
 * tabs, which one was in front, and whether the panel was showing. Restoring it
 * is what makes a reload mid-intake a reload rather than a reset — the sidebar
 * the client was reading comes back where they left it instead of collapsing to
 * a handle they have to find again.
 */
export const DOCUMENT_PANEL_STORAGE_KEY = 'moritz.intake.panel.v1';

/**
 * Everything an intake in progress has saved.
 *
 * Called by "Delete case", and also at the moment a case is sent: a submitted
 * case is a record on the client's account, not a draft in this browser, and
 * leaving the session behind is what had a sent case reopen as an unfinished
 * one the next time the client pressed "Start a case".
 */
export function clearIntakeSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(BRIEF_STORAGE_KEY);
    window.localStorage.removeItem(MESSAGES_STORAGE_KEY);
    window.localStorage.removeItem(DOCUMENTS_STORAGE_KEY);
    window.localStorage.removeItem(DOCUMENT_PANEL_STORAGE_KEY);
  } catch {
    // Blocked storage must never stop someone starting again.
  }

  /*
   * And the bytes, which are the part that actually matters to clear: the
   * arrangement above is a handful of ids, this is the client's contract. Not
   * awaited, because every caller is a UI action that must not wait on a disk
   * — and because nothing downstream reads the store again in the same gesture
   * (a restart resets the workspace in memory, a sent case navigates away).
   */
  void forgetAllDocuments();
}

export function readStoredJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeStoredJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // A full or blocked quota must never break the conversation.
  }
}
