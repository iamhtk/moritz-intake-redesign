/**
 * Procurement matter definition: vendor selection, RFPs, purchases/POs,
 * renewals, and vendor disputes. Branches by intent and by spend category.
 */

import {
  Boxes,
  Building,
  Cpu,
  FileText,
  Gavel,
  Handshake,
  RefreshCw,
  ScrollText,
  ShoppingCart,
  Truck,
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
import {
  detectCounterparty,
  detectFirst,
  keysOf,
  NARRATIVE_CAP,
} from '../parse-situation';
import { COMMERCIAL_ROSTER, shortlistBySpecialty } from '../lawyer-mocks';
import {
  URGENCY_OPTIONS,
  URGENCY_PATTERNS,
  YES_NO_NOT_SURE,
  buildUrgencyRush,
} from './shared';

const INTENT_OPTIONS: readonly QuestionOption[] = [
  {
    value: 'new_vendor',
    label: 'Select a new vendor',
    description: 'Onboard a supplier and paper the agreement.',
    icon: Handshake,
  },
  {
    value: 'rfp',
    label: 'Run an RFP',
    description: 'Compare bids and run a structured selection.',
    icon: ScrollText,
  },
  {
    value: 'purchase',
    label: 'Purchase / PO',
    description: 'A specific buy you want papered correctly.',
    icon: ShoppingCart,
  },
  {
    value: 'renewal',
    label: 'Renew or amend',
    description: 'Renew, extend, or change an existing contract.',
    icon: RefreshCw,
  },
  {
    value: 'dispute',
    label: 'Vendor dispute',
    description: 'A supplier relationship has gone sideways.',
    icon: Gavel,
  },
];

const CATEGORY_OPTIONS: readonly QuestionOption[] = [
  { value: 'saas', label: 'Software / SaaS', icon: Cpu },
  { value: 'hardware', label: 'Hardware', icon: Boxes },
  { value: 'services', label: 'Professional services', icon: Handshake },
  { value: 'goods', label: 'Goods / supplies', icon: Truck },
  { value: 'facilities', label: 'Facilities', icon: Building },
];

const SPEND_OPTIONS: readonly QuestionOption[] = [
  { value: 'under_10k', label: 'Under $10k' },
  { value: '10k_50k', label: '$10k–$50k' },
  { value: '50k_250k', label: '$50k–$250k' },
  { value: 'over_250k', label: 'Over $250k' },
  { value: 'not_sure', label: 'Not sure' },
];

const TERM_OPTIONS: readonly QuestionOption[] = [
  { value: 'one_time', label: 'One-time' },
  { value: 'under_1y', label: 'Under 1 yr' },
  { value: '1_3y', label: '1–3 yrs' },
  { value: 'over_3y', label: '3+ yrs' },
  { value: 'not_sure', label: 'Not sure' },
];

const OUTCOME_OPTIONS: readonly QuestionOption[] = [
  { value: 'perform', label: 'Get them to deliver', icon: Handshake },
  { value: 'refund', label: 'Get money back', icon: Gavel },
  { value: 'exit', label: 'Exit the contract', icon: FileText },
  { value: 'advice', label: 'Just advice for now', icon: ScrollText },
];

function uploadHeader(answers: IntakeAnswers): string {
  switch (answers.intent) {
    case 'renewal':
      return 'Upload the current contract you want to renew or amend.';
    case 'dispute':
      return 'Upload the contract and anything relevant to the dispute.';
    case 'rfp':
      return 'Upload your requirements or any draft RFP.';
    default:
      return 'Got a proposal, quote, or draft agreement?';
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
  category: {
    id: 'category',
    ui: 'card-grid',
    columns: 3,
    header: 'What are you buying?',
    helper: "Pick the closest — we'll figure it out together.",
    reviewLabel: 'Category',
    options: CATEGORY_OPTIONS,
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
      answers.intent === 'renewal' || answers.intent === 'dispute',
    skipAllowed: true,
  },

  // Shared detail questions
  vendorName: {
    id: 'vendorName',
    ui: 'text',
    header: 'Who is the vendor?',
    reviewLabel: 'Vendor',
    placeholder: 'Company name',
  },
  spend: {
    id: 'spend',
    ui: 'chips',
    header: 'Roughly, how much spend is involved?',
    helper: 'Ballpark over the life of the contract is fine.',
    reviewLabel: 'Spend',
    options: SPEND_OPTIONS,
    skipAllowed: true,
  },
  term: {
    id: 'term',
    ui: 'chips',
    header: 'How long is the commitment?',
    reviewLabel: 'Term',
    options: TERM_OPTIONS,
  },
  dataSecurity: {
    id: 'dataSecurity',
    ui: 'chips',
    header: 'Will they handle personal or sensitive data?',
    helper: 'If so, we may need a DPA alongside the main agreement.',
    reviewLabel: 'Handles sensitive data',
    options: YES_NO_NOT_SURE,
  },

  // Branch A — rfp
  rfpScope: {
    id: 'rfpScope',
    ui: 'textarea',
    header: 'What are you trying to source?',
    helper: 'A short description of the requirement and must-haves.',
    reviewLabel: 'RFP scope',
    placeholder: 'What are you sourcing?',
  },
  rfpTimeline: {
    id: 'rfpTimeline',
    ui: 'text',
    header: 'Any target decision date?',
    reviewLabel: 'Decision target',
    placeholder: 'e.g. by end of Q3',
    skipAllowed: true,
  },

  // Branch A — purchase
  purchaseItems: {
    id: 'purchaseItems',
    ui: 'textarea',
    header: 'What are you buying, exactly?',
    reviewLabel: 'Purchase items',
    placeholder: 'Describe the goods or services.',
  },

  // Branch A — renewal
  renewalChanges: {
    id: 'renewalChanges',
    ui: 'textarea',
    header: 'What do you want to change at renewal?',
    helper: 'Price, scope, term, terms you want improved.',
    reviewLabel: 'Renewal changes',
    placeholder: 'What should change?',
    skipAllowed: true,
  },

  // Branch A — dispute
  disputeWhatHappened: {
    id: 'disputeWhatHappened',
    ui: 'textarea',
    header: "Tell us what's going on.",
    helper: 'What was promised, what happened, and any dates.',
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
    header: 'Has anyone sent formal notices yet?',
    reviewLabel: 'Formal notices',
    options: YES_NO_NOT_SURE,
  },

  // Branch B — category specific
  saasSla: {
    id: 'saasSla',
    ui: 'chips',
    header: 'Do you need an SLA / uptime commitment?',
    reviewLabel: 'SLA needed',
    options: YES_NO_NOT_SURE,
  },
  servicesDeliverables: {
    id: 'servicesDeliverables',
    ui: 'textarea',
    header: 'What are the deliverables and acceptance criteria?',
    reviewLabel: 'Deliverables',
    placeholder: 'e.g. milestone-based delivery, sign-off on each',
    skipAllowed: true,
  },
  goodsDelivery: {
    id: 'goodsDelivery',
    ui: 'chips',
    header: 'One-time delivery or recurring supply?',
    reviewLabel: 'Delivery cadence',
    options: [
      { value: 'one_time', label: 'One-time' },
      { value: 'recurring', label: 'Recurring' },
    ],
  },
  goodsWarranty: {
    id: 'goodsWarranty',
    ui: 'chips',
    header: 'Need warranties or return rights?',
    reviewLabel: 'Warranties',
    options: YES_NO_NOT_SURE,
  },
  facilitiesNotes: {
    id: 'facilitiesNotes',
    ui: 'textarea',
    header: 'Anything specific about the facilities arrangement?',
    reviewLabel: 'Facilities notes',
    placeholder: 'Optional details.',
    skipAllowed: true,
  },
};

const intentIs = (value: string) => (a: IntakeAnswers) => a.intent === value;
const categoryIs = (value: string) => (a: IntakeAnswers) =>
  a.category === value;

const steps: readonly IntakeStep[] = [
  { id: 'intent', stage: 'triage', questionIds: ['intent'] },
  { id: 'category', stage: 'triage', questionIds: ['category'] },
  { id: 'urgency', stage: 'triage', questionIds: ['urgency'] },
  { id: 'documents', stage: 'triage', questionIds: ['documents'] },

  // Branch A — new vendor
  {
    id: 'newVendor',
    stage: 'details',
    questionIds: ['vendorName', 'spend'],
    visibleWhen: intentIs('new_vendor'),
  },
  {
    id: 'newVendorTerms',
    stage: 'details',
    questionIds: ['term', 'dataSecurity'],
    visibleWhen: intentIs('new_vendor'),
  },

  // Branch A — rfp
  {
    id: 'rfp',
    stage: 'details',
    questionIds: ['rfpScope', 'rfpTimeline'],
    visibleWhen: intentIs('rfp'),
  },

  // Branch A — purchase
  {
    id: 'purchase',
    stage: 'details',
    questionIds: ['vendorName', 'purchaseItems'],
    visibleWhen: intentIs('purchase'),
  },
  {
    id: 'purchaseSpend',
    stage: 'details',
    questionIds: ['spend'],
    visibleWhen: intentIs('purchase'),
  },

  // Branch A — renewal
  {
    id: 'renewal',
    stage: 'details',
    questionIds: ['vendorName', 'renewalChanges'],
    visibleWhen: intentIs('renewal'),
  },
  {
    id: 'renewalSpend',
    stage: 'details',
    questionIds: ['spend'],
    visibleWhen: intentIs('renewal'),
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

  // Branch B — category specific
  {
    id: 'saasDetails',
    stage: 'details',
    questionIds: ['saasSla', 'dataSecurity'],
    visibleWhen: categoryIs('saas'),
  },
  {
    id: 'servicesDetails',
    stage: 'details',
    questionIds: ['servicesDeliverables'],
    visibleWhen: categoryIs('services'),
  },
  {
    id: 'goodsDetails',
    stage: 'details',
    questionIds: ['goodsDelivery', 'goodsWarranty'],
    visibleWhen: categoryIs('goods'),
  },
  {
    id: 'facilitiesDetails',
    stage: 'details',
    questionIds: ['facilitiesNotes'],
    visibleWhen: categoryIs('facilities'),
  },
];

const INTENT_PATTERNS = [
  {
    value: 'dispute',
    re: /\b(dispute|breach|didn'?t deliver|late delivery|defect|refund|broke the|chargeback|went wrong)\b/,
  },
  {
    value: 'renewal',
    re: /\b(renew|renewal|extend|amend|amendment|true.?up|re-?up)\b/,
  },
  {
    value: 'rfp',
    re: /\b(rfp|rfq|tender|bid|request for proposal|compare vendors)\b/,
  },
  {
    value: 'purchase',
    re: /\b(purchase|\bpo\b|buy|order|procure|acquire equipment)\b/,
  },
  {
    value: 'new_vendor',
    re: /\b(new vendor|onboard|supplier|sign up|new supplier|engage a)\b/,
  },
];

const CATEGORY_PATTERNS = [
  {
    value: 'saas',
    re: /\b(saas|software|subscription|platform|app|cloud|license)\b/,
  },
  {
    value: 'hardware',
    re: /\b(hardware|laptops?|servers?|equipment|devices?|machinery)\b/,
  },
  {
    value: 'services',
    re: /\b(services|consult|agency|contractor|professional)\b/,
  },
  { value: 'goods', re: /\b(goods|supplies|materials|inventory|products?)\b/ },
  {
    value: 'facilities',
    re: /\b(facilities|office space|cleaning|catering|maintenance|utilities)\b/,
  },
];

const NARRATIVE_KEY: Record<string, string> = {
  rfp: 'rfpScope',
  purchase: 'purchaseItems',
  renewal: 'renewalChanges',
  dispute: 'disputeWhatHappened',
};

function parse(text: string): ParsedSituation {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const answers: IntakeAnswers = {};

  const intent = detectFirst(lower, INTENT_PATTERNS);
  if (intent) answers.intent = intent;

  const category = detectFirst(lower, CATEGORY_PATTERNS);
  if (category) answers.category = category;

  const urgency = detectFirst(lower, URGENCY_PATTERNS);
  if (urgency) answers.urgency = urgency;

  const vendor = detectCounterparty(trimmed);
  if (vendor) answers.vendorName = vendor;

  if (intent && NARRATIVE_KEY[intent] && trimmed.length > 0) {
    answers[NARRATIVE_KEY[intent] as string] = trimmed.slice(0, NARRATIVE_CAP);
  }

  return { answers, keys: keysOf(answers) };
}

function buildTriageTransition(answers: IntakeAnswers): string {
  const intentMap: Record<string, string> = {
    new_vendor: 'papering your new vendor',
    rfp: 'getting your RFP set up',
    purchase: 'papering your purchase',
    renewal: 'handling your renewal',
    dispute: 'working through the vendor dispute',
  };
  const lead =
    typeof answers.intent === 'string'
      ? intentMap[answers.intent]
      : 'getting your matter set up';
  return `Got it — ${lead}${buildUrgencyRush(answers.urgency)}. Just a few details and we’ll be set.`;
}

function staticSummary(answers: IntakeAnswers): string {
  const intentText: Record<string, string> = {
    new_vendor: 'wants to onboard a new vendor',
    rfp: 'is running an RFP',
    purchase: 'wants a purchase papered',
    renewal: 'is renewing or amending a vendor contract',
    dispute: 'has a vendor dispute',
  };
  const action =
    typeof answers.intent === 'string'
      ? intentText[answers.intent]
      : 'has a new procurement matter';
  const category = answers.category
    ? CATEGORY_OPTIONS.find((o) => o.value === answers.category)?.label
    : undefined;
  const categoryText = category ? ` (${category.toLowerCase()})` : '';
  const documents = Array.isArray(answers.documents)
    ? answers.documents.length
    : 0;
  const docText =
    documents > 0
      ? ` ${documents} document${documents > 1 ? 's' : ''} attached.`
      : ' No documents attached.';
  return `Client ${action}${categoryText}.${docText} Moritz will assign a commercial lawyer to take it from here.`;
}

function applyExtraction(
  answers: IntakeAnswers,
  fields: { counterparty?: string },
): IntakeAnswers | null {
  if (fields.counterparty && !answers.vendorName) {
    return { ...answers, vendorName: fields.counterparty };
  }
  return null;
}

export const procurementMatter: MatterIntakeDefinition = {
  id: 'procurement',
  label: 'Procurement',
  newMatterTitle: 'New procurement matter',
  buildHeaderTitle: (answers) => {
    const display = answers.category
      ? getAnswerDisplay(questions, 'category', answers)
      : null;
    return display ? `${display} matter` : 'New procurement matter';
  },
  triageKeys: ['intent', 'category', 'urgency'],
  questions,
  steps,
  introGreeting:
    "Hi — I'm Moritz. Tell me about your procurement need in your own words and I'll skip any questions I can already answer. Or pick what you need below to get started.",
  buildTriageTransition,
  parse,
  openAiHints: {
    enumKeys: ['intent', 'category', 'urgency', 'spend'],
    freeTextKeys: [
      'vendorName',
      'rfpScope',
      'purchaseItems',
      'renewalChanges',
      'disputeWhatHappened',
    ],
  },
  applyExtraction,
  staticSummary,
  getLawyerShortlist: (answers) =>
    shortlistBySpecialty(
      COMMERCIAL_ROSTER,
      typeof answers.category === 'string' ? answers.category : undefined,
    ),
};
