/**
 * Turns the existing per-matter question lists into brief field definitions.
 *
 * The `matters/*.ts` files stay exactly as they are, declarative data the
 * design team already curated. What changes in v2 is who reads them: the
 * scripted engine used them as a queue to walk in order, and the brief uses
 * them as a checklist with no order at all (Decision 6).
 *
 * `attach` and `recap` questions are flow steps, not facts about the case, so
 * they are not brief fields.
 */

import {
  MATTER_CHIPS,
  MATTER_FLOWS,
  URGENCY_QUESTION,
} from '@/components/design/new-case/matters';
import {
  MATTER_TYPE_KEY,
  type IntakeQuestion,
  type MatterId,
  type SuggestionChip,
} from '@/components/design/new-case/intake-types';
import type { FieldDef } from './brief';

/** Questions that describe the case rather than drive the flow. */
function isBriefField(question: IntakeQuestion): boolean {
  return question.kind === 'text' || question.kind === 'chips';
}

function toFieldDef(question: IntakeQuestion): FieldDef {
  return {
    key: question.key,
    label: question.reviewLabel,
    required: question.optional !== true,
  };
}

export const MATTER_TYPE_FIELD: FieldDef = {
  key: MATTER_TYPE_KEY,
  label: 'Matter type',
  required: true,
};

/**
 * The matter type as the chip that means it, where the model sent the same
 * thing in a different case.
 *
 * Found by using the flow rather than by reading it. Asked about exiting an
 * MSA, the model returned `contract` — correct, resolved correctly by
 * `matterOf`, and rendered as the word "contract" in lower case on the review
 * screen, one row above "Acme Holdings" and two above "Renewal is roughly six
 * weeks away." A brief that is supposed to read like a document a firm would
 * put its name on had a stray lower-case token in the first row of it.
 *
 * Deliberately the narrowest possible rewrite. It fires only when the whole
 * trimmed value *is* a matter id or a matter label, differing at most in case
 * and surrounding space, and it replaces it with that matter's own label. A
 * value that is a sentence — "Employment dispute, offer withdrawn", which the
 * model also produces — is left exactly as it arrived, because those are the
 * client's circumstances described, and tidying them into one word would throw
 * away the only part a lawyer would read twice.
 *
 * Not a synonym table and must not become one. `matter-of.ts` already owns the
 * tolerant matching, and it has its own note about what a wrong guess costs.
 * This is casing, nothing else.
 */
export function canonicalMatterType(value: string): string {
  const candidate = value.trim().toLowerCase();
  for (const flow of Object.values(MATTER_FLOWS)) {
    if (candidate === flow.id || candidate === flow.label.toLowerCase()) {
      return flow.label;
    }
  }
  return value;
}

/**
 * Every field a brief for this matter needs, in the order the empty outline
 * shows them at the start of the flow.
 */
export function fieldsForMatter(matterId: MatterId): FieldDef[] {
  const flow = MATTER_FLOWS[matterId];
  return [
    MATTER_TYPE_FIELD,
    ...flow.questions.filter(isBriefField).map(toFieldDef),
    toFieldDef(URGENCY_QUESTION),
  ];
}

/**
 * The hint text each field shows while it is still empty, "what is expected of
 * me" before a word is typed (Decision 18).
 */
export function hintsForMatter(matterId: MatterId): Record<string, string> {
  const flow = MATTER_FLOWS[matterId];
  const hints: Record<string, string> = {};
  for (const question of [...flow.questions, URGENCY_QUESTION]) {
    if (isBriefField(question) && question.hint) {
      hints[question.key] = question.hint;
    }
  }
  return hints;
}

/**
 * The ready-made answers for fields that have them, keyed by field.
 *
 * The old flow showed these as the only way to answer, a chip row that had to
 * be clicked before the conversation would move on. Here they are shortcuts,
 * not gates: the model asks in its own words, and if the field it is asking
 * about happens to have chips, they appear next to the composer. Typing
 * something else instead always works.
 */
export function chipsForMatter(
  matterId: MatterId,
): Record<string, readonly SuggestionChip[]> {
  const chips: Record<string, readonly SuggestionChip[]> = {
    [MATTER_TYPE_KEY]: MATTER_CHIPS,
  };

  for (const question of [
    ...MATTER_FLOWS[matterId].questions,
    URGENCY_QUESTION,
  ]) {
    if (question.kind === 'chips' && question.chips) {
      chips[question.key] = question.chips;
    }
  }

  return chips;
}
