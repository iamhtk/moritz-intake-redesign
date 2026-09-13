/**
 * When something happened: relative while that is the more useful answer,
 * absolute once it is not (L11).
 *
 * Legora's rule is relative time for recent events and absolute for old ones,
 * and it is right for a reason worth stating: the two formats answer different
 * questions. "4 minutes ago" answers *how long have I been at this*, which is
 * what a client wants about something they just did. "14:32" answers *when
 * exactly*, which is what anyone wants about something far enough back that
 * counting is work. A product that picks one and uses it everywhere gets one of
 * the two wrong, and the usual choice is the wrong one for the case that comes
 * up most.
 *
 * The one place this fires in the intake is the per-field receipt on a brief
 * row — "Accepted · you · 14:32". That timestamp was always absolute, and it
 * was the weaker half of the rule: `use-brief.ts` resets `receipts` to `{}` on
 * hydration, so a receipt can only ever be from the session you are sitting in,
 * and the clock time of something you did ninety seconds ago is a number you
 * have to subtract from to use.
 *
 * The absolute tier is still reachable, which is why it is here rather than
 * simplified away: a client can leave this tab open for hours — the whole flow
 * is built on the premise that they will go and find a contract and come back
 * — and at that distance "173 minutes ago" is worse than the clock.
 *
 * Pure, and takes `now` rather than reading the clock, so the boundaries can be
 * tested at an instant instead of near one.
 */

/** Under a minute reads as the present tense. */
const JUST_NOW_MS = 60_000;

/**
 * An hour, after which counting minutes stops helping.
 *
 * Not a rounded "about an hour ago" tier in between. That phrasing is vaguer
 * than both of its neighbours, and vagueness is the specific thing this flow is
 * answering — a label that says less than the data supports is the same defect
 * as a spinner that says less than the app knows.
 */
const RELATIVE_LIMIT_MS = 60 * JUST_NOW_MS;

export type When =
  /** Under a minute. No number: there is nothing useful to count. */
  | { kind: 'just-now' }
  /** Under an hour. `minutes` is at least 1. */
  | { kind: 'minutes'; minutes: number }
  /** An hour or more. `time` is a 24-hour clock reading, e.g. "14:32". */
  | { kind: 'clock'; time: string };

/**
 * @param at epoch ms, when the thing happened.
 * @param now epoch ms, the moment being described from.
 *
 * A future `at` is treated as the present rather than as a negative count. It
 * should not happen, and the way it does happen is a clock correction between
 * the two reads, which is not worth "in -1 minutes" on a client's brief.
 */
export function describeWhen(at: number, now: number): When {
  const elapsed = now - at;
  if (elapsed < JUST_NOW_MS) return { kind: 'just-now' };
  if (elapsed < RELATIVE_LIMIT_MS) {
    return { kind: 'minutes', minutes: Math.floor(elapsed / JUST_NOW_MS) };
  }
  return { kind: 'clock', time: clockTime(at) };
}

/**
 * HH:MM, 24-hour, in the reader's own timezone.
 *
 * `en-GB` rather than the active locale, matching `fileNoteTimestamp`: this app
 * ships English only, and reading the UI locale here would produce a format
 * nothing else on the page uses the day a second locale is added.
 */
export function clockTime(at: number): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(at));
}

/**
 * How long until this description could change, in ms, or `null` if it cannot.
 *
 * The reason a caller needs this is the reason relative time is usually done
 * badly: a label rendered once says "just now" for the rest of the afternoon.
 * That is not a cosmetic staleness, it is the screen asserting something untrue
 * about what the client did, on the row whose entire job is to record what they
 * did.
 *
 * So the caller re-renders, and this says when to bother. `null` once the label
 * has settled on a clock time, which never changes again — so the timer stops
 * rather than ticking for the life of the page.
 */
export function msUntilChange(at: number, now: number): number | null {
  const elapsed = now - at;
  if (elapsed >= RELATIVE_LIMIT_MS) return null;
  // The next whole-minute boundary since `at`, which is exactly when the label
  // gains a minute (or crosses out of `just-now`).
  const nextBoundary = (Math.floor(elapsed / JUST_NOW_MS) + 1) * JUST_NOW_MS;
  return Math.max(250, nextBoundary - elapsed);
}
