'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ChevronDown } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { caseStages, type CaseStageRow } from '@/lib/intake/case-stages';
import {
  JOURNEY_STAGES,
  JOURNEY_STEPS,
  journeyLineKey,
  journeyStepDone,
  journeyStepFor,
  type JourneyStepId,
} from '@/lib/intake/journey';
import type { IntakePhase } from '@/lib/intake/phase';

/**
 * Where the client is in the whole case, in the margin, for the whole flow.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE STEPPER, NOT TWO — AND IT LEFT THE PANEL.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This replaces two components that were the same component. `brief-stepper`
 * drew four steps across the bottom of the brief panel; `case-progress` drew
 * seven rows under the confirmation and again under the quote. Nobody meant to
 * build two — they arrived at different times for different screens — but a
 * client who pressed Send watched a four-step marker disappear and a seven-row
 * list take its place, which is the orientation complaint answered twice in two
 * different vocabularies. The seven nest inside the four exactly
 * (`JOURNEY_STAGES`), so there is one stepper: four headings, each of which
 * opens into the rows it is made of.
 *
 * **Why the margin rather than the panel.** The panel scrolls. A stepper inside
 * something that scrolls is a stepper the client cannot find when they want it,
 * and the brief this answers says *"people do not understand the steps in the
 * submission process, or where they are in it"* — which is a question asked at
 * an arbitrary moment, not at the bottom of a column. In its own column at the
 * far left it is always in the same place, whatever else the page is doing:
 * document open or closed, narrow or dragged wide, first reply or
 * confirmation. Not on the opening screen — nothing has started there, so
 * there is no position to report, and a tracker that appears mid-keystroke is
 * worse again. The card there (`how-it-works.tsx`) explains the same four
 * words; this reports on them once there is something to report. Mirrors the
 * document panel on the right.
 *
 * **It is a column, not an overlay.** See `JourneyRailColumn` for the three
 * ways the overlay version failed. Overlap is not avoided here, it is
 * impossible.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE THREE RULES, WHICH ARE THE WHOLE DESIGN.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **1. Very quiet.** A thin line, small grey text, black for the step you are
 * on, and a green tick for what is done. No cards, no boxes, no icons beyond
 * the tick and the disclosure chevron, no colour anywhere else. A vertical
 * stepper is one weight away from looking like a SaaS onboarding checklist,
 * which is the opposite of a law firm. If it pulls the eye off the
 * conversation it has failed, however accurate it is.
 *
 * **2. No numbers.** Not "Step 1 of 4", not a percentage, not a count. The
 * panel already reports progress *inside* the brief and that number is
 * genuinely useful there. A second number at a different zoom level, six inches
 * to the left, is two progress readings disagreeing in the client's peripheral
 * vision. The rail says which step, in a word.
 *
 * **3. Short lines.** The rail is 144px wide. Every sentence in it is written
 * to that measure — see `intake.journey` in `en.json` — rather than borrowed
 * from a panel that had 400px to play with.
 */

/**
 * The rail's own column, at the far left of the window.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS WAS AN OVERLAY, AND THE OVERLAY WAS WRONG.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The first version was `fixed` to the left edge and drew only when a
 * `ResizeObserver` said the page had left enough empty margin to be safe. The
 * appeal was that it cost the two panes nothing: on a wide display the 1600
 * cap centres the composition and leaves a margin the rail can live in for
 * free, so nothing had to move.
 *
 * It does not survive contact. Three separate ways it failed, and they are
 * worth writing down because they are the reasons *any* measured overlay is
 * the wrong shape here, not bugs in one attempt at it:
 *
 * 1. **The thing being measured is not one element.** The opening screen was a
 *    940px centred column; the two-pane screens are a grid. The effect bound
 *    its observer once, so the moment the client typed their first sentence it
 *    was watching a detached node and reporting its position forever.
 * 2. **A `ResizeObserver` hears about size, not position.** The transcript is
 *    capped at 56rem and centred inside its track, so docking a document or
 *    dragging it can move the first character 200px to the right without the
 *    observed box changing size at all. No callback, stale answer.
 * 3. **Reserving space to fix it is circular.** Padding the grid to make room
 *    changes the very number the measurement reads.
 *
 * So the rail is a real column now: 11.25rem of layout, at the far left, with
 * the rest of the page in the remaining space. Overlap is not something that
 * is checked for and avoided, it is something the box model makes impossible.
 * Deterministic, no JavaScript, no observer, and the same on every screen.
 *
 * **What it costs.** Below `xl` there is no room for a fourth column and the
 * rail lies down instead (`journey-bar.tsx`). At `xl` and up the page gets
 * 11.25rem less: the conversation is the `1fr` track so it gives up the most,
 * the document yields next, and the brief holds its floor — the same priority
 * the drag clamp uses. On a display wide enough that the 1600 cap was already
 * centring the composition, the pair shifts right by half the gutter and
 * nothing narrows.
 */
export function JourneyRailColumn({
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

  return (
    <aside
      aria-label={t('label')}
      data-tour="journey-rail"
      /*
       * `pt-8` is the panes' own `py-8`, so the first heading lines up with
       * the first message rather than floating above it. Hidden below `xl`
       * rather than shrunk: a rail narrower than this cannot hold its own
       * sentences, and the folded line is the better answer at that width.
       */
      className={cn(
        'hidden w-[11.25rem] shrink-0 flex-col pl-5 pr-2 pt-8 xl:flex',
        className,
      )}
    >
      <JourneySteps phase={phase} accepted={accepted} />
    </aside>
  );
}

/**
 * Four headings, each opening into the rows it is made of.
 *
 * Shared by the column and by the horizontal bar's disclosure, so the narrow
 * layout is the same rail rather than a second, smaller answer to the same
 * question — the defect this component was built to remove, reintroduced at a
 * breakpoint.
 */
export function JourneySteps({
  phase,
  accepted = false,
  omitLineFor,
}: {
  phase: IntakePhase;
  /** Whether the quote has been accepted. See `caseStages`. */
  accepted?: boolean;
  /**
   * A step whose sentence is already on screen somewhere else.
   *
   * The horizontal bar carries the active step's line in its second row, so
   * the panel it opens would print the same sentence an inch lower. One
   * caller, one reason, and the rail passes nothing.
   */
  omitLineFor?: JourneyStepId;
}) {
  const current = journeyStepFor(phase);
  const active = JOURNEY_STEPS[current]!;
  const rows = caseStages(phase, accepted);

  /*
   * The step you are on is open; the rest are closed until you ask.
   *
   * Rule 1 is the reason. Every step open at once is twelve rows of grey text
   * down the side of the page, which is the "SaaS dashboard" failure exactly —
   * it stops being a rail you glance at and becomes a second document. Closed,
   * it is four words and a line.
   */
  const [open, setOpen] = useState<readonly JourneyStepId[]>([active]);

  /*
   * Opening the new step when the phase moves on, without closing anything the
   * client opened themselves. A client who opened Document to see what they
   * were paying for and then pressed Send should not have it snap shut.
   */
  const seen = useRef(active);
  useEffect(() => {
    if (seen.current === active) return;
    seen.current = active;
    setOpen((steps) => (steps.includes(active) ? steps : [...steps, active]));
  }, [active]);

  return (
    <ol className="flex flex-col">
      {JOURNEY_STEPS.map((step, index) => {
        const done = journeyStepDone(phase, index);
        const isCurrent = index === current;
        const isOpen = open.includes(step);
        const isLast = index === JOURNEY_STEPS.length - 1;
        const stages = rows.filter((row) =>
          JOURNEY_STAGES[step].includes(row.id),
        );

        return (
          <JourneyStep
            key={step}
            step={step}
            done={done}
            current={isCurrent}
            open={isOpen}
            /*
             * The line runs to the next heading, so the four read as one rail
             * rather than four blocks. Not drawn on the last one: a connector
             * past the final mark points at nothing, which is the thing that
             * makes a stepper look broken.
             */
            connected={!isLast}
            stages={stages}
            /*
             * Resolved here rather than in the row, because the override
             * depends on the phase and the row is deliberately given only
             * what it draws. `journeyLineKey` is shared with the horizontal
             * bar so the two cannot disagree about what the wait says.
             */
            lineKey={
              step === 'brief' && step !== omitLineFor
                ? journeyLineKey(step, phase)
                : null
            }
            onToggle={() =>
              setOpen((steps) =>
                steps.includes(step)
                  ? steps.filter((one) => one !== step)
                  : [...steps, step],
              )
            }
          />
        );
      })}
    </ol>
  );
}

function JourneyStep({
  step,
  done,
  current,
  open,
  connected,
  stages,
  lineKey,
  onToggle,
}: {
  step: JourneyStepId;
  done: boolean;
  current: boolean;
  open: boolean;
  connected: boolean;
  stages: CaseStageRow[];
  /**
   * The sentence under this heading, or `null` where the rows say it better.
   *
   * Only `brief` has one — it is the step with no pipeline rows, because the
   * thing it is made of is the screen the client is already looking at. See
   * `JOURNEY_STAGES`.
   */
  lineKey: string | null;
  onToggle: () => void;
}) {
  const t = useTranslations('intake.journey');
  const panelId = useId();
  const line = lineKey === null ? null : t(lineKey);
  const note = step === 'quote' ? t('note.quote') : null;

  /*
   * The step's state as one of the three `state.*` keys, resolved here
   * rather than inline in the `t()` call. `copy-keys.test.ts` reads these
   * templates statically to prove every key exists, and a nested ternary
   * inside the interpolation reads to it as three bare keys with the
   * `state.` prefix lost — so a correct call failed a test that was right to
   * ask. Same shape as the sub-rows' `state.${row.state}` below.
   */
  const stepState = done ? 'done' : current ? 'current' : 'future';

  return (
    <li
      aria-current={current ? 'step' : undefined}
      data-tour={`journey-step-${step}`}
      className="flex gap-2"
    >
      {/*
       * The line, drawn beside the row as a flex column rather than as a left
       * border on it: a border runs the full height of the last row and
       * overshoots the final mark.
       */}
      <div
        aria-hidden="true"
        className="flex flex-col items-center gap-1 pt-[3px]"
      >
        <StepMark done={done} current={current} />
        {connected ? <span className="bg-border/70 w-px flex-1" /> : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="focus-visible:ring-ring mz-tap group relative -mx-1 flex items-center gap-1.5 rounded-[0.5rem] px-1 text-left focus-visible:outline-none focus-visible:ring-2"
        >
          {/*
           * Bold, and the only bold in the rail. The four headings are what a
           * client reads when they glance left; everything underneath is there
           * for the second look.
           */}
          <span
            className={cn(
              'flex-1 truncate text-xs font-medium leading-none',
              current || done ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {t(`step.${step}`)}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'text-muted-foreground/60 group-hover:text-muted-foreground size-3 shrink-0 transition-transform duration-200 motion-reduce:transition-none',
              open && 'rotate-180',
            )}
            strokeWidth={2}
          />
          {/*
           * The step's own state in words, on the same rule the sub-rows
           * below already follow.
           *
           * `StepMark` is the visual answer and it is `aria-hidden`, so a
           * finished step announced exactly like an untouched one: "Brief,
           * button, collapsed". `aria-current="step"` marks the one you are
           * on, which leaves the four-way distinction between done, current
           * and the two still to come resting entirely on a green tick
           * nobody can hear. One line, the same `state.*` strings the rows
           * use, so the rail says the same thing at both levels.
           */}
          <span className="sr-only">{t(`state.${stepState}`)}</span>
          <span className="sr-only">{t(open ? 'collapse' : 'expand')}</span>
        </button>

        {/*
         * `pb-3` on the wrapper rather than on the rows, so a closed step still
         * leaves the gap that makes the four headings read as a list. Without
         * it the rail collapses to four touching lines.
         */}
        <div className={cn('flex flex-col', connected && 'pb-3')}>
          {open ? (
            <div id={panelId} className="flex flex-col pt-1.5">
              {line !== null ? (
                <p className="text-muted-foreground text-xs leading-snug">
                  {line}
                </p>
              ) : null}
              {stages.length > 0 ? (
                <ol className="flex flex-col gap-1.5">
                  {stages.map((row) => (
                    <StageRow key={row.id} row={row} />
                  ))}
                </ol>
              ) : null}
              {note !== null ? (
                <p className="text-muted-foreground mt-2 text-xs leading-snug">
                  {note}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/**
 * One of the seven rows, under the heading it happens inside.
 *
 * Quieter than the heading in every dimension — smaller, lighter, no bold — so
 * that opening a step adds detail rather than adding weight. The marks are the
 * same three marks the headings use, one size down, because the rail should
 * read as one line of marks whose emphasis changes rather than as two kinds of
 * list.
 */
function StageRow({ row }: { row: CaseStageRow }) {
  const t = useTranslations('intake.journey');
  const done = row.state === 'done';
  const current = row.state === 'current';

  return (
    <li className="flex gap-2">
      <span aria-hidden="true" className="flex pt-[3px]">
        <StageMark done={done} current={current} />
      </span>
      <div className="flex min-w-0 flex-col">
        <span
          className={cn(
            'text-xs leading-snug',
            current
              ? 'text-foreground font-medium'
              : done
                ? 'text-foreground/80'
                : 'text-muted-foreground',
          )}
        >
          {t(`stage.${row.id}`)}
        </span>
        {/*
         * Only `pricing` has one, and it is the most valuable sentence in the
         * rail: the answer to "what is happening during those hours" is "quite
         * a lot, and some of your document already exists". See
         * `case-stages.ts`.
         */}
        {row.hasDetail ? (
          <span className="text-muted-foreground mt-0.5 text-xs leading-snug">
            {t(`detail.${row.id}`)}
          </span>
        ) : null}
        {/*
         * The state in words, for a screen reader. The marks are the visual
         * answer and they are `aria-hidden`, so without this every row reads
         * identically and the rail is a table of contents.
         */}
        <span className="sr-only">{t(`state.${row.state}`)}</span>
      </div>
    </li>
  );
}

/**
 * A heading's mark. Three states, and only one of them is coloured.
 *
 * Green is the single exception to the rail's greyscale, and it means what it
 * means everywhere else in this flow: settled, and good. A bare tick rather
 * than a filled green disc — a disc is a badge, and four of them stacked down
 * the margin would be the loudest thing on the page by the time a case is
 * delivered.
 *
 * The current step is a ring, not a fill. A filled mark for "in progress" is
 * how a stepper ends up looking like it has completed a step it has not, which
 * is the first complaint in the brief drawn as a circle.
 */
function StepMark({ done, current }: { done: boolean; current: boolean }) {
  if (done) {
    return (
      <span className="text-success flex size-3 items-center justify-center">
        <Check className="size-3" strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span
      className={cn(
        'flex size-3 items-center justify-center rounded-full border',
        current ? 'border-foreground border-2' : 'border-border',
      )}
    />
  );
}

/** The same three marks, one size down, for the rows inside a step. */
function StageMark({ done, current }: { done: boolean; current: boolean }) {
  if (done) {
    return (
      <span className="text-success flex size-2.5 items-center justify-center">
        <Check className="size-2.5" strokeWidth={3} />
      </span>
    );
  }
  return (
    <span
      className={cn(
        'size-2.5 rounded-full border',
        current ? 'border-foreground bg-foreground' : 'border-border',
      )}
    />
  );
}
