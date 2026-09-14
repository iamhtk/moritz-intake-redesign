'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ChevronDown } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
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
 * **It carries the active step's sentence.** Two rows rather than one, and it
 * was chosen over the one-row version after looking at both: a client on a
 * phone should not have to tap to find out that the thing they are doing is
 * describing the matter, or — after they send — that a lawyer is reading it.
 * The sentence is the payload; the four names are the map around it.
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
  className,
}: {
  phase: IntakePhase;
  /** Whether the quote has been accepted, which ticks one more row. */
  accepted?: boolean;
  className?: string;
}) {
  const t = useTranslations('intake.journey');
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
        '@container bg-background border-border sticky top-0 z-20 shrink-0 border-b',
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
        className="focus-visible:ring-ring flex w-full flex-col gap-1 px-4 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset sm:px-6"
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
        <span
          aria-hidden="true"
          className="text-muted-foreground @max-[400px]:text-[10px] block truncate text-[11px] leading-snug"
        >
          {t(journeyLineKey(active, phase))}
        </span>
      </button>

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
          <div className="max-w-sm">
            <JourneySteps
              phase={phase}
              accepted={accepted}
              omitLineFor={active}
            />
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
          'truncate text-[12px] font-semibold leading-none',
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
        current ? 'border-foreground border-[1.5px]' : 'border-border',
      )}
    />
  );
}
