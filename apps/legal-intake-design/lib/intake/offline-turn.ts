/**
 * The intake without a model behind it (item 11).
 *
 * A reviewer who clones this repo and does not set `ANTHROPIC_API_KEY` used to
 * meet an `unauthorized` failure on their first message, which means the one
 * act the brief actually asks to be judged — describe a matter and watch the
 * brief fill in — could not be performed at all. That is a worse first
 * impression than any amount of missing polish, and it is entirely avoidable:
 * the questions are already written, per matter, in `matters/*.ts`, and the
 * brief already knows which of its rows are empty.
 *
 * So this walks the same authored question list the old scripted engine walked,
 * and returns it in the shape the model would have returned. Everything
 * downstream — the SSE framing, `parseIntakeTurn`'s validation, the dash strip,
 * `applyFieldUpdates`, the confirm gate — is untouched and unaware. That is the
 * design constraint that matters: a second code path for the keyless case would
 * be a second intake to keep working, and it would rot, because nobody with a
 * key would ever see it.
 *
 * WHAT THIS IS NOT. It does not pretend to be the model. It fills the row it
 * just asked about with what the client typed, verbatim, and it never claims a
 * value the client did not say: every update it makes is `source: 'client'`,
 * never `inferred`, so no sentence in the UI can attribute a guess to a machine
 * that did not make one. The one inference it does make — which matter type an
 * opening description is — goes through `matterOfText`, the same keyword table
 * the model-backed path uses for the lawyer routing, and it is written into the
 * matter-type row where the client can see it and correct it.
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
import { MAX_TURN_OPTIONS, type IntakeTurn } from './turn-schema';

/**
 * How sure a scripted update claims to be.
 *
 * High, and deliberately so: this is the client's own sentence written into the
 * row the client was just asked about, which is the strongest provenance the
 * flow has. Not 10, because the attribution is positional — it trusts that the
 * answer belongs to the last question asked — and a client who answers two
 * questions at once will have the second half filed under the first row. Ten
 * would be a claim this path cannot support.
 */
const SCRIPTED_CONFIDENCE = 8;

/** The matter-type question, which lives outside any one matter's flow. */
const MATTER_TYPE_QUESTION: IntakeQuestion = {
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
function questionsFor(matterId: MatterId): IntakeQuestion[] {
  return [
    MATTER_TYPE_QUESTION,
    ...MATTER_FLOWS[matterId].questions.filter(
      (question) => question.kind === 'text' || question.kind === 'chips',
    ),
    URGENCY_QUESTION,
  ];
}

/** The filled rows, in the shape the authored `prompt()` closures expect. */
function answersOf(brief: Brief): AnswersMap {
  const answers: AnswersMap = {};
  for (const field of brief.fields) {
    if (field.value !== null) answers[field.key] = field.value;
  }
  return answers;
}

/** Empty rows, required ones first, in brief order. */
function unfilled(brief: Brief): BriefField[] {
  const empty = brief.fields.filter((field) => field.value === null);
  return [
    ...empty.filter((field) => field.required),
    ...empty.filter((field) => !field.required),
  ];
}

/**
 * The row this message is answering.
 *
 * Positional: the script asks about the first empty required row, so the next
 * thing the client says is taken to be that row's answer. There is no
 * `askingAbout` in the request body to consult, and adding one would let a
 * stale client tell the server which row to write — so the server works it out
 * from the brief it was sent, which is the same thing it does with everything
 * else.
 */
function targetOf(brief: Brief): BriefField | undefined {
  return unfilled(brief)[0];
}

/** Collapse whitespace, and keep it to something a brief row can hold. */
function tidy(message: string): string {
  const clean = message.replace(/\s+/g, ' ').trim();
  return clean.length > 280 ? `${clean.slice(0, 277)}...` : clean;
}

/**
 * What to write into the row, given what the client typed.
 *
 * Only the matter-type row is interpreted, and only into one of the six labels
 * the flow already knows. Everything else is stored as written: this path has
 * no business paraphrasing a client, and a row that reads back exactly what
 * somebody typed is a row they can confirm without re-reading the sentence.
 */
function valueFor(field: BriefField, message: string): string {
  const clean = tidy(message);
  if (field.key !== MATTER_TYPE_KEY) return clean;

  const matched = matterOfText(clean);
  return matched ? MATTER_FLOWS[matched].label : clean;
}

/**
 * One short acknowledgement, chosen by which row was just filled.
 *
 * Keyed rather than random, because this whole module's value is that the same
 * input produces the same output — a screenshot in the write-up has to still be
 * true next week. Two variants only, so an intake does not read as six
 * identical "Thanks." turns in a row.
 */
function acknowledge(field: BriefField, index: number): string {
  if (field.key === MATTER_TYPE_KEY) return 'Thanks, that helps.';
  return index % 2 === 0 ? "Got it, I've noted that." : 'Noted.';
}

/**
 * The closing line, once nothing required is missing.
 *
 * Says the one thing the client needs to know at that point and stops. It does
 * not promise a lawyer is reading, and it does not invent a timescale, because
 * both of those are claims the keyless path is in no position to make.
 */
const READY_REPLY =
  'That covers everything I need. Have a look at the brief on the right, ' +
  'confirm anything still marked unsure, and send it when you are happy with it.';

/**
 * What the concierge says after the case has gone.
 *
 * The waiting conversation exists to answer "what did I send" and "what
 * happens now" against a sealed brief. Without a model it can still answer the
 * first honestly, by reading the brief back, and it declines the second rather
 * than guessing at it.
 */
function waitingReply(brief: Brief): string {
  const filled = brief.fields.filter((field) => field.value !== null);
  const recap = filled
    .map((field) => `${field.label}: ${field.value}`)
    .join('\n');

  return (
    'Your case has been sent and nothing you do here changes it. ' +
    'This is what went across:\n\n' +
    recap +
    '\n\nI cannot answer anything beyond the brief on this build, because it ' +
    'is running without a model behind it. Anything else is best asked of the ' +
    'team on the case page.'
  );
}

export type OfflineTurnRequest = {
  brief: Brief;
  message: string;
  mode: 'intake' | 'waiting';
};

/**
 * One scripted turn, in the model's own output shape.
 *
 * Returns an `IntakeTurn` rather than something narrower for the same reason
 * `parseWaitingTurn` does: the client reads one shape, and a second one here
 * would fork the renderer.
 */
export function offlineTurn(request: OfflineTurnRequest): IntakeTurn {
  const { brief, message, mode } = request;

  if (mode === 'waiting') {
    return {
      reply: waitingReply(brief),
      fieldUpdates: [],
      askingAbout: '',
      nothingRequiredMissing: true,
      options: [],
      observation: '',
    };
  }

  const target = targetOf(brief);

  /*
   * Nothing empty left, so there is nothing to attribute this message to.
   * Answering with the ready line rather than writing the message somewhere is
   * the honest move: the alternative is overwriting a row the client already
   * confirmed with a sentence that was not about it.
   */
  if (!target) {
    return {
      reply: READY_REPLY,
      fieldUpdates: [],
      askingAbout: '',
      nothingRequiredMissing: true,
      options: [],
      observation: '',
    };
  }

  const value = valueFor(target, message);

  /*
   * The matter the brief will be once this update lands, which is not
   * necessarily the matter it is now: on the opening turn the matter-type row
   * is empty, and the question list for the *next* row depends on what this
   * message just classified it as. Reading it after the update rather than
   * before is what makes the second question an employment question when
   * somebody opens with "I was made redundant".
   */
  const resolved =
    (target.key === MATTER_TYPE_KEY ? matterOfText(value) : undefined) ??
    matterOfText(
      brief.fields.find((field) => field.key === MATTER_TYPE_KEY)?.value ?? '',
    ) ??
    brief.matterId;

  const filledIndex = brief.fields.filter(
    (field) => field.value !== null,
  ).length;

  /*
   * The next empty required row, once this one is counted as filled. Optional
   * rows are never asked about: the flow's promise is that the client can send
   * as soon as the required set is complete, and a script that kept asking
   * would walk straight past the moment it became true.
   */
  const next = brief.fields.find(
    (field) =>
      field.value === null && field.required && field.key !== target.key,
  );

  const questions = questionsFor(resolved);
  const answers = { ...answersOf(brief), [target.key]: value };

  const question = next
    ? questions.find((candidate) => candidate.key === next.key)
    : undefined;

  /*
   * The authored copy where there is some, the row's own label where there is
   * not. A brief row can exist without a matching question — `fieldsForMatter`
   * and this list are kept in step, but a future matter file could add a field
   * def without a prompt, and an intake that went silent at that point would
   * be a dead end. See item 16 for why a dead end here is the expensive kind.
   */
  const ask = question
    ? question.prompt(answers)
    : next
      ? `Could you tell me about ${next.label.toLowerCase()}?`
      : '';

  const options = question?.chips
    ? question.chips.map((chip) => chip.label).slice(0, MAX_TURN_OPTIONS)
    : [];

  return {
    reply: next
      ? `${acknowledge(target, filledIndex)} ${ask}`
      : `${acknowledge(target, filledIndex)} ${READY_REPLY}`,
    fieldUpdates: [
      {
        key: target.key,
        value,
        source: 'client',
        confidence: SCRIPTED_CONFIDENCE,
        reasoning: '',
      },
    ],
    askingAbout: next?.key ?? '',
    nothingRequiredMissing: !next,
    options,
    observation: '',
  };
}
