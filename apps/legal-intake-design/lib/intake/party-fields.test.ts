import { describe, expect, it } from 'vitest';
import { documentsOnlyMessage } from './outgoing-turn';
import {
  isPartyIdentityKey,
  partyNamedByClient,
  withoutUngroundedParties,
} from './party-fields';

/**
 * The guard T36 produced, tested without spending a token.
 *
 * The live runs are what found the bug and they stay, because they are the only
 * thing that proves the reader still behaves. But the decision is code now
 * precisely because a prompt rule could not be relied on, and a rule defended
 * only by an opt-in paid test is a rule that regresses on the first afternoon
 * nobody runs it.
 */
describe('partyNamedByClient', () => {
  const CLIENT = 'Northwind Logistics Limited';
  const OTHER = 'Acme Holdings Ltd';
  const SAID = 'We signed an MSA with Acme and we want to get out of it early.';

  it('corroborates the party the client actually named', () => {
    // The common shape: the client uses the short name, the contract uses the
    // registered one. Overlap on "acme" is what ties them together.
    expect(partyNamedByClient(OTHER, SAID)).toBe(true);
  });

  it('rejects the client own company, which is the whole bug', () => {
    /*
     * Both parties are named identically in the recital and the document
     * cannot say which is which. This value was returned live, twice: once
     * with no accompanying sentence and once with this exact one.
     */
    expect(partyNamedByClient(CLIENT, SAID)).toBe(false);
  });

  it('rejects everything when the client said nothing', () => {
    expect(partyNamedByClient(OTHER, undefined)).toBe(false);
    expect(partyNamedByClient(OTHER, '')).toBe(false);
    expect(partyNamedByClient(OTHER, '   ')).toBe(false);
  });

  it('does not let the app describing the upload corroborate anything', () => {
    /*
     * The specific hole worth closing. When a document arrives with no words
     * the app puts a bracketed note in the client-message slot, because the
     * turn route rejects an empty one. It carries the file name, so a contract
     * saved as `acme-msa.pdf` would otherwise corroborate a party through a
     * sentence the client never wrote.
     */
    expect(
      partyNamedByClient(OTHER, documentsOnlyMessage(['acme-msa.pdf'])),
    ).toBe(false);
  });

  it('ignores corporate suffixes, which identify nobody', () => {
    // "Limited" is in both parties on this contract and in most English
    // company names. Counting it would corroborate any candidate against any
    // sentence that mentioned a company.
    expect(
      partyNamedByClient(CLIENT, 'We have a dispute with a limited company.'),
    ).toBe(false);
    expect(
      partyNamedByClient('Acme Ltd', 'Our supplier is a ltd company'),
    ).toBe(false);
  });

  it('withholds a value with no name in it', () => {
    // Not the dangerous failure, since it names no company and so cannot name
    // the wrong one. Withheld anyway: "Other side: the supplier" teaches a
    // lawyer nothing, and the question Moritz asks instead gets a real name.
    expect(partyNamedByClient('the supplier', 'something happened')).toBe(
      false,
    );
    expect(partyNamedByClient('The Company Ltd', undefined)).toBe(false);
  });

  it('corroborates a role word the client used themselves', () => {
    // "supplier" is not a corporate suffix, so it is a distinctive token and
    // a client who used the same word has said which side they mean.
    expect(
      partyNamedByClient('the supplier', 'our supplier keeps missing SLAs'),
    ).toBe(true);
  });

  it('is not fooled by a partial word', () => {
    // Token overlap, not substring: "acmeware" is a different company.
    expect(partyNamedByClient('Acme Holdings Ltd', 'we use Acmeware')).toBe(
      false,
    );
  });
});

describe('isPartyIdentityKey', () => {
  it('covers the fields defined only in relation to the client', () => {
    expect(isPartyIdentityKey('otherSide')).toBe(true);
    expect(isPartyIdentityKey('counterparty')).toBe(true);
  });

  it('leaves fields a document can answer by role', () => {
    // A document does say which party is the vendor, and who was involved in
    // an employment matter. Withholding those would cost the client questions
    // the contract had already answered, which is what D6 exists to stop.
    expect(isPartyIdentityKey('vendor')).toBe(false);
    expect(isPartyIdentityKey('whoInvolved')).toBe(false);
    expect(isPartyIdentityKey('situation')).toBe(false);
    expect(isPartyIdentityKey('matter-type')).toBe(false);
  });
});

describe('withoutUngroundedParties', () => {
  const read = [
    { key: 'matter-type', value: 'contract' },
    { key: 'situation', value: 'A warehousing agreement.' },
    { key: 'otherSide', value: 'Northwind Logistics Limited' },
  ];

  it('withholds a party the client never named', () => {
    const { kept, withheld } = withoutUngroundedParties(read, undefined);
    expect(withheld).toEqual(['otherSide']);
    expect(kept.map((field) => field.key)).toEqual([
      'matter-type',
      'situation',
    ]);
  });

  it('withholds the wrong party even when the client did name one', () => {
    // The regression that made the prompt fix insufficient: the sentence is
    // there, and the reader still returned the client's own company.
    const { withheld } = withoutUngroundedParties(
      read,
      'We signed an MSA with Acme and we want out early.',
    );
    expect(withheld).toEqual(['otherSide']);
  });

  it('keeps the party the client named', () => {
    const corroborated = [
      ...read.slice(0, 2),
      { key: 'otherSide', value: 'Acme Holdings Ltd' },
    ];
    const { kept, withheld } = withoutUngroundedParties(
      corroborated,
      'We signed an MSA with Acme and we want out early.',
    );
    expect(withheld).toEqual([]);
    expect(kept).toHaveLength(3);
  });

  it('withholds nothing else, whatever the document answered', () => {
    // The guard is narrow on purpose. A read that cannot name the other side
    // has still read the contract, and every other field it filled is worth
    // having: the client sees their matter half written up rather than blank.
    const { kept } = withoutUngroundedParties(read, undefined);
    expect(kept.map((field) => field.value)).toEqual([
      'contract',
      'A warehousing agreement.',
    ]);
  });

  it('is a no-op on a read that proposed no party', () => {
    const fields = [{ key: 'situation', value: 'Something happened.' }];
    expect(withoutUngroundedParties(fields, undefined)).toEqual({
      kept: fields,
      withheld: [],
    });
  });
});
