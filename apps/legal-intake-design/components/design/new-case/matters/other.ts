/**
 * "Something else" flow: a catch-all for matters that don't fit the commercial
 * buckets. An open-ended conversation: the first question is the free-text
 * "describe what you need" step; the rest gather the area of law and
 * (optionally) what would help most. Chips are reserved for the shared
 * matter-type and urgency steps.
 */

import { type MatterFlow } from '../intake-types';

export const otherFlow: MatterFlow = {
  id: 'other',
  label: 'Something else',
  transition: () =>
    'Got it \u2014 tell me a bit more and I\u2019ll route it to the right lawyer as the brief fills in on the right.',
  questions: [
    {
      key: 'situation',
      kind: 'text',
      reviewLabel: 'What you need',
      hint: 'What you need',
      prompt: () =>
        'In your own words, tell me what you\u2019re dealing with and what you need.',
    },
    {
      key: 'area',
      kind: 'text',
      reviewLabel: 'Area',
      hint: 'Area of law it touches',
      prompt: () =>
        'Which area of law does it touch most \u2014 or not sure? A rough guess is fine.',
    },
    {
      key: 'whatWouldHelp',
      kind: 'text',
      optional: true,
      reviewLabel: 'What would help',
      hint: 'What would help most',
      prompt: () =>
        'What would help most right now? Skip if you\u2019d rather we suggest next steps.',
    },
  ],
};
