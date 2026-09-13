/**
 * The fields a document can never settle on its own, and the guard for them.
 *
 * Found by T36 and it took two passes to get right, because the first fix was
 * aimed at the wrong half of the problem.
 *
 * The seeded contract names NORTHWIND LOGISTICS LIMITED and ACME HOLDINGS LTD
 * in the same recital, in the same format, one sentence apart, and nothing in
 * the document says which of them the client is. Run 2 dropped it with no words
 * at all, which is a real path because the opening move never requires any (A,
 * D1): the reader picked the first party it read and Moritz said it out loud,
 * "with Northwind Logistics as the other side". The client's own company, named
 * to a lawyer as their opponent.
 *
 * The prompt was tightened and it did help: the value stopped being the whole
 * recital clause. It did not stop this. Worse, run 1 then showed the same
 * failure WITH the client's sentence present, having got it right on the
 * previous pass, which is the finding that matters: the tie-break is not a rule
 * the reader follows unreliably, it is a coin the reader flips. Asked to read a
 * document and fill in what it can, a reader answers the question the document
 * plainly answers ("who are the parties") rather than declining the one it
 * cannot ("which of them is you").
 *
 * So the code decides, which is where this belongs anyway (D27): the model owns
 * the conversation, the code owns the brief. The route already takes provenance
 * off the model, dropping a source whose quote cannot be found in the real
 * document text. This is that same rule pointed at the client instead of the
 * document: a value naming the other side survives a read only if it is
 * traceable to something the client actually said.
 *
 * What it costs when it fires wrongly: one question. Moritz asks who the other
 * side is and the client answers in three words, tagged `client`, which
 * auto-approves. What it saves: a wrong party name reaching a drafted document,
 * which the client can only stop by catching it on a panel of nine rows. Those
 * are not the same size of mistake, and the guard is deliberately biased.
 */

/**
 * Fields whose whole definition is "the party who is not the client".
 *
 * Deliberately not every field that names a company. `vendor` on a procurement
 * matter and `whoInvolved` on an employment one are named by their role, and a
 * document does say which party is the vendor. These two are defined only in
 * relation to the client, so the document cannot answer them.
 */
export const PARTY_IDENTITY_KEYS: readonly string[] = [
  'otherSide',
  'counterparty',
];

export function isPartyIdentityKey(key: string): boolean {
  return PARTY_IDENTITY_KEYS.includes(key);
}

/**
 * Words that identify nobody, so an overlap on one of them proves nothing.
 *
 * The corporate suffixes are the important half. "Limited" appears in both
 * parties on this contract and in most English company names, so a rule that
 * counted it would corroborate every candidate against any sentence mentioning
 * a company.
 */
const NOT_A_NAME = new Set([
  'ltd',
  'limited',
  'llc',
  'llp',
  'plc',
  'inc',
  'incorporated',
  'co',
  'company',
  'corp',
  'corporation',
  'group',
  'holdings',
  'holding',
  'partners',
  'gmbh',
  'sa',
  'bv',
  'ag',
  'nv',
  'pty',
  'the',
  'and',
  'of',
]);

/** Distinctive words in a name, lowercased, suffixes and noise removed. */
function nameTokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1 && !NOT_A_NAME.has(word));
}

/**
 * Whether the client's own words point at this party.
 *
 * Token overlap rather than a substring match, so "Acme" in the client's
 * sentence corroborates "Acme Holdings Ltd" from the document, which is the
 * common shape: clients use the short name and contracts use the registered
 * one. It runs the other way too, which is the point of the whole guard:
 * "Northwind Logistics Limited" shares no distinctive word with "we signed an
 * MSA with Acme", so it is not what the client was talking about.
 *
 * A value with nothing distinctive left in it ("The Company", "the supplier")
 * is withheld too. It is not the dangerous failure, since it names no company
 * and so cannot name the wrong one, but it is not worth a row on the brief
 * either: a lawyer reading "Other side: the supplier" learns nothing, and the
 * question Moritz asks instead gets a real name in three words.
 */
export function partyNamedByClient(
  value: string,
  accompanying: string | undefined,
): boolean {
  const tokens = nameTokens(value);
  if (tokens.length === 0) return false;

  const said = (accompanying ?? '').trim();
  /*
   * The app puts a bracketed note in the client-message slot when a document
   * arrives with no words, because the turn route rejects an empty one. It is
   * a note about what happened rather than the client saying anything, and it
   * carries the file name, so a contract called `acme-msa.pdf` would otherwise
   * corroborate a party through a sentence the client never wrote.
   */
  if (said === '' || (said.startsWith('[') && said.endsWith(']'))) return false;

  const heard = new Set(nameTokens(said));
  return tokens.some((token) => heard.has(token));
}

/**
 * Drop party-identity fields the client's own words do not support.
 *
 * Returns the fields to keep, and the keys that were withheld so the route can
 * log them. Nothing else about the read is touched: every other field the
 * documents answered still lands, still unconfirmed, still with its quote. A
 * read that cannot name the other side has still read the contract, and the
 * client should see their matter half written up rather than blank.
 */
export function withoutUngroundedParties<
  T extends { key: string; value: string },
>(
  fields: readonly T[],
  accompanying: string | undefined,
): { kept: T[]; withheld: string[] } {
  const kept: T[] = [];
  const withheld: string[] = [];

  for (const field of fields) {
    const ungrounded =
      isPartyIdentityKey(field.key) &&
      !partyNamedByClient(field.value, accompanying);
    if (ungrounded) withheld.push(field.key);
    else kept.push(field);
  }

  return { kept, withheld };
}
