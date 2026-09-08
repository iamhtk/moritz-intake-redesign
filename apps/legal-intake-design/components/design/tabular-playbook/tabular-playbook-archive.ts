'use client';

import { useMemo, useSyncExternalStore } from 'react';

import {
  mockTabularPlaybooks,
  type TabularPlaybookItem,
} from './tabular-playbook-data';

/**
 * Which playbooks are archived, for the session.
 *
 * Archiving is reached from two screens that don't share a tree — the index and
 * a playbook's own header — so the state sits outside React and both subscribe
 * to it. It starts from the fixtures and lives only as long as the tab does;
 * the playground has no backend to persist it to.
 */
const listeners = new Set<() => void>();

let archivedIds: ReadonlySet<string> = new Set(
  mockTabularPlaybooks.filter((p) => p.isArchived).map((p) => p.id),
);

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return archivedIds;
}

export function setPlaybookArchived(id: string, archived: boolean) {
  if (archivedIds.has(id) === archived) return;
  const next = new Set(archivedIds);
  if (archived) next.add(id);
  else next.delete(id);
  archivedIds = next;
  listeners.forEach((listener) => listener());
}

/**
 * The archived ids. Seeded identically on the server, so the first render of a
 * subscribed component matches the markup it hydrates.
 */
export function useArchivedPlaybookIds(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useIsPlaybookArchived(id: string | undefined): boolean {
  const ids = useArchivedPlaybookIds();
  return id !== undefined && ids.has(id);
}

/** The playbooks the index lists, split by whether they have been archived. */
export function useTabularPlaybooksByArchiveState(): {
  active: TabularPlaybookItem[];
  archived: TabularPlaybookItem[];
} {
  const ids = useArchivedPlaybookIds();
  return useMemo(
    () => ({
      active: mockTabularPlaybooks.filter((p) => !ids.has(p.id)),
      archived: mockTabularPlaybooks.filter((p) => ids.has(p.id)),
    }),
    [ids],
  );
}
