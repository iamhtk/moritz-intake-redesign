'use client';

import { useState } from 'react';
import { ChevronRight, Undo2 } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

import { Badge } from '@/components/design/foundations/components/badge';
import { Button } from '@/components/design/foundations/components/button';

import type { CellRevision } from '../types';
import { getCellBadges } from '../utils/badgeVariants';
import { formatAbsoluteTime, formatRelativeTime } from '../utils/relativeTime';

/**
 * A revision's value, rendered the way the grid renders it: badges for the
 * enum columns, clamped prose everywhere else. Two lines is enough to tell two
 * versions apart, which is all the list is for — the full text is one restore
 * or one scroll of the cell away.
 */
function RevisionValue({
  value,
  columnType,
  columnKey,
}: {
  value: string;
  columnType: string;
  columnKey?: string;
}) {
  const badges = getCellBadges(value, columnType, columnKey);

  if (badges) {
    return (
      <div className="flex flex-wrap items-center gap-1">
        {badges.map((badge) => (
          <Badge key={badge.label} variant={badge.variant}>
            {badge.label}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <p className="text-dt-fg-secondary line-clamp-2 text-sm leading-relaxed">
      {value.trim() === '' ? (
        <span className="text-dt-fg-tertiary italic">Empty</span>
      ) : (
        value
      )}
    </p>
  );
}

function Timestamp({ date }: { date: Date }) {
  return (
    <time
      dateTime={date.toISOString()}
      title={formatAbsoluteTime(date)}
      className="text-dt-fg-tertiary shrink-0 text-xs"
    >
      {formatRelativeTime(date)}
    </time>
  );
}

/**
 * A cell's edit history: who last changed it and when, with the full list of
 * earlier values a click away.
 *
 * Collapsed by default and deliberately so. The previous value used to sit
 * open below the current one, which put two walls of prose in a 350px panel
 * for what is usually a one-line question — who touched this. The list answers
 * that first and keeps the values behind a disclosure.
 */
export function CellHistory({
  revisions,
  columnType,
  columnKey,
  onRestore,
}: {
  /** Oldest first, extraction included. */
  revisions: CellRevision[];
  columnType: string;
  columnKey?: string;
  onRestore?: (revisionId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const latest = revisions[revisions.length - 1];
  if (!latest) return null;

  // Newest first: the list is read as a history, back from where the cell
  // stands now to the extraction it started from.
  const entries = [...revisions].reverse();

  return (
    <div className="space-y-2">
      <div className="text-dt-fg-tertiary flex flex-wrap items-center gap-x-1.5 text-xs">
        <span>
          {latest.isExtraction
            ? 'Extracted by'
            : latest.isProposal
              ? 'Proposed by'
              : 'Edited by'}{' '}
          {latest.author}
        </span>
        <span aria-hidden="true">·</span>
        <Timestamp date={latest.savedAt} />
        <span aria-hidden="true">·</span>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          className="text-dt-fg-secondary hover:text-dt-fg-primary focus-visible:outline-ring focus-visible:outline-solid -mx-1 inline-flex items-center gap-0.5 rounded px-1 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-0"
        >
          History ({revisions.length})
          <ChevronRight
            aria-hidden="true"
            className={cn('size-3 transition-transform', isOpen && 'rotate-90')}
          />
        </button>
      </div>

      {isOpen && (
        <ol className="space-y-3">
          {entries.map((revision, index) => {
            const isCurrent = index === 0;
            return (
              <li key={revision.id} className="group/revision relative pl-4">
                {/* The rail runs between dots, not past the last one, so the
                    history reads as ending rather than trailing off. */}
                {index !== entries.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="border-dt-line-tertiary absolute -bottom-3 left-0 top-2 border-l"
                  />
                )}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-0 top-1.5 size-1.5 -translate-x-1/2 rounded-full',
                    isCurrent ? 'bg-dt-fg-secondary' : 'bg-dt-line-primary',
                  )}
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="text-dt-fg-tertiary flex min-w-0 items-center gap-1.5 text-xs">
                    <span className="text-dt-fg-secondary truncate font-medium">
                      {revision.author}
                    </span>
                    <span aria-hidden="true">·</span>
                    <Timestamp date={revision.savedAt} />
                  </div>
                  {isCurrent ? (
                    <span className="text-dt-fg-tertiary shrink-0 text-xs">
                      Current
                    </span>
                  ) : (
                    onRestore && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRestore(revision.id)}
                        /*
                         * Kept out of the way until the row is under the
                         * pointer, so a list of five versions isn't a column of
                         * five buttons — but always there for the keyboard.
                         */
                        className="h-6 shrink-0 px-1.5 text-xs opacity-0 transition-opacity focus-visible:opacity-100 group-hover/revision:opacity-100"
                      >
                        <Undo2 aria-hidden="true" className="size-3" />
                        Restore
                      </Button>
                    )
                  )}
                </div>
                <div className="mt-0.5">
                  <RevisionValue
                    value={revision.value}
                    columnType={columnType}
                    columnKey={columnKey}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
