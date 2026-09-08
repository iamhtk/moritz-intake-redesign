import type { Invoice, Payment } from '@/lib/types';

// Invoices are spread across the eight mock cases to exercise every payment
// state the client Payments tab can render: requested, additional-requested,
// failed, processing, completed, (partially) refunded, and cancelled/void.
export const MOCK_INVOICES: Invoice[] = [
  // case_001 — completed deposit + a second open request (additional requested).
  {
    id: 'inv_001',
    number: 'INV-2026-0114-A',
    caseId: 'case_001',
    amount: 8_500,
    currency: 'USD',
    status: 'PAID',
    hostedUrl: 'https://example.invoice/INV-2026-0114-A',
    paidAt: '2026-05-13T14:00:00.000Z',
    createdAt: '2026-05-11T10:14:00.000Z',
    taxAmount: 723,
  },
  {
    id: 'inv_002',
    number: 'INV-2026-0114-B',
    caseId: 'case_001',
    amount: 2_400,
    currency: 'USD',
    status: 'OPEN',
    hostedUrl: 'https://example.invoice/INV-2026-0114-B',
    paidAt: null,
    createdAt: '2026-05-22T16:11:00.000Z',
    description:
      'Additional counsel time for the California carve-out redraft you asked for. This is on top of the initial payment.',
  },
  // case_002 — a single open invoice whose last payment attempt failed.
  {
    id: 'inv_004',
    number: 'INV-2026-0118',
    caseId: 'case_002',
    amount: 3_200,
    currency: 'USD',
    status: 'OPEN',
    hostedUrl: 'https://example.invoice/INV-2026-0118',
    paidAt: null,
    createdAt: '2026-05-20T09:30:00.000Z',
    failure: {
      reason: 'Your card was declined (insufficient funds).',
      attemptedAt: '2026-05-23T18:12:00.000Z',
    },
  },
  // case_003 — a single fully completed payment (closed case).
  {
    id: 'inv_003',
    number: 'INV-2026-0094',
    caseId: 'case_003',
    amount: 12_400,
    currency: 'USD',
    status: 'PAID',
    hostedUrl: 'https://example.invoice/INV-2026-0094',
    paidAt: '2026-04-29T08:00:00.000Z',
    createdAt: '2026-03-20T08:00:00.000Z',
    taxAmount: 1_054,
  },
  // case_004 — a single, simple open request.
  {
    id: 'inv_005',
    number: 'INV-2026-0121',
    caseId: 'case_004',
    amount: 1_000,
    currency: 'USD',
    status: 'OPEN',
    hostedUrl: 'https://example.invoice/INV-2026-0121',
    paidAt: null,
    createdAt: '2026-06-02T11:05:00.000Z',
  },
  // case_005 — payment initiated, awaiting bank confirmation (processing).
  {
    id: 'inv_006',
    number: 'INV-2026-0122',
    caseId: 'case_005',
    amount: 4_100,
    currency: 'USD',
    status: 'PROCESSING',
    hostedUrl: 'https://example.invoice/INV-2026-0122',
    paidAt: null,
    createdAt: '2026-06-03T13:40:00.000Z',
  },
  // case_006 — a cancelled/void request, reissued as a fresh open request.
  {
    id: 'inv_007',
    number: 'INV-2026-0123-A',
    caseId: 'case_006',
    amount: 5_600,
    currency: 'USD',
    status: 'VOID',
    hostedUrl: null,
    paidAt: null,
    createdAt: '2026-05-28T10:00:00.000Z',
    description:
      'Please ignore this request — we cancelled it and sent a corrected invoice below.',
  },
  {
    id: 'inv_008',
    number: 'INV-2026-0123-B',
    caseId: 'case_006',
    amount: 5_600,
    currency: 'USD',
    status: 'OPEN',
    hostedUrl: 'https://example.invoice/INV-2026-0123-B',
    paidAt: null,
    createdAt: '2026-06-01T09:15:00.000Z',
    description:
      'Reissued with the corrected amount after the earlier request was cancelled.',
  },
  // case_007 — a completed payment that was partially refunded.
  {
    id: 'inv_009',
    number: 'INV-2026-0125',
    caseId: 'case_007',
    amount: 3_800,
    currency: 'USD',
    status: 'PAID',
    hostedUrl: 'https://example.invoice/INV-2026-0125',
    paidAt: '2026-06-04T15:20:00.000Z',
    createdAt: '2026-06-02T08:10:00.000Z',
    description:
      'The MSA & DPA review came in under estimate, so we have refunded the difference.',
    taxAmount: 323,
    refundedAmount: 800,
    refundedAt: '2026-06-06T10:00:00.000Z',
  },
  // case_008 — completed deposit + an open balance request (additional requested).
  {
    id: 'inv_010',
    number: 'INV-2026-0124-A',
    caseId: 'case_008',
    amount: 2_250,
    currency: 'USD',
    status: 'PAID',
    hostedUrl: 'https://example.invoice/INV-2026-0124-A',
    paidAt: '2026-06-01T12:00:00.000Z',
    createdAt: '2026-05-30T09:00:00.000Z',
    taxAmount: 191,
  },
  {
    id: 'inv_011',
    number: 'INV-2026-0124-B',
    caseId: 'case_008',
    amount: 2_250,
    currency: 'USD',
    status: 'OPEN',
    hostedUrl: 'https://example.invoice/INV-2026-0124-B',
    paidAt: null,
    createdAt: '2026-06-05T14:30:00.000Z',
  },
];

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'pay_001',
    caseId: 'case_001',
    invoiceId: 'inv_001',
    amount: 8_500,
    currency: 'USD',
    status: 'succeeded',
    createdAt: '2026-05-13T14:00:00.000Z',
  },
  {
    id: 'pay_002',
    caseId: 'case_003',
    invoiceId: 'inv_003',
    amount: 12_400,
    currency: 'USD',
    status: 'succeeded',
    createdAt: '2026-04-29T08:00:00.000Z',
  },
];

export function getInvoicesForCase(caseId: string): Invoice[] {
  return MOCK_INVOICES.filter((i) => i.caseId === caseId);
}

export function getPaymentsForCase(caseId: string): Payment[] {
  return MOCK_PAYMENTS.filter((p) => p.caseId === caseId);
}
