/**
 * M&A / Other matter definition: acquisitions (buy-side), sales (sell-side),
 * investments, mergers, and an "other / something else" free-text fallback.
 * Branches by intent and by deal stage.
 */

import {
  Briefcase,
  Building2,
  HelpCircle,
  Merge,
  TrendingUp,
} from '@repo/ui/icons';
import type {
  IntakeAnswers,
  IntakeStep,
  MatterIntakeDefinition,
  ParsedSituation,
  QuestionDef,
  QuestionOption,
} from '../intake-types';
import {
  detectCounterparty,
  detectFirst,
  keysOf,
  NARRATIVE_CAP,
} from '../parse-situation';
import { CORPORATE_ROSTER, shortlistBySpecialty } from '../lawyer-mocks';
import { URGENCY_OPTIONS, URGENCY_PATTERNS, buildUrgencyRush } from './shared';

const INTENT_OPTIONS: readonly QuestionOption[] = [
  {
    value: 'acquire',
    label: 'Buy-side / acquire',
    description: "You're acquiring a company or its assets.",
    icon: Briefcase,
  },
  {
    value: 'sell',
    label: 'Sell-side',
    description: "You're selling your business or a division.",
    icon: Building2,
  },
  {
    value: 'investment',
    label: 'Make an investment',
    description: 'A minority stake or strategic investment.',
    icon: TrendingUp,
  },
  {
    value: 'merger',
    label: 'Merger',
    description: 'Combining with another company.',
    icon: Merge,
  },
  {
    value: 'other',
    label: 'Something else',
    description: "Tell us what you're working on.",
    icon: HelpCircle,
  },
];

const DEAL_STAGE_OPTIONS: readonly QuestionOption[] = [
  { value: 'exploring', label: 'Exploring' },
  { value: 'loi', label: 'LOI / term sheet' },
  { value: 'diligence', label: 'Due diligence' },
  { value: 'definitive', label: 'Definitive docs' },
  { value: 'closing', label: 'Closing' },
];

const STRUCTURE_OPTIONS: readonly QuestionOption[] = [
  { value: 'asset', label: 'Asset purchase' },
  { value: 'stock', label: 'Stock purchase' },
  { value: 'merger', label: 'Merger' },
  { value: 'not_sure', label: 'Not sure' },
];

const VALUE_OPTIONS: readonly QuestionOption[] = [
  { value: 'under_1m', label: 'Under $1M' },
  { value: '1m_10m', label: '$1M–$10M' },
  { value: '10m_50m', label: '$10M–$50M' },
  { value: 'over_50m', label: 'Over $50M' },
  { value: 'not_sure', label: 'Not sure' },
];

const INTENT_NOUN: Record<string, string> = {
  acquire: 'Acquisition',
  sell: 'Sale',
  investment: 'Investment',
  merger: 'Merger',
  other: 'Deal',
};

function counterpartyHeader(answers: IntakeAnswers): string {
  switch (answers.intent) {
    case 'acquire':
      return 'What company are you acquiring?';
    case 'sell':
      return 'What business are you selling?';
    case 'investment':
      return 'What are you investing in?';
    case 'merger':
      return 'Who are you merging with?';
    default:
      return 'Who is on the other side?';
  }
}

const questions: Record<string, QuestionDef> = {
  intent: {
    id: 'intent',
    ui: 'card-grid',
    columns: 2,
    header: 'What can we help you with?',
    reviewLabel: 'What you need',
    options: INTENT_OPTIONS,
    required: true,
  },
  dealStage: {
    id: 'dealStage',
    ui: 'card-grid',
    columns: 3,
    header: 'Where are you in the process?',
    helper: "A rough idea is fine — we'll meet you where you are.",
    reviewLabel: 'Deal stage',
    options: DEAL_STAGE_OPTIONS,
    required: true,
  },
  urgency: {
    id: 'urgency',
    ui: 'chips',
    header: 'How soon do you need it?',
    helper: 'This helps us route urgent matters faster.',
    reviewLabel: 'Timeline',
    options: URGENCY_OPTIONS,
    required: true,
  },
  documents: {
    id: 'documents',
    ui: 'upload',
    header: 'Got any related documents?',
    helper: 'An LOI, term sheet, NDA, or a teaser/CIM all help.',
    reviewLabel: 'Documents',
    skipAllowed: true,
  },

  // Shared deal questions
  counterpartyName: {
    id: 'counterpartyName',
    ui: 'text',
    header: counterpartyHeader,
    reviewLabel: 'Target / counterparty',
    placeholder: 'Company name',
    skipAllowed: true,
  },
  structure: {
    id: 'structure',
    ui: 'chips',
    header: 'What structure are you contemplating?',
    reviewLabel: 'Structure',
    options: STRUCTURE_OPTIONS,
  },
  dealValue: {
    id: 'dealValue',
    ui: 'chips',
    header: 'Roughly, what size is the deal?',
    helper: 'Ballpark enterprise value is fine.',
    reviewLabel: 'Deal value',
    options: VALUE_OPTIONS,
    skipAllowed: true,
  },
  concerns: {
    id: 'concerns',
    ui: 'textarea',
    header: "What's top of mind or worrying you?",
    helper: 'Key risks, sticking points, or what you most want protected.',
    reviewLabel: 'Concerns',
    placeholder: 'Tell us what matters most here.',
    skipAllowed: true,
  },

  // Branch A — investment
  investAmount: {
    id: 'investAmount',
    ui: 'chips',
    header: 'How much are you investing?',
    reviewLabel: 'Investment amount',
    options: VALUE_OPTIONS,
    skipAllowed: true,
  },
  investInstrument: {
    id: 'investInstrument',
    ui: 'chips',
    header: 'What instrument?',
    reviewLabel: 'Instrument',
    options: [
      { value: 'equity', label: 'Equity' },
      { value: 'safe', label: 'SAFE' },
      { value: 'convertible', label: 'Convertible note' },
      { value: 'debt', label: 'Debt' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },

  // Branch A — other
  otherDescription: {
    id: 'otherDescription',
    ui: 'textarea',
    header: "Tell us what you're working on.",
    helper: "In your own words — we'll route it to the right lawyer.",
    reviewLabel: 'Description',
    placeholder: 'Describe your matter.',
  },

  // Branch B — deal-stage specific
  loiSigned: {
    id: 'loiSigned',
    ui: 'chips',
    header: 'Is the LOI / term sheet signed?',
    reviewLabel: 'LOI status',
    options: [
      { value: 'signed', label: 'Signed' },
      { value: 'drafting', label: 'Drafting' },
      { value: 'not_yet', label: 'Not yet' },
    ],
  },
  diligenceScope: {
    id: 'diligenceScope',
    ui: 'multi-select',
    header: 'What diligence do you need?',
    helper: 'Pick all that apply.',
    reviewLabel: 'Diligence scope',
    options: [
      { value: 'financial', label: 'Financial' },
      { value: 'legal', label: 'Legal' },
      { value: 'ip', label: 'IP' },
      { value: 'employment', label: 'Employment' },
      { value: 'tax', label: 'Tax' },
      { value: 'other', label: 'Other' },
    ],
  },
  definitiveNotes: {
    id: 'definitiveNotes',
    ui: 'textarea',
    header: 'Anything specific about the definitive docs?',
    reviewLabel: 'Definitive docs notes',
    placeholder: 'Optional details.',
    skipAllowed: true,
  },
  closingDate: {
    id: 'closingDate',
    ui: 'date',
    header: 'Target closing date?',
    reviewLabel: 'Closing date',
    skipAllowed: true,
    skipKey: 'closingNoDate',
    displayValue: (answers) => {
      if (answers.closingNoDate) return 'Not set yet';
      const raw = answers.closingDate;
      return typeof raw === 'string' && raw.length > 0 ? raw : null;
    },
  },
  closingBlockers: {
    id: 'closingBlockers',
    ui: 'textarea',
    header: 'Anything standing between you and closing?',
    reviewLabel: 'Closing blockers',
    placeholder: 'Optional details.',
    skipAllowed: true,
  },

  // Internal-only key (paired with the closing-date question)
  closingNoDate: {
    id: 'closingNoDate',
    ui: 'chips',
    header: '',
    reviewLabel: 'No closing date',
  },
};

const intentIs = (value: string) => (a: IntakeAnswers) => a.intent === value;
const stageIs = (value: string) => (a: IntakeAnswers) => a.dealStage === value;
const isDealIntent = (a: IntakeAnswers) =>
  a.intent === 'acquire' || a.intent === 'sell' || a.intent === 'merger';

const steps: readonly IntakeStep[] = [
  { id: 'intent', stage: 'triage', questionIds: ['intent'] },
  { id: 'dealStage', stage: 'triage', questionIds: ['dealStage'] },
  { id: 'urgency', stage: 'triage', questionIds: ['urgency'] },
  { id: 'documents', stage: 'triage', questionIds: ['documents'] },

  // Branch A — acquire / sell / merger (shared deal questions)
  {
    id: 'dealTarget',
    stage: 'details',
    questionIds: ['counterpartyName', 'structure'],
    visibleWhen: isDealIntent,
  },
  {
    id: 'dealValue',
    stage: 'details',
    questionIds: ['dealValue', 'concerns'],
    visibleWhen: isDealIntent,
  },

  // Branch A — investment
  {
    id: 'investment',
    stage: 'details',
    questionIds: ['counterpartyName', 'investAmount'],
    visibleWhen: intentIs('investment'),
  },
  {
    id: 'investmentTerms',
    stage: 'details',
    questionIds: ['investInstrument', 'concerns'],
    visibleWhen: intentIs('investment'),
  },

  // Branch A — other (free-text fallback)
  {
    id: 'other',
    stage: 'details',
    questionIds: ['otherDescription'],
    visibleWhen: intentIs('other'),
  },

  // Branch B — deal-stage specific (skipped while just exploring or "other")
  {
    id: 'loiDetails',
    stage: 'details',
    questionIds: ['loiSigned'],
    visibleWhen: (a) => stageIs('loi')(a) && a.intent !== 'other',
  },
  {
    id: 'diligenceDetails',
    stage: 'details',
    questionIds: ['diligenceScope'],
    visibleWhen: (a) => stageIs('diligence')(a) && a.intent !== 'other',
  },
  {
    id: 'definitiveDetails',
    stage: 'details',
    questionIds: ['definitiveNotes'],
    visibleWhen: (a) => stageIs('definitive')(a) && a.intent !== 'other',
  },
  {
    id: 'closingDetails',
    stage: 'details',
    questionIds: ['closingDate', 'closingBlockers'],
    visibleWhen: (a) => stageIs('closing')(a) && a.intent !== 'other',
  },
];

const INTENT_PATTERNS = [
  {
    value: 'sell',
    re: /\b(sell|selling|sale of|divest|exit my|offload|sell-?side)\b/,
  },
  {
    value: 'acquire',
    re: /\b(acquir|buy(ing)? a company|buy-?side|takeover|purchase the business|roll-?up)\b/,
  },
  {
    value: 'merger',
    re: /\b(merg|combine with|merger of equals|amalgamat)\b/,
  },
  {
    value: 'investment',
    re: /\b(invest|minority stake|strategic investment|take a stake|fund the)\b/,
  },
];

const STAGE_PATTERNS = [
  {
    value: 'closing',
    re: /\b(closing|close the deal|signing|wire the funds)\b/,
  },
  {
    value: 'definitive',
    re: /\b(definitive|spa\b|purchase agreement|merger agreement|drafting the docs)\b/,
  },
  {
    value: 'diligence',
    re: /\b(due diligence|diligence|\bdd\b|reviewing the books)\b/,
  },
  { value: 'loi', re: /\b(loi|letter of intent|term sheet|signed an loi)\b/ },
  {
    value: 'exploring',
    re: /\b(exploring|early|thinking about|considering|kicking the tires)\b/,
  },
];

function parse(text: string): ParsedSituation {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const answers: IntakeAnswers = {};

  const intent = detectFirst(lower, INTENT_PATTERNS);
  if (intent) answers.intent = intent;

  const dealStage = detectFirst(lower, STAGE_PATTERNS);
  if (dealStage) answers.dealStage = dealStage;

  const urgency = detectFirst(lower, URGENCY_PATTERNS);
  if (urgency) answers.urgency = urgency;

  const counterparty = detectCounterparty(trimmed);
  if (counterparty && intent && intent !== 'other') {
    answers.counterpartyName = counterparty;
  }

  if (trimmed.length > 0) {
    // The deal intents share a "concerns" field; "other" has its own.
    const narrativeKey = intent === 'other' ? 'otherDescription' : 'concerns';
    answers[narrativeKey] = trimmed.slice(0, NARRATIVE_CAP);
  }

  return { answers, keys: keysOf(answers) };
}

function buildTriageTransition(answers: IntakeAnswers): string {
  const intentMap: Record<string, string> = {
    acquire: 'working on your acquisition',
    sell: 'getting your sale moving',
    investment: 'papering your investment',
    merger: 'working through your merger',
    other: 'getting your matter set up',
  };
  const lead =
    typeof answers.intent === 'string'
      ? intentMap[answers.intent]
      : 'getting your matter set up';
  return `Got it — ${lead}${buildUrgencyRush(answers.urgency)}. Just a few details and we’ll be set.`;
}

function staticSummary(answers: IntakeAnswers): string {
  const intentText: Record<string, string> = {
    acquire: 'is pursuing a buy-side acquisition',
    sell: 'is running a sell-side process',
    investment: 'is making an investment',
    merger: 'is working on a merger',
    other: 'has a matter to scope',
  };
  const action =
    typeof answers.intent === 'string'
      ? intentText[answers.intent]
      : 'has a new deal matter';
  const stage = answers.dealStage
    ? DEAL_STAGE_OPTIONS.find((o) => o.value === answers.dealStage)?.label
    : undefined;
  const stageText = stage ? ` (${stage.toLowerCase()})` : '';
  const documents = Array.isArray(answers.documents)
    ? answers.documents.length
    : 0;
  const docText =
    documents > 0
      ? ` ${documents} document${documents > 1 ? 's' : ''} attached.`
      : ' No documents attached.';
  return `Client ${action}${stageText}.${docText} Moritz will assign a transactional lawyer to take it from here.`;
}

export const maMatter: MatterIntakeDefinition = {
  id: 'ma',
  label: 'M&A / Other',
  newMatterTitle: 'New deal matter',
  buildHeaderTitle: (answers) => {
    const noun =
      typeof answers.intent === 'string'
        ? INTENT_NOUN[answers.intent]
        : undefined;
    return noun ? `${noun} matter` : 'New deal matter';
  },
  triageKeys: ['intent', 'dealStage', 'urgency'],
  questions,
  steps,
  introGreeting:
    "Hi — I'm Moritz. Tell me about your deal in your own words and I'll skip any questions I can already answer. Or pick what you need below to get started.",
  buildTriageTransition,
  parse,
  openAiHints: {
    enumKeys: ['intent', 'dealStage', 'urgency', 'structure', 'dealValue'],
    freeTextKeys: ['counterpartyName', 'concerns', 'otherDescription'],
  },
  staticSummary,
  getLawyerShortlist: (answers) =>
    shortlistBySpecialty(
      CORPORATE_ROSTER,
      typeof answers.intent === 'string' ? answers.intent : undefined,
    ),
};
