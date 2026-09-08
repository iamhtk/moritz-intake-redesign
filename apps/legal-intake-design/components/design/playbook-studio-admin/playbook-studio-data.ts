/**
 * Mock data + persistence for the Playbook Studio design proposal.
 *
 * Ported from the "Playbook Studio" prototype, trimmed to the
 * create/edit surface (the run-against-document / compliance flow, AI-assistant
 * activity, and source citations are intentionally dropped). Playbooks persist
 * to localStorage so the library and editor read from the same canonical store
 * across navigations, seeded from a fixed set on first load. No backend — this
 * is playground-only mock data.
 */

export interface PlaybookFallback {
  position: string;
  language?: string;
  comment?: string;
}

export interface PlaybookRule {
  id: string;
  title: string;
  preferredPosition: string;
  preferredLanguage?: string;
  preferredComment?: string;
  guidanceNote?: string;
  fallbacks: PlaybookFallback[];
}

export interface PlaybookStudioPlaybook {
  id: string;
  name: string;
  description: string;
  owner: string;
  updatedLabel: string;
  rules: PlaybookRule[];
}

const ndaRecipientRules: PlaybookRule[] = [
  {
    id: 'rule-confidential-term',
    title: 'Confidentiality Term - 2 Years Maximum',
    preferredPosition:
      'Confidentiality obligations should expire no later than two (2) years after disclosure or termination, except for trade secrets which remain protected only as long as they qualify as trade secrets under applicable law.',
    preferredLanguage:
      'The obligations of confidentiality with respect to Confidential Information will terminate two (2) years following the date of disclosure, except that trade secrets will remain protected for so long as they qualify as trade secrets under applicable law.',
    preferredComment:
      "Our firm's standard position limits confidentiality to two years. Longer periods create unnecessary exposure for the recipient and are not market-standard for mutual NDAs. Trade secret protection under applicable law is sufficient to cover truly sensitive information beyond the general term.",
    guidanceNote:
      'This is a hard line for most of our clients. Do NOT accept terms longer than 3 years under any circumstances. If counterparty pushes back on 2 years, escalate to the partner before agreeing to 3 years. Only accept the 3-year fallback if the deal value exceeds $5M or the client has explicitly approved flexibility on this point.',
    fallbacks: [
      {
        position:
          'A three (3) year term is acceptable if limited to specifically identified Confidential Information and trade secrets remain protected under applicable law.',
        language:
          'The confidentiality obligations will terminate three (3) years after disclosure for all Confidential Information except trade secrets, which remain protected under applicable law.',
        comment:
          'While we prefer a two-year term, a three-year term is acceptable here given the nature of the engagement. This is a common compromise position that most counterparties will accept without further negotiation.',
      },
    ],
  },
  {
    id: 'rule-independent-dev',
    title:
      'Confidential Information - Exception for Independently Developed Information',
    preferredPosition:
      "Confidential Information should exclude information independently developed by the recipient or its representatives without use of the disclosing party's Confidential Information.",
    preferredLanguage:
      'Confidential Information does not include information independently developed by the Receiving Party or its Representatives without use of or reference to the Confidential Information.',
    preferredComment:
      "The independent development exception is critical to protect our client's ongoing R&D activities. Without this carve-out, the recipient risks claims that internally developed technology infringes on the discloser's confidential information, even when developed independently.",
    guidanceNote:
      'This exception is essential for technology clients with active R&D programs. If the counterparty insists on removing it, flag this to the partner immediately — it could expose the client to IP infringement claims on their own independent work. The fallback requiring written records is acceptable but advise the client to maintain development logs.',
    fallbacks: [
      {
        position:
          'Independent development exception is acceptable if it is limited to development without use of the Confidential Information and supported by written records.',
      },
    ],
  },
  {
    id: 'rule-prior-possession',
    title: 'Confidential Information - Exception for Prior Possession',
    preferredPosition:
      "Confidential Information should exclude information already in the recipient's possession from a source other than the disclosing party, provided it was not acquired in breach of a confidentiality obligation.",
    preferredLanguage:
      'Confidential Information does not include information already known to the Receiving Party from a source other than the Disclosing Party, so long as such information was not acquired in breach of any confidentiality obligation.',
    fallbacks: [
      {
        position:
          'Prior possession exception is acceptable if limited to documented possession and not derived from the disclosing party.',
      },
    ],
  },
  {
    id: 'rule-third-party',
    title: 'Confidential Information - Exception for Third Party Sources',
    preferredPosition:
      'Confidential Information should exclude information received from a third party without restriction and without breach of any confidentiality obligation.',
    preferredLanguage:
      'Confidential Information does not include information rightfully received from a third party without restriction and without breach of any confidentiality obligation.',
    fallbacks: [
      {
        position:
          'Third party exception is acceptable if the recipient has no reason to know the third party was bound by confidentiality.',
      },
    ],
  },
  {
    id: 'rule-standard-of-care',
    title: 'Standard of Care - Commercially Reasonable',
    preferredPosition:
      'Recipient must protect Confidential Information using commercially reasonable measures, but not less than the care used to protect its own information of similar sensitivity.',
    preferredLanguage:
      'Receiving Party will protect Confidential Information using commercially reasonable measures, and in no event less than the care it uses to protect its own Confidential Information of similar sensitivity.',
    preferredComment:
      "A 'commercially reasonable' standard with a floor tied to the recipient's own practices is the market standard. Avoid agreeing to 'best efforts' or 'highest degree of care' — these create an unreasonably high bar and potential liability exposure that is not insurable.",
    guidanceNote:
      "If counterparty proposes 'best efforts' or 'highest degree of care,' reject immediately — these standards are uninsurable and expose the client to disproportionate liability. Accept the fallback 'reasonable care' standard only if the floor provision is preserved.",
    fallbacks: [
      {
        position:
          "A reasonable care standard is acceptable if it includes a floor tied to the recipient's own confidential information practices.",
        comment:
          "This fallback ensures a minimum standard of care while avoiding the more aggressive 'commercially reasonable' language. The floor tied to the recipient's own practices provides objective benchmarking.",
      },
    ],
  },
  {
    id: 'rule-retention-backups',
    title: 'Retention of Electronic Backup Copies',
    preferredPosition:
      'Return and destruction obligations must allow retention of routine electronic backup copies, subject to ongoing confidentiality obligations.',
    preferredLanguage:
      'Notwithstanding return or destruction obligations, the Receiving Party may retain copies in routine electronic backup systems, which will remain subject to confidentiality obligations until deleted in the ordinary course.',
    fallbacks: [
      {
        position:
          'Backup retention is acceptable if access is restricted and confidentiality obligations survive.',
      },
    ],
  },
  {
    id: 'rule-residual-knowledge',
    title: 'Use of General Concepts Permitted',
    preferredPosition:
      'A residual knowledge carve-out should permit use of general ideas, concepts, and know-how retained in unaided memory, provided there is no intentional memorization.',
    preferredLanguage:
      'Nothing in this Agreement restricts the use of Residual Knowledge retained in the unaided memory of Representatives who have had access to Confidential Information, provided there was no intentional memorization.',
    fallbacks: [
      {
        position:
          'Residual knowledge carve-out is acceptable if limited to non-confidential concepts and unaided memory.',
      },
    ],
  },
  {
    id: 'rule-no-license',
    title: 'No License or Proprietary Rights Grant',
    preferredPosition:
      'Disclosure does not grant any license or rights to use, commercialize, or exploit Confidential Information.',
    preferredLanguage:
      'No rights or licenses are granted by disclosure of Confidential Information, whether by implication, estoppel, or otherwise.',
    fallbacks: [
      {
        position:
          'No-license language is acceptable if it includes both express and implied rights.',
      },
    ],
  },
];

/**
 * Seed playbooks used on first load (and as the SSR fallback). Owner of "You"
 * marks the playbooks attributed to the current user for the "My Playbooks" tab.
 */
export const seedPlaybooks: PlaybookStudioPlaybook[] = [
  {
    id: 'mutual-nda-recipient-protective',
    name: 'Mutual NDA - Recipient Protective',
    description:
      'Standard mutual NDA playbook with recipient-protective positions, controlled fallbacks for confidentiality term, exclusions, and return-of-materials obligations.',
    owner: 'Pamir Ehsas',
    updatedLabel: '3 days ago',
    rules: ndaRecipientRules,
  },
  {
    id: 'ma-purchase-agreement-buyer',
    name: 'M&A Purchase Agreement - Buyer Favorable',
    description:
      'Buyer-side positions for representations & warranties, indemnification baskets, and closing conditions in acquisition agreements.',
    owner: 'Daniel Dalla Vedova',
    updatedLabel: '1 week ago',
    rules: ndaRecipientRules.slice(0, 6),
  },
  {
    id: 'saas-subscription-customer',
    name: 'SaaS Subscription Agreement - Customer Protective',
    description:
      'Customer-protective positions covering data security obligations, SLA commitments, limitation of liability carve-outs, and termination for convenience.',
    owner: 'You',
    updatedLabel: '2 weeks ago',
    rules: ndaRecipientRules.slice(0, 5),
  },
  {
    id: 'commercial-lease-tenant',
    name: 'Commercial Lease - Tenant Favorable',
    description:
      'Tenant-favorable positions for assignment rights, renewal options, maintenance obligations, and early termination clauses in commercial leases.',
    owner: 'You',
    updatedLabel: '1 month ago',
    rules: ndaRecipientRules.slice(0, 4),
  },
];

const STORAGE_KEY = 'playground:playbook-studio-admin';

function clonePlaybooks(playbooks: PlaybookStudioPlaybook[]) {
  return playbooks.map((playbook) => ({
    ...playbook,
    rules: playbook.rules.map((rule) => ({
      ...rule,
      fallbacks: rule.fallbacks.map((fallback) => ({ ...fallback })),
    })),
  }));
}

export function getPlaybooks(): PlaybookStudioPlaybook[] {
  if (typeof window === 'undefined') return clonePlaybooks(seedPlaybooks);
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed as PlaybookStudioPlaybook[];
    }
  } catch {
    // localStorage may be disabled or hold malformed data; fall back to seed.
  }
  return clonePlaybooks(seedPlaybooks);
}

export function savePlaybooks(playbooks: PlaybookStudioPlaybook[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(playbooks));
  } catch {
    // localStorage may be disabled (private mode, quota); fail silently.
  }
}

export function getPlaybook(id: string): PlaybookStudioPlaybook | undefined {
  return getPlaybooks().find((playbook) => playbook.id === id);
}

/**
 * SSR-safe seed snapshot. Matches what `getPlaybooks()` returns on the server
 * (no localStorage), so client components can use it as their initial state and
 * then load the real store in a mount effect without a hydration mismatch.
 */
export function getSeedPlaybooks(): PlaybookStudioPlaybook[] {
  return clonePlaybooks(seedPlaybooks);
}

export function addPlaybook(playbook: PlaybookStudioPlaybook): void {
  savePlaybooks([playbook, ...getPlaybooks()]);
}

export function updatePlaybook(updated: PlaybookStudioPlaybook): void {
  savePlaybooks(
    getPlaybooks().map((playbook) =>
      playbook.id === updated.id ? updated : playbook,
    ),
  );
}

export function deletePlaybook(id: string): void {
  savePlaybooks(getPlaybooks().filter((playbook) => playbook.id !== id));
}

const randomSuffix = () => Math.random().toString(36).slice(2, 8);

export function createEmptyPlaybook(): PlaybookStudioPlaybook {
  return {
    id: `playbook-${Date.now()}-${randomSuffix()}`,
    name: '',
    description: '',
    owner: 'You',
    updatedLabel: 'Just now',
    rules: [],
  };
}

export function createEmptyRule(): PlaybookRule {
  return {
    id: `rule-${Date.now()}-${randomSuffix()}`,
    title: '',
    preferredPosition: '',
    fallbacks: [],
  };
}
