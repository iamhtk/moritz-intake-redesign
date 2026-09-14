import type { LegalCase, ParticipantRef, Role } from '@/lib/types';
import { MOCK_DOCUMENTS } from './documents';

const CLIENT_ALEX: ParticipantRef = {
  id: 'usr_client_001',
  name: 'Alex Morgan',
  email: 'alex.morgan@northwindltd.com',
  image: '/onboarding-lawyers/maxim-van-eeckhout.png',
  actor: 'client',
  companyName: 'Northwind Ltd.',
};

const CLIENT_REENA: ParticipantRef = {
  id: 'usr_client_002',
  name: 'Reena Patel',
  email: 'reena.patel@oakworks.io',
  image: '/onboarding-lawyers/sofia-marchetti.jpg',
  actor: 'client',
  companyName: 'Oakworks',
};

const LEGAL_DANIEL: ParticipantRef = {
  id: 'usr_legal_005',
  name: 'Daniel Dalla Vedova',
  email: 'daniel.dallavedova@moritz.legal',
  image: '/onboarding-lawyers/daniel-dalla-vedova.png',
  actor: 'legal',
  companyName: 'Moritz',
};

const ADMIN_JORDAN: ParticipantRef = {
  id: 'usr_admin_001',
  name: 'Jordan Pierce',
  email: 'jordan@moritz.legal',
  image: '/onboarding-lawyers/kyle-westaway.png',
  actor: 'admin',
  companyName: 'Moritz',
};

const OPPOSING_VENDOR: ParticipantRef = {
  id: 'opp_001',
  name: 'BlueLight Equipment Co.',
  email: 'legal@bluelightequip.com',
  image: null,
  actor: 'opposing',
  companyName: 'BlueLight Equipment Co.',
};

const OPPOSING_EX_EMPLOYEE: ParticipantRef = {
  id: 'opp_002',
  name: 'Charlie Davis',
  email: 'cdavis@personal-mail.com',
  image: null,
  actor: 'opposing',
  companyName: null,
};

const CLIENT_DEVON: ParticipantRef = {
  id: 'usr_client_003',
  name: 'Devon Carter',
  email: 'devon.carter@trellislogistics.com',
  image: '/onboarding-lawyers/james-whitfield.jpg',
  actor: 'client',
  companyName: 'Trellis Logistics',
};

const LEGAL_CATARINA: ParticipantRef = {
  id: 'usr_legal_003',
  name: 'Catarina Milagre',
  email: 'catarina.milagre@moritz.legal',
  image: '/onboarding-lawyers/catarina-milagre.png',
  actor: 'legal',
  companyName: 'Moritz',
};

const LEGAL_AELITA: ParticipantRef = {
  id: 'usr_legal_004',
  name: 'Aélita Jacob',
  email: 'aelita.jacob@moritz.legal',
  image: '/onboarding-lawyers/aelita-jacob.png',
  actor: 'legal',
  companyName: 'Moritz',
};

const OPPOSING_NORTHSTAR: ParticipantRef = {
  id: 'opp_003',
  name: 'Northstar Analytics',
  email: 'legal@northstaranalytics.com',
  image: null,
  actor: 'opposing',
  companyName: 'Northstar Analytics',
};

const OPPOSING_FLEETLINK: ParticipantRef = {
  id: 'opp_004',
  name: 'FleetLink',
  email: 'contracts@fleetlink.io',
  image: null,
  actor: 'opposing',
  companyName: 'FleetLink',
};

const baseDescription = `Northwind Ltd. is a renewable-energy operator headquartered in Oakland, CA. We recently discovered that one of our supplier contracts contains an automatic renewal clause we believe is unenforceable under California Civil Code §1670.5 (unconscionability), and we'd like a second opinion before the renewal takes effect.
Specifically, we're looking for a second-opinion review of the renewal clause and the surrounding terms, a drafted notice of dispute we can serve on the supplier, and — if you think it's warranted — a short strategy memo weighing litigation against arbitration.
To support the review we've provided the signed Master Services Agreement from April 2024, the renewal notice we received on 19 April 2026, and an internal memo describing the operational impact if the clause is enforced.`;

const OPPOSING_ACME: ParticipantRef = {
  id: 'opp_003',
  name: 'Acme Technologies Ltd.',
  email: 'contracts@acmetech.example',
  image: null,
  actor: 'opposing',
  companyName: 'Acme Technologies Ltd.',
};

/**
 * Where "Go to case" lands (Decision 8, and §3's Decision 1).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS WAS `case_009` AND THE SWITCH BACK WAS DELIBERATE. READ BOTH SIDES.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Moritz's own confirmation card links to `case_006`, and matching that
 * exactly is the point: a reviewer comparing the old flow with this one sees
 * the same handoff, and `case_006` is the page where the quote and the
 * payment actually happen in their product — which is what the reframed quote
 * card is meant to be read against.
 *
 * What that costs, stated rather than discovered. `case_009` was written for
 * this job: submitted today, no quote, no lawyer, which puts their five-step
 * client timeline at step one and lets it do the "where am I" work for free.
 * `case_006` is three weeks old, `IN_PROGRESS`, priced at US$5,600 and has
 * Aélita assigned since 27 May. So a client who presses "Go to case" seconds
 * after a confirmation saying *nobody is assigned until you accept the quote*
 * lands on a case with a lawyer and a price on it. The rail says a lawyer is
 * pricing the work; that page says one was assigned in May.
 *
 * `applySubmission` in `lib/mocks/submitted-cases.ts` covers the half of this
 * that it can: the title, the description, the documents and the dates are
 * overlaid with what the client actually sent, so the page is at least about
 * their matter. It deliberately does not touch status, quote or lawyer — a
 * submission has no business deciding where a case sits in the firm's queue —
 * so those three stay as the fixture has them.
 *
 * `case_009` keeps its own id below and stays in the list. Nothing points at
 * it now; retiring it is a fixture cleanup rather than part of this change.
 */
export const SUBMITTED_CASE_ID = 'case_006';

/**
 * Today, at a fixed time of day.
 *
 * "Created today" has to be relative or the case reads as stale the day after
 * anyone looks at it, but a literal `new Date()` would differ between the
 * server render and the client bundle. Pinning to a UTC date and a fixed hour
 * makes both evaluate to the same string for the whole of a UTC day.
 */
function todayAt(hour: number): string {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const at = String(hour).padStart(2, '0');
  return `${now.getUTCFullYear()}-${month}-${day}T${at}:00:00.000Z`;
}

export const MOCK_CASES: LegalCase[] = [
  {
    /*
     * Its own id, not `SUBMITTED_CASE_ID`, and that is load-bearing now.
     *
     * This fixture used to *be* the submitted case and named itself after the
     * constant. Once the constant moved to `case_006` that spelling would
     * have given the list two cases with the same id, and `getCaseById` would
     * have returned this one — so the switch would have silently changed
     * nothing except the name of the target.
     */
    id: 'case_009',
    caseNumber: 'M-2026-0126',
    title: 'MSA review and early exit: Acme Technologies',
    description: `We signed a master services agreement with Acme Technologies for warehousing and last-mile distribution, and we now want to understand what it would take to get out of it early.
Service levels have been missed repeatedly and we would like a practical read on the termination and notice provisions — whether we have grounds to exit for cause, what notice we owe, and what the exposure looks like if we simply give notice.
We have attached the signed agreement. A short list of the clauses that actually matter here would be more useful to us than a full review.`,
    anonDescription:
      'A non-legal company wants advice on exiting a warehousing and distribution MSA early after repeated service-level failures.',
    status: 'READY_FOR_SUBMISSION_REVIEW',
    unreadCount: 0,
    quoteAmount: null,
    currency: 'USD',
    caseTypeId: 'ct_contract_review',
    country: 'US',
    client: CLIENT_ALEX,
    opposingParty: OPPOSING_ACME,
    assignedLawyer: null,
    ownerCompanyId: 'cmp_client_001',
    ownerCompanyName: 'Northwind Ltd.',
    legalCompanyId: null,
    legalCompanyName: null,
    claimableCompanyIds: [],
    participants: [CLIENT_ALEX],
    documents: [],
    draftDocuments: [],
    draftResponseMarkdown: null,
    claimDeadline: null,
    receivedAt: todayAt(9),
    sentToFirmsAt: null,
    lawyerAssignedAt: null,
    createdAt: todayAt(9),
    updatedAt: todayAt(9),
  },
  {
    id: 'case_007',
    caseNumber: 'M-2026-0125',
    title: 'Analytics vendor MSA & DPA review',
    description: `We're trying to onboard a new analytics vendor by the end of this week — the budget is approved and the business is keen to move — and they've sent over their standard MSA and DPA for us to sign.
Before we commit, we'd like a practical read on whether we can sign as-is or where we genuinely need to push back. We're not looking to renegotiate everything, just to understand what actually matters.
Our main concern is the data terms: we handle courier and consumer PII, so we'd appreciate a flag on anything in the DPA that's a real problem for us given how we operate.`,
    anonDescription:
      'A last-mile delivery company wants to onboard an analytics vendor this week and needs a review of the vendor MSA and DPA, with a view on what to push back on before signature.',
    status: 'IN_PROGRESS',
    unreadCount: 2,
    quoteAmount: 3_800,
    currency: 'USD',
    caseTypeId: 'ct_commercial_review',
    country: 'US',
    client: CLIENT_DEVON,
    opposingParty: OPPOSING_NORTHSTAR,
    assignedLawyer: LEGAL_CATARINA,
    ownerCompanyId: 'cmp_client_004',
    ownerCompanyName: 'Trellis Logistics',
    legalCompanyId: 'cmp_legal_001',
    legalCompanyName: 'Catarina Milagre',
    claimableCompanyIds: ['cmp_legal_001'],
    participants: [CLIENT_DEVON, LEGAL_CATARINA, ADMIN_JORDAN],
    documents: [
      MOCK_DOCUMENTS[5]!,
      MOCK_DOCUMENTS[6]!,
      MOCK_DOCUMENTS[9]!,
      MOCK_DOCUMENTS[10]!,
      MOCK_DOCUMENTS[11]!,
      MOCK_DOCUMENTS[12]!,
    ],
    draftDocuments: [MOCK_DOCUMENTS[6]!],
    draftResponseMarkdown: null,
    claimDeadline: null,
    receivedAt: '2026-06-01T09:12:00.000Z',
    sentToFirmsAt: '2026-06-01T15:30:00.000Z',
    lawyerAssignedAt: '2026-06-02T10:20:00.000Z',
    createdAt: '2026-06-01T09:12:00.000Z',
    updatedAt: '2026-06-03T14:40:00.000Z',
  },
  {
    id: 'case_008',
    caseNumber: 'M-2026-0124',
    title: 'Courier platform renewal review',
    description: `Our courier management platform is up for renewal, and this time they're asking for a two-year term and a roughly 12% price increase. Before we commit that spend, we'd like a read on whether the terms still protect us.
What's prompting the review is that they've changed their paper since we first signed, so we can't assume the renewal matches what we originally agreed to.
To help with the comparison we've shared their current renewal agreement alongside our original executed version.`,
    anonDescription:
      'A last-mile delivery company is reviewing a courier management platform renewal with a two-year term and a 12 percent increase, and needs a read on whether the terms still protect it.',
    status: 'IN_PROGRESS',
    unreadCount: 1,
    quoteAmount: 4_500,
    currency: 'USD',
    caseTypeId: 'ct_commercial_review',
    country: 'US',
    client: CLIENT_DEVON,
    opposingParty: OPPOSING_FLEETLINK,
    assignedLawyer: LEGAL_AELITA,
    ownerCompanyId: 'cmp_client_004',
    ownerCompanyName: 'Trellis Logistics',
    legalCompanyId: 'cmp_legal_001',
    legalCompanyName: 'Aélita Jacob',
    claimableCompanyIds: ['cmp_legal_001'],
    participants: [CLIENT_DEVON, LEGAL_AELITA, ADMIN_JORDAN],
    documents: [MOCK_DOCUMENTS[7]!, MOCK_DOCUMENTS[8]!, MOCK_DOCUMENTS[13]!],
    draftDocuments: [MOCK_DOCUMENTS[8]!],
    draftResponseMarkdown: null,
    claimDeadline: null,
    receivedAt: '2026-05-30T10:05:00.000Z',
    sentToFirmsAt: '2026-05-30T16:45:00.000Z',
    lawyerAssignedAt: '2026-05-31T11:15:00.000Z',
    createdAt: '2026-05-30T10:05:00.000Z',
    updatedAt: '2026-06-02T16:20:00.000Z',
  },
  {
    id: 'case_001',
    caseNumber: 'M-2026-0114',
    title: 'Supplier renewal clause: California',
    description: baseDescription,
    anonDescription:
      'A renewable-energy operator needs a second opinion on a supplier renewal clause and a draft notice of dispute. Materials provided include the master services agreement and the renewal notice.',
    status: 'IN_PROGRESS',
    unreadCount: 3,
    quoteAmount: 8_500,
    currency: 'USD',
    caseTypeId: 'ct_commercial_review',
    country: 'US',
    client: CLIENT_ALEX,
    opposingParty: OPPOSING_VENDOR,
    assignedLawyer: LEGAL_DANIEL,
    ownerCompanyId: 'cmp_client_001',
    ownerCompanyName: 'Northwind Ltd.',
    legalCompanyId: 'cmp_legal_001',
    legalCompanyName: 'Daniel Dalla Vedova',
    claimableCompanyIds: ['cmp_legal_001'],
    participants: [CLIENT_ALEX, LEGAL_DANIEL, ADMIN_JORDAN],
    documents: [MOCK_DOCUMENTS[0]!, MOCK_DOCUMENTS[1]!],
    draftDocuments: [MOCK_DOCUMENTS[3]!],
    draftResponseMarkdown:
      '## Notice of Dispute\n\nDear Counsel,\n\nWe write on behalf of Northwind Ltd. with respect to the renewal clause contained in Section 14.2 of the Master Services Agreement dated April 4, 2024…',
    claimDeadline: null,
    receivedAt: '2026-05-09T08:00:00.000Z',
    sentToFirmsAt: '2026-05-09T14:30:00.000Z',
    lawyerAssignedAt: '2026-05-12T09:45:00.000Z',
    createdAt: '2026-05-09T08:00:00.000Z',
    updatedAt: '2026-05-22T12:08:00.000Z',
  },
  {
    id: 'case_002',
    caseNumber: 'M-2026-0118',
    title: 'Employment termination review',
    description: `We've had a contested termination that we're worried carries some wrongful-dismissal risk, and we'd like a quick independent review before we take our next step.
Ideally we're after a short 30-minute strategy call to talk it through, followed by a one-page note setting out the main risks as you see them.`,
    anonDescription:
      'A US SaaS company is reviewing a contested termination and would like a 30-minute call plus a one-page risk note.',
    status: 'IN_PROGRESS',
    unreadCount: 0,
    quoteAmount: 3_200,
    currency: 'USD',
    caseTypeId: 'ct_employment',
    country: 'US',
    client: CLIENT_REENA,
    opposingParty: OPPOSING_EX_EMPLOYEE,
    assignedLawyer: LEGAL_CATARINA,
    ownerCompanyId: 'cmp_client_002',
    ownerCompanyName: 'Oakworks',
    legalCompanyId: 'cmp_legal_001',
    legalCompanyName: 'Catarina Milagre',
    claimableCompanyIds: ['cmp_legal_001'],
    participants: [CLIENT_REENA, LEGAL_CATARINA, ADMIN_JORDAN],
    documents: [MOCK_DOCUMENTS[2]!],
    draftDocuments: [],
    draftResponseMarkdown: null,
    claimDeadline: null,
    receivedAt: '2026-05-21T09:30:00.000Z',
    sentToFirmsAt: '2026-05-21T15:10:00.000Z',
    lawyerAssignedAt: '2026-05-23T10:40:00.000Z',
    createdAt: '2026-05-21T09:30:00.000Z',
    updatedAt: '2026-05-27T14:22:00.000Z',
  },
  {
    id: 'case_003',
    caseNumber: 'M-2026-0094',
    title: 'IP licensing dispute: Nordic vendor',
    description: `A Norwegian vendor has come back to us asserting a usage cap on what we always understood to be a perpetual software licence, and we're not convinced their reading of the contract is right.
We'd like help interpreting the relevant terms and, assuming the position holds up, drafting a response we can send back to them.`,
    anonDescription:
      'A SaaS company has received an assertion about a usage cap on a perpetual license from a Nordic vendor.',
    status: 'CLOSED',
    unreadCount: 0,
    quoteAmount: 12_400,
    currency: 'USD',
    caseTypeId: 'ct_ip_dispute',
    country: 'US',
    client: CLIENT_REENA,
    opposingParty: null,
    assignedLawyer: LEGAL_AELITA,
    ownerCompanyId: 'cmp_client_002',
    ownerCompanyName: 'Oakworks',
    legalCompanyId: 'cmp_legal_001',
    legalCompanyName: 'Aélita Jacob',
    claimableCompanyIds: ['cmp_legal_001'],
    participants: [CLIENT_REENA, LEGAL_AELITA],
    documents: [MOCK_DOCUMENTS[4]!],
    draftDocuments: [],
    draftResponseMarkdown: null,
    claimDeadline: null,
    receivedAt: '2026-03-12T08:00:00.000Z',
    sentToFirmsAt: '2026-03-12T13:20:00.000Z',
    lawyerAssignedAt: '2026-03-15T10:05:00.000Z',
    createdAt: '2026-03-12T08:00:00.000Z',
    updatedAt: '2026-04-30T15:20:00.000Z',
  },
  {
    id: 'case_004',
    caseNumber: 'M-2026-0121',
    title: 'NDA review: manufacturing partner',
    description:
      "We're in early conversations with a prospective manufacturing partner, and they've asked us to sign their standard NDA before we share any technical specifications. We'd like a quick independent review before we execute it.\nOur main concern is that the mutual confidentiality terms are genuinely balanced — that the definition of \"confidential information,\" the permitted-use scope, and the term and survival provisions don't quietly favour their side. We'd also appreciate a flag on anything unusual around IP ownership or residual-knowledge clauses.\nThis one is time-sensitive: we're hoping to move to a first technical exchange within the week, so a fast turnaround with a short list of any redlines you'd recommend would be ideal.",
    anonDescription:
      'A non-legal company has received an NDA from a prospective manufacturing partner and needs a fast turnaround review.',
    status: 'IN_PROGRESS',
    unreadCount: 1,
    quoteAmount: 1_000,
    currency: 'USD',
    caseTypeId: 'ct_contract_review',
    country: 'US',
    client: CLIENT_ALEX,
    opposingParty: null,
    assignedLawyer: LEGAL_DANIEL,
    ownerCompanyId: 'cmp_client_001',
    ownerCompanyName: 'Northwind Ltd.',
    legalCompanyId: 'cmp_legal_001',
    legalCompanyName: 'Daniel Dalla Vedova',
    claimableCompanyIds: ['cmp_legal_001'],
    participants: [CLIENT_ALEX, LEGAL_DANIEL, ADMIN_JORDAN],
    documents: [],
    draftDocuments: [],
    draftResponseMarkdown: null,
    claimDeadline: null,
    receivedAt: '2026-05-23T10:11:00.000Z',
    sentToFirmsAt: '2026-05-23T16:00:00.000Z',
    lawyerAssignedAt: '2026-05-24T09:30:00.000Z',
    createdAt: '2026-05-23T10:11:00.000Z',
    updatedAt: '2026-05-26T15:40:00.000Z',
  },
  {
    id: 'case_005',
    caseNumber: 'M-2026-0122',
    title: 'GDPR data subject request: vendor response',
    description: `We've received a data subject access request that came in through one of our vendor portals rather than directly to us, and we'd like help handling it correctly.
Mainly we're after a drafted response we can rely on, along with a quick check that we're meeting our obligations and timelines under the GDPR.`,
    anonDescription:
      'A SaaS company received a GDPR data subject access request through a vendor portal and needs a response drafted.',
    status: 'IN_PROGRESS',
    unreadCount: 0,
    quoteAmount: 4_100,
    currency: 'USD',
    caseTypeId: 'ct_privacy',
    country: 'GB',
    client: CLIENT_REENA,
    opposingParty: null,
    assignedLawyer: LEGAL_CATARINA,
    ownerCompanyId: 'cmp_client_002',
    ownerCompanyName: 'Oakworks',
    legalCompanyId: 'cmp_legal_001',
    legalCompanyName: 'Catarina Milagre',
    claimableCompanyIds: ['cmp_legal_001'],
    participants: [CLIENT_REENA, LEGAL_CATARINA],
    documents: [],
    draftDocuments: [],
    draftResponseMarkdown: null,
    claimDeadline: null,
    receivedAt: '2026-05-24T15:00:00.000Z',
    sentToFirmsAt: '2026-05-24T17:20:00.000Z',
    lawyerAssignedAt: '2026-05-26T10:15:00.000Z',
    createdAt: '2026-05-24T15:00:00.000Z',
    updatedAt: '2026-05-28T11:05:00.000Z',
  },
  {
    id: 'case_006',
    caseNumber: 'M-2026-0123',
    title: 'Commercial lease renegotiation',
    description:
      'Our landlord has proposed terms for a 3-year renewal of the commercial lease on our main operations site, and with the current term expiring at the end of the quarter we want a brief independent review before signing. The new draft raises base rent by roughly 12% in year one, adds uncapped CPI-linked annual escalations, shifts more of the maintenance and insurance obligations onto us as the tenant, and introduces early-termination penalties that did not exist in the previous agreement. We would like a short written summary of the main risks, a view on which terms are worth pushing back on, and any redlines you would recommend before we respond to the landlord.',
    anonDescription:
      'A renewable-energy operator wants a brief independent review of a proposed 3-year commercial lease renewal.',
    status: 'IN_PROGRESS',
    unreadCount: 0,
    quoteAmount: 5_600,
    currency: 'USD',
    caseTypeId: 'ct_commercial_review',
    country: 'US',
    client: CLIENT_ALEX,
    opposingParty: null,
    assignedLawyer: LEGAL_AELITA,
    ownerCompanyId: 'cmp_client_001',
    ownerCompanyName: 'Northwind Ltd.',
    legalCompanyId: 'cmp_legal_001',
    legalCompanyName: 'Aélita Jacob',
    claimableCompanyIds: ['cmp_legal_001'],
    participants: [CLIENT_ALEX, LEGAL_AELITA, ADMIN_JORDAN],
    documents: [],
    draftDocuments: [],
    draftResponseMarkdown: null,
    claimDeadline: null,
    receivedAt: '2026-05-25T11:00:00.000Z',
    sentToFirmsAt: '2026-05-25T16:30:00.000Z',
    lawyerAssignedAt: '2026-05-27T09:50:00.000Z',
    createdAt: '2026-05-25T11:00:00.000Z',
    updatedAt: '2026-05-29T16:30:00.000Z',
  },
];

export function getCaseById(id: string): LegalCase | undefined {
  return MOCK_CASES.find((c) => c.id === id || c.caseNumber === id);
}

/**
 * Cases for a role's *list view*. Not a privacy boundary — see below.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DO NOT USE THIS FOR ASK OR FOR THE COMMAND PALETTE. Use
 * `buildAskScope()` in `lib/ask/scope.ts`.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The `NON_LEGAL` branch returns every mock case on purpose, so the client
 * table can demonstrate all five statuses rather than only Northwind's two.
 * That is right for a table whose job is to show the range of states, and
 * wrong for anything that reads a case *back* to someone: a grounded answer
 * built on this would name other companies' matters, which in a legal product
 * reads as a confidentiality breach rather than as generous seed data.
 *
 * `lib/ask/scope.ts` is the strict version and carries the matching comment.
 * The two look similar enough to invite merging; they must not be merged.
 */
export function getCasesForRole(role: Role): LegalCase[] {
  switch (role) {
    case 'NON_LEGAL':
      // Design playground: surface every mock case in the client view so the
      // list demonstrates all statuses and conversations, not just Northwind's.
      return MOCK_CASES;
    case 'LEGAL':
      // Lawyers see only claim-ready, in-progress, or closed cases visible to them.
      return MOCK_CASES.filter(
        (c) =>
          c.status === 'READY_FOR_CLAIM' ||
          c.status === 'IN_PROGRESS' ||
          c.status === 'CLOSED',
      );
    case 'INTERNAL_ADMIN':
    case 'INTERNAL_ASSISTANT':
      return MOCK_CASES;
  }
}

export function getCasesStatusCounts(cases: LegalCase[]) {
  return cases.reduce<Record<string, number>>(
    (acc, c) => ({ ...acc, [c.status]: (acc[c.status] ?? 0) + 1 }),
    {},
  );
}

export function getCasesForCompany(companyId: string): LegalCase[] {
  return MOCK_CASES.filter(
    (c) => c.ownerCompanyId === companyId || c.legalCompanyId === companyId,
  );
}
