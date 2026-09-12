/**
 * Where an in-progress intake lives between visits.
 *
 * Two keys rather than one object, because the brief and the transcript are
 * written at different moments and a single blob would make every keystroke
 * rewrite the whole session. They are cleared together, a brief without its
 * conversation, or the reverse, is worse than a clean start.
 *
 * The `v3` suffix is a new namespace, not a bump: the old flow stored a
 * different shape under `v1`/`v2`, and rehydrating that here would produce a
 * half-broken session rather than an empty one.
 */

export const BRIEF_STORAGE_KEY = 'moritz.intake.brief.v3';
export const MESSAGES_STORAGE_KEY = 'moritz.intake.messages.v3';

/** Everything an intake in progress has saved. Used by "Delete case". */
export function clearIntakeSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(BRIEF_STORAGE_KEY);
    window.localStorage.removeItem(MESSAGES_STORAGE_KEY);
  } catch {
    // Blocked storage must never stop someone starting again.
  }
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
