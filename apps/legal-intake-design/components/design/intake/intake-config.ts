/**
 * Generic helpers over the declarative question definitions.
 *
 * Each matter module supplies its own `questions` map (see `matters/*`); these
 * helpers resolve dynamic copy/booleans and render an answer's display value
 * without knowing anything matter-specific.
 */

import type {
  AnswerKey,
  DynamicBool,
  DynamicCopy,
  IntakeAnswers,
  QuestionDef,
} from './intake-types';

export function resolveCopy(
  copy: DynamicCopy | undefined,
  answers: IntakeAnswers,
): string | undefined {
  if (copy === undefined) return undefined;
  return typeof copy === 'function' ? copy(answers) : copy;
}

export function resolveBool(
  value: DynamicBool | undefined,
  answers: IntakeAnswers,
): boolean {
  if (value === undefined) return false;
  return typeof value === 'function' ? value(answers) : value;
}

/**
 * Human-readable value for a given answer, mapping option values back to their
 * labels. Returns `null` when the answer is empty so the review screen can
 * skip it.
 */
export function getAnswerDisplay(
  questions: Record<string, QuestionDef>,
  key: AnswerKey,
  answers: IntakeAnswers,
): string | null {
  const question = questions[key];
  if (!question) return null;
  const raw = answers[key];

  if (question.displayValue) {
    return question.displayValue(answers);
  }

  if (question.ui === 'upload') {
    const files = Array.isArray(raw) ? raw : [];
    const count = files.length;
    return count > 0 ? `${count} file${count > 1 ? 's' : ''} attached` : null;
  }
  if (Array.isArray(raw)) {
    if (raw.length === 0) return null;
    return (raw as string[])
      .map(
        (value) =>
          question.options?.find((o) => o.value === value)?.label ?? value,
      )
      .join(', ');
  }
  if (typeof raw === 'string') {
    if (raw.trim().length === 0) return null;
    return question.options?.find((o) => o.value === raw)?.label ?? raw;
  }
  return null;
}
