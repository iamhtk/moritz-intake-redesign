/**
 * Contract flow: an open-ended conversation. The first question is the
 * free-text "describe what you need" step; the rest gather the other side and
 * (optionally) the desired outcome. Chips are reserved for the shared
 * matter-type and urgency steps.
 */

import { type MatterFlow } from '../intake-types';

export const contractFlow: MatterFlow = {
  id: 'contract',
  label: 'Contract',
  chipHint: 'Terms, NDAs, anything you sign',
  transition: () =>
    'Got it \u2014 a contract matter. Tell me a bit more and the brief will fill in on the right.',
  questions: [
    {
      key: 'situation',
      kind: 'text',
      reviewLabel: 'What you need',
      hint: 'What you need',
      prompt: () =>
        'In your own words, what\u2019s the contract and what do you need \u2014 drafting, reviewing, negotiating, or sorting out a dispute?',
    },
    {
      key: 'otherSide',
      kind: 'text',
      reviewLabel: 'Other side',
      hint: 'Who\u2019s on the other side',
      prompt: () =>
        'Who\u2019s on the other side? A name or company is plenty \u2014 whatever you\u2019ve got.',
    },
    {
      key: 'outcome',
      kind: 'text',
      optional: true,
      reviewLabel: 'Desired outcome',
      hint: 'What a good result looks like',
      prompt: () =>
        'What would a good outcome look like? Feel free to skip if you\u2019re not sure yet.',
    },
  ],
};
