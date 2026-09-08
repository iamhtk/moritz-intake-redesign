/**
 * Mock data + persistence for the Playbook Studio design proposal.
 *
 * Ported from the "Playbook Studio" prototype, trimmed to the
 * create/edit surface (the run-against-document / compliance flow, AI-assistant
 * activity, and source citations are intentionally dropped). Playbooks persist
 * to localStorage so the library and editor read from the same canonical store
 * across navigations, seeded from a fixed set on first load. No backend — this
 * is playground-only mock data.
 *
 * The seed set (`seedPlaybooks`) is generated from the anonymized Moritz /
 * Voce AI MSA playbook export and lives in `playbook-studio-seed-data.ts`.
 */

export interface PlaybookFallback {
  position: string;
  language?: string;
  comment?: string;
}

/**
 * Severity mirrors the Moritz / Voce AI MSA playbook classification of how hard
 * a clause is to concede: "Material" positions are near hard-lines, "Standard"
 * are the everyday negotiation give-and-take, and "Nice-to-have" are low-stakes.
 */
export type PlaybookRuleSeverity = 'Material' | 'Standard' | 'Nice-to-have';

export interface PlaybookRule {
  id: string;
  title: string;
  preferredPosition: string;
  preferredLanguage?: string;
  preferredComment?: string;
  guidanceNote?: string;
  fallbacks: PlaybookFallback[];
  /** Clause grouping from the source playbook (e.g. "Scope/Access"). */
  category?: string;
  severity?: PlaybookRuleSeverity;
  /** Why the preferred position matters to us (source: "Benefit"). */
  benefit?: string;
  /** Long-form reasoning behind the position ladder (source: "Rationale"). */
  rationale?: string;
  /** Prior deals / precedent supporting the position. */
  precedent?: string;
  /** Summary of the standard clause / guideline for this position. */
  standardSummary?: string;
  /** The point at which we walk away rather than concede. */
  walkAwayTrigger?: string;
}

export interface PlaybookStudioPlaybook {
  id: string;
  name: string;
  description: string;
  owner: string;
  updatedLabel: string;
  rules: PlaybookRule[];
}

import { seedPlaybooks } from './playbook-studio-seed-data';

const STORAGE_KEY = 'playground:playbook-studio-v2';

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

/**
 * Demo: seed playbooks hidden from the library listing (and nav count). They
 * stay in the store (not deleted) and remain reachable by direct URL.
 * User-created/duplicated playbooks are never hidden.
 */
export const HIDDEN_PLAYBOOK_IDS = new Set<string>([
  'voce-msa-data-security-confidentiality',
  'voce-msa-ip-indemnity-liability',
  'voce-msa-term-boilerplate',
]);

/** Playbooks surfaced in the library and counted in the nav badge. */
export function getVisiblePlaybooks(): PlaybookStudioPlaybook[] {
  return getPlaybooks().filter(
    (playbook) => !HIDDEN_PLAYBOOK_IDS.has(playbook.id),
  );
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
