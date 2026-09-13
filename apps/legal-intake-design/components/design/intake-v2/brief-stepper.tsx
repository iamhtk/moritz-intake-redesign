'use client';

import { useTranslations } from 'next-intl';
import { Check } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import {
  JOURNEY_STEPS,
  journeyStepDone,
  journeyStepFor,
} from '@/lib/intake/journey';
import type { IntakePhase } from '@/lib/intake/phase';

/**
 * Where the client is in their case, above the Send button.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE COMPLAINT THIS ANSWERS.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Two of the four pieces of real feedback in the brief are about orientation:
 * *"People do not understand when a case has actually been submitted"* and
 * *"People do not understand the steps in the submission process, or where they
 * are in it."* The flow already answers the first at the moment it happens —
 * the sending steps, the receipt, the reference — and answered the second
 * nowhere. A client filling in a brief could see how much of the brief was
 * done (the progress bar) and had no way to know that the brief was step one of
 * four.
 *
 * Which is the gap the brief itself names: *"they submit, then nothing, then a
 * lawyer appears in the chat, then a document arrives."* The "then nothing" is
 * not a missing notification, it is a missing map. Four labels are the map.
 *
 * **Directly above the footer sentence, not at the top of the panel.** The
 * sentence underneath already describes what happens after sending, and the
 * button underneath that does the sending — so this sits with the two things
 * it is about, in the one part of the panel that does not scroll away. At the
 * top it would be chrome the client reads once; here it is next to the decision
 * it informs.
 *
 * **Two rows, ~40px.** This is a sticky footer in a sidebar, so vertical space
 * is the scarcest thing on the screen and a stepper that pushes the Send button
 * down is a worse trade than no stepper. One line names the current step in
 * full, one row carries the four markers with one-word labels.
 *
 * **The last two steps are permanently upcoming, and that is the honest
 * render.** `lawyer` and `document` happen after the intake hands the case on,
 * and this prototype has no backend to move them. Greyed is what they are. See
 * `journey.ts` for why four steps rather than the pipeline's seven.
 */
export function BriefStepper({
  phase,
  className,
}: {
  phase: IntakePhase;
  className?: string;
}) {
  const t = useTranslations('intake.journey');
  const current = journeyStepFor(phase);

  return (
    /*
     * `gap-3` between the sentence and the markers. At `gap-2` the position
     * line sat close enough to the rail to read as a label *on* it rather than
     * as a sentence above it, and the markers lost the horizontal emphasis
     * that makes them scannable as a row.
     */
    <div className={cn('flex flex-col gap-3', className)}>
      {/*
       * The count and the current step, in words. The count is what makes the
       * markers legible as a position rather than as decoration — "Step 1 of 4"
       * is the sentence the feedback was asking for.
       *
       * `aria-live` so a screen reader hears the step change on submit rather
       * than only finding it on the next sweep. Polite: it is a change of
       * state, not an alert.
       */}
      <p className="text-muted-foreground text-[11px]" aria-live="polite">
        <span className="text-foreground font-medium">
          {t('position', { step: current + 1, total: JOURNEY_STEPS.length })}
        </span>
        {` · ${t(`now.${JOURNEY_STEPS[current]!}`)}`}
      </p>

      {/*
       * `ol` because it is an ordered list of stages, which is what it looks
       * like. `grid-cols-4` rather than flex, so the four columns are equal
       * whatever the labels say: with flex, "Document" would take more room
       * than "Brief" and the markers would stop lining up with anything.
       */}
      <ol className="grid grid-cols-4 gap-0">
        {JOURNEY_STEPS.map((step, index) => {
          const done = journeyStepDone(phase, index);
          const isCurrent = index === current;
          const isFirst = index === 0;
          const isLast = index === JOURNEY_STEPS.length - 1;

          return (
            <li
              key={step}
              className="flex min-w-0 flex-col items-center gap-1"
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* The marker, with the rail running through it. */}
              <span className="relative flex h-3 w-full items-center justify-center">
                {/*
                 * Two half-rails rather than one line per gap, so the row does
                 * not need a wrapper per pair. Suppressed at the ends, or the
                 * rail would stick out past the first and last markers.
                 */}
                {!isFirst ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-y-1/2 left-0 h-px w-1/2',
                      done || isCurrent ? 'bg-success/40' : 'bg-border',
                    )}
                  />
                ) : null}
                {!isLast ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-y-1/2 right-0 h-px w-1/2',
                      done ? 'bg-success/40' : 'bg-border',
                    )}
                  />
                ) : null}

                {done ? (
                  /*
                   * Green, and the same green as the brief rows' ticks: a
                   * finished step is settled, which is the one meaning green
                   * carries in this flow.
                   */
                  <span className="bg-success text-background relative flex size-3 items-center justify-center rounded-full">
                    <Check className="size-2" strokeWidth={4} />
                  </span>
                ) : isCurrent ? (
                  /*
                   * A ring rather than a fill. The current step is not finished,
                   * and a filled marker for "in progress" is how a stepper ends
                   * up looking like it has completed a step it has not.
                   */
                  <span className="border-success bg-background ring-success/15 relative size-3 rounded-full border-[1.5px] ring-4" />
                ) : (
                  <span className="border-border bg-background relative size-2.5 rounded-full border" />
                )}
              </span>

              <span
                className={cn(
                  'w-full truncate text-center text-[10.5px] leading-tight',
                  isCurrent
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground',
                )}
              >
                {t(`step.${step}`)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
