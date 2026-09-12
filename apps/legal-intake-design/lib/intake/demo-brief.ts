/**
 * Sample values covering all four field states, so the brief can be reviewed
 * before the conversation is wired up.
 *
 * Reached with `?demo=1` on the intake route, a documented query parameter
 * rather than a design flag buried in a list of twenty (Decision 28).
 *
 * The quote below is real text from `public/demo/northwind-acme-msa.pdf`, so
 * the demo shows the same thing a genuine verified extraction would.
 */

import type { FieldUpdate } from './brief';

export const DEMO_FIELD_UPDATES: FieldUpdate[] = [
  // Will be confirmed on arrival, so it lands in the `confirmed` state.
  {
    key: 'matter-type',
    value: 'Contract',
    source: 'client',
    confidence: 'sure',
  },
  // Verified document extraction: shows its source, with the quote on tap.
  {
    key: 'situation',
    value:
      'Review a master services agreement for warehousing and last-mile distribution, and advise on exiting it early.',
    source: 'document',
    confidence: 'unsure',
    sourceNote: 'Services clause 1.1, page 1',
    sourceQuote:
      'The Supplier shall provide warehousing, pick-and-pack and last-mile distribution services (the "Services") to the Customer',
  },
  // Worked out from the conversation, so it has no source to show.
  {
    key: 'otherSide',
    value: 'Northwind Logistics Limited',
    source: 'inferred',
    confidence: 'unsure',
  },
  // `outcome` and `urgency` are left alone, so they stay missing.
];

/** The field confirmed as soon as the demo loads. */
export const DEMO_CONFIRMED_KEY = 'matter-type';
