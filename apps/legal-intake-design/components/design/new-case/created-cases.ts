/**
 * Tiny localStorage ledger of case titles created in the playground. Backend
 * stays stubbed here, so this stands in for "which case names already exist"
 * — enough to make the "Google Contract" -> "Google Contract 2" de-duplication
 * in `deriveCaseTitle` real across submissions.
 */

const STORAGE_KEY = 'playground:new-case-created-titles:v1';
const MAX_TITLES = 50;

export function readCreatedTitles(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t): t is string => typeof t === 'string');
  } catch {
    return [];
  }
}

export function recordCreatedTitle(title: string): void {
  if (typeof window === 'undefined') return;
  const next = [...readCreatedTitles(), title].slice(-MAX_TITLES);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage may be unavailable (private mode, quota); fail silently.
  }
}
