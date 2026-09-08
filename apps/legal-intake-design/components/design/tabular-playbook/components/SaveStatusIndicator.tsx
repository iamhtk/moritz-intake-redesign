'use client';

import { useEffect, useState } from 'react';
import { cn } from '@repo/ui/lib/utils';

import { formatRelativeTime } from '../utils/relativeTime';
import type { PlaybookSaveStatus } from '../utils/usePlaybookAutosave';

/** How often the "Saved 2 minutes ago" label re-reads the clock. */
const TICK_MS = 30_000;

/**
 * The workspace's autosave read-out: "Saving…" while an edit is outstanding,
 * then how long ago the last save landed. Sits with the playbook's other
 * metadata and stays quiet — it is a reassurance, not an action.
 *
 * Text only, and deliberately no spinner: the status sits inline with the rule
 * count, where an icon appearing and disappearing would jog the line every time
 * a cell is edited.
 */
export function SaveStatusIndicator({
  status,
  lastSavedAt,
  /** Shown before the first edit, e.g. the "3 days ago" from the last session. */
  idleLabel,
  className,
}: {
  status: PlaybookSaveStatus;
  lastSavedAt: Date | null;
  idleLabel?: string;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!lastSavedAt) return;
    // Re-read on every new save too, so a fresh one isn't described by a clock
    // reading from up to a tick ago.
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [lastSavedAt]);

  const label =
    status === 'saving'
      ? 'Saving…'
      : lastSavedAt
        ? `Saved ${formatRelativeTime(lastSavedAt, now)}`
        : idleLabel
          ? `Saved ${idleLabel}`
          : null;

  if (!label) return null;

  return (
    <span
      // Polite so the save lands in a screen reader's queue rather than cutting
      // across whatever the user is doing at the time.
      aria-live="polite"
      className={cn(
        'text-muted-foreground shrink-0 whitespace-nowrap text-xs',
        className,
      )}
    >
      {status === 'saved' && lastSavedAt ? (
        <time dateTime={lastSavedAt.toISOString()}>{label}</time>
      ) : (
        label
      )}
    </span>
  );
}
