/**
 * Who is offered the tour.
 *
 * Written as a predicate in its own file for the reason spelled out at length
 * in `lib/ask/availability.ts`: the trigger and the thing it drives are
 * mounted from two different components, and every time this app has computed
 * one rule in two places the two have drifted and taken the feature with
 * them. Ask went missing twice that way.
 *
 * Here the pairing is `TourButton` in the top nav and `TourProvider` in the
 * shell. If the button renders where the provider does not, pressing it calls
 * into a context with no listener — visible, focusable and inert, which is
 * exactly the shape of the Ask defect. Both call `tourOffered`.
 *
 * **Clients only, and the same list Ask uses.** The tour walks the client
 * intake: the composer, the brief, the confirmation, the quote. A lawyer or
 * an admin pressing it would be sent to a screen that is not theirs. There is
 * deliberately no pathname term — the button is offered on every client
 * route, and pressing it from anywhere is what takes you to the start.
 */

import type { Role } from '@/lib/types';

/** The roles the tour is for. */
export const TOUR_ROLES: readonly Role[] = ['NON_LEGAL'];

export function tourOffered(role: Role): boolean {
  return TOUR_ROLES.includes(role);
}
