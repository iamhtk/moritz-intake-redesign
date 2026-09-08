import type { IroncladDocument } from '@/lib/types';

/**
 * Mock "Imported from Ironclad" documents, keyed by case id. In the real
 * product Moritz would pull relevant executed contracts, templates, and
 * policies from the client's Ironclad workspace to enrich a case before the AI
 * and assigned lawyer start work. Here they are static placeholders for the
 * sales demo (see the Ironclad design flag) and reinforce the narrative in each
 * case's chat transcript.
 */
const IRONCLAD_DOCUMENTS_BY_CASE: Record<string, IroncladDocument[]> = {
  // Analytics vendor MSA & DPA review (opposing: Northstar Analytics).
  case_007: [
    {
      id: 'ic_007_001',
      name: 'Trellis Logistics DPA (standard).docx',
      kind: 'Template',
      counterparty: null,
      effectiveDate: '2025-09-01T00:00:00.000Z',
      syncedAt: '2026-06-01T09:12:00.000Z',
      summary:
        'Your standard data processing addendum, used to benchmark the vendor DPA.',
    },
    {
      id: 'ic_007_002',
      name: 'Segment Metrics MSA (executed 2024).pdf',
      kind: 'Executed contract',
      counterparty: 'Segment Metrics',
      effectiveDate: '2024-03-14T00:00:00.000Z',
      syncedAt: '2026-06-01T09:12:00.000Z',
      summary:
        'Prior analytics-vendor MSA; sub-processor and liability terms reused as a benchmark.',
    },
    {
      id: 'ic_007_003',
      name: 'Data Protection & Sub-processor Policy.pdf',
      kind: 'Policy',
      counterparty: null,
      effectiveDate: '2025-11-20T00:00:00.000Z',
      syncedAt: '2026-06-01T09:12:00.000Z',
      summary:
        'Internal policy requiring advance sub-processor notice for anything touching consumer PII.',
    },
    {
      id: 'ic_007_004',
      name: 'Northstar Analytics NDA (executed 2026).pdf',
      kind: 'Executed contract',
      counterparty: 'Northstar Analytics',
      effectiveDate: '2026-04-30T00:00:00.000Z',
      syncedAt: '2026-06-01T09:12:00.000Z',
      summary:
        'Existing NDA with the same vendor, signed during early diligence.',
    },
  ],
  // Courier platform renewal review (opposing: FleetLink).
  case_008: [
    {
      id: 'ic_008_001',
      name: 'FleetLink MSA (executed 2023).pdf',
      kind: 'Executed contract',
      counterparty: 'FleetLink',
      effectiveDate: '2023-07-01T00:00:00.000Z',
      syncedAt: '2026-05-30T10:05:00.000Z',
      summary:
        'Your original executed agreement, used to diff against the renewal paper.',
    },
    {
      id: 'ic_008_002',
      name: 'FleetLink Amendment No. 1 (2024).pdf',
      kind: 'Amendment',
      counterparty: 'FleetLink',
      effectiveDate: '2024-10-05T00:00:00.000Z',
      syncedAt: '2026-05-30T10:05:00.000Z',
      summary:
        'Prior amendment adjusting SLAs; confirms the mutual indemnity baseline.',
    },
    {
      id: 'ic_008_003',
      name: 'Vendor Liability & Indemnity Standard.docx',
      kind: 'Policy',
      counterparty: null,
      effectiveDate: '2025-08-12T00:00:00.000Z',
      syncedAt: '2026-05-30T10:05:00.000Z',
      summary:
        'Trellis playbook floor for vendors operating vehicles on your behalf.',
    },
    {
      id: 'ic_008_004',
      name: 'Certificate of Insurance - FleetLink.pdf',
      kind: 'Executed contract',
      counterparty: 'FleetLink',
      effectiveDate: '2026-01-15T00:00:00.000Z',
      syncedAt: '2026-05-30T10:05:00.000Z',
      summary:
        'Current COI on file; relevant to the vehicle-operations risk profile.',
    },
  ],
};

export function getIroncladDocumentsForCase(
  caseId: string,
): IroncladDocument[] {
  return IRONCLAD_DOCUMENTS_BY_CASE[caseId] ?? [];
}
