/**
 * Demo fixtures for the tabular playbooks index, carried over from the source app.
 */
export interface Column {
  key: string;
  label: string;
  type: string;
}

export type TabValue = 'all' | 'mine' | 'shared' | 'archived';

/**
 * The detail view renders the same demo grid whatever id is in the URL (see
 * `tabular-playbook-detail.tsx`), so its title is a constant rather than an
 * index lookup. Shared so the top-nav breadcrumb names the playbook the reader
 * is actually looking at.
 */
export const DEMO_TABULAR_PLAYBOOK_NAME = 'Pylon Provider Playbook';

/** Title for a playbook the user just created, which has no name to show yet. */
export const NEW_TABULAR_PLAYBOOK_NAME = 'Untitled playbook';

// Mock data for tabular playbooks
export interface TabularPlaybookItem {
  id: string;
  name: string;
  description: string;
  /** Client the playbook is being run for. Empty until one is assigned. */
  client: string;
  owner: string;
  ruleCount: number;
  updatedLabel: string;
  /**
   * Seeds the Archived tab. Archiving during a session is tracked separately,
   * in `tabular-playbook-archive`, so the fixtures stay a fixed starting point.
   */
  isArchived?: boolean;
}

export const mockTabularPlaybooks: TabularPlaybookItem[] = [
  {
    id: 'dt-1',
    name: 'Project Apex - Acquisition Target Contracts',
    description:
      "Due diligence review of target company's material contracts for change-of-control and consent provisions",
    client: 'Meridian Capital Partners',
    owner: 'Pamir Ehsas',
    ruleCount: 31,
    updatedLabel: '2 hours ago',
  },
  {
    id: 'dt-2',
    name: 'Northstar SaaS Vendor Agreements - Renewal Tracker',
    description:
      'Tracking auto-renewal dates, termination-for-convenience windows, and SLA commitments across vendor portfolio',
    client: 'Northstar Logistics',
    owner: 'You',
    ruleCount: 11,
    updatedLabel: '5 hours ago',
  },
  {
    id: 'dt-3',
    name: 'Confidentiality Agreements - Fund III Portfolio',
    description:
      'Comparing non-disclosure terms, carve-outs, and permitted disclosures across fund portfolio NDAs',
    client: 'Brightwater Ventures',
    owner: 'Daniel Dalla Vedova',
    ruleCount: 10,
    updatedLabel: '1 day ago',
  },
  {
    id: 'dt-4',
    name: 'Commercial Lease Portfolio - 2025 Expirations',
    description:
      'Extracting renewal options, rent escalation clauses, and assignment restrictions for leases expiring this year',
    client: 'Halcyon Retail Group',
    owner: 'Pamir Ehsas',
    ruleCount: 13,
    updatedLabel: '3 days ago',
  },
  {
    id: 'dt-5',
    name: 'Syndicated Credit Facilities - Covenant Comparison',
    description:
      'Comparing financial covenants, EBITDA definitions, and default triggers across borrower credit agreements',
    client: 'Ironbridge Bank',
    owner: 'Daniel Dalla Vedova',
    ruleCount: 27,
    updatedLabel: '5 days ago',
  },
  {
    id: 'dt-6',
    name: 'Employment Agreements - Executive Compensation Audit',
    description:
      'Reviewing change-in-control payments, non-compete scope, and equity vesting acceleration across executive contracts',
    client: 'Vertex Biosciences',
    owner: 'Pamir Ehsas',
    ruleCount: 10,
    updatedLabel: '1 week ago',
    isArchived: true,
  },
  {
    id: 'dt-7',
    name: 'IP License Agreements - Royalty Rate Benchmarking',
    description:
      'Benchmarking royalty rates, exclusivity terms, and sublicensing rights across technology licensing agreements',
    client: 'Pylon Technologies',
    owner: 'You',
    ruleCount: 24,
    updatedLabel: '2 weeks ago',
  },
  {
    id: 'dt-8',
    name: 'Master Services Agreements - Indemnity & Liability Review',
    description:
      'Analyzing indemnification obligations, liability caps, and limitation-of-liability carve-outs across MSA portfolio',
    client: 'Cobalt Health Systems',
    owner: 'Daniel Dalla Vedova',
    ruleCount: 18,
    updatedLabel: '3 weeks ago',
    isArchived: true,
  },
];

/**
 * Only the fixture ids have a seeded grid behind them. `createEmptyTabularPlaybook`
 * mints a timestamp id, so anything unrecognised is a playbook the user just
 * created and should open with no rules.
 */
export function isNewTabularPlaybook(id: string): boolean {
  return !mockTabularPlaybooks.some((playbook) => playbook.id === id);
}

/** Sentinel for "no client", since Radix Select reserves the empty string. */
export const UNASSIGNED_CLIENT = 'unassigned';

/**
 * Clients offered when creating a playbook. Derived from the fixtures so the
 * picker always lists the same names the index shows in its Client column.
 */
export const TABULAR_PLAYBOOK_CLIENTS: string[] = [
  ...new Set(mockTabularPlaybooks.map((playbook) => playbook.client)),
]
  .filter(Boolean)
  .sort((a, b) => a.localeCompare(b));

// Helper function to create empty tabular playbook
export const createEmptyTabularPlaybook = (): TabularPlaybookItem => ({
  id: `dt-${Date.now()}`,
  name: '',
  description: '',
  client: '',
  owner: 'You',
  ruleCount: 0,
  updatedLabel: 'Just created',
});
