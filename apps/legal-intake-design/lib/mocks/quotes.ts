import type { QuoteRound } from '@/lib/types';
import { MOCK_DOCUMENTS } from './documents';

export const MOCK_QUOTE_ROUNDS: QuoteRound[] = [
  {
    id: 'qr_001',
    caseId: 'case_002',
    caseNumber: 'M-2026-0118',
    caseTitle: 'Employment termination review',
    clientName: 'Anonymous client',
    clientCompany: 'US-based SaaS company',
    opposingPartyName: 'Anonymous individual',
    opposingPartyCompany: 'Former employee',
    benchmarkAmount: 4_200,
    yourQuoteAmount: null,
    yourQuoteStatus: 'NONE',
    expiresAt: '2026-05-30T17:00:00.000Z',
    anonymised: true,
    conflictReported: false,
    currency: 'USD',
    description:
      '## Scope\n\nQuick review of a contested termination. Looking for a strategy call plus a one-page risk note. Materials: termination notice, internal HR memo (redacted).',
    adminNotes:
      'Two firms invited. Benchmark is based on similar engagements within Moritz over the past 6 months.',
    documents: [MOCK_DOCUMENTS[2]!],
  },
  {
    id: 'qr_002',
    caseId: 'case_006',
    caseNumber: 'M-2026-0123',
    caseTitle: 'Commercial lease renegotiation',
    clientName: 'Anonymous client',
    clientCompany: 'Renewable-energy operator',
    opposingPartyName: 'Anonymous landlord',
    opposingPartyCompany: 'Commercial property holding',
    benchmarkAmount: 3_500,
    yourQuoteAmount: 3_900,
    yourQuoteStatus: 'SUBMITTED',
    expiresAt: '2026-06-02T17:00:00.000Z',
    anonymised: true,
    conflictReported: false,
    currency: 'USD',
    description:
      '## Scope\n\nIndependent review of a 3-year commercial lease renewal proposal. ~3 days turnaround.',
    adminNotes: null,
    documents: [],
  },
  {
    id: 'qr_003',
    caseId: 'case_005',
    caseNumber: 'M-2026-0122',
    caseTitle: 'GDPR data subject request: vendor response',
    clientName: 'Anonymous client',
    clientCompany: 'UK SaaS company',
    opposingPartyName: 'Data subject',
    opposingPartyCompany: 'None',
    benchmarkAmount: 1_800,
    yourQuoteAmount: null,
    yourQuoteStatus: 'CONFLICT',
    expiresAt: '2026-05-29T17:00:00.000Z',
    anonymised: true,
    conflictReported: true,
    currency: 'GBP',
    description:
      '## Scope\n\nDraft a response to a GDPR data subject access request that arrived through a vendor portal.',
    adminNotes: 'Conflict reported by Moritz on 2026-05-25.',
    documents: [],
  },
];

export function getQuoteRoundById(id: string): QuoteRound | undefined {
  return (
    MOCK_QUOTE_ROUNDS.find((q) => q.id === id) ||
    MOCK_QUOTE_ROUNDS.find((q) => q.caseId === id) ||
    MOCK_QUOTE_ROUNDS.find((q) => q.caseNumber === id)
  );
}
