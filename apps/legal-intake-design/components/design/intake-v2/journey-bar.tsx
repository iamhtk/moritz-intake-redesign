'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ChevronDown } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { TABLET_COLUMN } from '@/lib/intake/layout';
import {
  JOURNEY_STEPS,
  journeyLineKey,
  journeyStepDone,
  journeyStepFor,
  type JourneyStepId,
} from '@/lib/intake/journey';
import type { IntakePhase } from '@/lib/intake/phase';
import { JourneySteps } from './journey-rail';

/**
 * The journey rail, laid out horizontally, for the widths with no room for a
 * column beside the page.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS RATHER THAN THE FOLDED LINE IT REPLACES.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Below `xl` the rail cannot have its own column — three panes and a fourth
 * track do not fit — and the first answer was a single line at the top naming
 * the step you were on, which opened downward. Two things were wrong with it.
 * It pushed both panes down by the height of whatever it opened, so the
 * conversation moved every time somebody checked where they were; and it named
 * one step, which answers "where am I" and not "how many more of these are
 * there", and the second question is half of the complaint in the brief.
 *
 * So: all four steps, across, in a bar the panes never move for.
 *
 * **Sticky, and that is the point of it.** Pinned to the top of the page, so
 * scrolling the transcript never takes the answer off screen. A stepper you
 * have to scroll back up to read is a stepper that is only there when you
 * already know.
 *
 * **What opens, opens over.** The disclosure is absolutely positioned under
 * the bar, so the panes keep their exact top edge whether it is open or shut.
 * Nothing below it reflows, ever. That was the brief for this component.
 *
 * **It carries the active step's sentence from `lg` up, and the brief's
 * percentage below it.** Two rows rather than one was chosen over the one-row
 * version after looking at both, and then the phone took the other side of
 * that trade: below `lg` the sentence is a caption for a stepper that is
 * already legible, and the row is worth more as the one place the measure
 * lives. Both are still a tap away in the panel. See `percent`.
 *
 * **It measures itself, not the window.** `@container`, not a media query, so
 * the bar reacts to the width it is actually given. Below 400px the labels
 * hold their size and `Document` becomes `Doc`, which was picked over
 * shrinking the type: 10px in a law firm's product reads like a disclaimer,
 * and an abbreviation reads like a small screen.
 *
 * **No connectors between the steps.** In the vertical rail a hairline runs
 * mark to mark and it reads well. Horizontally, with four labels of four
 * different lengths, the line has to thread through a gap that changes width
 * in every column and it looks fussy at every size. The bar's own bottom
 * hairline carries the quiet-thin-line rule instead, and four marks read left
 * to right as a sequence without help.
 */
export function JourneyBar({
  phase,
  accepted = false,
  percent = null,
  confirmed = null,
  total = null,
  className,
}: {
  phase: IntakePhase;
  /** Whether the quote has been accepted, which ticks one more row. */
  accepted?: boolean;
  /**
   * How much of the brief is confirmed, or `null` where the bar should not
   * report it (after submission, and from `lg` up where the brief has a
   * column of its own that already says).
   *
   * ───────────────────────────────────────────────────────────────────────
   * WHY THE NUMBER MOVED HERE.
   * ───────────────────────────────────────────────────────────────────────
   *
   * A phone was showing three rows of status before a single word of
   * content: this bar, then the brief's collapsible header with its own
   * percentage and its own progress rail, then the transcript. Two of those
   * rows were answering the same question in two vocabularies — "you are on
   * Brief" and "you are 20% through the brief" — which is the same answer
   * twice, and it cost about a fifth of a 390x844 screen to say.
   *
   * So the measure lives on the row that already tracks position, and the
   * brief's header goes back to being what it is: the thing you tap to open
   * the brief.
   */
  percent?: number | null;
  /**
   * The same measure as `percent`, unrounded, for `aria-valuetext`.
   *
   * A screen reader gets no bar to look at, so "80%" is the one reading it
   * cannot use; "4 of 5 confirmed" is the same fact in the form that answers
   * "how much is left". Passed rather than derived because this component is
   * given the percentage and has never seen the brief.
   */
  confirmed?: number | null;
  total?: number | null;
  className?: string;
}) {
  const t = useTranslations('intake.journey');
  const tBrief = useTranslations('intake.brief');
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrapper = useRef<HTMLElement>(null);

  const current = journeyStepFor(phase);
  const active = JOURNEY_STEPS[current]!;

  /*
   * Escape and a press anywhere else close it. Both, not one: the bar is the
   * width of the page, so "tap the thing again" means finding a strip that
   * the panel you just opened is sitting on top of.
   */
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onDown = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  return (
    <nav
      ref={wrapper}
      aria-label={t('label')}
      className={cn(
        /*
         * `z-30`, and the number is load-bearing rather than a round-up.
         *
         * This bar was `z-20`, and so is the sticky row directly beneath it
         * that carries the brief summary on a phone (and the conversation once
         * the case is sent). Two positioned siblings at the same z-index are
         * painted in DOM order, and that row comes second — so it won.
         *
         * That would have been invisible, because the two never overlap while
         * this bar is shut. Open it and they do: the disclosure below is
         * `absolute top-full`, drawn *over* the page rather than pushing it
         * down, and it landed underneath the very next bar. Its own `z-30`
         * could not save it, because `sticky` plus a `z-index` here makes this
         * element a stacking context and traps every descendant's z-index
         * inside it. The child cannot climb past a ceiling its parent set.
         *
         * So the fix belongs on the parent. One step above the row below it,
         * still far under the document overlay and the drop target at `z-50`.
         */
        '@container bg-background border-border sticky top-0 z-30 shrink-0 border-b',
        // `relative` for the progress rule pinned to the bottom edge below.
        'relative',
        className,
      )}
    >
      {/*
       * The whole bar is the control, because on a phone a 14px chevron is
       * not a tap target. Its contents are `aria-hidden` and it is named by
       * the step instead: a button whose accessible name is four step names
       * and a sentence is a button nobody can use, and the list semantics
       * would be flattened inside it anyway. The panel below carries the real
       * structure for assistive tech.
       */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          'focus-visible:ring-ring flex w-full flex-col gap-1 px-4 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset sm:px-6',
          /*
           * The doc's list of tap targets names "the rail's tap-to-open", and
           * this band is it below `xl`. It measured 34px because `py-2` is
           * sized for the bar's density rather than for a thumb. `min-h`
           * rather than the transparent `mz-tap` expansion used elsewhere: a
           * 44px invisible box centred on a 34px band overhangs the sticky
           * row directly beneath it by 5px and starts eating presses meant
           * for the brief summary. A band can afford the 10px; a hit area
           * that overlaps its neighbour cannot.
           */
          'max-lg:min-h-11 max-lg:justify-center',
          /*
           * The bar is the fifth band that has to take the tablet measure, or
           * four step names spread across 752px sit above a 640px column and
           * the two stop reading as the same page. The bar's own background
           * and its bottom progress rule stay full width: they are the page's
           * edge, not the column's.
           */
          TABLET_COLUMN,
        )}
      >
        <span className="sr-only">{t(`step.${active}`)}</span>

        <span aria-hidden="true" className="flex w-full items-center gap-2">
          {/*
           * Four equal columns, so the marks stay evenly spaced whatever the
           * labels say. With flex, `Document` would take more room than
           * `Brief` and the row would read as four things of different
           * importance.
           */}
          <span className="grid min-w-0 flex-1 grid-cols-4">
            {JOURNEY_STEPS.map((step, index) => (
              <BarStep
                key={step}
                step={step}
                done={journeyStepDone(phase, index)}
                current={index === current}
              />
            ))}
          </span>
          {/*
           * The brief's measure, on the row that already reports position.
           * `@max-[360px]` drops the word and keeps the figure: at that width
           * "20% confirmed" is competing with four step names for the same
           * line, and the number is the part that is news.
           */}
          {percent !== null ? (
            <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums lg:hidden">
              <span className="@max-[360px]:hidden">
                {tBrief('percentDone', { percent })}
              </span>
              <span className="@max-[360px]:inline hidden">{percent}%</span>
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              'text-muted-foreground/70 size-3.5 shrink-0 transition-transform duration-200 motion-reduce:transition-none',
              open && 'rotate-180',
            )}
            strokeWidth={2}
          />
        </span>

        {/*
         * The active step's sentence, full width under the row rather than
         * inside the active column: at four columns wide a column is 70px on
         * a phone and a sentence in it is two words a line.
         *
         * `journeyLineKey` rather than `line.${active}`, so the wait's
         * override reaches this row too: through `sending` the step is still
         * `brief` and the sentence is not.
         *
         * Truncated rather than wrapped, so the bar's height is a constant.
         * A bar that grows a line when the copy changes is a bar the panes
         * move for, which is the whole thing this component exists to stop.
         * The full sentence is in the panel a tap below.
         */}
        {/*
         * Gone below `lg`, kept above it.
         *
         * "You are telling us about the matter" is a caption for a stepper
         * the client can already read, directly under the word *Brief* with
         * a ring around it. On a laptop that is a free sentence; on a phone
         * it is 24px of the four hundred there are, spent restating the row
         * above it. The full sentence is still one tap away in the panel,
         * which is where a client who actually wants the detail goes.
         */}
        <span
          aria-hidden="true"
          className="text-muted-foreground hidden truncate text-xs leading-snug lg:block"
        >
          {t(journeyLineKey(active, phase))}
        </span>
      </button>

      {/*
       * The fill, as the bar's own bottom edge.
       *
       * It used to be a separate 3px rule under the brief's header, one row
       * down, measuring a number that was printed somewhere else again. Here
       * it is the underline of the figure it belongs to, and it costs no
       * height at all: it sits in the border the bar already had.
       *
       * The one green in the intake, under the same rule as everywhere else
       * it appears — a quantity, not a judgement. See `brief-column.tsx`.
       */}
      {percent !== null ? (
        <div
          className="bg-border absolute inset-x-0 bottom-0 h-[2px] lg:hidden"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={tBrief('progressLabel')}
          {...(confirmed !== null && total !== null
            ? {
                // The count rather than the percentage. Same rule, same
                // strings, as the panel's bar — see `brief-column.tsx`.
                'aria-valuetext': tBrief('progressValueText', {
                  confirmed,
                  total,
                }),
              }
            : {})}
        >
          <div
            className="bg-success h-full transition-[width] duration-[550ms] ease-out motion-reduce:transition-none"
            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          />
        </div>
      ) : null}

      {/*
       * Over the page, not above it. `absolute` from the sticky bar, so the
       * panes keep the same top edge open or shut and nothing below reflows.
       *
       * `omitLineFor` because the active step's sentence is already in the
       * bar, an inch higher. Without it, opening the bar on the first screen
       * printed "You are telling us about the matter." twice, one directly
       * above the other.
       */}
      {open ? (
        <div
          id={panelId}
          className="border-border bg-background absolute inset-x-0 top-full z-30 border-b px-4 py-3 shadow-sm sm:px-6"
        >
          {/*
           * The disclosure takes the same measure as the bar that opened it,
           * so its rows line up with the step marks above them instead of
           * hugging the left edge of a wider page. `max-w-sm` stays as the
           * inner limit: the step list is a list, not a column of prose.
           */}
          <div className={cn(TABLET_COLUMN, 'lg:mx-0')}>
            <div className="max-w-sm">
              <JourneySteps
                phase={phase}
                accepted={accepted}
                omitLineFor={active}
              />
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}

function BarStep({
  step,
  done,
  current,
}: {
  step: JourneyStepId;
  done: boolean;
  current: boolean;
}) {
  const t = useTranslations('intake.journey');

  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <BarMark done={done} current={current} />
      <span
        className={cn(
          'truncate text-xs font-medium leading-none',
          current || done ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {/*
         * `Document` is the only label long enough to be a problem at 320px.
         * Both strings are in the DOM and the container query picks between
         * them; a `@container` cannot swap text on its own.
         */}
        {step === 'document' ? (
          <>
            <span className="@max-[400px]:hidden">{t('step.document')}</span>
            <span className="@max-[400px]:inline hidden">
              {t('step.documentShort')}
            </span>
          </>
        ) : (
          t(`step.${step}`)
        )}
      </span>
    </span>
  );
}

/**
 * The same three marks as the rail, so the two layouts are one component in
 * the client's head. Green tick for done, dark ring for the step you are on,
 * hairline ring for what is still ahead, and no other colour.
 */
function BarMark({ done, current }: { done: boolean; current: boolean }) {
  if (done) {
    return (
      <span className="text-success flex size-3 shrink-0 items-center justify-center">
        <Check className="size-3" strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span
      className={cn(
        'size-2.5 shrink-0 rounded-full border',
        current ? 'border-foreground border-2' : 'border-border',
      )}
    />
  );
}
