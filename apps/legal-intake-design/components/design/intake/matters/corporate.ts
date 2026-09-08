/**
 * Corporate matter definition: entity formation, governance, financing, cap
 * table / equity, and compliance. Branches by intent and by entity type.
 */

import {
  Banknote,
  Building2,
  Coins,
  Landmark,
  ScrollText,
  ShieldCheck,
  Users,
} from '@repo/ui/icons';
import { getAnswerDisplay } from '../intake-config';
import type {
  IntakeAnswers,
  IntakeStep,
  MatterIntakeDefinition,
  ParsedSituation,
  QuestionDef,
  QuestionOption,
} from '../intake-types';
import { detectFirst, keysOf, NARRATIVE_CAP } from '../parse-situation';
import { CORPORATE_ROSTER, shortlistBySpecialty } from '../lawyer-mocks';
import {
  URGENCY_OPTIONS,
  URGENCY_PATTERNS,
  YES_NO_NOT_SURE,
  buildUrgencyRush,
} from './shared';

const INTENT_OPTIONS: readonly QuestionOption[] = [
  {
    value: 'formation',
    label: 'Form an entity',
    description: 'Set up a new company or holding structure.',
    icon: Building2,
  },
  {
    value: 'governance',
    label: 'Governance',
    description: 'Board setup, bylaws, shareholder agreements.',
    icon: Users,
  },
  {
    value: 'financing',
    label: 'Raise financing',
    description: 'A SAFE, convertible, or priced round.',
    icon: Banknote,
  },
  {
    value: 'equity',
    label: 'Cap table / equity',
    description: 'Issue shares, set up an option pool, or clean up.',
    icon: Coins,
  },
  {
    value: 'compliance',
    label: 'Compliance',
    description: 'Filings, registered agent, minutes, qualification.',
    icon: ShieldCheck,
  },
];

const ENTITY_TYPE_OPTIONS: readonly QuestionOption[] = [
  { value: 'llc', label: 'LLC', icon: Building2 },
  { value: 'c_corp', label: 'C-corp', icon: Landmark },
  { value: 's_corp', label: 'S-corp', icon: Landmark },
  { value: 'partnership', label: 'Partnership', icon: Users },
  { value: 'nonprofit', label: 'Nonprofit', icon: ScrollText },
];

const RAISE_OPTIONS: readonly QuestionOption[] = [
  { value: 'under_500k', label: 'Under $500k' },
  { value: '500k_2m', label: '$500k–$2M' },
  { value: '2m_10m', label: '$2M–$10M' },
  { value: 'over_10m', label: 'Over $10M' },
  { value: 'not_sure', label: 'Not sure' },
];

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
  entityType: {
    id: 'entityType',
    ui: 'card-grid',
    columns: 3,
    header: 'What kind of entity is this about?',
    helper: "Not sure yet? Pick the closest — we'll advise.",
    reviewLabel: 'Entity type',
    options: ENTITY_TYPE_OPTIONS,
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
    helper:
      'Existing formation docs, a cap table, term sheet, or bylaws all help.',
    reviewLabel: 'Documents',
    skipAllowed: true,
  },

  // Branch A — formation
  jurisdiction: {
    id: 'jurisdiction',
    ui: 'text',
    header: 'Where do you want to incorporate?',
    helper: 'A state or country — Delaware is common for startups.',
    reviewLabel: 'Jurisdiction',
    placeholder: 'e.g. Delaware',
    suggestions: ['Delaware', 'California', 'New York', 'Not sure'],
  },
  foundersCount: {
    id: 'foundersCount',
    ui: 'chips',
    header: 'How many founders?',
    reviewLabel: 'Founders',
    options: [
      { value: '1', label: 'Just me' },
      { value: '2', label: '2' },
      { value: '3_plus', label: '3+' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  equitySplit: {
    id: 'equitySplit',
    ui: 'chips',
    header: 'Is the equity split decided?',
    reviewLabel: 'Equity split',
    options: [
      { value: 'known', label: 'We know the split' },
      { value: 'tbd', label: 'Still TBD' },
    ],
  },
  formationPurpose: {
    id: 'formationPurpose',
    ui: 'textarea',
    header: 'What will the company do?',
    reviewLabel: 'Purpose',
    placeholder: 'A sentence on the business.',
    skipAllowed: true,
  },

  // Branch A — governance
  governanceNeeds: {
    id: 'governanceNeeds',
    ui: 'multi-select',
    header: 'What do you need to put in place?',
    helper: 'Pick all that apply.',
    reviewLabel: 'Governance needs',
    options: [
      { value: 'board', label: 'Board setup' },
      { value: 'bylaws', label: 'Bylaws' },
      { value: 'shareholder', label: 'Shareholder agreement' },
      { value: 'option_pool', label: 'Option pool' },
      { value: 'committees', label: 'Committee charters' },
      { value: 'other', label: 'Other' },
    ],
  },
  governanceNotes: {
    id: 'governanceNotes',
    ui: 'textarea',
    header: 'Anything specific to flag?',
    reviewLabel: 'Governance notes',
    placeholder: 'Optional details.',
    skipAllowed: true,
  },

  // Branch A — financing
  roundType: {
    id: 'roundType',
    ui: 'chips',
    header: 'What stage is the round?',
    reviewLabel: 'Round',
    options: [
      { value: 'pre_seed', label: 'Pre-seed' },
      { value: 'seed', label: 'Seed' },
      { value: 'series_a', label: 'Series A+' },
      { value: 'bridge', label: 'Bridge' },
      { value: 'other', label: 'Other' },
    ],
  },
  raiseAmount: {
    id: 'raiseAmount',
    ui: 'chips',
    header: 'How much are you raising?',
    reviewLabel: 'Raise amount',
    options: RAISE_OPTIONS,
    skipAllowed: true,
  },
  instrument: {
    id: 'instrument',
    ui: 'chips',
    header: 'What instrument?',
    reviewLabel: 'Instrument',
    options: [
      { value: 'safe', label: 'SAFE' },
      { value: 'convertible', label: 'Convertible note' },
      { value: 'priced', label: 'Priced round' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  leadInvestor: {
    id: 'leadInvestor',
    ui: 'text',
    header: 'Is there a lead investor?',
    reviewLabel: 'Lead investor',
    placeholder: 'Name, or leave blank',
    skipAllowed: true,
  },

  // Branch A — equity
  equityAction: {
    id: 'equityAction',
    ui: 'chips',
    header: 'What do you need to do to the cap table?',
    reviewLabel: 'Cap table action',
    options: [
      { value: 'issue', label: 'Issue shares' },
      { value: 'option_pool', label: 'Set up option pool' },
      { value: 'transfer', label: 'Transfer shares' },
      { value: 'cleanup', label: 'Clean it up' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  capTableNotes: {
    id: 'capTableNotes',
    ui: 'textarea',
    header: 'Anything we should know?',
    reviewLabel: 'Cap table notes',
    placeholder: 'Optional details.',
    skipAllowed: true,
  },

  // Branch A — compliance
  complianceNeeds: {
    id: 'complianceNeeds',
    ui: 'multi-select',
    header: 'What needs handling?',
    helper: 'Pick all that apply.',
    reviewLabel: 'Compliance needs',
    options: [
      { value: 'annual', label: 'Annual filings' },
      { value: 'foreign_qual', label: 'Foreign qualification' },
      { value: 'agent', label: 'Registered agent' },
      { value: 'minutes', label: 'Board minutes' },
      { value: 'other', label: 'Other' },
    ],
  },
  complianceNotes: {
    id: 'complianceNotes',
    ui: 'textarea',
    header: 'Anything specific or overdue?',
    reviewLabel: 'Compliance notes',
    placeholder: 'Optional details.',
    skipAllowed: true,
  },

  // Branch B — entity-type specific
  cCorpState: {
    id: 'cCorpState',
    ui: 'chips',
    header: 'Delaware or your home state?',
    reviewLabel: 'Incorporation state',
    options: [
      { value: 'delaware', label: 'Delaware' },
      { value: 'home_state', label: 'Home state' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  llcManagement: {
    id: 'llcManagement',
    ui: 'chips',
    header: 'Member-managed or manager-managed?',
    reviewLabel: 'LLC management',
    options: [
      { value: 'member', label: 'Member-managed' },
      { value: 'manager', label: 'Manager-managed' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  partnershipType: {
    id: 'partnershipType',
    ui: 'chips',
    header: 'What kind of partnership?',
    reviewLabel: 'Partnership type',
    options: [
      { value: 'general', label: 'General' },
      { value: 'limited', label: 'Limited (LP)' },
      { value: 'llp', label: 'LLP' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  sCorpEligibility: {
    id: 'sCorpEligibility',
    ui: 'chips',
    header: 'Confident you meet the S-corp eligibility rules?',
    helper: 'US persons only, one class of stock, under 100 shareholders.',
    reviewLabel: 'S-corp eligibility',
    options: YES_NO_NOT_SURE,
  },
};

const intentIs = (value: string) => (a: IntakeAnswers) => a.intent === value;
const entityIs = (value: string) => (a: IntakeAnswers) =>
  a.entityType === value;

const steps: readonly IntakeStep[] = [
  { id: 'intent', stage: 'triage', questionIds: ['intent'] },
  { id: 'entityType', stage: 'triage', questionIds: ['entityType'] },
  { id: 'urgency', stage: 'triage', questionIds: ['urgency'] },
  { id: 'documents', stage: 'triage', questionIds: ['documents'] },

  // Branch A — formation
  {
    id: 'formation',
    stage: 'details',
    questionIds: ['jurisdiction', 'foundersCount'],
    visibleWhen: intentIs('formation'),
  },
  {
    id: 'formationEquity',
    stage: 'details',
    questionIds: ['equitySplit', 'formationPurpose'],
    visibleWhen: intentIs('formation'),
  },

  // Branch A — governance
  {
    id: 'governance',
    stage: 'details',
    questionIds: ['governanceNeeds', 'governanceNotes'],
    visibleWhen: intentIs('governance'),
  },

  // Branch A — financing
  {
    id: 'financing',
    stage: 'details',
    questionIds: ['roundType', 'raiseAmount'],
    visibleWhen: intentIs('financing'),
  },
  {
    id: 'financingTerms',
    stage: 'details',
    questionIds: ['instrument', 'leadInvestor'],
    visibleWhen: intentIs('financing'),
  },

  // Branch A — equity
  {
    id: 'equity',
    stage: 'details',
    questionIds: ['equityAction', 'capTableNotes'],
    visibleWhen: intentIs('equity'),
  },

  // Branch A — compliance
  {
    id: 'compliance',
    stage: 'details',
    questionIds: ['complianceNeeds', 'complianceNotes'],
    visibleWhen: intentIs('compliance'),
  },

  // Branch B — entity-type specific
  {
    id: 'cCorpDetails',
    stage: 'details',
    questionIds: ['cCorpState'],
    visibleWhen: entityIs('c_corp'),
  },
  {
    id: 'llcDetails',
    stage: 'details',
    questionIds: ['llcManagement'],
    visibleWhen: entityIs('llc'),
  },
  {
    id: 'partnershipDetails',
    stage: 'details',
    questionIds: ['partnershipType'],
    visibleWhen: entityIs('partnership'),
  },
  {
    id: 'sCorpDetails',
    stage: 'details',
    questionIds: ['sCorpEligibility'],
    visibleWhen: entityIs('s_corp'),
  },
];

const INTENT_PATTERNS = [
  {
    value: 'financing',
    re: /\b(raise|financing|fundrais|safe|convertible|seed round|series [a-d]|investor|venture|term sheet)\b/,
  },
  {
    value: 'formation',
    re: /\b(form|incorporat|set up (a|an)|register a company|start a company|new entity|llc|c-?corp)\b/,
  },
  {
    value: 'equity',
    re: /\b(cap table|option pool|issue shares|stock|equity grant|vesting|esop)\b/,
  },
  {
    value: 'governance',
    re: /\b(governance|board|bylaws|shareholder agreement|voting|committee)\b/,
  },
  {
    value: 'compliance',
    re: /\b(compliance|annual filing|registered agent|foreign qualif|minutes|good standing)\b/,
  },
];

const ENTITY_PATTERNS = [
  { value: 'c_corp', re: /\b(c-?corp|c corporation|delaware corp|inc\.?)\b/ },
  { value: 's_corp', re: /\b(s-?corp|s corporation|s election)\b/ },
  { value: 'llc', re: /\b(llc|limited liability)\b/ },
  {
    value: 'partnership',
    re: /\b(partnership|\blp\b|\bllp\b|general partner)\b/,
  },
  { value: 'nonprofit', re: /\b(nonprofit|non-profit|501c|charity)\b/ },
];

const NARRATIVE_KEY: Record<string, string> = {
  formation: 'formationPurpose',
  governance: 'governanceNotes',
  equity: 'capTableNotes',
  compliance: 'complianceNotes',
};

function parse(text: string): ParsedSituation {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const answers: IntakeAnswers = {};

  const intent = detectFirst(lower, INTENT_PATTERNS);
  if (intent) answers.intent = intent;

  const entityType = detectFirst(lower, ENTITY_PATTERNS);
  if (entityType) answers.entityType = entityType;

  const urgency = detectFirst(lower, URGENCY_PATTERNS);
  if (urgency) answers.urgency = urgency;

  if (intent && NARRATIVE_KEY[intent] && trimmed.length > 0) {
    answers[NARRATIVE_KEY[intent] as string] = trimmed.slice(0, NARRATIVE_CAP);
  }

  return { answers, keys: keysOf(answers) };
}

function buildTriageTransition(answers: IntakeAnswers): string {
  const intentMap: Record<string, string> = {
    formation: 'getting your entity set up',
    governance: 'sorting out your governance',
    financing: 'getting your round papered',
    equity: 'working on your cap table',
    compliance: 'handling your compliance',
  };
  const lead =
    typeof answers.intent === 'string'
      ? intentMap[answers.intent]
      : 'getting your matter set up';
  return `Got it — ${lead}${buildUrgencyRush(answers.urgency)}. Just a few details and we’ll be set.`;
}

function staticSummary(answers: IntakeAnswers): string {
  const intentText: Record<string, string> = {
    formation: 'wants to form an entity',
    governance: 'needs governance documents',
    financing: 'is raising financing',
    equity: 'has cap table / equity work',
    compliance: 'needs corporate compliance handled',
  };
  const action =
    typeof answers.intent === 'string'
      ? intentText[answers.intent]
      : 'has a new corporate matter';
  const entity = answers.entityType
    ? ENTITY_TYPE_OPTIONS.find((o) => o.value === answers.entityType)?.label
    : undefined;
  const entityText = entity ? ` (${entity})` : '';
  const documents = Array.isArray(answers.documents)
    ? answers.documents.length
    : 0;
  const docText =
    documents > 0
      ? ` ${documents} document${documents > 1 ? 's' : ''} attached.`
      : ' No documents attached.';
  return `Client ${action}${entityText}.${docText} Moritz will assign a corporate lawyer to take it from here.`;
}

export const corporateMatter: MatterIntakeDefinition = {
  id: 'corporate',
  label: 'Corporate',
  newMatterTitle: 'New corporate matter',
  buildHeaderTitle: (answers) => {
    const display = answers.entityType
      ? getAnswerDisplay(questions, 'entityType', answers)
      : null;
    return display ? `${display} matter` : 'New corporate matter';
  },
  triageKeys: ['intent', 'entityType', 'urgency'],
  questions,
  steps,
  introGreeting:
    "Hi — I'm Moritz. Tell me about your corporate matter in your own words and I'll skip any questions I can already answer. Or pick what you need below to get started.",
  buildTriageTransition,
  parse,
  openAiHints: {
    enumKeys: ['intent', 'entityType', 'urgency', 'roundType', 'raiseAmount'],
    freeTextKeys: [
      'jurisdiction',
      'formationPurpose',
      'governanceNotes',
      'capTableNotes',
      'complianceNotes',
      'leadInvestor',
    ],
  },
  staticSummary,
  getLawyerShortlist: (answers) =>
    shortlistBySpecialty(
      CORPORATE_ROSTER,
      typeof answers.intent === 'string' ? answers.intent : undefined,
    ),
};
