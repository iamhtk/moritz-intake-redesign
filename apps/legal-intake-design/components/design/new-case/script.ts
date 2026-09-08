/**
 * Answer-driven intake engine. A matter-type pick routes into a per-matter
 * branch of open-ended questions that converges on the shared urgency ->
 * documents -> recap tail. The engine is a pure, synchronous state machine: it
 * records the answer for the awaited question, recomputes the remaining
 * questions, and emits the next assistant turn. Assistant copy is revealed
 * word-by-word by StreamingText, so nothing here is time-based.
 */

import {
  DOCUMENTS_QUESTION,
  MATTER_CHIPS,
  MATTER_FLOWS,
  RECAP_QUESTION,
  URGENCY_QUESTION,
} from './matters';
import {
  DOCUMENTS_KEY,
  MATTER_TYPE_KEY,
  RECAP_KEY,
  type AnswersMap,
  type InlineCard,
  type IntakeMessage,
  type IntakeQuestion,
  type IntakeState,
  type MatterId,
  type StepResult,
} from './intake-types';

const newId = (): string =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

const nowIso = (): string => new Date().toISOString();

const assistant = (content: string, card?: InlineCard): IntakeMessage => ({
  id: newId(),
  role: 'assistant',
  content,
  createdAt: nowIso(),
  card,
});

/** Opening matter-type question (greeting + the five commercial chips). */
export const MATTER_TYPE_QUESTION: IntakeQuestion = {
  key: MATTER_TYPE_KEY,
  kind: 'chips',
  reviewLabel: "What's this about",
  hint: 'What kind of matter',
  prompt: () =>
    "Hi \u2014 I'm Moritz. I'll walk through a few quick questions and build out a case brief on the right as we go. Voice and attachments are welcome whenever you'd like.\n\nTo start, what kind of matter is this? Pick one below, or describe it in your own words.",
  chips: MATTER_CHIPS,
};

const isMatterId = (value: string): value is MatterId => value in MATTER_FLOWS;

const isSkip = (text: string): boolean =>
  /^(skip|none|n\/a|no|nothing|no thanks|not now)$/i.test(text.trim());

/**
 * The full ordered question list for the current matter:
 * matter-type -> the matter's open-ended questions -> urgency -> documents ->
 * recap. Before a matter is chosen, only the matter-type question is known.
 */
export function orderedQuestions(
  matterId: MatterId | undefined,
  _answers: AnswersMap,
): IntakeQuestion[] {
  const list: IntakeQuestion[] = [MATTER_TYPE_QUESTION];
  if (!matterId) return list;
  const flow = MATTER_FLOWS[matterId];
  list.push(
    ...flow.questions,
    URGENCY_QUESTION,
    DOCUMENTS_QUESTION,
    RECAP_QUESTION,
  );
  return list;
}

/** Remaining questions to ask (recap is always last and never "answered"). */
function pendingQuestions(
  matterId: MatterId | undefined,
  answers: AnswersMap,
): IntakeQuestion[] {
  return orderedQuestions(matterId, answers).filter(
    (q) => !Object.prototype.hasOwnProperty.call(answers, q.key),
  );
}

function findQuestion(
  matterId: MatterId | undefined,
  answers: AnswersMap,
  key: string,
): IntakeQuestion {
  return (
    orderedQuestions(matterId, answers).find((q) => q.key === key) ??
    MATTER_TYPE_QUESTION
  );
}

/** Map a user reply to the value we store for the awaited question. */
function interpretAnswer(
  question: IntakeQuestion,
  userMessage: string,
): string {
  const trimmed = userMessage.trim();
  if (question.kind === 'chips') {
    const lower = trimmed.toLowerCase();
    const match = (question.chips ?? []).find(
      (c) => c.label.toLowerCase() === lower || c.value.toLowerCase() === lower,
    );
    if (match) return match.value;
    if (question.optional && isSkip(trimmed)) return '';
    return trimmed;
  }
  // text / attach
  if (question.optional && isSkip(trimmed)) return '';
  return trimmed;
}

function cardFor(question: IntakeQuestion): InlineCard | undefined {
  switch (question.kind) {
    case 'chips':
      return { type: 'chips', chips: question.chips ?? [] };
    case 'attach':
      return { type: 'attach' };
    case 'recap':
      return { type: 'recap' };
    case 'text':
      return question.optional ? { type: 'skip' } : undefined;
    default:
      return undefined;
  }
}

/** Human-readable display for a recorded answer (chip label, text, or skipped). */
export function displayAnswer(
  question: IntakeQuestion,
  answers: AnswersMap,
): string | null {
  const value = answers[question.key];
  if (value === undefined) return null;
  if (value === '') return 'Skipped';
  if (question.kind === 'chips') {
    return question.chips?.find((c) => c.value === value)?.label ?? value;
  }
  return value;
}

/** Opening assistant turn (matter-type prompt + chips). */
export function startIntake(): StepResult {
  return {
    assistantMessage: assistant(MATTER_TYPE_QUESTION.prompt({}), {
      type: 'chips',
      chips: MATTER_CHIPS,
    }),
    answerPatch: {},
    nextCurrentKey: MATTER_TYPE_KEY,
    done: false,
  };
}

/**
 * Optional AI augmentation for a single step. All fields are best-effort and
 * validated here before use, so a malformed suggestion can never corrupt state.
 */
export interface StepAiInput {
  /** Matter classification for a free-text matter-type reply. */
  classifiedMatterId?: MatterId;
  /** Confidently-extracted answers to pre-fill for later questions. */
  extractedAnswers?: AnswersMap;
  /** A short warm sentence to lead the next prompt (replaces the transition). */
  acknowledgement?: string;
}

/**
 * Keep only extracted answers that target real, still-unstructured questions
 * for this matter with valid values. Never touches the just-answered key or the
 * structural keys (matter-type / documents / recap).
 */
function validateExtracted(
  matterId: MatterId | undefined,
  priorAnswers: AnswersMap,
  answeredKey: string,
  extracted: AnswersMap,
): AnswersMap {
  const byKey = new Map(
    orderedQuestions(matterId, priorAnswers).map((q) => [q.key, q] as const),
  );
  const out: AnswersMap = {};
  for (const [key, raw] of Object.entries(extracted)) {
    if (
      key === answeredKey ||
      key === MATTER_TYPE_KEY ||
      key === DOCUMENTS_KEY ||
      key === RECAP_KEY
    ) {
      continue;
    }
    const question = byKey.get(key);
    if (!question || typeof raw !== 'string') continue;
    const value = raw.trim();
    if (!value) continue;
    if (question.kind === 'chips') {
      if (question.chips?.some((c) => c.value === value)) out[key] = value;
    } else if (question.kind === 'text') {
      out[key] = value.slice(0, 600);
    }
  }
  return out;
}

/** Record the answer for the current question and produce the next turn. */
export function stepIntake(
  state: IntakeState,
  userMessage: string,
): StepResult {
  return stepIntakeWith(state, userMessage);
}

/**
 * Like `stepIntake`, but folds in optional AI augmentation: classifying a
 * free-text matter reply, pre-filling later answers, and leading the next prompt
 * with a warm acknowledgement. With no `ai` argument it behaves identically to
 * the deterministic `stepIntake`.
 */
export function stepIntakeWith(
  state: IntakeState,
  userMessage: string,
  ai?: StepAiInput,
): StepResult {
  const question = findQuestion(
    state.matterId,
    state.answers,
    state.currentKey,
  );
  const answeredMatterType = question.key === MATTER_TYPE_KEY;
  let value = interpretAnswer(question, userMessage);

  // If a free-text matter reply doesn't map to one of the flows, use the AI
  // classification when available; otherwise re-ask with the chips rather than
  // recording an unroutable matter type.
  if (answeredMatterType && !isMatterId(value)) {
    const classified = ai?.classifiedMatterId;
    if (classified && isMatterId(classified)) {
      value = classified;
    } else {
      return {
        assistantMessage: assistant(
          "Let's make sure I route this to the right team \u2014 which of these fits best?",
          { type: 'chips', chips: MATTER_CHIPS },
        ),
        answerPatch: {},
        nextCurrentKey: MATTER_TYPE_KEY,
        done: false,
      };
    }
  }

  const matterId: MatterId | undefined =
    answeredMatterType && isMatterId(value) ? value : state.matterId;

  // The answered question, plus any confidently-extracted later answers.
  const patch: AnswersMap = { [question.key]: value };
  if (ai?.extractedAnswers) {
    Object.assign(
      patch,
      validateExtracted(
        matterId,
        state.answers,
        question.key,
        ai.extractedAnswers,
      ),
    );
  }

  const answers: AnswersMap = { ...state.answers, ...patch };
  const next = pendingQuestions(matterId, answers)[0] ?? RECAP_QUESTION;
  const done = next.key === RECAP_KEY;

  let content = next.prompt(answers);
  const ack = ai?.acknowledgement?.trim();
  if (ack) {
    // A warm, context-aware lead-in replaces the static matter transition.
    content = `${ack}\n\n${content}`;
  } else if (matterId && answeredMatterType && next.key !== RECAP_KEY) {
    const transition = MATTER_FLOWS[matterId].transition?.(answers);
    if (transition) content = `${transition}\n\n${content}`;
  }

  return {
    assistantMessage: assistant(content, cardFor(next)),
    answerPatch: patch,
    matterId: answeredMatterType ? matterId : undefined,
    nextCurrentKey: next.key,
    done,
  };
}

/**
 * Answer an off-script message (a question/aside) without advancing: prepend the
 * note, then re-ask the current question with its card so chips stay actionable.
 */
export function reaskWithNote(state: IntakeState, note: string): StepResult {
  const question = findQuestion(
    state.matterId,
    state.answers,
    state.currentKey,
  );
  const body = question.prompt(state.answers);
  const trimmed = note.trim();
  const content = trimmed ? `${trimmed}\n\n${body}` : body;
  return {
    assistantMessage: assistant(content, cardFor(question)),
    answerPatch: {},
    nextCurrentKey: state.currentKey,
    done: false,
  };
}
