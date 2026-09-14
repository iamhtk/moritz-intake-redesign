'use client';

import { useTranslations } from 'next-intl';
import { Check, ChevronDown } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import type { Brief } from '@/lib/intake/brief';

/**
 * The brief on a phone, when it is not open (Decision 18).
 *
 * Stacking the two panes is the easy half of mobile. The hard half is that a
 * brief filling in below a conversation is invisible — the client scrolls past
 * the composer to find it, or never does. So on small screens the brief
 * collapses to one line that carries the two things worth interrupting for:
 * what has just been settled, and what is being asked for next. Tapping it
 * opens the full brief.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NO NUMBERS ON IT ANY MORE.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * It used to carry a percentage and a 3px progress rail of its own, directly
 * under a journey bar that was already reporting position. Three rows of
 * status stacked above the first line of content, two of them answering the
 * same question. The measure moved up to the journey bar, where it underlines
 * the step row it belongs to (`journey-bar.tsx`), and this went back to being
 * one thing: the control that opens the brief, and a two-line summary of what
 * is in it.
 *
 * It is a real `aria-expanded` button over the panel it controls rather than a
 * `<details>`, because the panel is a landmark section with its own heading and
 * the open state has to be driven by the phase as well as by the tap.
 */
export function BriefSummaryBar({
  brief,
  open,
  onToggle,
  titlePending = false,
}: {
  brief: Brief;
  open: boolean;
  onToggle: () => void;
  /**
   * The recap is out writing the case name (item 16), same flag the panel
   * takes.
   *
   * It has to be read here too, or the two layouts disagree about what is
   * happening: the desktop heading shimmers "Writing up your case notes"
   * while this row, which *is* the heading below `lg`, sat on the generic
   * "Your case brief" as if nothing were running.
   */
  titlePending?: boolean;
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

  /*
   * The last thing the client actually settled.
   *
   * A collapsed brief that only says what is *missing* is a to-do list with
   * the done column cut off: "Next: What you need" is true and gives no
   * reason to believe anything has been recorded. One confirmed value turns
   * the row into a receipt — *we have this, and here is what is next* — which
   * is the whole argument for the panel being collapsible in the first place.
   *
   * Last in field order rather than last by time, because the brief has no
   * timestamps and does not need them: the fields are ordered the way they
   * are asked, so the deepest confirmed row is the newest one in every path
   * the conversation can actually walk.
   */
  const settled = [...brief.fields]
    .reverse()
    .find((field) => field.confirmed && field.value !== null);

  return (
    <div className="border-border border-b lg:hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="intake-brief-panel"
        className="focus-visible:outline-ring focus-visible:outline-solid flex w-full items-center gap-3 py-2.5 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-foreground truncate text-xs font-medium">
            {brief.title ??
              (titlePending ? (
                <span className="shimmer">{t('writingNotes')}</span>
              ) : (
                t('title')
              ))}
          </span>
          <span className="flex min-w-0 items-center gap-2">
            {settled ? (
              /*
               * A chip rather than another line of grey text, so the two
               * halves of the row read as two different kinds of thing: a
               * fact on the record, and a question still open. The tick is
               * the same mark the brief's own rows use for a confirmed
               * value, in the same ink weight.
               */
              <span className="bg-muted text-foreground inline-flex max-w-[55%] shrink items-center gap-1 rounded-full px-1.5 py-0.5 text-xs leading-none">
                <Check
                  aria-hidden="true"
                  className="text-success size-2.5 shrink-0"
                  strokeWidth={3}
                />
                <span className="truncate">{settled.value}</span>
                <span className="sr-only">
                  {t('summarySettled', { field: settled.label })}
                </span>
              </span>
            ) : null}
            <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
              {detail}
            </span>
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'text-muted-foreground size-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none',
            open && 'rotate-180',
          )}
        />
      </button>
    </div>
  );
}
