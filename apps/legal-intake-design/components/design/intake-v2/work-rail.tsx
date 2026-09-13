'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ChevronDown } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { Spinner } from '@/components/design/foundations/components/spinner';
import {
  isWorthKeeping,
  runningStep,
  type TimelineStep,
} from '@/lib/intake/timeline';

/**
 * What Moritz is doing, and then what he did (L1, V24, L9, L14).
 *
 * The brief's second complaint is about a product that shows one vague
 * indicator for every wait. `waits.ts` answered the naming half of that: five
 * waits, five sentences, and a test that fails the build if two of them match.
 * This answers the half that was left — those sentences were *transient*. Each
 * was shown while the work happened and then thrown away, so the flow's own
 * record of having read a contract lasted about four seconds.
 *
 * One component, two lifetimes, and that is the design rather than an
 * optimisation:
 *
 * **While it runs** it is a vertical rail. One row per wait, the finished ones
 * ticked with the real number they produced nested underneath, the live one
 * with a spinner and the shimmer the rest of the flow already uses for
 * streaming status. It grows downward, so the client watches work being added
 * rather than watching one label be overwritten by the next — which is the
 * thing that made the original impossible to follow: four of its ten waits were
 * invisible because a later one had replaced the label before anyone read it.
 *
 * **Once it has settled** it folds into one quiet line above the reply, opened
 * on a click. This is V24: the last status is not swapped out for the answer,
 * it ticks off and the answer arrives under it, and then the rail steps out of
 * the way. And it is L14: the record stays on the turn that produced it and
 * opens in place, rather than being a modal or a second panel. A transcript
 * three turns later can still be asked what was actually read.
 *
 * **Above the reply rather than below it**, which is a deliberate departure
 * from L9's footer expander. Two reasons, and the second is the real one. It is
 * chronologically true — the work happened, then the answer did — but more
 * importantly the rail is the same element the client was already watching, so
 * keeping it in place means it *shrinks* rather than being deleted from one
 * spot and rebuilt in another. A fold that appears somewhere other than where
 * the spinner was reads as a new control arriving, not as the status settling,
 * and it would cost a reflow of the reply at the exact moment the client starts
 * reading it.
 *
 * **It leaves nothing behind when it has nothing to say.** A turn with one step
 * and no number is precisely what the client just watched, so it folds to
 * nothing rather than to a control that unfolds a sentence they have read. See
 * `isWorthKeeping`, and the `written > 0` test at the settle call in
 * `use-conversation.ts`.
 *
 * **What it will not do** is say anything a response did not produce. Every row
 * comes from a `startStep` call made immediately before a request goes out and
 * a `finishStep` made when it returns; there is no timer anywhere in here, and
 * `timeline.test.ts` asserts that every `waitId` the app uses is one of the
 * listed waits. That restraint is the whole claim: the reference product this
 * design is measured against has a top bar reading "Uploading" across five
 * screens and twenty-nine minutes of footage, and it never resolves. A
 * decorative rail would have been the same defect with better typography.
 */
export function WorkRail({
  steps,
  className,
}: {
  steps: readonly TimelineStep[];
  className?: string;
}) {
  const t = useTranslations('intake.timeline');
  const [open, setOpen] = useState(false);
  const panelId = useId();

  if (steps.length === 0) return null;

  const live = runningStep(steps);

  /*
   * A settled rail nobody would open does not get a control.
   *
   * One step with no number is exactly what the client watched happen a second
   * ago, so offering to unfold it is a button that costs a glance and returns a
   * sentence they have already read. See `isWorthKeeping`.
   */
  if (live === null && !isWorthKeeping(steps)) return null;

  const expanded = live !== null || open;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {/*
       * The fold, which only exists once the work has. While a step is running
       * the rail is the thing the client is watching and hiding it behind a
       * disclosure would be putting the answer to "what is happening" one click
       * away at the exact moment they are asking.
       */}
      {live === null ? (
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={t(open ? 'hide' : 'show', { count: steps.length })}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring -mx-1 flex w-fit items-center gap-1.5 rounded-[0.5rem] px-1 py-0.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2"
        >
          <Check aria-hidden="true" className="size-3" strokeWidth={2} />
          {t('summary', { count: steps.length })}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'size-3 transition-transform duration-200 motion-reduce:transition-none',
              open && 'rotate-180',
            )}
            strokeWidth={2}
          />
        </button>
      ) : null}

      {expanded ? (
        <ol
          id={panelId}
          /*
           * `role="status"` while the work is live, and nothing once it has
           * settled. A live region that stays live would re-announce the whole
           * rail every time the client unfolds it three turns later, which is a
           * screen reader reading out old news because a div was still marked
           * as breaking.
           */
          {...(live !== null
            ? { role: 'status' as const, 'aria-live': 'polite' as const }
            : {})}
          className="flex flex-col gap-2.5"
        >
          {steps.map((step, index) => {
            const isLive = step.state === 'running';
            return (
              <li
                key={`${step.waitId}-${step.at}-${index}`}
                className="mz-animate-reveal flex gap-2.5"
              >
                {/*
                 * The rail itself: a mark, and a line down to the next row.
                 *
                 * Drawn as a flex column rather than a border on the row,
                 * because the line has to stop at the last mark. A left border
                 * on the list runs past the final step and points at nothing,
                 * which reads as a rail that is still going.
                 */}
                <div
                  aria-hidden="true"
                  className="flex flex-col items-center gap-1 pt-0.5"
                >
                  <span
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded-full border',
                      isLive
                        ? 'border-transparent'
                        : 'border-border bg-background text-foreground',
                    )}
                  >
                    {isLive ? (
                      <Spinner className="size-3.5" />
                    ) : (
                      <Check className="size-2.5" strokeWidth={2.5} />
                    )}
                  </span>
                  {index < steps.length - 1 ? (
                    <span className="bg-border w-px flex-1" />
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-col gap-0.5 pb-0.5">
                  <span
                    className={cn(
                      'text-sm leading-5',
                      isLive
                        ? 'text-muted-foreground shimmer'
                        : 'text-foreground',
                    )}
                  >
                    {step.label}
                  </span>
                  {/*
                   * The count, nested under the sentence it belongs to.
                   *
                   * Nested rather than being a step of its own, because writing
                   * four values onto the brief is real work that takes no time
                   * at all. A row for it would appear already ticked and be
                   * indistinguishable from a decorative one, which is the line
                   * this whole component is trying not to cross.
                   */}
                  {step.detail ? (
                    <span className="text-muted-foreground text-xs leading-5">
                      {step.detail}
                    </span>
                  ) : null}
                  {/*
                   * The state in words, for a screen reader only. The tick and
                   * the spinner are the visual answer and are `aria-hidden`,
                   * so without this every row reads identically whether it has
                   * finished or not.
                   */}
                  <span className="sr-only">
                    {t(isLive ? 'runningLabel' : 'doneLabel')}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}
