/**
 * Employment matter definition: hiring/offers, terminations/exits, equity
 * grants, policies/handbooks, and disputes/claims. Branches by intent and by
 * worker type.
 */

import {
  AlertTriangle,
  Briefcase,
  Coins,
  FileText,
  Gavel,
  Handshake,
  ScrollText,
  UserMinus,
  UserPlus,
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
import { EMPLOYMENT_ROSTER, shortlistBySpecialty } from '../lawyer-mocks';
import {
  URGENCY_OPTIONS,
  URGENCY_PATTERNS,
  YES_NO_NOT_SURE,
  buildUrgencyRush,
} from './shared';

const INTENT_OPTIONS: readonly QuestionOption[] = [
  {
    value: 'offer',
    label: 'Make an offer / hire',
    description: 'Offer letters and employment agreements for a new hire.',
    icon: UserPlus,
  },
  {
    value: 'termination',
    label: 'Termination or exit',
    description: 'Let someone go, agree a separation, or handle a resignation.',
    icon: UserMinus,
  },
  {
    value: 'equity',
    label: 'Equity grant',
    description: 'Options or RSUs for an employee, advisor, or contractor.',
    icon: Coins,
  },
  {
    value: 'policy',
    label: 'Policy or handbook',
    description: 'Workplace policies, handbooks, or IP assignment.',
    icon: ScrollText,
  },
  {
    value: 'dispute',
    label: 'Dispute or claim',
    description: 'A grievance, claim, or investigation has come up.',
    icon: Gavel,
  },
];

const WORKER_TYPE_OPTIONS: readonly QuestionOption[] = [
  { value: 'employee', label: 'Employee', icon: Briefcase },
  { value: 'contractor', label: 'Contractor', icon: Handshake },
  { value: 'executive', label: 'Executive', icon: UserPlus },
  { value: 'intern', label: 'Intern', icon: UserPlus },
];

const COMP_OPTIONS: readonly QuestionOption[] = [
  { value: 'under_50k', label: 'Under $50k' },
  { value: '50k_100k', label: '$50k–$100k' },
  { value: '100k_200k', label: '$100k–$200k' },
  { value: 'over_200k', label: 'Over $200k' },
  { value: 'not_sure', label: 'Not sure yet' },
];

const GRANT_TYPE_OPTIONS: readonly QuestionOption[] = [
  { value: 'iso', label: 'ISOs' },
  { value: 'nso', label: 'NSOs' },
  { value: 'rsu', label: 'RSUs' },
  { value: 'options_other', label: 'Other options' },
  { value: 'not_sure', label: 'Not sure' },
];

const VESTING_OPTIONS: readonly QuestionOption[] = [
  { value: 'standard', label: '4-year, 1-year cliff' },
  { value: 'no_cliff', label: 'No cliff' },
  { value: 'custom', label: 'Custom' },
  { value: 'not_sure', label: 'Not sure' },
];

const OUTCOME_OPTIONS: readonly QuestionOption[] = [
  { value: 'resolve', label: 'Resolve it quietly', icon: Handshake },
  { value: 'defend', label: 'Defend a claim', icon: AlertTriangle },
  { value: 'exit', label: 'Agree a clean exit', icon: UserMinus },
  { value: 'advice', label: 'Just advice for now', icon: FileText },
];

function uploadHeader(answers: IntakeAnswers): string {
  switch (answers.intent) {
    case 'termination':
      return 'Upload the current employment agreement (and any policies).';
    case 'dispute':
      return 'Upload anything relevant — the contract, emails, or notices.';
    case 'equity':
      return 'Upload the current plan documents, if you have them.';
    default:
      return 'Got any related documents?';
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
  workerType: {
    id: 'workerType',
    ui: 'card-grid',
    columns: 4,
    header: 'Who does this involve?',
    helper: "Pick the closest — we'll refine it together.",
    reviewLabel: 'Worker type',
    options: WORKER_TYPE_OPTIONS,
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
    header: uploadHeader,
    helper: "We'll pull out the key terms automatically where we can.",
    reviewLabel: 'Documents',
    required: (answers) =>
      answers.intent === 'termination' || answers.intent === 'dispute',
    skipAllowed: true,
  },

  // Branch A — offer / hire
  offerRole: {
    id: 'offerRole',
    ui: 'text',
    header: 'What role are you hiring for?',
    reviewLabel: 'Role',
    placeholder: 'e.g. Senior Backend Engineer',
  },
  offerComp: {
    id: 'offerComp',
    ui: 'chips',
    header: 'Roughly, what does the cash comp look like?',
    helper: 'Ballpark base salary is fine.',
    reviewLabel: 'Cash compensation',
    options: COMP_OPTIONS,
    skipAllowed: true,
  },
  offerEquity: {
    id: 'offerEquity',
    ui: 'chips',
    header: 'Does the offer include equity?',
    reviewLabel: 'Includes equity',
    options: YES_NO_NOT_SURE,
  },
  offerStartDate: {
    id: 'offerStartDate',
    ui: 'date',
    header: 'When would they start?',
    reviewLabel: 'Start date',
    skipAllowed: true,
    skipKey: 'offerNoStartDate',
    displayValue: (answers) => {
      if (answers.offerNoStartDate) return 'Not set yet';
      const raw = answers.offerStartDate;
      return typeof raw === 'string' && raw.length > 0 ? raw : null;
    },
  },
  offerAtWill: {
    id: 'offerAtWill',
    ui: 'chips',
    header: 'At-will or fixed-term?',
    reviewLabel: 'Engagement basis',
    options: [
      { value: 'at_will', label: 'At-will' },
      { value: 'fixed_term', label: 'Fixed-term' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },

  // Branch A — termination / exit
  terminationReason: {
    id: 'terminationReason',
    ui: 'textarea',
    header: "What's prompting the exit?",
    helper: 'Walk us through it — performance, restructuring, a resignation.',
    reviewLabel: 'Reason',
    placeholder: 'Tell us what happened.',
  },
  terminationSeverance: {
    id: 'terminationSeverance',
    ui: 'chips',
    header: 'Is severance on the table?',
    reviewLabel: 'Severance',
    options: YES_NO_NOT_SURE,
  },
  terminationNotice: {
    id: 'terminationNotice',
    ui: 'chips',
    header: 'Any notice period to honour?',
    reviewLabel: 'Notice period',
    options: [
      { value: 'none', label: 'None' },
      { value: 'two_weeks', label: '2 weeks' },
      { value: 'one_month', label: '1 month' },
      { value: 'longer', label: 'Longer' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },

  // Branch A — equity
  equityGrantType: {
    id: 'equityGrantType',
    ui: 'chips',
    header: 'What kind of grant?',
    reviewLabel: 'Grant type',
    options: GRANT_TYPE_OPTIONS,
  },
  equityVesting: {
    id: 'equityVesting',
    ui: 'chips',
    header: 'What vesting schedule?',
    reviewLabel: 'Vesting',
    options: VESTING_OPTIONS,
  },
  equityAmount: {
    id: 'equityAmount',
    ui: 'text',
    header: 'How much are you granting?',
    helper: 'A share count or a percentage — whatever you have.',
    reviewLabel: 'Grant size',
    placeholder: 'e.g. 10,000 options or 0.25%',
    skipAllowed: true,
  },

  // Branch A — policy / handbook
  policyTypes: {
    id: 'policyTypes',
    ui: 'multi-select',
    header: 'Which policies do you need?',
    helper: 'Pick all that apply.',
    reviewLabel: 'Policies',
    options: [
      { value: 'handbook', label: 'Employee handbook' },
      { value: 'pto', label: 'PTO / leave' },
      { value: 'remote', label: 'Remote work' },
      { value: 'conduct', label: 'Code of conduct' },
      { value: 'ip', label: 'IP assignment' },
      { value: 'other', label: 'Other' },
    ],
  },
  policyNotes: {
    id: 'policyNotes',
    ui: 'textarea',
    header: 'Anything specific you want covered?',
    reviewLabel: 'Policy notes',
    placeholder: 'Optional details.',
    skipAllowed: true,
  },

  // Branch A — dispute / claim
  disputeWhatHappened: {
    id: 'disputeWhatHappened',
    ui: 'textarea',
    header: "Tell us what's going on.",
    helper: "Dates, who's involved, and what was said or done.",
    reviewLabel: 'What happened',
    placeholder: 'What happened?',
  },
  disputeOutcome: {
    id: 'disputeOutcome',
    ui: 'card-grid',
    columns: 2,
    header: 'What does a good resolution look like?',
    reviewLabel: 'Desired outcome',
    options: OUTCOME_OPTIONS,
  },
  disputeFormalNotices: {
    id: 'disputeFormalNotices',
    ui: 'chips',
    header: 'Have any formal notices or claims been filed?',
    reviewLabel: 'Formal notices',
    options: YES_NO_NOT_SURE,
  },

  // Branch B — worker-type specific
  executiveTerms: {
    id: 'executiveTerms',
    ui: 'textarea',
    header: 'Any executive-specific terms in play?',
    helper: 'e.g. change-of-control, enhanced severance, board seat.',
    reviewLabel: 'Executive terms',
    placeholder: 'Optional details.',
    skipAllowed: true,
  },
  contractorIp: {
    id: 'contractorIp',
    ui: 'chips',
    header: 'Who owns the work product?',
    reviewLabel: 'Work product owner',
    options: [
      { value: 'you', label: 'You' },
      { value: 'them', label: 'Them' },
      { value: 'shared', label: 'Shared' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  contractorClassification: {
    id: 'contractorClassification',
    ui: 'chips',
    header: 'Comfortable they qualify as a contractor?',
    helper: 'Misclassification is the most common contractor risk.',
    reviewLabel: 'Classification confidence',
    options: YES_NO_NOT_SURE,
  },
  internPaid: {
    id: 'internPaid',
    ui: 'chips',
    header: 'Paid or unpaid?',
    reviewLabel: 'Intern pay',
    options: [
      { value: 'paid', label: 'Paid' },
      { value: 'unpaid', label: 'Unpaid' },
      { value: 'stipend', label: 'Stipend' },
    ],
  },
  employeeLocation: {
    id: 'employeeLocation',
    ui: 'text',
    header: 'Where are they based?',
    helper: 'State or country — it drives which rules apply.',
    reviewLabel: 'Location',
    placeholder: 'e.g. California, or Germany',
    skipAllowed: true,
  },

  // Internal-only key (paired with the start-date question)
  offerNoStartDate: {
    id: 'offerNoStartDate',
    ui: 'chips',
    header: '',
    reviewLabel: 'No start date',
  },
};

const intentIs = (value: string) => (a: IntakeAnswers) => a.intent === value;
const workerIs = (value: string) => (a: IntakeAnswers) =>
  a.workerType === value;

const steps: readonly IntakeStep[] = [
  { id: 'intent', stage: 'triage', questionIds: ['intent'] },
  { id: 'workerType', stage: 'triage', questionIds: ['workerType'] },
  { id: 'urgency', stage: 'triage', questionIds: ['urgency'] },
  { id: 'documents', stage: 'triage', questionIds: ['documents'] },

  // Branch A — offer
  {
    id: 'offerRole',
    stage: 'details',
    questionIds: ['offerRole', 'offerComp'],
    visibleWhen: intentIs('offer'),
  },
  {
    id: 'offerTerms',
    stage: 'details',
    questionIds: ['offerEquity', 'offerAtWill'],
    visibleWhen: intentIs('offer'),
  },
  {
    id: 'offerStart',
    stage: 'details',
    questionIds: ['offerStartDate'],
    visibleWhen: intentIs('offer'),
  },

  // Branch A — termination
  {
    id: 'terminationReason',
    stage: 'details',
    questionIds: ['terminationReason'],
    visibleWhen: intentIs('termination'),
  },
  {
    id: 'terminationTerms',
    stage: 'details',
    questionIds: ['terminationSeverance', 'terminationNotice'],
    visibleWhen: intentIs('termination'),
  },

  // Branch A — equity
  {
    id: 'equityGrant',
    stage: 'details',
    questionIds: ['equityGrantType', 'equityVesting'],
    visibleWhen: intentIs('equity'),
  },
  {
    id: 'equityAmount',
    stage: 'details',
    questionIds: ['equityAmount'],
    visibleWhen: intentIs('equity'),
  },

  // Branch A — policy
  {
    id: 'policy',
    stage: 'details',
    questionIds: ['policyTypes', 'policyNotes'],
    visibleWhen: intentIs('policy'),
  },

  // Branch A — dispute
  {
    id: 'disputeWhat',
    stage: 'details',
    questionIds: ['disputeWhatHappened'],
    visibleWhen: intentIs('dispute'),
  },
  {
    id: 'disputeTerms',
    stage: 'details',
    questionIds: ['disputeOutcome', 'disputeFormalNotices'],
    visibleWhen: intentIs('dispute'),
  },

  // Branch B — worker-type specific
  {
    id: 'executiveDetails',
    stage: 'details',
    questionIds: ['executiveTerms'],
    visibleWhen: workerIs('executive'),
  },
  {
    id: 'contractorDetails',
    stage: 'details',
    questionIds: ['contractorIp', 'contractorClassification'],
    visibleWhen: workerIs('contractor'),
  },
  {
    id: 'internDetails',
    stage: 'details',
    questionIds: ['internPaid'],
    visibleWhen: workerIs('intern'),
  },
  {
    id: 'employeeDetails',
    stage: 'details',
    questionIds: ['employeeLocation'],
    visibleWhen: workerIs('employee'),
  },
];

const INTENT_PATTERNS = [
  {
    value: 'termination',
    re: /\b(terminat|fire|firing|let (them|him|her) go|lay ?off|layoff|sever|resign|exit|dismiss)\b/,
  },
  {
    value: 'equity',
    re: /\b(equity|option|options|rsu|iso|nso|stock grant|vesting|cap table grant)\b/,
  },
  {
    value: 'policy',
    re: /\b(policy|policies|handbook|pto|leave policy|code of conduct|remote work|ip assignment)\b/,
  },
  {
    value: 'dispute',
    re: /\b(claim|grievance|dispute|harass|discriminat|investigat|complaint|wrongful)\b/,
  },
  {
    value: 'offer',
    re: /\b(hir(e|ing)|offer|onboard|new employee|job offer|bring on|recruit)\b/,
  },
];

const WORKER_PATTERNS = [
  {
    value: 'contractor',
    re: /\b(contractor|freelanc|consultant|1099|independent)\b/,
  },
  {
    value: 'executive',
    re: /\b(executive|c-?level|ceo|cfo|cto|coo|vp|founder)\b/,
  },
  { value: 'intern', re: /\b(intern|internship|trainee|apprentice)\b/ },
  { value: 'employee', re: /\b(employee|staff|full.?time|part.?time|hire)\b/ },
];

const NARRATIVE_KEY: Record<string, string> = {
  termination: 'terminationReason',
  dispute: 'disputeWhatHappened',
  policy: 'policyNotes',
};

function parse(text: string): ParsedSituation {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const answers: IntakeAnswers = {};

  const intent = detectFirst(lower, INTENT_PATTERNS);
  if (intent) answers.intent = intent;

  const workerType = detectFirst(lower, WORKER_PATTERNS);
  if (workerType) answers.workerType = workerType;

  const urgency = detectFirst(lower, URGENCY_PATTERNS);
  if (urgency) answers.urgency = urgency;

  if (intent && NARRATIVE_KEY[intent] && trimmed.length > 0) {
    answers[NARRATIVE_KEY[intent] as string] = trimmed.slice(0, NARRATIVE_CAP);
  }

  return { answers, keys: keysOf(answers) };
}

function buildTriageTransition(answers: IntakeAnswers): string {
  const intentMap: Record<string, string> = {
    offer: 'putting an offer together',
    termination: 'handling the exit',
    equity: 'setting up the equity grant',
    policy: 'getting your policies sorted',
    dispute: 'working through the dispute',
  };
  const lead =
    typeof answers.intent === 'string'
      ? intentMap[answers.intent]
      : 'getting your matter set up';
  return `Got it — ${lead}${buildUrgencyRush(answers.urgency)}. Just a few details and we’ll be set.`;
}

function staticSummary(answers: IntakeAnswers): string {
  const intentText: Record<string, string> = {
    offer: 'wants to make an offer / hire',
    termination: 'is handling a termination or exit',
    equity: 'wants to grant equity',
    policy: 'needs employment policies prepared',
    dispute: 'has an employment dispute or claim',
  };
  const action =
    typeof answers.intent === 'string'
      ? intentText[answers.intent]
      : 'has a new employment matter';
  const worker = answers.workerType
    ? WORKER_TYPE_OPTIONS.find((o) => o.value === answers.workerType)?.label
    : undefined;
  const workerText = worker ? ` (${worker.toLowerCase()})` : '';
  const documents = Array.isArray(answers.documents)
    ? answers.documents.length
    : 0;
  const docText =
    documents > 0
      ? ` ${documents} document${documents > 1 ? 's' : ''} attached.`
      : ' No documents attached.';
  return `Client ${action}${workerText}.${docText} Moritz will assign an employment lawyer to take it from here.`;
}

export const employmentMatter: MatterIntakeDefinition = {
  id: 'employment',
  label: 'Employment',
  newMatterTitle: 'New employment matter',
  buildHeaderTitle: (answers) => {
    const display = answers.workerType
      ? getAnswerDisplay(questions, 'workerType', answers)
      : null;
    return display ? `${display} matter` : 'New employment matter';
  },
  triageKeys: ['intent', 'workerType', 'urgency'],
  questions,
  steps,
  introGreeting:
    "Hi — I'm Moritz. Tell me about your employment matter in your own words and I'll skip any questions I can already answer. Or pick what you need below to get started.",
  buildTriageTransition,
  parse,
  openAiHints: {
    enumKeys: ['intent', 'workerType', 'urgency', 'offerComp'],
    freeTextKeys: [
      'offerRole',
      'terminationReason',
      'disputeWhatHappened',
      'policyNotes',
      'equityAmount',
    ],
  },
  staticSummary,
  getLawyerShortlist: (answers) =>
    shortlistBySpecialty(
      EMPLOYMENT_ROSTER,
      typeof answers.intent === 'string' ? answers.intent : undefined,
    ),
};
