import type { Notification, Role } from '@/lib/types';

// Notifications mirror the production in-app inbox (see the audit of
// apps/legal-intake): the same deliverable notification types, the same
// title/body copy generated at creation time, actor avatars, a
// `Case {caseNumber}: {caseTitle}` subtitle, and the INVOICE_CREATED Pay /
// "Invoice paid" states. Content is grounded in the shared mock cases and
// participants (see ./cases.ts) and is role-specific, matching production where
// clients, lawyers, and internal admins each receive a different set.
//
// Excluded on purpose (never surface as in-app rows in production):
// COMPANY_CREATED (email-only), QUOTE_CREATED and QUOTE_ACCEPTED (typed in the
// pg enum but not created in-app).

// Actor images reuse the participant avatars from ./cases.ts.
const DANIEL = {
  name: 'Daniel Dalla Vedova',
  image: '/onboarding-lawyers/daniel-dalla-vedova.png',
};
const CATARINA = {
  name: 'Catarina Milagre',
  image: '/onboarding-lawyers/catarina-milagre.png',
};
const AELITA = {
  name: 'Aélita Jacob',
  image: '/onboarding-lawyers/aelita-jacob.png',
};
const DEVON = {
  name: 'Devon Carter',
  image: '/onboarding-lawyers/james-whitfield.jpg',
};
const JORDAN = {
  name: 'Jordan Pierce',
  image: '/onboarding-lawyers/kyle-westaway.png',
};

// Client (NON_LEGAL) — the case owner's inbox. Base path `/client`.
const CLIENT_NOTIFICATIONS: Notification[] = [
  {
    id: 'ntf_client_001',
    type: 'INVOICE_CREATED',
    title: 'Payment Requested',
    content: 'A payment of $1,000 has been requested for your case.',
    read: false,
    createdAt: '2026-06-02T11:05:00.000Z',
    caseNumber: 'M-2026-0121',
    caseTitle: 'NDA review: manufacturing partner',
    triggeredBy: null,
    invoice: { id: 'inv_client_0121', status: 'PENDING' },
    href: '/client/cases/M-2026-0121?tab=payments',
  },
  {
    id: 'ntf_client_002',
    type: 'NEW_MESSAGE',
    title: 'New message from Daniel Dalla Vedova',
    read: false,
    createdAt: '2026-06-06T09:41:00.000Z',
    caseNumber: 'M-2026-0114',
    caseTitle: 'Supplier renewal clause: California',
    triggeredBy: DANIEL,
    href: '/client/cases/M-2026-0114?tab=messages',
  },
  {
    id: 'ntf_client_003',
    type: 'CASE_OWNER_CHANGED',
    title: 'Case owner changed',
    content: 'The case owner has been updated by Moritz support.',
    read: false,
    createdAt: '2026-06-01T15:20:00.000Z',
    caseNumber: 'M-2026-0121',
    caseTitle: 'NDA review: manufacturing partner',
    triggeredBy: JORDAN,
    href: '/client/cases/M-2026-0121',
  },
  {
    id: 'ntf_client_004',
    type: 'LAWYER_DIRECTLY_ASSIGNED',
    title: 'Daniel Dalla Vedova has been assigned to your case',
    read: true,
    createdAt: '2026-05-12T09:45:00.000Z',
    caseNumber: 'M-2026-0114',
    caseTitle: 'Supplier renewal clause: California',
    triggeredBy: DANIEL,
    href: '/client/cases/M-2026-0114',
  },
  {
    id: 'ntf_client_005',
    type: 'INVOICE_CREATED',
    title: 'Payment Requested',
    content: 'A payment of $5,600 has been requested for your case.',
    read: true,
    createdAt: '2026-05-29T16:30:00.000Z',
    caseNumber: 'M-2026-0123',
    caseTitle: 'Commercial lease renegotiation',
    triggeredBy: null,
    invoice: { id: 'inv_client_0123', status: 'PAID' },
    href: '/client/cases/M-2026-0123?tab=payments',
  },
  {
    id: 'ntf_client_006',
    type: 'CASE_CLOSED',
    title: 'IP licensing dispute: Nordic vendor status updated',
    content: 'IP licensing dispute: Nordic vendor moved to closed',
    read: true,
    createdAt: '2026-04-30T15:20:00.000Z',
    caseNumber: 'M-2026-0094',
    caseTitle: 'IP licensing dispute: Nordic vendor',
    triggeredBy: AELITA,
    href: '/client/cases/M-2026-0094',
  },
  {
    id: 'ntf_client_007',
    type: 'NEW_MESSAGE',
    title: 'New message from Catarina Milagre',
    read: false,
    createdAt: '2026-06-05T13:18:00.000Z',
    caseNumber: 'M-2026-0123',
    caseTitle: 'Commercial lease renegotiation',
    triggeredBy: CATARINA,
    href: '/client/cases/M-2026-0123?tab=messages',
  },
  {
    id: 'ntf_client_008',
    type: 'CASE_COLLABORATOR_ADDED',
    title: 'A new collaborator has been added to your case',
    content: 'Jordan Pierce has been added to your case.',
    read: false,
    createdAt: '2026-06-03T10:55:00.000Z',
    caseNumber: 'M-2026-0118',
    caseTitle: 'Employment termination review',
    triggeredBy: JORDAN,
    href: '/client/cases/M-2026-0118',
  },
  {
    id: 'ntf_client_009',
    type: 'INVOICE_CREATED',
    title: 'Payment Requested',
    content: 'A payment of $2,400 has been requested for your case.',
    read: true,
    createdAt: '2026-05-20T08:30:00.000Z',
    caseNumber: 'M-2026-0114',
    caseTitle: 'Supplier renewal clause: California',
    triggeredBy: null,
    invoice: { id: 'inv_client_0114', status: 'PAID' },
    href: '/client/cases/M-2026-0114?tab=payments',
  },
  {
    id: 'ntf_client_010',
    type: 'NEW_MESSAGE',
    title: 'New message from Aélita Jacob',
    read: true,
    createdAt: '2026-05-18T16:05:00.000Z',
    caseNumber: 'M-2026-0094',
    caseTitle: 'IP licensing dispute: Nordic vendor',
    triggeredBy: AELITA,
    href: '/client/cases/M-2026-0094?tab=messages',
  },
  {
    id: 'ntf_client_011',
    type: 'LAWYER_DIRECTLY_ASSIGNED',
    title: 'Catarina Milagre has been assigned to your case',
    read: true,
    createdAt: '2026-05-15T11:40:00.000Z',
    caseNumber: 'M-2026-0123',
    caseTitle: 'Commercial lease renegotiation',
    triggeredBy: CATARINA,
    href: '/client/cases/M-2026-0123',
  },
  {
    id: 'ntf_client_012',
    type: 'CASE_COLLABORATOR_REMOVED',
    title: 'A collaborator has been removed from your case',
    content: 'Jordan Pierce has been removed from your case.',
    read: true,
    createdAt: '2026-05-10T09:12:00.000Z',
    caseNumber: 'M-2026-0121',
    caseTitle: 'NDA review: manufacturing partner',
    triggeredBy: JORDAN,
    href: '/client/cases/M-2026-0121',
  },
  {
    id: 'ntf_client_013',
    type: 'CASE_CLOSED',
    title: 'Employment termination review status updated',
    content: 'Employment termination review moved to closed',
    read: true,
    createdAt: '2026-04-22T14:50:00.000Z',
    caseNumber: 'M-2026-0118',
    caseTitle: 'Employment termination review',
    triggeredBy: DANIEL,
    href: '/client/cases/M-2026-0118',
  },
];

// Lawyer (LEGAL) — the assigned/claimable firm's inbox. Base path `/legal`.
const LEGAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'ntf_legal_001',
    type: 'QUOTE_ROUND_INVITATION',
    title: "You've been invited to submit a quote",
    content:
      'A new quote round has been created for case "Analytics vendor MSA & DPA review". Deadline: Jun 8, 2026',
    read: false,
    createdAt: '2026-06-01T15:30:00.000Z',
    caseNumber: 'M-2026-0125',
    caseTitle: 'Analytics vendor MSA & DPA review',
    triggeredBy: null,
    href: '/legal/quotes/M-2026-0125',
  },
  {
    id: 'ntf_legal_002',
    type: 'CASE_READY_FOR_CLAIM',
    title: 'Courier platform renewal review status updated',
    content: 'Courier platform renewal review moved to ready for claim',
    read: false,
    createdAt: '2026-05-30T16:45:00.000Z',
    caseNumber: 'M-2026-0124',
    caseTitle: 'Courier platform renewal review',
    triggeredBy: null,
    href: '/legal/cases/M-2026-0124',
  },
  {
    id: 'ntf_legal_003',
    type: 'NEW_MESSAGE',
    title: 'New message from Devon Carter',
    read: false,
    createdAt: '2026-06-03T14:40:00.000Z',
    caseNumber: 'M-2026-0125',
    caseTitle: 'Analytics vendor MSA & DPA review',
    triggeredBy: DEVON,
    href: '/legal/cases/M-2026-0125?tab=messages',
  },
  {
    id: 'ntf_legal_004',
    type: 'LAWYER_DIRECTLY_ASSIGNED',
    title: 'You have been assigned to a case',
    read: true,
    createdAt: '2026-05-12T09:45:00.000Z',
    caseNumber: 'M-2026-0114',
    caseTitle: 'Supplier renewal clause: California',
    triggeredBy: JORDAN,
    href: '/legal/cases/M-2026-0114',
  },
  {
    id: 'ntf_legal_005',
    type: 'QUOTE_ROUND_CLOSED',
    title: 'Quote round has been closed',
    content:
      'The quote round for case "Courier platform renewal review" has been closed.',
    read: true,
    createdAt: '2026-05-31T11:15:00.000Z',
    caseNumber: 'M-2026-0124',
    caseTitle: 'Courier platform renewal review',
    triggeredBy: null,
    href: '/legal/quotes/M-2026-0124',
  },
  {
    id: 'ntf_legal_006',
    type: 'CASE_COLLABORATOR_ADDED',
    title: 'You have been added to a new case.',
    content: 'Catarina Milagre has shared a new legal case with you.',
    read: true,
    createdAt: '2026-05-26T10:15:00.000Z',
    caseNumber: 'M-2026-0122',
    caseTitle: 'GDPR data subject request: vendor response',
    triggeredBy: CATARINA,
    href: '/legal/cases/M-2026-0122',
  },
];

// Internal admin — Moritz operations inbox. Base path `/admin`.
const ADMIN_NOTIFICATIONS: Notification[] = [
  {
    id: 'ntf_admin_001',
    type: 'CASE_OWNER_CHANGED',
    title: 'Case owner changed',
    content: 'The case owner has been updated by Moritz support.',
    read: false,
    createdAt: '2026-06-04T10:10:00.000Z',
    caseNumber: 'M-2026-0114',
    caseTitle: 'Supplier renewal clause: California',
    triggeredBy: JORDAN,
    href: '/admin/cases/M-2026-0114',
  },
  {
    id: 'ntf_admin_002',
    type: 'INVOICE_CREATED',
    title: 'Payment Requested',
    content: 'A payment of $4,500 has been requested for the case.',
    read: false,
    createdAt: '2026-06-02T09:00:00.000Z',
    caseNumber: 'M-2026-0124',
    caseTitle: 'Courier platform renewal review',
    triggeredBy: null,
    invoice: { id: 'inv_admin_0124', status: 'PENDING' },
    href: '/admin/cases/M-2026-0124?tab=payments',
  },
  {
    id: 'ntf_admin_003',
    type: 'CASE_COLLABORATOR_ADDED',
    title: 'A new collaborator has been added to the case',
    read: false,
    createdAt: '2026-05-24T09:30:00.000Z',
    caseNumber: 'M-2026-0121',
    caseTitle: 'NDA review: manufacturing partner',
    triggeredBy: JORDAN,
    href: '/admin/cases/M-2026-0121',
  },
  {
    id: 'ntf_admin_004',
    type: 'CASE_COLLABORATOR_REMOVED',
    title: 'A collaborator has been removed from the case',
    read: true,
    createdAt: '2026-05-23T13:12:00.000Z',
    caseNumber: 'M-2026-0118',
    caseTitle: 'Employment termination review',
    triggeredBy: JORDAN,
    href: '/admin/cases/M-2026-0118',
  },
  {
    id: 'ntf_admin_005',
    type: 'CASE_READY_FOR_CLAIM',
    title: 'GDPR data subject request: vendor response status updated',
    content:
      'GDPR data subject request: vendor response moved to ready for claim',
    read: true,
    createdAt: '2026-05-24T17:20:00.000Z',
    caseNumber: 'M-2026-0122',
    caseTitle: 'GDPR data subject request: vendor response',
    triggeredBy: null,
    href: '/admin/cases/M-2026-0122',
  },
  {
    id: 'ntf_admin_006',
    type: 'CASE_CLOSED',
    title: 'IP licensing dispute: Nordic vendor status updated',
    content: 'IP licensing dispute: Nordic vendor moved to closed',
    read: true,
    createdAt: '2026-04-30T15:20:00.000Z',
    caseNumber: 'M-2026-0094',
    caseTitle: 'IP licensing dispute: Nordic vendor',
    triggeredBy: AELITA,
    href: '/admin/cases/M-2026-0094',
  },
];

const NOTIFICATIONS_BY_ROLE: Record<Role, Notification[]> = {
  NON_LEGAL: CLIENT_NOTIFICATIONS,
  LEGAL: LEGAL_NOTIFICATIONS,
  INTERNAL_ADMIN: ADMIN_NOTIFICATIONS,
  INTERNAL_ASSISTANT: ADMIN_NOTIFICATIONS,
};

export function getNotificationsForRole(role: Role): Notification[] {
  return NOTIFICATIONS_BY_ROLE[role];
}

export function getUnreadNotificationCount(role: Role): number {
  return getNotificationsForRole(role).filter((n) => !n.read).length;
}
