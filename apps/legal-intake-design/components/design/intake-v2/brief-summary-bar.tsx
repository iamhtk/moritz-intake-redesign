'use client';

import { useTranslations } from 'next-intl';
import { ChevronDown } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import type { Brief } from '@/lib/intake/brief';

/**
 * The brief on a phone, when it is not open (Decision 18).
 *
 * Stacking the two panes is the easy half of mobile. The hard half is that a
 * brief filling in below a conversation is invisible — the client scrolls past
 * the composer to find it, or never does. So on small screens the brief
 * collapses to one line that carries the two things worth interrupting for: how
 * far along this is, and what is being asked for next. Tapping it opens the
 * full brief.
 *
 * It is a real `aria-expanded` button over the panel it controls rather than a
 * `<details>`, because the panel is a landmark section with its own heading and
 * the open state has to be driven by the phase as well as by the tap.
 */
export function BriefSummaryBar({
  brief,
  progress,
  open,
  onToggle,
}: {
  brief: Brief;
  progress: { confirmed: number; filled: number; total: number };
  open: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations('intake.brief');

  // What the client is being asked for: the first required field with nothing
  // in it, or failing that the first value that still needs agreeing with.
  const nextMissing = brief.fields.find(
    (field) => field.required && field.value === null,
  );
  const nextUnconfirmed = brief.fields.find(
    (field) => field.value !== null && !field.confirmed,
  );

  const detail = nextMissing
    ? t('summaryNext', { field: nextMissing.label })
    : nextUnconfirmed
      ? t('summaryCheck', { field: nextUnconfirmed.label })
      : t('summaryReady');

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="intake-brief-panel"
      className="border-border focus-visible:outline-ring focus-visible:outline-solid flex w-full items-center gap-3 border-b py-3 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 lg:hidden"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-foreground text-xs font-medium">
          {brief.title ?? t('title')}
        </span>
        <span className="text-muted-foreground truncate text-[11.5px]">
          {detail}
        </span>
      </span>
      <span className="text-muted-foreground shrink-0 font-mono text-[11.5px]">
        {progress.confirmed} / {progress.total}
      </span>
      <ChevronDown
        aria-hidden="true"
        className={cn(
          'text-muted-foreground size-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none',
          open && 'rotate-180',
        )}
      />
    </button>
  );
}
