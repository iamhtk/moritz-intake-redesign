/**
 * Corporate flow: an open-ended conversation. The first question is the
 * free-text "describe what you need" step; the rest gather the entity and
 * (optionally) any specific notes. Chips are reserved for the shared
 * matter-type and urgency steps.
 */

import { type MatterFlow } from '../intake-types';

export const corporateFlow: MatterFlow = {
  id: 'corporate',
  label: 'Corporate',
  transition: () =>
    'Got it \u2014 a corporate matter. Tell me a bit more and the brief will fill in on the right.',
  questions: [
    {
      key: 'situation',
      kind: 'text',
      reviewLabel: 'What you need',
      hint: 'What you need',
      prompt: () =>
        'In your own words, what do you need \u2014 forming an entity, governance, financing, cap table, or compliance?',
    },
    {
      key: 'entity',
      kind: 'text',
      reviewLabel: 'Entity',
      hint: 'The entity and where it\u2019s based',
      prompt: () =>
        'What entity is this about, and where is it (or will it be) based?',
    },
    {
      key: 'notes',
      kind: 'text',
      optional: true,
      reviewLabel: 'Notes',
      hint: 'Anything specific to flag',
      prompt: () =>
        'Anything specific you\u2019re trying to achieve or worried about? Skip if not.',
    },
  ],
};
