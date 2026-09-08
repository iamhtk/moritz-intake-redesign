'use client';

import { Sparkles, Undo2 } from '@repo/ui/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/design/foundations/components/button';
import { cn } from '@/lib/utils';

import type { PaperChange } from './first-draft-document-paper';
import { redlineBlocks, redlineCounts } from './redline';

/** Breathing room between two comments that would otherwise overlap. */
const GAP = 12;

/** Assumed until a bubble has been measured, so the first paint is close. */
const ESTIMATED_HEIGHT = 132;

/**
 * The agent's reasoning for one clause rewrite, as a comment.
 *
 * It is the agent's own account of why the wording moved, written when it made
 * the change, and it is read-only: ops answers it by asking for another change
 * or by putting the previous wording back, not by editing the note.
 */
export function ChangeNoteBubble({
  change,
  active,
  onHover,
  onRevert,
}: {
  change: PaperChange;
  active?: boolean;
  onHover?: (changeId?: string) => void;
  onRevert?: (changeId: string) => void;
}) {
  const counts = useMemo(
    () => redlineCounts(redlineBlocks(change.previousBody, change.body)),
    [change.previousBody, change.body],
  );

  return (
    <div
      onMouseEnter={() => onHover?.(change.id)}
      onMouseLeave={() => onHover?.(undefined)}
      className={cn(
        'bg-background rounded-lg border p-3 shadow-sm transition-colors duration-200',
        active ? 'border-primary/40' : 'border-field',
      )}
    >
      <div className="flex items-center gap-1.5">
        <Sparkles className="text-primary size-3.5 shrink-0" />
        <span className="text-foreground text-xs font-medium">Moritz AI</span>
        <span className="text-muted-foreground ml-auto font-mono text-[11px]">
          {counts.added > 0 ? `+${counts.added}` : null}
          {counts.added > 0 && counts.removed > 0 ? ' ' : null}
          {counts.removed > 0 ? `−${counts.removed}` : null}
        </span>
      </div>

      <p className="text-muted-foreground mt-1.5 text-xs/[1.5]">
        {change.note}
      </p>

      {onRevert ? (
        <Button
          variant="ghost"
          size="sm"
          className="-mb-1 -ml-2 mt-1.5 h-7 px-2 text-xs"
          onClick={() => onRevert(change.id)}
        >
          <Undo2 data-icon="inline-start" />
          Revert this clause
        </Button>
      ) : null}
    </div>
  );
}

/**
 * The margin: every comment in this version, each beside the clause it belongs
 * to.
 *
 * A comment is placed by measuring where its clause actually sits, because a
 * redline changes how tall a clause is and two rewrites can land a paragraph
 * apart. Where that would stack two comments on top of each other, the lower
 * one slides down — so the order always matches the document even when the
 * exact alignment cannot.
 */
export function ChangeNoteGutter({
  changes,
  pagesRef,
  activeChangeId,
  onHoverChange,
  onRevert,
  /** Anything that re-lays the pages out and so moves the clauses. */
  measureKey,
}: {
  changes: PaperChange[];
  pagesRef: React.RefObject<HTMLDivElement | null>;
  activeChangeId?: string;
  onHoverChange?: (changeId?: string) => void;
  onRevert?: (changeId: string) => void;
  measureKey?: string;
}) {
  const [tops, setTops] = useState<Record<string, number>>({});
  const [heights, setHeights] = useState<Record<string, number>>({});

  const measure = useCallback(() => {
    const pages = pagesRef.current;
    if (!pages) return;
    const origin = pages.getBoundingClientRect().top;
    const next: Record<string, number> = {};
    pages
      .querySelectorAll<HTMLElement>('[data-change-id]')
      .forEach((clause) => {
        const id = clause.dataset.changeId;
        if (id) next[id] = clause.getBoundingClientRect().top - origin;
      });
    setTops((current) => (same(current, next) ? current : next));
  }, [pagesRef]);

  // The pages resize when the preview is resized, when a version arrives, and
  // when the redline itself is toggled, so the measurement follows the element
  // rather than any one of those events.
  useEffect(() => {
    measure();
    const pages = pagesRef.current;
    if (!pages) return;
    const observer = new ResizeObserver(measure);
    observer.observe(pages);
    return () => observer.disconnect();
  }, [measure, pagesRef, measureKey]);

  // How tall a note is depends on how much the agent had to say, and that is
  // what decides whether the one below it has to move.
  const measureBubble = useCallback(
    (id: string) => (node: HTMLDivElement | null) => {
      if (!node) return;
      setHeights((current) =>
        current[id] === node.offsetHeight
          ? current
          : { ...current, [id]: node.offsetHeight },
      );
    },
    [],
  );

  const placed = useMemo(() => {
    let floor = -Infinity;
    return [...changes]
      .sort((a, b) => (tops[a.id] ?? 0) - (tops[b.id] ?? 0))
      .map((change) => {
        const top = Math.max(tops[change.id] ?? 0, floor);
        floor = top + (heights[change.id] ?? ESTIMATED_HEIGHT) + GAP;
        return { change, top };
      });
  }, [changes, heights, tops]);

  return (
    <>
      {placed.map(({ change, top }) => (
        <div
          key={change.id}
          ref={measureBubble(change.id)}
          style={{ transform: `translateY(${top}px)` }}
          className="absolute inset-x-0 top-0 transition-transform duration-300 ease-out"
        >
          <span
            aria-hidden
            className={cn(
              'absolute -left-6 top-5 w-6 border-t border-dashed transition-colors duration-200',
              activeChangeId === change.id
                ? 'border-primary/70'
                : 'border-primary/40',
            )}
          />
          <ChangeNoteBubble
            change={change}
            active={activeChangeId === change.id}
            onHover={onHoverChange}
            onRevert={onRevert}
          />
        </div>
      ))}
    </>
  );
}

function same(a: Record<string, number>, b: Record<string, number>) {
  const keys = Object.keys(b);
  return (
    keys.length === Object.keys(a).length &&
    keys.every((key) => Math.abs((a[key] ?? -1) - b[key]!) < 1)
  );
}
