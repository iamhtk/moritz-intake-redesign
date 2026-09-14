/**
 * Where the tour is, and whether it has been sent away.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TWO STORES, BECAUSE THEY ANSWER TWO QUESTIONS WITH TWO LIFETIMES.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **The cursor is `sessionStorage`.** It exists to survive one thing: the
 * three navigations the tour makes between demo links. A tour is a single
 * sitting, and a position restored a week later would drop somebody into stop
 * 19 of a flow they have no memory of starting. `sessionStorage` has exactly
 * that lifetime built in, so there is no expiry to write and none to get
 * wrong. It also dies with the tab, which is the right answer to "I closed it
 * halfway through": the Tour button restarts from the beginning, which is
 * what it says it does.
 *
 * **The dismissal is `localStorage`.** It answers a different question, and
 * the question is durable: *has this person already decided they do not want
 * this?* Nothing in this build auto-starts the tour, so today the flag nags
 * nobody either way. It is written anyway, because the flag is the cheap half
 * of that arrangement and the expensive half is remembering to add it before
 * the first thing that would auto-prompt. A tour that opens itself on load
 * and has no memory is the single most irritating pattern in onboarding UI,
 * and the way products acquire one is by shipping the prompt first.
 *
 * Both are guarded the same way as `lib/intake/session-storage.ts`: storage
 * throws in a locked-down Safari and on a server render there is no `window`
 * at all, so every read falls back to "nothing stored" and every write is
 * allowed to fail. Losing a tour position is not worth a broken page.
 */

import type { TourScreenId } from './registry';

/** Where the reviewer is: which screen, and which stop inside it. */
export type TourCursor = {
  readonly screen: TourScreenId;
  /** Index into that screen's `stops`, zero-based. */
  readonly stop: number;
};

/** Why the tour is not running. Written on both exits, read by nothing yet. */
export type TourDismissal = 'skipped' | 'finished';

export const TOUR_CURSOR_KEY = 'moritz.tour.cursor.v1';
export const TOUR_DISMISSED_KEY = 'moritz.tour.dismissed.v1';

/**
 * The valid screen ids, as a runtime list.
 *
 * Parsing has to reject a cursor naming a screen that no longer exists — a
 * renamed screen would otherwise resume into `undefined` and throw on the
 * first render after a deploy. Written out rather than derived from
 * `TOUR_SCREENS` so this module stays free of the registry's import graph and
 * can be tested on its own.
 */
const SCREEN_IDS: readonly string[] = [
  'home',
  'describe',
  'sent',
  'quote',
  'back',
];

/**
 * Whether an unknown value is a cursor we are willing to resume from.
 *
 * Exported because it is the whole of the parsing rule and the test wants it
 * without a `Storage` in the way.
 */
export function isTourCursor(value: unknown): value is TourCursor {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.screen === 'string' &&
    SCREEN_IDS.includes(candidate.screen) &&
    typeof candidate.stop === 'number' &&
    Number.isInteger(candidate.stop) &&
    candidate.stop >= 0
  );
}

function session(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

function local(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** The stored cursor, or `null` if there is none or it is not one. */
export function readCursor(): TourCursor | null {
  const store = session();
  if (!store) return null;
  try {
    const raw = store.getItem(TOUR_CURSOR_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return isTourCursor(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCursor(cursor: TourCursor): void {
  const store = session();
  if (!store) return;
  try {
    store.setItem(TOUR_CURSOR_KEY, JSON.stringify(cursor));
  } catch {
    // A full or locked store costs the tour its position across a navigation
    // and nothing else. Not worth a thrown render.
  }
}

export function clearCursor(): void {
  const store = session();
  if (!store) return;
  try {
    store.removeItem(TOUR_CURSOR_KEY);
  } catch {
    // See `writeCursor`.
  }
}

/** How the tour last ended, if it has. */
export function readDismissal(): TourDismissal | null {
  const store = local();
  if (!store) return null;
  try {
    const raw = store.getItem(TOUR_DISMISSED_KEY);
    return raw === 'skipped' || raw === 'finished' ? raw : null;
  } catch {
    return null;
  }
}

export function writeDismissal(reason: TourDismissal): void {
  const store = local();
  if (!store) return;
  try {
    store.setItem(TOUR_DISMISSED_KEY, reason);
  } catch {
    // See `writeCursor`.
  }
}
