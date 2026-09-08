import type { CaseType, CaseTemplate } from '@/lib/types';

export const MOCK_CASE_TYPES: CaseType[] = [
  {
    id: 'ct_commercial_review',
    name: 'Commercial contract review',
    description:
      'Independent review of a commercial contract — supplier, lease, vendor, partnership.',
    requiredInformation: [
      'Contract or term sheet (PDF or DOCX)',
      'Relationship history with the counterparty',
      'Internal stakeholders and approvals required',
    ],
    templateCount: 3,
    updatedAt: '2026-05-12T08:00:00.000Z',
  },
  {
    id: 'ct_employment',
    name: 'Employment review',
    description: 'Termination, redundancy, or contract disputes.',
    requiredInformation: [
      'Employment agreement',
      'Termination notice or letter',
      'Timeline of events and witnesses',
    ],
    templateCount: 2,
    updatedAt: '2026-05-01T08:00:00.000Z',
  },
  {
    id: 'ct_ip_dispute',
    name: 'IP dispute',
    description: 'IP-licensing or trademark disputes with vendors or partners.',
    requiredInformation: [
      'IP-related agreements',
      'Asserted claim or communication',
      'Background on usage history',
    ],
    templateCount: 1,
    updatedAt: '2026-04-21T08:00:00.000Z',
  },
  {
    id: 'ct_contract_review',
    name: 'Quick contract review',
    description: 'Short-form contract or NDA review with rapid turnaround.',
    requiredInformation: ['Contract or NDA', 'Counterparty type', 'Deadline'],
    templateCount: 2,
    updatedAt: '2026-05-19T08:00:00.000Z',
  },
  {
    id: 'ct_privacy',
    name: 'Privacy / data protection',
    description:
      'GDPR / CCPA data subject requests, breach notifications, vendor reviews.',
    requiredInformation: [
      'Request received (or breach report)',
      'Affected data',
      'Vendor or platform involved',
    ],
    templateCount: 1,
    updatedAt: '2026-05-10T08:00:00.000Z',
  },
];

export const MOCK_CASE_TEMPLATES: CaseTemplate[] = [
  {
    id: 'tpl_001',
    caseTypeId: 'ct_commercial_review',
    title: 'Supplier renewal dispute — standard',
    description: 'Used for supplier renewal disputes with US suppliers.',
    previewText:
      'Dear Counsel, We write on behalf of {{clientCompany}} with respect to the renewal clause contained in Section {{section}} of the Master Services Agreement dated {{contractDate}}...',
    dataRequirements: ['clientCompany', 'section', 'contractDate'],
    updatedAt: '2026-05-12T08:00:00.000Z',
  },
  {
    id: 'tpl_002',
    caseTypeId: 'ct_commercial_review',
    title: 'Commercial lease — second opinion brief',
    description: 'Standard brief for a 3-page commercial lease review.',
    previewText:
      'Engagement scope: independent review of the lease attached, including indemnity, escalation, and termination clauses. Deliverable: a 1-page memo summarising risks and recommended changes.',
    dataRequirements: ['clientCompany', 'reviewDeadline'],
    updatedAt: '2026-05-19T08:00:00.000Z',
  },
  {
    id: 'tpl_003',
    caseTypeId: 'ct_employment',
    title: 'Termination risk note',
    description:
      'One-page risk note for a contested termination — wrongful dismissal analysis.',
    previewText:
      'Summary of risks: this note evaluates the wrongful dismissal exposure resulting from the termination on {{terminationDate}}. Findings are organised by procedural fairness, contract compliance, and damages exposure.',
    dataRequirements: ['terminationDate', 'employmentLengthYears'],
    updatedAt: '2026-05-01T08:00:00.000Z',
  },
];

export function getCaseTypeById(id: string): CaseType | undefined {
  return MOCK_CASE_TYPES.find((c) => c.id === id);
}

export function getTemplatesForCaseType(caseTypeId: string): CaseTemplate[] {
  return MOCK_CASE_TEMPLATES.filter((t) => t.caseTypeId === caseTypeId);
}

export function getTemplateById(id: string): CaseTemplate | undefined {
  return MOCK_CASE_TEMPLATES.find((t) => t.id === id);
}
