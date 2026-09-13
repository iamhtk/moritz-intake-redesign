'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ChevronDown } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { caseStages, type CaseStageRow } from '@/lib/intake/case-stages';
import type { IntakePhase } from '@/lib/intake/phase';

/**
 * Where the case is in the firm's pipeline, on the screen the client lands on
 * after pressing send.
 *
 * `work-rail.tsx` is the same idea at the scale of a turn and it is the right
 * idea: steps that appear, tick, and stay, so the client watches work being
 * added rather than one label being overwritten. This is that pattern at the
 * scale of the engagement, which is where the brief's second complaint was
 * actually being made. What the client experienced before this was submit,
 * silence, a lawyer appearing in a chat, a document arriving, with three of the
 * seven steps behind it invisible and no way to tell how many were left.
 *
 * Built as its own component rather than by widening `WorkRail`, for the reason
 * `case-stages.ts` sets out: that rail's rows are created by a response
 * arriving, which is what makes it trustworthy, and a row for work that has not
 * happened yet cannot be one of them. Two components with a deliberately shared
 * visual language, and a divergence that is itself information.
 *
 * ## The divergence, which is the design
 *
 * **The live row does not spin.** `WorkRail` gives its running step a spinner
 * and the shimmer the rest of the flow uses for streaming, because something is
 * genuinely happening on the other end of a request that is open right now.
 * Here nothing is, or nothing we can see: a lawyer will read this brief at some
 * point in the next four hours, and a spinner would be this product claiming to
 * watch them do it. So the current row gets a filled mark and its sentence in
 * full ink, and the two rails stay honest about the difference between work in
 * flight and work in a queue.
 *
 * **It grows downward into grey rather than stopping.** The turn rail ends at
 * the last thing that happened, deliberately, so the line never points at
 * nothing. This one runs on through what is still ahead, because "how many more
 * of these are there" is half the question being asked and a rail that ends at
 * the present cannot answer it.
 *
 * **The work after acceptance folds away.** A client who has just pressed send
 * has one question and it is about the price. The four rows covering drafting,
 * review and delivery are one click below it rather than stacked on top of it:
 * present, because somebody deciding whether to spend money on a law firm is
 * entitled to see the process first, and closed, because it is not yet what
 * they came to find out. See `CaseStageGroup`.
 */
export function CaseProgress({
  phase,
  className,
}: {
  phase: IntakePhase;
  className?: string;
}) {
  const t = useTranslations('intake.caseProgress');
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const rows = caseStages(phase);
  const upToQuote = rows.filter((row) => row.group === 'quote');
  const afterAccepting = rows.filter((row) => row.group === 'work');

  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <h3 className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.14em]">
        {t('title')}
      </h3>

      {/*
       * No `role="status"` anywhere in here, and that is not an omission.
       *
       * `WorkRail` marks itself as a live region while a step is running,
       * because rows genuinely arrive under a screen reader user mid-read. This
       * rail is static for the whole time it is on screen: it changes only when
       * the phase does, which is a navigation the client has just performed.
       * Announcing it would re-read eight rows over whatever they were actually
       * listening to.
       */}
      <ol className="flex flex-col">
        {upToQuote.map((row, index) => (
          <StageRow
            key={row.id}
            row={row}
            label={t(`stage.${row.id}`)}
            detail={row.hasDetail ? t(`detail.${row.id}`) : null}
            /*
             * The connector is drawn by every row except the visually last one,
             * and which row that is depends on the fold. With the work group
             * closed the fourth quote row is the end of the rail and must not
             * trail a line into a button; with it open the line has to cross
             * into the first work row or the two groups read as two rails.
             */
            connected={index < upToQuote.length - 1 || open}
          />
        ))}
      </ol>

      {/*
       * The disclosure, under the rail rather than beside the heading.
       *
       * It sits where the next row would be, because that is what it opens: a
       * control in the heading would read as a setting on the whole block,
       * where this one is a continuation of the list the client is reading down.
       */}
      <div className="flex flex-col">
        {open ? (
          <ol id={panelId} className="flex flex-col">
            {afterAccepting.map((row, index) => (
              <StageRow
                key={row.id}
                row={row}
                label={t(`stage.${row.id}`)}
                detail={row.hasDetail ? t(`detail.${row.id}`) : null}
                connected={index < afterAccepting.length - 1}
              />
            ))}
          </ol>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls={panelId}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring -mx-1 mt-1 flex w-fit items-center gap-1.5 rounded-[0.5rem] px-1 py-0.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2"
        >
          {t(open ? 'hideWork' : 'showWork', { count: afterAccepting.length })}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'size-3 transition-transform duration-200 motion-reduce:transition-none',
              open && 'rotate-180',
            )}
            strokeWidth={2}
          />
        </button>
      </div>

      {/*
       * The sentence that stops the grey rows being read as a schedule.
       *
       * Eight rows in order is a strong implication that somebody knows how
       * long they take, and we do not: four hours is a quote turnaround and
       * nothing has been said to us about the rest. Saying so once, under the
       * rail, is cheaper than a rail that hedges on every row.
       */}
      <p className="text-muted-foreground text-[11.5px] leading-relaxed">
        {t('noTimings')}
      </p>
    </section>
  );
}

/**
 * One row: a mark, a line down to the next, and a sentence.
 *
 * The mark treatment carries the state on its own, so the sentence is free to
 * be a sentence. Three marks for three states, and the middle one is the one
 * worth arguing about: a filled disc rather than a ring or a spinner, because
 * `current` means "this is what your case is waiting on", which is a definite
 * fact and deserves a definite mark, while a ring would read as another empty
 * future row and a spinner would claim somebody is working on it this second.
 */
function StageRow({
  row,
  label,
  detail,
  connected,
}: {
  row: CaseStageRow;
  label: string;
  /**
   * The second line, where this stage has one (`CaseStage.hasDetail`).
   *
   * Only `pricing` does, and it carries the concurrent drafting work. See the
   * argument in `case-stages.ts`: steps 2 and 3 of the firm's pipeline do not
   * follow the quote, they run alongside it, inside the exact window the client
   * experiences as silence. This line is the only place the product says so.
   */
  detail: string | null;
  connected: boolean;
}) {
  const t = useTranslations('intake.caseProgress');
  const done = row.state === 'done';
  const current = row.state === 'current';

  return (
    <li className="flex gap-2.5">
      {/*
       * Drawn as a flex column beside the row rather than as a left border on
       * it, for the reason `WorkRail` gives: a border runs the full height of
       * the last row and points past the final mark at nothing.
       */}
      <div
        aria-hidden="true"
        className="flex flex-col items-center gap-1 pt-[3px]"
      >
        <span
          className={cn(
            'flex size-4 shrink-0 items-center justify-center rounded-full border',
            done && 'border-border bg-background text-foreground',
            current && 'border-foreground bg-foreground text-background',
            // A future mark is the same ring at a third of the weight. Same
            // geometry on purpose: the rail should read as one line of marks
            // whose emphasis changes, not as two kinds of dot.
            row.state === 'future' && 'border-border/60 bg-background',
          )}
        >
          {done ? <Check className="size-2.5" strokeWidth={2.5} /> : null}
          {current ? (
            <span className="bg-background size-1.5 rounded-full" />
          ) : null}
        </span>
        {connected ? (
          <span
            className={cn(
              'w-px flex-1',
              // The line dims from the current row onward, so the rail itself
              // shows where the present is without needing a label for it.
              done ? 'bg-border' : 'bg-border/60',
            )}
          />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col pb-3">
        <span
          className={cn(
            'text-[13px] leading-5',
            current
              ? 'text-foreground font-medium'
              : done
                ? 'text-foreground'
                : 'text-muted-foreground',
          )}
        >
          {label}
        </span>
        {/*
         * The detail line, under the sentence it qualifies.
         *
         * Deliberately quieter than a `future` row's label. It is reassurance
         * about work already under way, not a step the client is waiting on,
         * and setting it at the weight of a stage would add an eighth row to a
         * rail whose whole job is saying how many there are.
         */}
        {detail ? (
          <span className="text-muted-foreground mt-1 text-[11.5px] leading-relaxed">
            {detail}
          </span>
        ) : null}
        {/*
         * The state in words, for a screen reader only.
         *
         * The marks are the visual answer and they are `aria-hidden`, so
         * without this every row reads identically and the rail's only content
         * is eight sentences in a list. "Done", "happening next" and "to come"
         * are the difference between a progress indicator and a table of
         * contents.
         */}
        <span className="sr-only">{t(`state.${row.state}`)}</span>
      </div>
    </li>
  );
}
