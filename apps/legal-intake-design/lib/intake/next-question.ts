/**
 * What the product would ask next, in the product's own words.
 *
 * Two callers, and they are here together because they have to agree. The
 * keyless interviewer (`offline-turn.ts`) walks this list because it has no
 * model to write a question with; the dead-end guard (`dead-end.ts`) reaches
 * for it when the model wrote a turn that asked nothing at all. A question
 * written twice in two files is a question that will eventually be two
 * different questions, and the second one is the one nobody reviewed.
 *
 * Everything in here is read out of `matters/*.ts`, which is the curated copy.
 * Nothing composes a sentence except the one fallback at the bottom of
 * `askFor`, and that exists only so a field def added without a prompt cannot
 * end the conversation.
 */

import {
  MATTER_CHIPS,
  MATTER_FLOWS,
  URGENCY_QUESTION,
} from '@/components/design/new-case/matters';
import {
  MATTER_TYPE_KEY,
  type AnswersMap,
  type IntakeQuestion,
  type MatterId,
} from '@/components/design/new-case/intake-types';
import type { Brief, BriefField } from './brief';
import { matterOfText } from './matter-of';
import { MAX_TURN_OPTIONS } from './turn-schema';

/** The matter-type question, which lives outside any one matter's flow. */
export const MATTER_TYPE_QUESTION: IntakeQuestion = {
  key: MATTER_TYPE_KEY,
  kind: 'chips',
  reviewLabel: 'Matter type',
  prompt: () => 'What kind of matter is this?',
  chips: MATTER_CHIPS,
};

/**
 * Every question that describes the case, in the order the brief lists them.
 *
 * Mirrors `fieldsForMatter` exactly, and has to: the brief's rows come from
 * there, and a question list in a different order would ask about a row that
 * is already full while leaving the empty one alone.
 */
export function questionsFor(matterId: MatterId): IntakeQuestion[] {
  return [
    MATTER_TYPE_QUESTION,
    ...MATTER_FLOWS[matterId].questions.filter(
      (question) => question.kind === 'text' || question.kind === 'chips',
    ),
    URGENCY_QUESTION,
  ];
}

/** The filled rows, in the shape the authored `prompt()` closures expect. */
export function answersOf(brief: Brief): AnswersMap {
  const answers: AnswersMap = {};
  for (const field of brief.fields) {
    if (field.value !== null) answers[field.key] = field.value;
  }
  return answers;
}

/**
 * The matter this brief is really about.
 *
 * Read off the matter-type row rather than off `brief.matterId`, because the
 * row is what the client can see and correct: a brief still carrying the
 * default matter while its first row says "Employment" would be asked the
 * wrong flow's questions.
 */
export function matterOfBrief(brief: Brief): MatterId {
  const row = brief.fields.find((field) => field.key === MATTER_TYPE_KEY);
  return matterOfText(row?.value ?? '') ?? brief.matterId;
}

export type AuthoredQuestion = {
  /** The brief row this asks about. */
  key: string;
  /** The question, as the design team wrote it. */
  ask: string;
  /** Its ready-made answers, where the field has them. */
  options: string[];
};

/**
 * The authored question for one row.
 *
 * @param matterId which flow's questions to look in. Passed in rather than
 * read off the brief because the two callers disagree about where the matter
 * comes from, and both are right: the guard reads the matter-type row, while
 * the keyless interviewer has to use the matter the message it is handling has
 * just established, on the one turn where that row was still empty.
 * @param answers the brief's filled rows, plus anything this turn has just
 * proposed. Several authored prompts interpolate an earlier answer, and on the
 * turn that fills one the brief does not have it yet.
 */
export function askFor(
  matterId: MatterId,
  field: BriefField,
  answers: AnswersMap,
): AuthoredQuestion {
  const question = questionsFor(matterId).find(
    (candidate) => candidate.key === field.key,
  );

  /*
   * The authored copy where there is some, the row's own label where there is
   * not. A brief row can exist without a matching question: `fieldsForMatter`
   * and the list above are kept in step, but a future matter file could add a
   * field def without a prompt, and an intake that went silent at that point
   * would be a dead end of exactly the kind this module exists to close.
   */
  return {
    key: field.key,
    ask: question
      ? question.prompt(answers)
      : `Could you tell me about ${field.label.toLowerCase()}?`,
    options: question?.chips
      ? question.chips.map((chip) => chip.label).slice(0, MAX_TURN_OPTIONS)
      : [],
  };
}

/**
 * The row to ask about next, or `undefined` when the brief is full.
 *
 * Required rows first, then optional ones, in brief order. Optional rows are
 * included, and deliberately: the send gate opens once the required set is
 * complete, but an intake that fell silent while an optional row sat empty
 * would leave the client with nothing to do and no way to know that.
 *
 * @param exclude a row to skip, for the caller that has just filled it and
 * cannot wait for the brief to catch up.
 */
export function nextGap(
  brief: Brief,
  exclude?: string,
): BriefField | undefined {
  const empty = brief.fields.filter(
    (field) => field.value === null && field.key !== exclude,
  );
  return (
    empty.find((field) => field.required) ??
    empty.find((field) => !field.required)
  );
}
