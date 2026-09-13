/**
 * The one case the intake's submission stands for (Decision 8).
 *
 * Submission is stubbed — there is no backend here — so the confirmation needs
 * a reference to show and somewhere for "Go to case" to land. Both come off the
 * single mock case added for exactly this purpose, so the number on the
 * confirmation is the number on the case page rather than two strings that
 * happen to look alike.
 */

import { getCaseById, SUBMITTED_CASE_ID } from '@/lib/mocks/cases';

const mockCase = getCaseById(SUBMITTED_CASE_ID);

export const SUBMITTED_CASE = {
  id: SUBMITTED_CASE_ID,
  /** The case number a client would quote in an email. */
  reference: mockCase?.caseNumber ?? SUBMITTED_CASE_ID,
  href: `/client/cases/${SUBMITTED_CASE_ID}`,
} as const;

/**
 * The figure the `?demo=quote` screen shows, and why it is not invented (G3).
 *
 * The flow shows no price in a real run, on purpose. Garzai confirmed the quote
 * is written by a person after submission, so a number the prototype made up
 * would be a commitment nobody had made — which is why the plan's cut list cut
 * the `$750` card and `NOTE.md` argues for the cut.
 *
 * G3 is not about showing a price, though; it is about designing what happens
 * when the client does not accept it, and that decision is not real without a
 * number on the screen. So the number is taken from this app's own case
 * fixtures rather than written here: `case_007` is the closest comparable
 * matter the mocks contain — a commercial MSA and DPA review for a logistics
 * client — and it already carries a `quoteAmount`. Reading it means the figure
 * on this screen is a figure the case pages already show, which is the same
 * discipline `SUBMITTED_CASE` exists to enforce one paragraph up.
 *
 * The card also says on its face that it is an example figure from the
 * prototype's own data. Without that line this would be the one place in the
 * submission where a number nobody had been quoted sat on screen looking like a
 * quote, and it would undo the argument the note makes.
 */
const COMPARABLE_CASE_ID = 'case_007';
const comparable = getCaseById(COMPARABLE_CASE_ID);

export const DEMO_QUOTE = {
  /** Falls back only if the fixture is edited; never a number invented here. */
  fee: comparable?.quoteAmount ?? 0,
  currency: comparable?.currency ?? 'USD',
  sourceCaseNumber: comparable?.caseNumber ?? COMPARABLE_CASE_ID,
} as const;
