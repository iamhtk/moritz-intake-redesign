/**
 * Which wins when a `?demo=` link and a saved session disagree: the link.
 *
 * The demo seed in `intake-v2.tsx` refuses to run once the brief has a value
 * in it (`brief.fields.some(...)`), which is the right guard against seeding
 * over someone's real work and the wrong one for the case it actually hit. A
 * saved session is restored from `localStorage` before that effect runs, so a
 * reviewer who opens `?demo=1`, reads it, and then opens `?demo=quote` gets
 * `?demo=1` a second time — the seed sees a brief with values and returns, the
 * stage stays `intake`, and the quote screen looks like it does not exist.
 *
 * That is the worst failure mode available to this prototype. `NOTE.md` hands
 * over five demo URLs and asks the reader to try them, and trying them in one
 * tab is the only way anybody will. A reviewer clicking the second link and
 * seeing the first screen does not conclude "stale session", they conclude the
 * feature was never built.
 *
 * ## Why a marker rather than "clear whenever `demo` is present"
 *
 * Because a refresh has to keep what the reviewer did. They open `?demo=1`,
 * correct a value, reload to check it saved — wiping there would teach them the
 * flow forgets, on the one screen built to prove it remembers. So the stored
 * session records which demo produced it, and it is cleared only when the link
 * asks for a *different* one.
 *
 * A real intake carries no marker and is never touched by any of this: with no
 * `demo` param the decision is always to keep the session. What it does do is
 * forget the marker, so the next demo link re-seeds rather than resuming a
 * session that has since become somebody's actual case.
 */

import {
  clearIntakeSession,
  readStoredJson,
  writeStoredJson,
} from './session-storage';

/**
 * Where the marker lives.
 *
 * Deliberately outside the `v6` session keys: those are cleared together as one
 * unit by "Delete case", and the marker has to survive that so a reviewer who
 * deletes a demo case and reloads the same link gets it seeded again rather
 * than landing on an empty start screen with no explanation.
 */
export const DEMO_MARKER_KEY = 'moritz.intake.demo.v1';

export type DemoSessionDecision = {
  /** Whether the saved brief, transcript and documents must go. */
  clearSession: boolean;
  /** What the marker should hold afterwards. `null` means remove it. */
  marker: string | null;
};

/**
 * The whole rule, as a function of the URL and what is on disk.
 *
 * Pure so the table of cases can be a test rather than a paragraph. The three
 * rows are: no demo asked for, the same demo asked for again, a different demo
 * asked for.
 */
export function demoSessionDecision(
  param: string | null,
  marker: string | null,
): DemoSessionDecision {
  // A real intake. Never clear, and drop the marker so the next demo link is
  // not mistaken for a continuation of this session.
  if (param === null) return { clearSession: false, marker: null };

  // The same link again: a refresh, or a second visit. Keep the edits.
  if (marker === param) return { clearSession: false, marker: param };

  // A different link. The link wins.
  return { clearSession: true, marker: param };
}

/**
 * Apply the rule, once, before anything reads the stored session.
 *
 * Called during the first render of `IntakeV2` rather than from an effect, and
 * that ordering is the entire point: `useBrief` hydrates from `localStorage` in
 * an effect, and effects run after render, so clearing here is the only place
 * that lands before the restore rather than after it. Anything later would have
 * to unpick a session that had already arrived in React state.
 *
 * Safe to call on the server, where it does nothing.
 */
export function prepareDemoSession(search: string): void {
  if (typeof window === 'undefined') return;

  const param = new URLSearchParams(search).get('demo');
  const marker = readStoredJson<string>(DEMO_MARKER_KEY);
  const decision = demoSessionDecision(param, marker);

  if (decision.clearSession) clearIntakeSession();

  if (decision.marker === null) {
    try {
      window.localStorage.removeItem(DEMO_MARKER_KEY);
    } catch {
      // Blocked storage must never stop the flow loading.
    }
    return;
  }

  if (decision.marker !== marker) {
    writeStoredJson(DEMO_MARKER_KEY, decision.marker);
  }
}
