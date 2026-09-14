/**
 * Who the intake is talking to (item 1).
 *
 * The client is signed in by the time they reach `/client/new`, so their name
 * is already known and the opening line has no business asking for it. This is
 * the one place that reads it, because the greeting on the first screen and the
 * greeting in the confirmation email have to be the same person: the email was
 * already splitting the name inline, and a second copy of that split is how one
 * surface ends up saying "Alex" while the other says "Alex Morgan".
 *
 * Reading from `MOCK_CLIENT_USER` is the prototype's stand-in for the session.
 * When there is a real one this function is the only thing that changes.
 */

import { MOCK_CLIENT_USER } from '@/lib/mocks/users';

/**
 * The name to greet them by, or `null` when there is not one worth using.
 *
 * `null` rather than an empty string, so a caller has to decide what to do
 * about it. "Hello, ." is worse than no greeting at all, and a template
 * handed a blank would print exactly that.
 */
export function clientFirstName(): string | null {
  const first = MOCK_CLIENT_USER.name.trim().split(/\s+/)[0];
  return first ? first : null;
}

/**
 * The whole name, for the brief's file note signature (item 14).
 *
 * Full rather than first, because the two lines are doing different jobs. A
 * greeting is a person speaking to you and uses the name they would say out
 * loud; a signature on a document is a record and uses the name on the file.
 * "Prepared with Alex" reads as a note to self, "Prepared with Alex Morgan"
 * reads as a document.
 */
export function clientFullName(): string {
  return MOCK_CLIENT_USER.name.trim();
}
