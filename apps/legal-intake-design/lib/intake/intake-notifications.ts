/**
 * "Case received", raised by the intake at the moment of submission
 * (Decision 23).
 *
 * The client's inbox had rows for a lawyer being assigned and a payment being
 * requested, and nothing at all for the case arriving. That is the gap behind
 * complaint one: the only confirmation a client ever got lived on a screen they
 * then navigated away from. A notification is the in-product half of the same
 * receipt the email is the out-of-product half of.
 *
 * Stored copy, not a translation key, because the notification outlives the
 * render that made it: it is written to localStorage and read back on a later
 * visit, exactly like the rest of the mock feed, whose titles are also baked at
 * creation time. So the strings arrive from the caller, which has the
 * translator, and this module stays a pure shape.
 */

import type { Notification } from '@/lib/types';

/** Stable, so a reload or a second submit cannot double the row. */
export const CASE_RECEIVED_NOTIFICATION_ID = 'ntf_client_intake_received';

export function caseReceivedNotification({
  caseNumber,
  caseTitle,
  href,
  title,
  content,
  now = new Date(),
}: {
  caseNumber: string;
  caseTitle: string;
  href: string;
  title: string;
  content: string;
  now?: Date;
}): Notification {
  return {
    id: CASE_RECEIVED_NOTIFICATION_ID,
    type: 'CASE_RECEIVED',
    title,
    content,
    // Unread is the point. It is the badge on the bell that tells a client
    // something happened while they were not looking at this screen.
    read: false,
    createdAt: now.toISOString(),
    caseNumber,
    caseTitle,
    /*
     * No actor. Submission is the client's own action and the system's
     * acknowledgement of it, so there is no person to attribute it to, and
     * putting a lawyer's face on it would say someone had picked the case up.
     * A null actor makes the row use its type icon, which is the honest render
     * (B, Decision 21).
     */
    triggeredBy: null,
    href,
  };
}

/** Stable, for the same reason `CASE_RECEIVED` is. */
export const QUOTE_READY_NOTIFICATION_ID = 'ntf_client_intake_quote_ready';

/**
 * "Your quote is ready", raised when the price lands (item 59).
 *
 * The receipt above stops at submission, which is exactly where the silence
 * starts. Garzai's own summary of the client's experience — "submit, a quote to
 * pay, silence, a lawyer appears, a document arrives" — has the quote as the
 * first thing that happens *to* the client rather than because of them, and
 * nothing in the product told them it had. A client who took the confirmation
 * at its word and closed the tab had no way back in.
 *
 * Unlike the received row, this one has an actor, and the difference is the
 * rule rather than a detail. Submission is the client's own action, so there is
 * nobody to attribute it to; a quote is written by a named lawyer, which is the
 * one claim about a person this flow can actually stand behind. So the row
 * carries their face — and it is the first time in the whole journey that a
 * real individual is attached to the client's case, which is the moment the
 * firm stops being a system.
 */
export function quoteReadyNotification({
  caseNumber,
  caseTitle,
  href,
  title,
  content,
  lawyer,
  now = new Date(),
}: {
  caseNumber: string;
  caseTitle: string;
  href: string;
  title: string;
  content: string;
  lawyer: { name: string; image: string | null } | null;
  now?: Date;
}): Notification {
  return {
    id: QUOTE_READY_NOTIFICATION_ID,
    type: 'QUOTE_CREATED',
    title,
    content,
    read: false,
    createdAt: now.toISOString(),
    caseNumber,
    caseTitle,
    triggeredBy: lawyer,
    href,
  };
}
