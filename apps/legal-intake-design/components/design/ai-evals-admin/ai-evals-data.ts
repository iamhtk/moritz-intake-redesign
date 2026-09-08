export type EvalGate = 'Pre-review' | 'Submission';
export type EvalStatus = 'Passed' | 'Blocked' | 'Review required' | 'Running';
export type FindingSeverity = 'Red' | 'Orange' | 'Green';
export type FindingCategory =
  | 'Critical legal'
  | 'Material'
  | 'Language'
  | 'Formatting';

export type EvalFinding = {
  id: string;
  severity: FindingSeverity;
  category: FindingCategory;
  title: string;
  description: string;
  location: string;
  recommendation: string;
};

export type FidelityCheck = {
  label: string;
  status: 'Passed' | 'Failed';
  detail: string;
};

export type EvalRun = {
  id: string;
  matter: string;
  client: string;
  document: string;
  version: string;
  gate: EvalGate;
  status: EvalStatus;
  score: number;
  duration: string;
  durationSeconds: number;
  completedAt: string;
  owner: string;
  findings: EvalFinding[];
  fidelityChecks: FidelityCheck[];
};

export type GoldenMatter = {
  id: string;
  matter: string;
  paperSource: 'Moritz paper' | 'Customer template' | 'Third-party paper';
  pages: number;
  score: number;
  baseline: number;
  result: 'Pass' | 'Regressed' | 'Critical';
  humanPreference: string;
};

export type CalibrationSample = {
  label: string;
  agreement: number;
  sampled: number;
};

const fidelityPassed: FidelityCheck[] = [
  {
    label: 'DOCX opens cleanly',
    status: 'Passed',
    detail: 'Package and relationships validated',
  },
  {
    label: 'Styles and numbering',
    status: 'Passed',
    detail: 'No missing or orphaned definitions',
  },
  {
    label: 'Tracked changes',
    status: 'Passed',
    detail: 'All revisions are well-formed',
  },
  {
    label: 'Spelling and grammar',
    status: 'Passed',
    detail: 'No unreported language defects',
  },
];

export const EVAL_RUNS: EvalRun[] = [
  {
    id: 'EV-1048',
    matter: 'Marketplace services agreement',
    client: 'Enterprise Customer X',
    document: 'Marketplace_Services_Agreement_v7.docx',
    version: 'v7',
    gate: 'Submission',
    status: 'Blocked',
    score: 72,
    duration: '8m 42s',
    durationSeconds: 522,
    completedAt: 'Today, 13:42',
    owner: 'Amelia Hart',
    findings: [
      {
        id: 'F-1048-1',
        severity: 'Red',
        category: 'Critical legal',
        title: 'Liability cap excludes data breach exposure',
        description:
          'The final edit removes data-security claims from the super-cap while the approved playbook requires them to remain uncapped.',
        location: 'Section 11.3 — Limitation of liability',
        recommendation:
          'Restore the data-security carve-out or record an authorized business override.',
      },
      {
        id: 'F-1048-2',
        severity: 'Orange',
        category: 'Material',
        title: 'Termination cure period exceeds fallback',
        description:
          'The counterparty cure period is 45 days. The approved final fallback is 30 days.',
        location: 'Section 14.2 — Termination for breach',
        recommendation:
          'Reduce the cure period to 30 days or confirm acceptance.',
      },
      {
        id: 'F-1048-3',
        severity: 'Green',
        category: 'Language',
        title: 'Defined term used before definition',
        description:
          '“Platform Services” first appears one paragraph before its definition.',
        location: 'Section 2.1 — Services',
        recommendation: 'Move the definition to its first use.',
      },
    ],
    fidelityChecks: fidelityPassed,
  },
  {
    id: 'EV-1047',
    matter: 'Data processing addendum',
    client: 'Northstar Labs',
    document: 'Northstar_DPA_final.docx',
    version: 'v4',
    gate: 'Submission',
    status: 'Passed',
    score: 96,
    duration: '6m 18s',
    durationSeconds: 378,
    completedAt: 'Today, 12:18',
    owner: 'Noah Williams',
    findings: [
      {
        id: 'F-1047-1',
        severity: 'Green',
        category: 'Formatting',
        title: 'Inconsistent paragraph spacing',
        description:
          'One schedule heading uses 8pt spacing instead of the document standard of 12pt.',
        location: 'Schedule 2 — Security measures',
        recommendation: 'Apply the Schedule Heading style.',
      },
    ],
    fidelityChecks: fidelityPassed,
  },
  {
    id: 'EV-1046',
    matter: 'Vendor master services agreement',
    client: 'Atlas Commerce',
    document: 'Atlas_MSA_redline_v3.docx',
    version: 'v3',
    gate: 'Pre-review',
    status: 'Review required',
    score: 84,
    duration: '7m 03s',
    durationSeconds: 423,
    completedAt: 'Today, 11:51',
    owner: 'AI drafting pipeline',
    findings: [
      {
        id: 'F-1046-1',
        severity: 'Orange',
        category: 'Material',
        title: 'Auto-renewal notice is outside preferred position',
        description:
          'The draft accepts 90 days while the playbook preference is 30 days and fallback is 60 days.',
        location: 'Section 12.1 — Term and renewal',
        recommendation: 'Revise to 60 days before lawyer review.',
      },
      {
        id: 'F-1046-2',
        severity: 'Green',
        category: 'Language',
        title: 'Ambiguous pronoun reference',
        description: '“It” may refer to either party or the service.',
        location: 'Section 5.4 — Cooperation',
        recommendation: 'Replace the pronoun with the named party.',
      },
    ],
    fidelityChecks: fidelityPassed,
  },
  {
    id: 'EV-1045',
    matter: 'Enterprise SaaS order form',
    client: 'Enterprise Customer X',
    document: 'Order_Form_2026_Q3.docx',
    version: 'v2',
    gate: 'Pre-review',
    status: 'Passed',
    score: 94,
    duration: '5m 49s',
    durationSeconds: 349,
    completedAt: 'Today, 10:26',
    owner: 'AI drafting pipeline',
    findings: [],
    fidelityChecks: fidelityPassed,
  },
  {
    id: 'EV-1044',
    matter: 'Commercial lease amendment',
    client: 'Harbor Retail',
    document: 'Lease_Amendment_v5.docx',
    version: 'v5',
    gate: 'Submission',
    status: 'Passed',
    score: 91,
    duration: '9m 11s',
    durationSeconds: 551,
    completedAt: 'Yesterday, 17:04',
    owner: 'Olivia Chen',
    findings: [
      {
        id: 'F-1044-1',
        severity: 'Green',
        category: 'Formatting',
        title: 'Table row may split across pages',
        description: 'The signature table does not retain rows as a unit.',
        location: 'Signature page',
        recommendation: 'Enable “Keep with next” for signature rows.',
      },
    ],
    fidelityChecks: fidelityPassed,
  },
  {
    id: 'EV-1043',
    matter: 'Payment services agreement',
    client: 'SignalPay',
    document: 'PSA_counterparty_v8.docx',
    version: 'v8',
    gate: 'Submission',
    status: 'Running',
    score: 0,
    duration: '3m 21s',
    durationSeconds: 201,
    completedAt: 'Started 13:51',
    owner: 'Ethan Brooks',
    findings: [],
    fidelityChecks: [],
  },
];

export const GOLDEN_MATTERS: GoldenMatter[] = [
  {
    id: 'GS-01',
    matter: 'Enterprise marketplace MSA',
    paperSource: 'Third-party paper',
    pages: 184,
    score: 94,
    baseline: 91,
    result: 'Pass',
    humanPreference: 'Platform preferred',
  },
  {
    id: 'GS-02',
    matter: 'US SaaS agreement',
    paperSource: 'Moritz paper',
    pages: 42,
    score: 97,
    baseline: 96,
    result: 'Pass',
    humanPreference: 'Tie',
  },
  {
    id: 'GS-03',
    matter: 'Customer procurement terms',
    paperSource: 'Customer template',
    pages: 68,
    score: 89,
    baseline: 92,
    result: 'Regressed',
    humanPreference: 'Benchmark preferred',
  },
  {
    id: 'GS-04',
    matter: 'Global data processing addendum',
    paperSource: 'Moritz paper',
    pages: 31,
    score: 96,
    baseline: 94,
    result: 'Pass',
    humanPreference: 'Platform preferred',
  },
  {
    id: 'GS-05',
    matter: 'Long-form logistics agreement',
    paperSource: 'Third-party paper',
    pages: 500,
    score: 92,
    baseline: 90,
    result: 'Pass',
    humanPreference: 'Platform preferred',
  },
];

export const CALIBRATION_TREND: CalibrationSample[] = [
  { label: 'Jul 7', agreement: 82, sampled: 18 },
  { label: 'Jul 14', agreement: 86, sampled: 22 },
  { label: 'Jul 21', agreement: 89, sampled: 24 },
  { label: 'Jul 28', agreement: 92, sampled: 27 },
];

export const DISAGREEMENTS = [
  {
    id: 'CAL-29',
    matter: 'Marketplace services agreement',
    category: 'Critical legal',
    evalLabel: 'Red',
    humanLabel: 'Orange',
    reviewers: 'Pamir + Daniel',
  },
  {
    id: 'CAL-28',
    matter: 'Customer procurement terms',
    category: 'Material',
    evalLabel: 'Orange',
    humanLabel: 'Green',
    reviewers: 'Marissa + Daniel',
  },
  {
    id: 'CAL-27',
    matter: 'Global data processing addendum',
    category: 'Formatting',
    evalLabel: 'Green',
    humanLabel: 'No finding',
    reviewers: 'Pamir + Marissa',
  },
] as const;
