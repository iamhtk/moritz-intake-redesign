/**
 * Procurement flow: an open-ended conversation. The first question is the
 * free-text "describe what you need" step; the rest gather the vendor and
 * (optionally) spend and timeline. Chips are reserved for the shared
 * matter-type and urgency steps.
 */

import { type MatterFlow } from '../intake-types';

export const procurementFlow: MatterFlow = {
  id: 'procurement',
  label: 'Procurement',
  transition: () =>
    'Got it \u2014 a procurement matter. Tell me a bit more and the brief will fill in on the right.',
  questions: [
    {
      key: 'situation',
      kind: 'text',
      reviewLabel: 'What you need',
      hint: 'What you need',
      prompt: () =>
        'In your own words, what are you buying and what do you need \u2014 a new vendor, an RFP, a purchase, a renewal, or help with a dispute?',
    },
    {
      key: 'vendor',
      kind: 'text',
      reviewLabel: 'Vendor',
      hint: 'The vendor or supplier',
      prompt: () =>
        'Who\u2019s the vendor or supplier? A name is fine, or describe them if it\u2019s not decided yet.',
    },
    {
      key: 'spendTimeline',
      kind: 'text',
      optional: true,
      reviewLabel: 'Spend & timeline',
      hint: 'Rough spend and timing',
      prompt: () =>
        'Roughly what\u2019s the spend, and is there a timeline? Ballpark is fine \u2014 skip if you\u2019re not sure.',
    },
  ],
};
