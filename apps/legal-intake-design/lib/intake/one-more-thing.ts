/**
 * The one thing, if there is one, that would move this client's own case along.
 *
 * Offered once on the confirmation and never again. The temptation on a waiting
 * screen is to reopen the form — "you skipped three fields, want to fill them
 * in?" — and that is the intake failing to take yes for an answer. The client
 * has sent their case. Anything asked of them now has to clear a higher bar
 * than "we have a slot for it": it has to be something whose absence will
 * actually slow down or weaken the work they are waiting for.
 *
 * So there are exactly two asks, at most one is shown, and the common case is
 * silence. A screen that asks for nothing is the correct output for a client
 * who gave us everything, and the block renders nothing at all rather than
 * congratulating them for it.
 *
 * ## The two, and why only these two
 *
 * **The document.** A contract matter with no contract attached is the one gap
 * that changes what the firm can do rather than how well they can do it: the
 * drafting agent starts on the first draft straight away, and a draft written
 * from a description of an agreement nobody has read is a different and worse
 * artefact than one written from the agreement. It is also the cheapest thing
 * the client can hand over, because the file already exists on their machine.
 *
 * **What a good result looks like.** `outcome` is the one optional field in the
 * contract flow, and the reason it is optional is sound — a client who does not
 * know yet should not be blocked by it. But it is the field a lawyer pricing
 * the work would most like to have, because it is the difference between
 * quoting a review and quoting a negotiation. Asking once, after the case is
 * safely in, is the right moment for a question that was right to skip earlier.
 *
 * ## What is deliberately not here
 *
 * Every required field, because they are all filled — the send gate does not
 * open otherwise, so an ask derived from one could never fire. `Timeline` is
 * chips with a default-ish answer and nothing useful comes of pressing for it.
 * And nothing at all about the client's budget: the quote is the firm's job to
 * write, and a flow that asked "what were you hoping to spend" the moment the
 * case was sent would be pricing the client rather than the work.
 */

import type { Brief } from './brief';

export type OneMoreThing = 'document' | 'outcome';

/** The optional field the `outcome` ask is about. */
const OUTCOME_KEY = 'outcome';

/**
 * Which ask to make, or `null` for none.
 *
 * Ordered rather than combined, and the order is the value to the work: the
 * document changes what gets drafted, the outcome changes what gets quoted.
 * Two asks stacked on a confirmation screen is a form, which is the thing this
 * flow stopped being.
 *
 * `documentCount` is passed rather than read off the brief because the brief
 * only records documents that produced a field: a contract the reader could
 * make nothing of leaves no trace on it, and asking someone to send a file they
 * have already sent is worse than not asking.
 */
export function oneMoreThing(
  brief: Brief,
  documentCount: number,
): OneMoreThing | null {
  if (documentCount === 0) return 'document';

  const outcome = brief.fields.find((field) => field.key === OUTCOME_KEY);
  // Absent on matters that have no such field, which is not a gap in the case.
  if (outcome && outcome.value === null) return 'outcome';

  return null;
}
