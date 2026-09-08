/**
 * Shared types for the generic matter-intake wizard (design playground).
 *
 * The intake is a chat-style, branched form: a triage stage, a document
 * stage, then intent- and type-specific question branches, ending in a review
 * + mock quote generation. The orchestrator, dock, chat shell, review, and
 * save/resume are all matter-agnostic and driven by a `MatterIntakeDefinition`
 * (see `matters/*`). Only the questions, branching, parsing, and copy live per
 * matter.
 *
 * Nothing here touches a real backend. See `mock-*.ts` and
 * `openai-intake-helpers.ts` for the (optional) smarter mock behaviour.
 */

import type { LucideIcon } from '@repo/ui/icons';

/**
 * Metadata for an uploaded file. We never persist the `File` blob to
 * localStorage, only this descriptor, so resume can prompt for a re-upload.
 */
export type FileMeta = {
  name: string;
  size: number;
  type: string;
};

/** Every value an answer can hold across the generic matter flows. */
export type IntakeAnswerValue = string | string[] | boolean | FileMeta[];

/**
 * The live answer bag. Keys are matter-specific question IDs (strings); each
 * matter definition knows its own keys, while the engine stays generic.
 */
export type IntakeAnswers = Record<string, IntakeAnswerValue | undefined>;

/** Answer keys are plain strings in the generic engine. */
export type AnswerKey = string;

export type QuestionUi =
  | 'card-grid'
  | 'chips'
  | 'text'
  | 'textarea'
  | 'upload'
  | 'date'
  | 'multi-select';

export type QuestionOption = {
  value: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
};

export type DynamicCopy = string | ((answers: IntakeAnswers) => string);
export type DynamicBool = boolean | ((answers: IntakeAnswers) => boolean);

export type QuestionDef = {
  id: AnswerKey;
  ui: QuestionUi;
  header: DynamicCopy;
  helper?: DynamicCopy;
  /** Short label used in the review summary. */
  reviewLabel: string;
  placeholder?: string;
  options?: readonly QuestionOption[];
  /** Chip suggestions for free-text fields (rendered above the input). */
  suggestions?: readonly string[];
  skipAllowed?: boolean;
  required?: DynamicBool;
  maxLength?: number;
  columns?: 2 | 3 | 4;
  /** Draft path "describe the deal" offers a guided sub-flow escape hatch. */
  guidedDeal?: boolean;
  /**
   * For a `date` question, the boolean answer key paired with it (e.g. the
   * "No specific deadline" checkbox). Lets the dock/display avoid hardcoding
   * the contract-specific keys.
   */
  skipKey?: AnswerKey;
  /**
   * Optional custom display for the review summary, overriding the default
   * option-label lookup (used by paired date/skip questions).
   */
  displayValue?: (answers: IntakeAnswers) => string | null;
};

/** Coarse progress segments shown in the side panel. */
export type StepStage = 'triage' | 'details' | 'review';

/**
 * One screen of the wizard. A step may render one or two closely-related
 * questions (desktop grouping). `visibleWhen` gates branch A/B steps.
 */
export type IntakeStep = {
  id: string;
  stage: StepStage;
  questionIds: AnswerKey[];
  visibleWhen?: (answers: IntakeAnswers) => boolean;
};

/** High-level phase of the chat orchestrator. */
export type IntakePhase =
  | 'intro'
  | 'asking'
  | 'review'
  | 'generating'
  | 'success';

/**
 * Result of parsing a free-text "describe your situation" paste. `answers`
 * holds whatever fields we could confidently extract; `keys` lists which of
 * those came from the parse (used for "from your description" tags).
 */
export type ParsedSituation = {
  answers: IntakeAnswers;
  keys: AnswerKey[];
};

/** Lightweight, JSON-serialisable attachment descriptor for a chat turn. */
export type ChatAttachmentMeta = {
  name: string;
  size: number;
};

/**
 * A single entry in the chat transcript. `answered` items reference a single
 * question by its answer key and are re-rendered against the live answers, so
 * the transcript stays JSON-serialisable for save/resume. The active (pending)
 * question is not a transcript entry — it renders in the docked panel above the
 * composer.
 */
export type ChatItem =
  | { id: string; kind: 'assistant'; text: string }
  | { id: string; kind: 'user'; text: string; attachment?: ChatAttachmentMeta }
  | { id: string; kind: 'answered'; key: AnswerKey };

/** Fields a mock document extraction can surface from a filename. */
export type ExtractedFields = {
  counterparty?: string;
  value?: string;
  suggestedType?: string;
};

/** Hints that steer the optional OpenAI free-text parser per matter. */
export type OpenAiParseHints = {
  /** Answer keys whose value must be one of the question's option values. */
  enumKeys: AnswerKey[];
  /** Answer keys that accept short copied free-text. */
  freeTextKeys: AnswerKey[];
};

/**
 * Everything matter-specific the generic orchestrator needs. The shared
 * framework (flow, dock, shell, review, save/resume) reads from this; the
 * matter modules in `matters/*` supply it.
 */
export type MatterIntakeDefinition = {
  /** Stable id, also used as the localStorage draft namespace + route slug. */
  id: string;
  /** Display label, e.g. "Contract". */
  label: string;
  /** Header title shown while the matter has no resolved sub-type yet. */
  newMatterTitle: string;
  /** Builds the chat header title from the live answers. */
  buildHeaderTitle: (answers: IntakeAnswers) => string;
  /** The fixed triage set shown first (e.g. intent / type / urgency). */
  triageKeys: AnswerKey[];
  /** Every question keyed by its answer id. */
  questions: Record<string, QuestionDef>;
  /** The full ordered step list (triage -> documents -> branches). */
  steps: readonly IntakeStep[];
  /** Opening assistant greeting. */
  introGreeting: string;
  /** Short line after the triage trio collapses. */
  buildTriageTransition: (answers: IntakeAnswers) => string;
  /** Deterministic, offline free-text parse (keyword heuristic). */
  parse: (text: string) => ParsedSituation;
  /** Hints for the optional OpenAI free-text parser. */
  openAiHints: OpenAiParseHints;
  /** Apply mock document-extraction fields; returns merged answers or null. */
  applyExtraction?: (
    answers: IntakeAnswers,
    fields: ExtractedFields,
  ) => IntakeAnswers | null;
  /** Deterministic lawyer-ready summary used at review (AI may refine it). */
  staticSummary: (answers: IntakeAnswers) => string;
  /** Lawyers worth surfacing on the success screen for this matter. */
  getLawyerShortlist: (answers: IntakeAnswers) => Lawyer[];
};

/** Mock lawyer descriptor (success screen shortlist). */
export type Lawyer = {
  id: string;
  name: string;
  title: string;
  initials: string;
  credentials: string[];
  bio: string;
  imageUrl: string | null;
  responseTime: string;
  specialties?: string[];
};
