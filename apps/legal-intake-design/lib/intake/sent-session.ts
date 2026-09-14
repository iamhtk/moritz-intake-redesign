/**
 * The sealed brief, kept so a sent case survives a reload (items 20 and 21).
 *
 * Two separate failures shared one cause: everything durable about a
 * submission happened inside the 1800ms `setTimeout` that drove the spinner.
 *
 * - Reload one second after sending and the confirmation was gone. The screen
 * rendered from React state, `clearIntakeSession()` had already removed the
 * draft, and nothing else on the intake route knew a case had been sent — so
 * a client who refreshed to check it had worked got the blank "Describe your
 * matter" screen, which reads as "it did not work".
 * - Navigate away *during* the wait and the case was never recorded at all.
 * The unmount cleanup cleared the timer, so `recordSubmittedCase`,
 * the notification and the session clear never ran, while the draft sat in
 * `localStorage` looking like unfinished work.
 *
 * ## Why a third key rather than keeping the draft
 *
 * Because the draft keys mean something to code that cannot see this file.
 * `use-document-workspace.ts` decides whether to keep a client's document
 * bytes by asking whether `BRIEF_STORAGE_KEY` or `MESSAGES_STORAGE_KEY` is
 * present: no session, no documents. Making the draft survive a submission in
 * order to fix a reload would silently change what happens to somebody's
 * contract, from a file two directories away. So submission still clears the
 * draft exactly as it did, and the sealed copy lands somewhere with its own
 * name and its own lifetime.
 *
 * ## Why it expires
 *
 * A confirmation answers one question — "did that actually go through" — and
 * that question is asked within hours. A receipt with no expiry would mean a
 * client who sent a case on Monday and came back on Friday to start a second
 * one landed on Monday's confirmation instead of a fresh intake, which is a
 * new dead end in exchange for fixing an old one. After the window the case
 * page is the right place to look, and it is the place the notification and
 * the email both point.
 */

import type { MatterId } from '@/components/design/new-case/intake-types';
import type { Brief } from './brief';
import { readStoredJson, writeStoredJson } from './session-storage';

/**
 * Its own key and its own version, deliberately not a `v6` session key: those
 * are cleared together as one unit at submission, which is the exact moment
 * this one has to be written.
 */
export const SENT_STORAGE_KEY = 'moritz.intake.sent.v1';

/**
 * The query key that makes a confirmation an address rather than a leftover.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THE RECEIPT IS NOT ENOUGH ON ITS OWN.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The record above answers "did that actually go through" after a refresh, and
 * it did that correctly. What it could not do is tell a refresh apart from a
 * client deliberately asking for a new case, because both arrive as the same
 * thing: a mount of `/client/new` with a receipt sitting in `localStorage`. So
 * for twelve hours after sending, every route into the intake landed on the
 * confirmation for a case the client had finished with:
 *
 *   send it → Go to case → Home → New case → the previous case, again
 *
 * That is four of the four ways in. "New case" in the sidebar, the card on the
 * dashboard, the command palette and the engagement-gated button are all plain
 * `<Link href="/client/new">`, so none of them goes through the navigation
 * guard, and the one place that *does* clear the receipt on the way out
 * (`onLeaveSent`) only fires for navigation routed through `navigate()`.
 * Clearing it from each link in turn would be four fixes and a fifth one owed
 * to whoever adds the next entry point.
 *
 * So the discriminator is the address, which is the one thing that genuinely
 * differs between the two intentions. A refresh keeps the query string; a
 * client clicking "New case" asks for the bare path. Submission puts the case
 * id in the URL, the restore below happens only when it is there, and a bare
 * `/client/new` therefore means what it says.
 *
 * The default is a new case. That is the direction that has to be safe: the
 * cost of a missed restore is one extra click through to Your cases, and the
 * cost of a missed *reset* is a client who cannot start a second case at all.
 */
export const SENT_PARAM = 'sent';

/**
 * The case id in the address bar, or `null` when the URL is not a confirmation.
 *
 * Takes the search string rather than reading `window` so it can be tested and
 * so the caller decides which URL is being asked about.
 */
export function sentCaseIdOf(search: string): string | null {
  try {
    return new URLSearchParams(search).get(SENT_PARAM) || null;
  } catch {
    // A malformed search string is not a confirmation.
    return null;
  }
}

/**
 * How long a sent case keeps the intake route, in milliseconds.
 *
 * Twelve hours: long enough to cover "I sent it this morning and want to check
 * it went", short enough that it cannot become a permanent redirect away from
 * starting a second case.
 *
 * It is the third of three backstops now, and the least important. `SENT_PARAM`
 * above is what actually keeps a finished case off a new one, because it is
 * checked on every mount rather than after half a day; "Start another case"
 * clears the record outright. This is what catches the client who sends a case
 * and leaves the tab open until Friday.
 */
export const SENT_TTL_MS = 12 * 60 * 60 * 1000;

export type SentSession = {
  /** The brief as it was sent. Read-only from here on. */
  brief: Brief;
  /** Resolved from the matter-type row, not `brief.matterId` (item 13). */
  matterId: MatterId | undefined;
  /** Epoch milliseconds, used for the expiry and nothing else. */
  sentAt: number;
  /** The case the confirmation points at, so "Go to case" agrees with it. */
  caseId: string;
  /** Names only. The bytes are not kept; see the note above. */
  documentNames: readonly string[];
};

function isSentSession(value: unknown): value is SentSession {
  if (typeof value !== 'object' || value === null) return false;
  const { brief, sentAt, caseId } = value as Record<string, unknown>;
  if (typeof sentAt !== 'number' || typeof caseId !== 'string') return false;
  if (typeof brief !== 'object' || brief === null) return false;
  // Same shape check the intake route makes of a posted brief: a `fields`
  // array is what every consumer of this actually reads.
  const { fields } = brief as Record<string, unknown>;
  return Array.isArray(fields);
}

export function writeSentSession(session: SentSession): void {
  writeStoredJson(SENT_STORAGE_KEY, session);
}

export function clearSentSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SENT_STORAGE_KEY);
  } catch {
    // Blocked storage must never stop the flow loading.
  }
}

/**
 * The sent case still worth showing, or `null`.
 *
 * Clears an expired or unreadable record on the way past rather than leaving
 * it to be re-read and re-rejected on every mount. A malformed record is
 * treated exactly like an expired one: there is no version of "half a sealed
 * brief" worth rendering a confirmation from.
 */
export function readSentSession(now: number = Date.now()): SentSession | null {
  const stored = readStoredJson<unknown>(SENT_STORAGE_KEY);
  if (stored === null) return null;

  if (!isSentSession(stored) || now - stored.sentAt > SENT_TTL_MS) {
    clearSentSession();
    return null;
  }

  return stored;
}
