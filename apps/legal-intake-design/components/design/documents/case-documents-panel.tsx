'use client';

import { useMemo, useState } from 'react';
import { Search } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { Input } from '@/components/design/design-system/input';
import { Chip } from '@/components/design/foundations/components/chip';
import type { Document } from '@/lib/types';
import { DocumentFamilyCard } from './document-family-card';
import {
  familyMatchesFilter,
  groupIntoFamilies,
  type DocumentFamily,
  type DocumentFilter,
} from './document-model';

const FILTERS: { value: DocumentFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'client', label: 'From client' },
  { value: 'counsel', label: 'From counsel' },
  { value: 'moritz', label: 'From Moritz' },
];

/**
 * Entrance stagger for the `mz-animate-step` reveal: the header, search, and
 * filter chips come in together as one step, then the document list follows —
 * each family on a tighter `FILE_STAGGER_MS` beat so the list reads as it
 * settles in.
 */
const FILES_BASE_MS = 120;
const FILE_STAGGER_MS = 50;

function matchesSearch(family: DocumentFamily, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (family.name.toLowerCase().includes(q)) return true;
  return family.versions.some((version) =>
    version.uploadedBy.toLowerCase().includes(q),
  );
}

/**
 * The redesigned Documents tab for the case-details panel. Groups every upload
 * into a version family, then lets the user search and filter by the side a
 * document came from. Built for the docked panel, so everything stacks
 * vertically and filter chips scroll horizontally rather than wrapping.
 */
export function CaseDocumentsPanel({
  documents,
  emptyState,
}: {
  documents: Document[];
  emptyState?: React.ReactNode;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<DocumentFilter>('all');

  const families = useMemo(() => groupIntoFamilies(documents), [documents]);

  const visibleFamilies = useMemo(
    () =>
      families.filter(
        (family) =>
          familyMatchesFilter(family, filter) && matchesSearch(family, search),
      ),
    [families, filter, search],
  );

  if (documents.length === 0) {
    return (
      <div className="mz-animate-step text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
        {emptyState ?? 'No documents have been uploaded yet.'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="mz-animate-step space-y-3"
        style={{ animationDelay: '0ms' }}
      >
        <p className="text-sm font-medium">
          {families.length} {families.length === 1 ? 'document' : 'documents'}
        </p>

        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or uploader"
            aria-label="Search documents"
            className="[&>input]:pl-8"
          />
        </div>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {FILTERS.map(({ value, label }) => {
            const active = filter === value;
            return (
              <Chip
                key={value}
                size="sm"
                aria-pressed={active}
                onClick={() => setFilter(value)}
                className={cn(
                  active &&
                    'bg-foreground text-background hover:bg-foreground! border-transparent',
                )}
              >
                {label}
              </Chip>
            );
          })}
        </div>
      </div>

      {visibleFamilies.length === 0 ? (
        <div
          className="mz-animate-step text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm"
          style={{ animationDelay: `${FILES_BASE_MS}ms` }}
        >
          No documents match your search or filter.
        </div>
      ) : (
        <ul className="space-y-1">
          {visibleFamilies.map((family, index) => (
            <li
              key={family.familyId}
              className="mz-animate-step"
              style={{
                animationDelay: `${FILES_BASE_MS + index * FILE_STAGGER_MS}ms`,
              }}
            >
              <DocumentFamilyCard family={family} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
