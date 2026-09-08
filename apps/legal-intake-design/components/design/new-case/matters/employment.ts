/**
 * Employment flow: an open-ended conversation. The first question is the
 * free-text "describe what you need" step; the rest gather who's involved and
 * (optionally) the goal. Chips are reserved for the shared matter-type and
 * urgency steps.
 */

import { type MatterFlow } from '../intake-types';

export const employmentFlow: MatterFlow = {
  id: 'employment',
  label: 'Employment',
  transition: () =>
    'Got it \u2014 an employment matter. Tell me a bit more and the brief will fill in on the right.',
  questions: [
    {
      key: 'situation',
      kind: 'text',
      reviewLabel: 'What you need',
      hint: 'What you need',
      prompt: () =>
        'In your own words, what do you need \u2014 a hire or offer, an exit, equity, a policy, or help with a dispute?',
    },
    {
      key: 'whoInvolved',
      kind: 'text',
      reviewLabel: 'Who\u2019s involved',
      hint: 'Who it involves',
      prompt: () =>
        'Who does it involve \u2014 an employee, contractor, executive, or someone else?',
    },
    {
      key: 'goal',
      kind: 'text',
      optional: true,
      reviewLabel: 'Goal',
      hint: 'What you\u2019re hoping to achieve',
      prompt: () =>
        'What are you hoping to achieve? Skip if it\u2019s still taking shape.',
    },
  ],
};
