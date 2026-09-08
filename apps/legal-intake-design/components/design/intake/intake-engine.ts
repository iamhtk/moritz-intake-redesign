/**
 * Pure branching + navigation logic for the matter-intake wizard.
 *
 * The flow component owns React state; everything here is a pure function of
 * the current answers + the matter definition so it can be unit-tested in
 * isolation. The step list is ordered: triage -> documents -> branches.
 */

import type {
  AnswerKey,
  IntakeAnswers,
  IntakeStep,
  MatterIntakeDefinition,
} from './intake-types';

export function getVisibleSteps(
  definition: MatterIntakeDefinition,
  answers: IntakeAnswers,
): IntakeStep[] {
  return definition.steps.filter(
    (step) => !step.visibleWhen || step.visibleWhen(answers),
  );
}

/**
 * Answer keys that appear in the review summary, in display order: the triage
 * keys first, then every visible step's questions (documents excluded — shown
 * as file chips, not a summary row).
 */
export function getReviewKeys(
  definition: MatterIntakeDefinition,
  answers: IntakeAnswers,
): AnswerKey[] {
  const triage = definition.triageKeys;
  const keys: AnswerKey[] = [...triage];
  for (const step of getVisibleSteps(definition, answers)) {
    for (const key of step.questionIds) {
      if (key === 'documents') continue;
      if (triage.includes(key)) continue;
      keys.push(key);
    }
  }
  return keys;
}
