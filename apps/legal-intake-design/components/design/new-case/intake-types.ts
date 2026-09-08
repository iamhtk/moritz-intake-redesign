/**
 * Types for the conversational case-intake flow (Moritz-style chat with a live
 * brief panel). The engine is a small, declarative, answer-driven question
 * framework: a matter-type pick routes into a per-matter branch of open-ended
 * questions (chips are reserved for the matter-type pick and the closing urgency
 * step) that converges on the shared urgency -> documents -> recap tail.
 * Assistant turns are revealed by the shared StreamingText, so the engine itself
 * stays pure and synchronous.
 */

export type MatterId =
  | 'contract'
  | 'employment'
  | 'procurement'
  | 'corporate'
  | 'ma'
  | 'other';

/** Every answer is stored as a string: a chip `value`, free text, or '' (skipped). */
export type AnswerValue = string;

export type AnswersMap = Record<string, AnswerValue>;

export interface SuggestionChip {
  id: string;
  label: string;
  value: string;
}

export type InlineCard =
  | { type: 'chips'; chips: SuggestionChip[] }
  | { type: 'attach'; label?: string }
  | { type: 'recap' }
  | { type: 'submitted'; title: string }
  | { type: 'skip' };

export interface IntakeFile {
  id: string;
  name: string;
  size: number;
}

export interface IntakeMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  createdAt: string;
  card?: InlineCard;
  /** Files attached to (and sent with) this message; rendered on the bubble. */
  attachments?: IntakeFile[];
}

/**
 * One question in a flow. `kind` drives how the user answers: `chips` renders a
 * suggestion-chip group, `text` takes the composer input, `attach` is the
 * documents step, and `recap` is the terminal summary turn.
 */
export interface IntakeQuestion {
  key: string;
  kind: 'chips' | 'text' | 'attach' | 'recap';
  /** Assistant copy for the turn. */
  prompt: (answers: AnswersMap) => string;
  /** Short label used in the brief panel and recap. */
  reviewLabel: string;
  /** Chips for `kind: 'chips'`. */
  chips?: SuggestionChip[];
  /** Hint shown in the brief panel while the question is still upcoming. */
  hint?: string;
  /** Optional questions accept a "skip" answer. */
  optional?: boolean;
}

export interface MatterFlow {
  id: MatterId;
  label: string;
  /** Short acknowledgement that leads the first question after the matter pick. */
  transition?: (answers: AnswersMap) => string;
  /** Tailored, mostly open-ended questions asked in order for this matter. */
  questions: IntakeQuestion[];
}

export interface IntakeState {
  matterId?: MatterId;
  answers: AnswersMap;
  /** Key of the question currently awaiting an answer. */
  currentKey: string;
  files: IntakeFile[];
  done: boolean;
}

export interface StepResult {
  assistantMessage: IntakeMessage;
  /** New answers to merge (the question just answered). */
  answerPatch: AnswersMap;
  /** Set once, when the matter-type question is answered. */
  matterId?: MatterId;
  /** Key of the next awaited question. */
  nextCurrentKey: string;
  done?: boolean;
}

export const MATTER_TYPE_KEY = 'matter-type';
export const URGENCY_KEY = 'urgency';
export const DOCUMENTS_KEY = 'documents';
export const RECAP_KEY = 'recap';
