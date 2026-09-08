/**
 * Small constants shared across matter definitions (urgency scale, yes/no, and
 * the urgency keyword patterns). Each matter still owns its own intent/sub-type
 * questions and branching.
 */

import type { QuestionOption } from '../intake-types';

export const URGENCY_OPTIONS: readonly QuestionOption[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
  { value: 'exploring', label: 'Just exploring' },
];

export const YES_NO_NOT_SURE: readonly QuestionOption[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_sure', label: 'Not sure' },
];

export const URGENCY_PATTERNS = [
  {
    value: 'today',
    re: /\b(today|asap|urgent|right away|immediately|end of day|\beod\b|by tonight)\b/,
  },
  {
    value: 'exploring',
    re: /\b(no rush|just exploring|exploring|not urgent|whenever|no (firm )?deadline|early stage)\b/,
  },
  {
    value: 'this_week',
    re: /\b(this week|in a few days|within (a )?(few )?days|by friday|by end of week)\b/,
  },
  {
    value: 'this_month',
    re: /\b(this month|in a few weeks|by month.?end|next month|couple of weeks)\b/,
  },
];

/** Builds the standard "Got it — … . Just a few details …" transition line. */
export function buildUrgencyRush(urgency: unknown): string {
  return urgency === 'today'
    ? ', and it’s urgent'
    : urgency === 'exploring'
      ? ', no rush'
      : '';
}
