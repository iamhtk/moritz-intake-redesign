/**
 * What happens when the answer is not "yes" (G3, G2).
 *
 * Both of their how-it-works videos, and every frame of the reference product,
 * assume the client agrees. The quote arrives and the only control on it is
 * `APPROVE AND START`. That is a reasonable thing to optimise for and it is not
 * how buying legal work goes: the first real decision the client makes with
 * money attached is the one place the flow currently has no design at all.
 *
 * So this models the two shapes of "not yes".
 *
 * **G3, the client does not accept.** Four paths instead of one. The important
 * thing is not that "this seems high" exists as a button; it is that pressing
 * it asks *which* problem it is, because three of the four answers are things a
 * lawyer can act on and one is not. "Too expensive" on its own is a dead end
 * for both sides — the client has said no and given nobody anything to do about
 * it. "More than I can spend on this" is a brief for a smaller piece of work.
 *
 * **G2, the firm cannot quote.** A criminal matter, a jurisdiction the firm does
 * not cover, or work too uncertain to price as a fixed fee. This is a product
 * decision and not an error screen: the client has spent ten minutes writing a
 * brief, and the worst possible ending is a red box. Every reason here carries
 * what *is* possible instead, because "we cannot help" and "we cannot help on
 * these terms" are very different sentences and only one of them is true.
 *
 * Pure data and pure functions. The copy lives in `en.json`; what is here is
 * which paths exist and which of them need something from the client before
 * they can be sent.
 */

/** Why a fixed quote is not possible (G2). Each one has its own way forward. */
export type NoQuoteReason =
  /** Outside what the firm does at all. Criminal, family, immigration. */
  | 'out-of-practice'
  /** A jurisdiction the firm has no admitted lawyer in. */
  | 'out-of-jurisdiction'
  /** Real work, genuinely not pricable up front. */
  | 'not-fixed-fee';

export const NO_QUOTE_REASONS: readonly NoQuoteReason[] = [
  'out-of-practice',
  'out-of-jurisdiction',
  'not-fixed-fee',
];

/**
 * How the client can answer a quote (G3).
 *
 * `approve` is the path their product has. The other three are the ones it does
 * not, and they are ordered by how much the client is committing to: approve,
 * ask, push back, or ask for less. A client who wants the cheapest option first
 * finds it last, which is deliberate — the default is still yes.
 */
export type QuoteResponse = 'approve' | 'question' | 'too-high' | 'part-only';

export const QUOTE_RESPONSES: readonly QuoteResponse[] = [
  'approve',
  'question',
  'too-high',
  'part-only',
];

/**
 * Why the price is a problem, which is the whole of G3.
 *
 * A quote the client will not pay is not one fact, it is four, and they want
 * four different things from the lawyer who wrote it. Offering "this seems
 * high" and then sending nothing but that is the same failure as a spinner
 * that will not say what it is doing: the app knows more than it passed on.
 *
 * `thinking` is in the list precisely because it is the one the lawyer cannot
 * act on. Leaving it out would push a client who simply wants a day to decide
 * into picking one of the three that misrepresents them, and a misrepresented
 * objection is worse for the lawyer than an honest silence.
 */
export type TooHighReason =
  /** No budget for it at this size. Opens the door to a smaller scope. */
  | 'over-budget'
  /** Expected less for this kind of work. Wants the reasoning. */
  | 'unexpected'
  /** Has a cheaper quote elsewhere. Invites a response to it. */
  | 'compared'
  /** Wants time. Nothing for the lawyer to do but hold it. */
  | 'thinking';

export const TOO_HIGH_REASONS: readonly TooHighReason[] = [
  'over-budget',
  'unexpected',
  'compared',
  'thinking',
];

/** A path that opens a panel, which is every path except accepting. */
export type DetailedResponse = Exclude<QuoteResponse, 'approve'>;

/**
 * Whether this path needs the client to say more before it can be sent.
 *
 * `approve` does not: it is the one path where the client's meaning is complete
 * in the click, and putting a form in front of it would be charging them for
 * agreeing. Everything else carries something a person has to read, so it stays
 * disabled until there is something to read — sending an empty "I have a
 * question" wastes a round trip on both sides.
 *
 * A type guard rather than a plain boolean, because the card holds "which path
 * is open" in state and `approve` can never be the answer. Saying that in the
 * type means the state cannot hold it, which is how the compiler found a dead
 * `open === 'approve'` branch in the card's own ready check.
 */
export function needsDetail(
  response: QuoteResponse,
): response is DetailedResponse {
  return response !== 'approve';
}

/**
 * Whether a chosen objection is one the lawyer can do something about.
 *
 * Drives the copy on the confirmation, not whether it can be sent. All four are
 * sendable; only three of them get "they will come back to you with options",
 * because promising a response to "I want to think about it" would be the flow
 * inventing an obligation the client did not ask for.
 */
export function isActionable(reason: TooHighReason): boolean {
  return reason !== 'thinking';
}

/**
 * The parts of the matter a client can ask to have priced on their own.
 *
 * Derived from the brief's own field keys rather than a separate list, which is
 * the point: the brief spent the whole intake itemising this matter, so the
 * client asking for part of it can point at the parts that already exist. A
 * hand-written menu of "scope options" here would be a second, competing
 * account of the same case — and it would go stale the moment a matter type
 * changed its fields.
 *
 * Only filled required fields. An empty field is not a piece of work anyone can
 * price, and an optional one the client skipped is not a thing they are asking
 * for.
 */
export function scopeChoices(
  fields: readonly {
    key: string;
    label: string;
    value: string | null;
    required: boolean;
  }[],
): { key: string; label: string }[] {
  return fields
    .filter((field) => field.required && field.value !== null)
    .map((field) => ({ key: field.key, label: field.label }));
}
