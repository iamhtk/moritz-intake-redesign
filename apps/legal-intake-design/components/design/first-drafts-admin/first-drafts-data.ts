/**
 * The fixture behind a case's first draft: which draft the agent is writing for
 * a case, and the clauses that draft is made of. The document itself is read in
 * the case's First draft tab.
 */

export type PaperSource =
  | 'Moritz template'
  | 'Customer template'
  | 'Third-party paper';

export type FindingSeverity = 'Red' | 'Orange' | 'Green';

export type DraftDocumentSection = {
  id: string;
  number: string;
  title: string;
  body: string;
  page: number;
  severity?: FindingSeverity;
  trace?: string;
  previousText?: string;
};

/** The draft the agent has produced for a case. */
export type DraftRun = {
  id: string;
  /** The case this draft belongs to, which is where it is read and revised. */
  caseId: string;
  client: string;
  document: string;
  paperSource: PaperSource;
  pages: number;
};

export const DRAFT_RUNS: DraftRun[] = [
  {
    id: 'FD-2841',
    caseId: 'case_007',
    client: 'DoorDash',
    document: 'Northwind_Master_Services_Agreement.docx',
    paperSource: 'Third-party paper',
    pages: 20,
  },
  {
    id: 'FD-2840',
    caseId: 'case_008',
    client: 'DoorDash',
    document: 'APAC_DPA_draft.docx',
    paperSource: 'Customer template',
    pages: 34,
  },
  {
    id: 'FD-2839',
    caseId: 'case_001',
    client: 'Linear',
    document: 'Procurement_Terms.docx',
    paperSource: 'Moritz template',
    pages: 52,
  },
  {
    id: 'FD-2838',
    caseId: 'case_004',
    client: 'DoorDash',
    document: 'Logistics_Framework_Agreement.docx',
    paperSource: 'Third-party paper',
    pages: 148,
  },
  {
    id: 'FD-2837',
    caseId: 'case_006',
    client: 'Canva',
    document: 'Creator_Partnership_Brief.pdf',
    paperSource: 'Moritz template',
    pages: 12,
  },
  {
    id: 'FD-2834',
    caseId: 'case_002',
    client: 'DoorDash',
    document: 'Payments_Amendment_v8.docx',
    paperSource: 'Third-party paper',
    pages: 501,
  },
];

/** The draft being written for a case, if the agent has produced one. */
export function getDraftRunForCase(caseId: string) {
  return DRAFT_RUNS.find((run) => run.caseId === caseId);
}

export const DRAFT_DOCUMENT_SECTIONS: DraftDocumentSection[] = [
  {
    id: 'parties',
    number: '',
    title: 'Master Services Agreement',
    body: 'This Master Services Agreement is entered into between DoorDash, Inc. (“Customer”) and Northwind Logistics LLC (“Supplier”) as of the Effective Date. The parties agree that each Statement of Work will be governed by this Agreement.',
    page: 1,
  },
  {
    id: 'services',
    number: '1.',
    title: 'Services',
    body: 'Supplier will perform the services described in each Statement of Work in a professional and workmanlike manner, using personnel with the qualifications and experience reasonably necessary to perform those services.',
    page: 1,
  },
  {
    id: 'fees',
    number: '2.',
    title: 'Fees and payment',
    body: 'Customer will pay undisputed invoices within forty-five (45) days after receipt. Supplier must submit invoices through Customer’s designated procurement system and identify the applicable purchase order.',
    page: 1,
  },
  {
    id: 'term',
    number: '3.',
    title: 'Term and renewal',
    previousText:
      'The Agreement renews automatically unless either party gives ninety (90) days’ written notice.',
    body: 'The Agreement renews automatically unless either party gives forty-five (45) days’ written notice.',
    page: 1,
    severity: 'Orange',
    trace: 'TERM-02 · approved fallback',
  },
  {
    id: 'warranties',
    number: '4.',
    title: 'Warranties',
    body: 'Supplier warrants that the Services will materially conform to the applicable Statement of Work and will be performed in accordance with applicable law. Supplier will promptly reperform nonconforming Services at no additional charge.',
    page: 1,
  },
  {
    id: 'intellectual-property',
    number: '5.',
    title: 'Intellectual property',
    body: 'Each party retains ownership of its pre-existing materials. Upon payment, Customer owns the Deliverables created specifically for Customer, excluding Supplier tools and general know-how embedded in those Deliverables.',
    page: 1,
  },
  {
    id: 'customer-responsibilities',
    number: '6.',
    title: 'Customer responsibilities',
    body: 'Customer will provide timely access to personnel, systems, and information reasonably required for Supplier to perform the Services. Supplier remains responsible for identifying dependencies and promptly notifying Customer of any anticipated delay.',
    page: 1,
  },
  {
    id: 'confidentiality',
    number: '7.',
    title: 'Confidentiality',
    body: 'Confidential Information includes written, electronic, and oral disclosures that a reasonable person would understand to be confidential, together with all copies and extracts of those disclosures.',
    page: 2,
    severity: 'Green',
    trace: 'CONF-01 · baseline position',
  },
  {
    id: 'security',
    number: '8.',
    title: 'Security and data protection',
    body: 'Supplier will maintain administrative, physical, and technical safeguards appropriate to the nature of Customer Data and will notify Customer without undue delay after discovering a Security Incident.',
    page: 2,
  },
  {
    id: 'privacy',
    number: '9.',
    title: 'Privacy and data use',
    body: 'Supplier will process Personal Data only as necessary to provide the Services and in accordance with Customer’s documented instructions. Supplier will not sell Customer Data or use it for advertising, profiling, or unrelated product development.',
    page: 2,
  },
  {
    id: 'insurance-main',
    number: '10.',
    title: 'Insurance',
    body: 'Supplier will maintain insurance coverage appropriate to its obligations, including commercial general liability, technology errors and omissions, cyber liability, and workers’ compensation coverage, with reputable insurers.',
    page: 2,
  },
  {
    id: 'indemnity',
    number: '11.',
    title: 'Indemnification',
    previousText:
      'Supplier’s aggregate liability for all third-party claims arising under this Agreement will be unlimited.',
    body: 'Supplier’s aggregate liability for third-party claims will not exceed two times the fees paid in the preceding twelve months, except that its IP infringement obligations remain uncapped.',
    page: 2,
    severity: 'Red',
    trace: 'LIAB-04 · fallback position',
  },
  {
    id: 'limitation-of-liability',
    number: '12.',
    title: 'Limitation of liability',
    body: 'Except for excluded claims, each party’s aggregate liability arising from this Agreement will not exceed the fees paid or payable during the twelve months preceding the event giving rise to the claim. Neither party is liable for indirect or consequential damages.',
    page: 3,
  },
  {
    id: 'termination',
    number: '13.',
    title: 'Termination',
    body: 'Either party may terminate this Agreement for an uncured material breach after thirty days’ written notice, or immediately if the other party becomes insolvent. Upon termination, Supplier will provide reasonable transition assistance and return Customer Data.',
    page: 3,
  },
  {
    id: 'notices',
    number: '14.',
    title: 'Notices',
    body: 'Formal notices must be in writing and delivered by personal delivery, nationally recognized overnight courier, or email with confirmation of receipt to the addresses specified in the applicable Statement of Work.',
    page: 3,
  },
  {
    id: 'general',
    number: '15.',
    title: 'General',
    body: 'This Agreement is governed by the laws of the State of New York. Neither party may assign this Agreement without the other party’s prior written consent, except in connection with a merger or sale of substantially all assets.',
    page: 3,
  },
  {
    id: 'definitions',
    number: '16.',
    title: 'Defined terms',
    body: '<p>“Affiliate” means an entity that directly or indirectly controls, is controlled by, or is under common control with a party. “Customer Data” means all information submitted to or collected by Supplier in connection with the Services.</p><p>“Deliverables” means the reports, configurations, documentation, and other work product identified in a Statement of Work. “Applicable Law” includes all laws and binding regulatory requirements applicable to the Services.</p>',
    page: 4,
  },
  {
    id: 'service-levels',
    number: 'Schedule 1.1',
    title: 'Service levels',
    body: '<p>Supplier will make the production Services available at least 99.9% of each calendar month, excluding approved maintenance windows. Availability is measured from Customer’s external monitoring points.</p><p>For a Severity 1 incident, Supplier will acknowledge the incident within fifteen minutes, provide hourly updates, and restore service within four hours. Repeated failures entitle Customer to the service credits set out below.</p>',
    page: 5,
    severity: 'Orange',
    trace: 'SLA-03 · customer standard',
  },
  {
    id: 'service-credits',
    number: 'Schedule 1.2',
    title: 'Service credits',
    body: '<p>Monthly availability below 99.9% but at or above 99.5% results in a credit equal to five percent of monthly fees. Availability below 99.5% but at or above 99.0% results in a ten percent credit.</p><p>Availability below 99.0% results in a twenty percent credit. Credits do not limit Customer’s termination rights for chronic service-level failure.</p>',
    page: 6,
  },
  {
    id: 'support',
    number: 'Schedule 1.3',
    title: 'Support and escalation',
    body: '<p>Supplier will provide support twenty-four hours per day for Severity 1 and Severity 2 incidents. Customer may escalate unresolved incidents to Supplier’s incident commander and executive sponsor.</p><p>Within five business days after a material incident, Supplier will provide a written root-cause analysis describing impact, timeline, corrective actions, and measures designed to prevent recurrence.</p>',
    page: 7,
  },
  {
    id: 'security-program',
    number: 'Schedule 2',
    title: 'Information security program',
    body: '<p>Supplier will maintain a written information security program aligned with ISO 27001 and appropriate to the sensitivity of Customer Data. The program will include risk assessment, access control, vulnerability management, secure development, and incident response.</p><p>Supplier will review the program at least annually and after a material change to the Services. Policies and evidence of control operation will be made available to Customer on reasonable request.</p>',
    page: 8,
    severity: 'Green',
    trace: 'SEC-01 · enterprise baseline',
  },
  {
    id: 'access-control',
    number: 'Schedule 2.1',
    title: 'Access control and personnel security',
    body: '<p>Access to Customer Data is limited to personnel with a documented business need and is protected by multi-factor authentication. Privileged access must be time-bound, logged, and reviewed quarterly.</p><p>Supplier will conduct appropriate background screening before granting access and require personnel to complete security and privacy training annually.</p>',
    page: 9,
  },
  {
    id: 'encryption',
    number: 'Schedule 2.2',
    title: 'Encryption and key management',
    body: '<p>Customer Data will be encrypted in transit using TLS 1.2 or later and at rest using AES-256 or an equivalent industry standard. Encryption keys will be stored separately from encrypted data.</p><p>Supplier will rotate keys according to documented schedules and immediately after suspected compromise. Access to key-management systems will be restricted and audited.</p>',
    page: 10,
  },
  {
    id: 'incident-response',
    number: 'Schedule 2.3',
    title: 'Security incident response',
    body: '<p>Supplier will notify Customer without undue delay and no later than twenty-four hours after confirming a Security Incident involving Customer Data. The notice will describe known facts, affected systems, and containment measures.</p><p>Supplier will preserve relevant evidence, cooperate with Customer’s investigation, and provide updates until containment and remediation are complete.</p>',
    page: 11,
    severity: 'Red',
    trace: 'SEC-07 · notification requirement',
  },
  {
    id: 'business-continuity',
    number: 'Schedule 2.4',
    title: 'Business continuity and disaster recovery',
    body: '<p>Supplier will maintain business continuity and disaster recovery plans covering critical personnel, infrastructure, communications, and third-party dependencies. Plans will be tested at least annually.</p><p>The Services will have a recovery time objective of four hours and a recovery point objective of one hour. Material test findings will be remediated promptly.</p>',
    page: 12,
  },
  {
    id: 'data-processing',
    number: 'Schedule 3',
    title: 'Data processing terms',
    body: '<p>Supplier will process Personal Data only on documented Customer instructions and only for the purpose of providing the Services. Supplier will comply with applicable data protection laws and notify Customer if an instruction appears unlawful.</p><p>Supplier will ensure that persons authorized to process Personal Data are bound by confidentiality obligations and receive appropriate privacy training.</p>',
    page: 13,
  },
  {
    id: 'subprocessors',
    number: 'Schedule 3.1',
    title: 'Subprocessors',
    body: '<p>Supplier may engage subprocessors listed in the approved subprocessor schedule. Supplier remains responsible for each subprocessor’s performance and will impose data protection obligations no less protective than this Agreement.</p><p>Supplier will provide at least thirty days’ prior notice of a new subprocessor and will work in good faith to address Customer’s reasonable objection.</p>',
    page: 14,
    severity: 'Orange',
    trace: 'PRIV-04 · notice fallback',
  },
  {
    id: 'international-transfers',
    number: 'Schedule 3.2',
    title: 'International data transfers',
    body: '<p>Where Personal Data is transferred from the European Economic Area to a country without an adequacy decision, the parties incorporate the applicable Standard Contractual Clauses.</p><p>Supplier will implement supplementary measures identified by the transfer impact assessment and provide information reasonably required to evaluate transfer risk.</p>',
    page: 15,
  },
  {
    id: 'audit-rights',
    number: 'Schedule 4',
    title: 'Audit and assurance',
    body: '<p>Once annually, Supplier will provide its then-current SOC 2 Type II report, penetration-test summary, and ISO 27001 certificate. Customer will protect those materials as Supplier Confidential Information.</p><p>If the materials do not reasonably demonstrate compliance, Customer may conduct a focused audit on thirty days’ notice. Additional audits are permitted following a Security Incident or regulator request.</p>',
    page: 16,
  },
  {
    id: 'insurance',
    number: 'Schedule 5',
    title: 'Insurance requirements',
    body: '<p>During the Term and for two years afterward, Supplier will maintain commercial general liability, technology errors and omissions, cyber liability, workers’ compensation, and automobile liability coverage.</p><p>Cyber and technology errors and omissions coverage will have limits of at least five million dollars per claim and in the aggregate. Certificates of insurance will be provided on request.</p>',
    page: 17,
  },
  {
    id: 'statement-of-work',
    number: 'Exhibit A',
    title: 'Initial Statement of Work',
    body: '<p>Supplier will configure and operate the Northwind logistics optimization service for Customer’s United States delivery network. Deliverables include implementation planning, integration support, production monitoring, and quarterly optimization reports.</p><p>The implementation begins on the Effective Date and is targeted for production launch within twelve weeks, subject to Customer’s timely provision of access and required technical information.</p>',
    page: 18,
  },
  {
    id: 'fees-exhibit',
    number: 'Exhibit B',
    title: 'Fees and invoicing schedule',
    body: '<p>Implementation services are provided for a fixed fee of $180,000. Recurring platform fees are $42,000 per month beginning on production launch. Approved travel expenses are reimbursable at cost without markup.</p><p>Supplier will not exceed a Statement of Work estimate without Customer’s prior written approval. Each invoice must include sufficient detail to validate the applicable milestone or service period.</p>',
    page: 19,
  },
  {
    id: 'signatures',
    number: '',
    title: 'Signatures',
    body: '<p>The parties have caused their authorized representatives to execute this Agreement as of the Effective Date.</p><p><strong>DOORDASH, INC.</strong><br><br>By: ______________________________<br>Name: ____________________________<br>Title: _____________________________<br>Date: _____________________________</p><p><strong>NORTHWIND LOGISTICS LLC</strong><br><br>By: ______________________________<br>Name: ____________________________<br>Title: _____________________________<br>Date: _____________________________</p>',
    page: 20,
  },
];
