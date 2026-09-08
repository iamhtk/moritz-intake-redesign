/**
 * Pure helpers for the simplified one-question-per-screen flow.
 *
 * The full flow asks one question per screen via the dock; the simplified flow
 * does the same but as a focused Typeform-style screen, walking the matter's
 * visible questions one at a time (preceded by a synthetic matter-type
 * question). Everything here is a pure function of the matter definition +
 * current answers, mirroring `intake-engine.ts` / `intake-flow.tsx`.
 */

import { resolveBool } from './intake-config';
import { getVisibleSteps } from './intake-engine';
import type {
  AnswerKey,
  FileMeta,
  IntakeAnswers,
  MatterIntakeDefinition,
  QuestionOption,
} from './intake-types';

/** Synthetic id for the leading "what kind of matter is this?" question. */
export const MATTER_TYPE_KEY = '__matterType';

/** Editable matter-type options (last entry is the M&A / Other catch-all). */
export const MATTER_TYPE_OPTIONS: readonly QuestionOption[] = [
  { value: 'contract', label: 'Contract' },
  { value: 'employment', label: 'Employment' },
  { value: 'procurement', label: 'Procurement' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'ma', label: 'M&A / Other' },
];

/** Ordered list of every currently visible question key (branch-aware). */
export function visibleQuestionKeys(
  definition: MatterIntakeDefinition,
  answers: IntakeAnswers,
): AnswerKey[] {
  return getVisibleSteps(definition, answers).flatMap(
    (step) => step.questionIds,
  );
}

export function isAnsweredKey(
  definition: MatterIntakeDefinition,
  key: AnswerKey,
  answers: IntakeAnswers,
): boolean {
  const question = definition.questions[key];
  if (!question) return false;
  if (question.ui === 'upload') {
    const files = answers[key] as FileMeta[] | undefined;
    return Array.isArray(files) && files.length > 0;
  }
  if (question.ui === 'date') {
    const hasDate =
      typeof answers[key] === 'string' &&
      (answers[key] as string).trim().length > 0;
    const skipped = question.skipKey
      ? Boolean(answers[question.skipKey])
      : false;
    return hasDate || skipped;
  }
  const value = answers[key];
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return value !== undefined && value !== null;
}

export function isRequiredKey(
  definition: MatterIntakeDefinition,
  key: AnswerKey,
  answers: IntakeAnswers,
): boolean {
  return resolveBool(definition.questions[key]?.required, answers);
}
