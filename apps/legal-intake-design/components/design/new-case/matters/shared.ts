/**
 * Helpers and the shared tail questions (urgency, documents, recap) used by
 * every matter flow. Option labels and copy are reused from the unified wizard's
 * matter definitions so the conversational flow matches the established voice.
 */

import {
  DOCUMENTS_KEY,
  RECAP_KEY,
  URGENCY_KEY,
  type IntakeQuestion,
  type SuggestionChip,
} from '../intake-types';

/** Build a suggestion chip; the value doubles as the (group-unique) id. */
export function chip(value: string, label: string): SuggestionChip {
  return { id: value, label, value };
}

/** Build a chip group from `[value, label]` tuples. */
export function chipGroup(
  entries: ReadonlyArray<readonly [string, string]>,
): SuggestionChip[] {
  return entries.map(([value, label]) => chip(value, label));
}

/** "Got it — …" lead, optionally coloured by the chosen urgency. */
export function urgencyRush(urgency: string | undefined): string {
  if (urgency === 'today') return ', and it’s urgent';
  if (urgency === 'exploring') return ', no rush';
  return '';
}

export const URGENCY_QUESTION: IntakeQuestion = {
  key: URGENCY_KEY,
  kind: 'chips',
  reviewLabel: 'Timeline',
  hint: 'How time-sensitive',
  prompt: () =>
    'How soon do you need this? This helps us route urgent matters to the right lawyer faster.',
  chips: chipGroup([
    ['today', 'Today'],
    ['this_week', 'This week'],
    ['this_month', 'This month'],
    ['exploring', 'Just exploring'],
  ]),
};

export const DOCUMENTS_QUESTION: IntakeQuestion = {
  key: DOCUMENTS_KEY,
  kind: 'attach',
  optional: true,
  reviewLabel: 'Documents',
  hint: 'Supporting files',
  prompt: () =>
    'Anything to attach? Contracts, letters, term sheets, or prior drafts all help — drop them in below, or say “skip” if there’s nothing right now.',
};

export const RECAP_QUESTION: IntakeQuestion = {
  key: RECAP_KEY,
  kind: 'recap',
  reviewLabel: 'Review',
  prompt: () =>
    "Here's what I've got. Have a look and submit whenever you're ready.",
};
