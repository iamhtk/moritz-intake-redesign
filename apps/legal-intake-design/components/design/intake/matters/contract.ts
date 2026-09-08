/**
 * Contract matter definition.
 *
 * The declarative question map + ordered step list translated from the intake
 * spec, plus the contract-specific parsing, copy, document-extraction mapping,
 * and lawyer shortlist. The generic framework (`intake-flow`, dock, review,
 * save/resume) consumes everything through `MatterIntakeDefinition`.
 */

import {
  Building2,
  FileSignature,
  FileText,
  Gavel,
  Handshake,
  Home,
  KeyRound,
  PencilLine,
  ShieldQuestion,
  ShoppingCart,
  Truck,
} from '@repo/ui/icons';
import { getAnswerDisplay } from '../intake-config';
import type {
  ExtractedFields,
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
  detectValueBand,
  keysOf,
  NARRATIVE_CAP,
} from '../parse-situation';
import { COMMERCIAL_ROSTER, shortlistBySpecialty } from '../lawyer-mocks';

const INTENT_OPTIONS: readonly QuestionOption[] = [
  {
    value: 'draft',
    label: 'Draft a new contract',
    description:
      "Start from scratch — we'll match you with a lawyer to write it.",
    icon: PencilLine,
  },
  {
    value: 'review',
    label: 'Review one I received',
    description:
      "Someone sent you a contract — a lawyer will tell you what's in it.",
    icon: FileText,
  },
  {
    value: 'negotiate',
    label: 'Negotiate redlines',
    description:
      "You're in back-and-forth on a draft — a lawyer will mark it up.",
    icon: Handshake,
  },
  {
    value: 'dispute',
    label: 'Enforce or dispute an existing one',
    description:
      "Something's gone wrong with a contract that's already signed.",
    icon: Gavel,
  },
];

const CONTRACT_TYPE_OPTIONS: readonly QuestionOption[] = [
  { value: 'nda', label: 'NDA', icon: ShieldQuestion },
  { value: 'services', label: 'Services / MSA', icon: Handshake },
  { value: 'vendor', label: 'Vendor', icon: Truck },
  { value: 'licensing', label: 'Licensing / IP', icon: KeyRound },
  { value: 'sales', label: 'Sales', icon: ShoppingCart },
  { value: 'lease', label: 'Lease', icon: Home },
  { value: 'partnership', label: 'Partnership / JV', icon: Building2 },
  { value: 'other', label: 'Other', icon: FileSignature },
];

const URGENCY_OPTIONS: readonly QuestionOption[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
  { value: 'exploring', label: 'Just exploring' },
];

const RELATIONSHIP_SUGGESTIONS = [
  'Vendor',
  'Client',
  'Employer',
  'Landlord',
  'Investor',
  'Other',
] as const;

const OTHER_SIDE_TYPE_OPTIONS: readonly QuestionOption[] = [
  { value: 'individual', label: 'Individual' },
  { value: 'llc', label: 'LLC' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'foreign', label: 'Foreign entity' },
  { value: 'not_sure', label: 'Not sure' },
];

const VALUE_OPTIONS: readonly QuestionOption[] = [
  { value: 'under_10k', label: 'Under $10k' },
  { value: '10k_100k', label: '$10k–$100k' },
  { value: '100k_1m', label: '$100k–$1M' },
  { value: 'over_1m', label: 'Over $1M' },
  { value: 'not_sure', label: 'Not sure / not applicable' },
];

const MUST_HAVE_OPTIONS: readonly QuestionOption[] = [
  { value: 'payment_terms', label: 'Payment terms' },
  { value: 'ip_ownership', label: 'IP ownership' },
  { value: 'exclusivity', label: 'Exclusivity' },
  { value: 'termination', label: 'Termination rights' },
  { value: 'non_compete', label: 'Non-compete' },
  { value: 'liability_cap', label: 'Liability cap' },
  { value: 'confidentiality', label: 'Confidentiality' },
  { value: 'other', label: 'Other' },
];

const DISPUTE_OUTCOME_OPTIONS: readonly QuestionOption[] = [
  {
    value: 'perform',
    label: 'Get them to do what they promised',
    icon: Handshake,
  },
  { value: 'damages', label: 'Get money back / damages', icon: Gavel },
  { value: 'end', label: 'End the contract', icon: FileText },
  { value: 'advice', label: 'Just advice for now', icon: ShieldQuestion },
];

const YES_NO_NOT_SURE: readonly QuestionOption[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_sure', label: 'Not sure' },
];

function uploadHeader(answers: IntakeAnswers): string {
  switch (answers.intent) {
    case 'review':
      return "Upload the contract you'd like us to review.";
    case 'negotiate':
      return 'Upload the current draft (and any markup from the other side).';
    case 'dispute':
      return 'Upload the signed contract.';
    default:
      return 'Got any related documents?';
  }
}

function uploadHelper(answers: IntakeAnswers): string {
  if (answers.intent === 'draft') {
    return 'A term sheet, RFP, prior version, or email thread all help — but skip if you don\u2019t.';
  }
  return "We'll pull out the key terms automatically so you don't have to retype them.";
}

const questions: Record<string, QuestionDef> = {
  intent: {
    id: 'intent',
    ui: 'card-grid',
    columns: 2,
    header: 'What can we help you with today?',
    reviewLabel: 'What you need',
    options: INTENT_OPTIONS,
    required: true,
  },
  contractType: {
    id: 'contractType',
    ui: 'card-grid',
    columns: 4,
    header: 'What kind of contract is it?',
    helper: "Not sure? Pick the closest — we'll figure it out together.",
    reviewLabel: 'Contract type',
    options: CONTRACT_TYPE_OPTIONS,
    required: true,
  },
  urgency: {
    id: 'urgency',
    ui: 'chips',
    header: 'How soon do you need it?',
    helper: 'This helps us route urgent matters to the right lawyer faster.',
    reviewLabel: 'Timeline',
    options: URGENCY_OPTIONS,
    required: true,
  },
  documents: {
    id: 'documents',
    ui: 'upload',
    header: uploadHeader,
    helper: uploadHelper,
    reviewLabel: 'Documents',
    required: (answers) => answers.intent !== 'draft',
    skipAllowed: true,
  },

  // Branch A — review
  reviewSenderName: {
    id: 'reviewSenderName',
    ui: 'text',
    header: 'Who sent you this?',
    helper: "A name or a company — whatever you've got.",
    reviewLabel: 'Sent by',
    placeholder: 'Name or company',
  },
  reviewRelationship: {
    id: 'reviewRelationship',
    ui: 'text',
    header: "What's your relationship?",
    reviewLabel: 'Relationship',
    placeholder: 'e.g. Vendor, Client, Landlord',
    suggestions: RELATIONSHIP_SUGGESTIONS,
  },
  reviewDeadline: {
    id: 'reviewDeadline',
    ui: 'date',
    header: 'Any deadline to respond?',
    reviewLabel: 'Respond by',
    skipAllowed: true,
    skipKey: 'reviewNoDeadline',
    displayValue: (answers) => {
      if (answers.reviewNoDeadline) return 'No specific deadline';
      const raw = answers.reviewDeadline;
      return typeof raw === 'string' && raw.length > 0 ? raw : null;
    },
  },
  reviewConcerns: {
    id: 'reviewConcerns',
    ui: 'textarea',
    header: "What's giving you pause?",
    helper:
      "Anything — a specific clause, a gut feeling, or just 'I want to make sure I'm not missing something.'",
    reviewLabel: 'Concerns',
    placeholder: 'Tell us what made you want a lawyer to look.',
    skipAllowed: true,
  },

  // Branch A — draft
  draftDealSummary: {
    id: 'draftDealSummary',
    ui: 'text',
    header: "What's the deal, in plain English?",
    helper: "e.g. 'I'm hiring a designer to redo my website for a flat fee.'",
    reviewLabel: 'The deal',
    placeholder: 'In one sentence, what are you trying to accomplish?',
    maxLength: 280,
    guidedDeal: true,
  },
  draftOtherSideName: {
    id: 'draftOtherSideName',
    ui: 'text',
    header: 'Who are you doing this with?',
    reviewLabel: 'Other side',
    placeholder: 'Name of the other side',
  },
  draftOtherSideType: {
    id: 'draftOtherSideType',
    ui: 'chips',
    header: 'What kind of entity are they?',
    reviewLabel: 'Other side type',
    options: OTHER_SIDE_TYPE_OPTIONS,
  },
  draftValue: {
    id: 'draftValue',
    ui: 'chips',
    header: 'Roughly, how much money is involved?',
    helper: 'Ballpark is fine. This helps us calibrate how careful to be.',
    reviewLabel: 'Approximate value',
    options: VALUE_OPTIONS,
    skipAllowed: true,
  },
  draftMustHaves: {
    id: 'draftMustHaves',
    ui: 'multi-select',
    header: 'Anything that absolutely has to be in this contract?',
    helper:
      "Pick anything you've already agreed on, or anything you're worried about. Skip if nothing comes to mind.",
    reviewLabel: 'Must-haves',
    options: MUST_HAVE_OPTIONS,
    skipAllowed: true,
  },

  // Branch A — negotiate
  negotiateStickingPoint: {
    id: 'negotiateStickingPoint',
    ui: 'textarea',
    header: "Where's it stuck?",
    helper:
      "What's the other side pushing for that you're not comfortable with — or vice versa?",
    reviewLabel: 'Sticking point',
    placeholder: 'Describe the sticking point.',
  },
  negotiateAgreedVerbally: {
    id: 'negotiateAgreedVerbally',
    ui: 'textarea',
    header: "Anything you've already shaken hands on?",
    helper: 'Even informally — over email, on a call, in person.',
    reviewLabel: 'Agreed verbally',
    placeholder: "What's already been agreed?",
    skipAllowed: true,
  },

  // Branch A — dispute
  disputeWhatHappened: {
    id: 'disputeWhatHappened',
    ui: 'textarea',
    header: "Tell us what's going on.",
    helper:
      "Walk us through it like you'd tell a friend. Dates, names, what was supposed to happen vs. what did.",
    reviewLabel: 'What happened',
    placeholder: 'What happened?',
  },
  disputeOutcome: {
    id: 'disputeOutcome',
    ui: 'card-grid',
    columns: 2,
    header: 'What does a good resolution look like?',
    reviewLabel: 'Desired outcome',
    options: DISPUTE_OUTCOME_OPTIONS,
  },
  disputeFormalNotices: {
    id: 'disputeFormalNotices',
    ui: 'chips',
    header: 'Has anyone sent formal notices yet?',
    helper:
      'Things like a demand letter, notice of breach, or cease and desist.',
    reviewLabel: 'Formal notices',
    options: YES_NO_NOT_SURE,
  },

  // Branch B — NDA
  ndaDirection: {
    id: 'ndaDirection',
    ui: 'chips',
    header: 'One-way or mutual?',
    reviewLabel: 'NDA direction',
    options: [
      { value: 'one_way', label: 'One-way' },
      { value: 'mutual', label: 'Mutual' },
    ],
  },
  ndaProtected: {
    id: 'ndaProtected',
    ui: 'text',
    header: "What's being protected?",
    reviewLabel: 'Protected information',
    placeholder: 'e.g. product roadmap, customer data, pricing',
    skipAllowed: true,
  },

  // Branch B — Services / MSA
  servicesDeliverables: {
    id: 'servicesDeliverables',
    ui: 'textarea',
    header: 'What are the deliverables and how is payment structured?',
    reviewLabel: 'Deliverables & payment',
    placeholder: 'e.g. monthly retainer for design work, paid net-30',
    skipAllowed: true,
  },
  servicesIpOwner: {
    id: 'servicesIpOwner',
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

  // Branch B — Licensing / IP
  licensingWhat: {
    id: 'licensingWhat',
    ui: 'text',
    header: "What's being licensed?",
    reviewLabel: 'Licensed asset',
    placeholder: 'e.g. software, brand, patent, content',
    skipAllowed: true,
  },
  licensingExclusive: {
    id: 'licensingExclusive',
    ui: 'chips',
    header: 'Exclusive or non-exclusive?',
    reviewLabel: 'Exclusivity',
    options: [
      { value: 'exclusive', label: 'Exclusive' },
      { value: 'non_exclusive', label: 'Non-exclusive' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  licensingTerritory: {
    id: 'licensingTerritory',
    ui: 'chips',
    header: 'Territory?',
    reviewLabel: 'Territory',
    options: [
      { value: 'us', label: 'US' },
      { value: 'worldwide', label: 'Worldwide' },
      { value: 'other', label: 'Other' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },

  // Branch B — Sales
  salesGoodsServices: {
    id: 'salesGoodsServices',
    ui: 'chips',
    header: 'Goods, services, or both?',
    reviewLabel: 'Goods or services',
    options: [
      { value: 'goods', label: 'Goods' },
      { value: 'services', label: 'Services' },
      { value: 'both', label: 'Both' },
    ],
  },
  salesRecurring: {
    id: 'salesRecurring',
    ui: 'chips',
    header: 'One-time or recurring?',
    reviewLabel: 'Cadence',
    options: [
      { value: 'one_time', label: 'One-time' },
      { value: 'recurring', label: 'Recurring' },
    ],
  },

  // Branch B — Lease
  leaseAssetType: {
    id: 'leaseAssetType',
    ui: 'chips',
    header: 'Real estate or equipment?',
    reviewLabel: 'Lease type',
    options: [
      { value: 'real_estate', label: 'Real estate' },
      { value: 'equipment', label: 'Equipment' },
    ],
  },
  leaseTerm: {
    id: 'leaseTerm',
    ui: 'chips',
    header: 'Term length?',
    reviewLabel: 'Term length',
    options: [
      { value: 'month_to_month', label: 'Month-to-month' },
      { value: 'under_1y', label: 'Under 1 yr' },
      { value: '1_3y', label: '1–3 yrs' },
      { value: 'over_3y', label: '3+ yrs' },
    ],
  },

  // Branch B — Partnership / JV
  partnershipEquity: {
    id: 'partnershipEquity',
    ui: 'chips',
    header: 'Equity split and decision rights — known or still TBD?',
    reviewLabel: 'Equity & decisions',
    options: [
      { value: 'known', label: 'We know the split' },
      { value: 'tbd', label: 'Still TBD' },
    ],
  },
  partnershipNotes: {
    id: 'partnershipNotes',
    ui: 'text',
    header: 'Anything to add on the split?',
    reviewLabel: 'Split notes',
    placeholder: 'Optional details',
    skipAllowed: true,
  },

  // Internal-only key (paired with the deadline date question)
  reviewNoDeadline: {
    id: 'reviewNoDeadline',
    ui: 'chips',
    header: '',
    reviewLabel: 'No deadline',
  },
};

const intentIs = (value: string) => (a: IntakeAnswers) => a.intent === value;
const typeIs = (value: string) => (a: IntakeAnswers) =>
  a.contractType === value;

/** NDA drafting is overkill on value/must-haves and the "what's the deal" question. */
const isNdaDraftSkippable = (a: IntakeAnswers) => a.contractType === 'nda';

const steps: readonly IntakeStep[] = [
  // Stage 1 — triage
  { id: 'intent', stage: 'triage', questionIds: ['intent'] },
  { id: 'contractType', stage: 'triage', questionIds: ['contractType'] },
  { id: 'urgency', stage: 'triage', questionIds: ['urgency'] },

  // Stage 2 — documents
  { id: 'documents', stage: 'triage', questionIds: ['documents'] },

  // Branch A — review
  {
    id: 'reviewSender',
    stage: 'details',
    questionIds: ['reviewSenderName', 'reviewRelationship'],
    visibleWhen: intentIs('review'),
  },
  {
    id: 'reviewDeadline',
    stage: 'details',
    questionIds: ['reviewDeadline'],
    visibleWhen: intentIs('review'),
  },
  {
    id: 'reviewConcerns',
    stage: 'details',
    questionIds: ['reviewConcerns'],
    visibleWhen: intentIs('review'),
  },

  // Branch A — draft (NDA skips the deal sentence, value, and must-haves)
  {
    id: 'draftDeal',
    stage: 'details',
    questionIds: ['draftDealSummary'],
    visibleWhen: (a) => intentIs('draft')(a) && !isNdaDraftSkippable(a),
  },
  {
    id: 'draftOtherSide',
    stage: 'details',
    questionIds: ['draftOtherSideName', 'draftOtherSideType'],
    visibleWhen: intentIs('draft'),
  },
  {
    id: 'draftValue',
    stage: 'details',
    questionIds: ['draftValue'],
    visibleWhen: (a) => intentIs('draft')(a) && !isNdaDraftSkippable(a),
  },
  {
    id: 'draftMustHaves',
    stage: 'details',
    questionIds: ['draftMustHaves'],
    visibleWhen: (a) => intentIs('draft')(a) && !isNdaDraftSkippable(a),
  },

  // Branch A — negotiate
  {
    id: 'negotiateSticking',
    stage: 'details',
    questionIds: ['negotiateStickingPoint'],
    visibleWhen: intentIs('negotiate'),
  },
  {
    id: 'negotiateAgreed',
    stage: 'details',
    questionIds: ['negotiateAgreedVerbally'],
    visibleWhen: intentIs('negotiate'),
  },

  // Branch A — dispute
  {
    id: 'disputeWhat',
    stage: 'details',
    questionIds: ['disputeWhatHappened'],
    visibleWhen: intentIs('dispute'),
  },
  {
    id: 'disputeOutcome',
    stage: 'details',
    questionIds: ['disputeOutcome'],
    visibleWhen: intentIs('dispute'),
  },
  {
    id: 'disputeNotices',
    stage: 'details',
    questionIds: ['disputeFormalNotices'],
    visibleWhen: intentIs('dispute'),
  },

  // Branch B — type-specific (shown for any intent)
  {
    id: 'ndaDetails',
    stage: 'details',
    questionIds: ['ndaDirection', 'ndaProtected'],
    visibleWhen: typeIs('nda'),
  },
  {
    id: 'servicesDetails',
    stage: 'details',
    questionIds: ['servicesDeliverables', 'servicesIpOwner'],
    visibleWhen: typeIs('services'),
  },
  {
    id: 'licensingWhat',
    stage: 'details',
    questionIds: ['licensingWhat'],
    visibleWhen: typeIs('licensing'),
  },
  {
    id: 'licensingTerms',
    stage: 'details',
    questionIds: ['licensingExclusive', 'licensingTerritory'],
    visibleWhen: typeIs('licensing'),
  },
  {
    id: 'salesDetails',
    stage: 'details',
    questionIds: ['salesGoodsServices', 'salesRecurring'],
    visibleWhen: typeIs('sales'),
  },
  {
    id: 'leaseDetails',
    stage: 'details',
    questionIds: ['leaseAssetType', 'leaseTerm'],
    visibleWhen: typeIs('lease'),
  },
  {
    id: 'partnershipDetails',
    stage: 'details',
    questionIds: ['partnershipEquity', 'partnershipNotes'],
    visibleWhen: typeIs('partnership'),
  },
];

const INTENT_PATTERNS = [
  {
    value: 'dispute',
    re: /\b(breach|broke the|didn'?t (pay|deliver)|sue|lawsuit|enforce|dispute|violat|defaulted?|went wrong|owe[sd]?)\b/,
  },
  {
    value: 'negotiate',
    re: /\b(negotiat|redline|red-line|counter\s?offer|push ?back|back.and.forth|mark ?up|their terms|sticking point)\b/,
  },
  {
    value: 'review',
    re: /\b(review|look (over|at)|sent me|they sent|received|check (this|it)|is this (fair|ok)|should i sign|before i sign)\b/,
  },
  {
    value: 'draft',
    re: /\b(draft|write|create|prepare|put together|need (a|an)|set up|from scratch)\b/,
  },
];

const TYPE_PATTERNS = [
  { value: 'nda', re: /\b(nda|non.?disclosure|confidential)\b/ },
  {
    value: 'services',
    re: /\b(msa|services? agreement|statement of work|\bsow\b|consult|retainer|contractor|freelanc)\b/,
  },
  {
    value: 'licensing',
    re: /\b(licen[sc]e|licen[sc]ing|intellectual property|\bip\b|royalt|patent|trademark)\b/,
  },
  { value: 'lease', re: /\b(lease|renting|rental|tenan|premises|landlord)\b/ },
  { value: 'sales', re: /\b(sale|selling|purchase|buying|goods|supply of)\b/ },
  {
    value: 'partnership',
    re: /\b(partnership|joint venture|\bjv\b|co.?found|equity split)\b/,
  },
  { value: 'vendor', re: /\b(vendor|supplier|procurement|rfp)\b/ },
];

const URGENCY_PATTERNS = [
  {
    value: 'today',
    re: /\b(today|asap|urgent|right away|immediately|end of day|\beod\b|by tonight)\b/,
  },
  {
    value: 'exploring',
    re: /\b(no rush|just exploring|exploring|not urgent|whenever|no (firm )?deadline|early stage)\b/,
  },
  {
    value: 'this_week',
    re: /\b(this week|in a few days|within (a )?(few )?days|by friday|by end of week)\b/,
  },
  {
    value: 'this_month',
    re: /\b(this month|in a few weeks|by month.?end|next month|couple of weeks)\b/,
  },
];

/** Free-text "describe the situation" field per intent. */
const NARRATIVE_KEY: Record<string, string> = {
  draft: 'draftDealSummary',
  review: 'reviewConcerns',
  negotiate: 'negotiateStickingPoint',
  dispute: 'disputeWhatHappened',
};

function parse(text: string): ParsedSituation {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const answers: IntakeAnswers = {};

  const intent = detectFirst(lower, INTENT_PATTERNS);
  if (intent) answers.intent = intent;

  const contractType = detectFirst(lower, TYPE_PATTERNS);
  if (contractType) answers.contractType = contractType;

  const urgency = detectFirst(lower, URGENCY_PATTERNS);
  if (urgency) answers.urgency = urgency;

  if (intent === 'draft') {
    const value = detectValueBand(trimmed);
    if (value) answers.draftValue = value;
  }

  const counterparty = detectCounterparty(trimmed);
  if (counterparty) {
    if (intent === 'draft') answers.draftOtherSideName = counterparty;
    else if (intent) answers.reviewSenderName = counterparty;
  }

  // Keep the narrative in the intent-appropriate free-text field so the
  // review and the assigned lawyer see the client's own words.
  if (intent && trimmed.length > 0) {
    answers[NARRATIVE_KEY[intent] as string] = trimmed.slice(0, NARRATIVE_CAP);
  }

  return { answers, keys: keysOf(answers) };
}

function applyExtraction(
  answers: IntakeAnswers,
  fields: ExtractedFields,
): IntakeAnswers | null {
  const next = { ...answers };
  let changed = false;
  if (fields.counterparty) {
    if (answers.intent === 'draft' && !answers.draftOtherSideName) {
      next.draftOtherSideName = fields.counterparty;
      changed = true;
    } else if (answers.intent !== 'draft' && !answers.reviewSenderName) {
      next.reviewSenderName = fields.counterparty;
      changed = true;
    }
  }
  if (
    fields.suggestedType &&
    !answers.contractType &&
    CONTRACT_TYPE_OPTIONS.some((o) => o.value === fields.suggestedType)
  ) {
    next.contractType = fields.suggestedType;
    changed = true;
  }
  return changed ? next : null;
}

function buildTriageTransition(answers: IntakeAnswers): string {
  const typeLabel = answers.contractType
    ? (getAnswerDisplay(questions, 'contractType', answers) ?? 'contract')
    : 'contract';
  const intentMap: Record<string, string> = {
    draft: `drafting a new ${typeLabel}`,
    review: `reviewing the ${typeLabel} you received`,
    negotiate: `negotiating your ${typeLabel}`,
    dispute: `sorting out your ${typeLabel} dispute`,
  };
  const lead =
    typeof answers.intent === 'string'
      ? intentMap[answers.intent]
      : 'getting your matter set up';
  const rush =
    answers.urgency === 'today'
      ? ', and it’s urgent'
      : answers.urgency === 'exploring'
        ? ', no rush'
        : '';
  return `Got it — ${lead}${rush}. Just a few details and we’ll be set.`;
}

function staticSummary(answers: IntakeAnswers): string {
  const intentText: Record<string, string> = {
    draft: 'wants a new contract drafted',
    review: 'wants a contract they received reviewed',
    negotiate: 'is negotiating redlines on a draft',
    dispute: 'has a dispute over a signed contract',
  };
  const action =
    typeof answers.intent === 'string'
      ? intentText[answers.intent]
      : 'has a new contract matter';
  const type = answers.contractType
    ? CONTRACT_TYPE_OPTIONS.find((o) => o.value === answers.contractType)?.label
    : undefined;
  const typeText = type ? ` (${type})` : '';
  const documents = Array.isArray(answers.documents)
    ? answers.documents.length
    : 0;
  const docText =
    documents > 0
      ? ` ${documents} document${documents > 1 ? 's' : ''} attached.`
      : ' No documents attached.';
  return `Client ${action}${typeText}.${docText} Moritz will assign a commercial lawyer to take it from here.`;
}

export const contractMatter: MatterIntakeDefinition = {
  id: 'contract',
  label: 'Contract',
  newMatterTitle: 'New contract matter',
  buildHeaderTitle: (answers) => {
    const typeDisplay = answers.contractType
      ? getAnswerDisplay(questions, 'contractType', answers)
      : null;
    return typeDisplay ? `${typeDisplay} matter` : 'New contract matter';
  },
  triageKeys: ['intent', 'contractType', 'urgency'],
  questions,
  steps,
  introGreeting:
    "Hi — I'm Moritz. Tell me about your contract situation in your own words and I'll skip any questions I can already answer. Or pick what you need below to get started.",
  buildTriageTransition,
  parse,
  openAiHints: {
    enumKeys: ['intent', 'contractType', 'urgency', 'draftValue'],
    freeTextKeys: [
      'draftDealSummary',
      'draftOtherSideName',
      'reviewSenderName',
      'reviewConcerns',
      'negotiateStickingPoint',
      'disputeWhatHappened',
    ],
  },
  applyExtraction,
  staticSummary,
  getLawyerShortlist: (answers) =>
    shortlistBySpecialty(
      COMMERCIAL_ROSTER,
      typeof answers.contractType === 'string'
        ? answers.contractType
        : undefined,
    ),
};
