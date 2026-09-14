/**
 * M&A flow: an open-ended conversation. The first question is the free-text
 * "describe what you need" step; the rest gather the counterparty and size and
 * (optionally) any concerns. Chips are reserved for the shared matter-type and
 * urgency steps.
 */

import { type MatterFlow } from '../intake-types';

export const maFlow: MatterFlow = {
  id: 'ma',
  label: 'M&A',
  chipHint: 'Buying or selling a business',
  transition: () =>
    'Got it \u2014 an M&A matter. Tell me a bit more and the brief will fill in on the right.',
  questions: [
    {
      key: 'situation',
      kind: 'text',
      reviewLabel: 'What you need',
      hint: 'What you need',
      prompt: () =>
        'In your own words, tell me about the deal \u2014 buying, selling, investing, or merging, and where you are in the process.',
    },
    {
      key: 'counterparty',
      kind: 'text',
      reviewLabel: 'Counterparty & size',
      hint: 'The other side and rough size',
      prompt: () =>
        'Who\u2019s on the other side, and roughly how big is it? Ballpark is fine.',
    },
    {
      key: 'concerns',
      kind: 'text',
      optional: true,
      reviewLabel: 'Concerns',
      hint: 'What\u2019s top of mind',
      prompt: () =>
        'What\u2019s top of mind or worrying you? Skip if nothing stands out yet.',
    },
  ],
};
