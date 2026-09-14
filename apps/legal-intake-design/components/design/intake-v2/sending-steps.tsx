'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { Spinner } from '@/components/design/foundations/components/spinner';
import { SENDING_STEPS, SENDING_STEP_MS } from '@/lib/intake/sending-steps';

/**
 * The send, as three named steps rather than one spinner (item 38).
 *
 * The argument for the steps is in `lib/intake/sending-steps.ts`. This is how
 * they are drawn, and the treatment is deliberately the one `WorkRail` uses for
 * a turn rather than the one `CaseProgress` uses for the pipeline — because
 * this wait is the same kind of thing as a turn. Something is genuinely
 * happening on the other end of a request that is open right now, so the live
 * row gets a spinner, which is the one place in this flow a spinner is an
 * honest mark. `CaseProgress` refuses one for the opposite reason: nothing is
 * visibly happening there.
 *
 * It replaces the footer's button rather than appearing beside it. Decision 18
 * asks for one change per boundary, and the send boundary's change is exactly
 * this: the control the client just pressed becomes the account of what
 * pressing it did.
 */
export function SendingSteps({ className }: { className?: string }) {
  const t = useTranslations('intake');
  /**
   * How many steps have finished.
   *
   * Advanced on a timer here only because submission is stubbed; see the note
   * on `SENDING_TOTAL_MS`. It stops at the last step rather than completing it,
   * which is not an off-by-one: the last step finishing *is* the case being
   * sent, and the confirmation replaces this whole block at that moment. A rail
   * that ticked its final row and then sat there would be claiming the case had
   * gone a frame before the screen agreed.
   */
  const [done, setDone] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDone((current) => Math.min(current + 1, SENDING_STEPS.length - 1));
    }, SENDING_STEP_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/*
       * One live region for the whole block, on the heading rather than on each
       * row.
       *
       * `aria-live="polite"` with the step name in it would re-read the heading
       * three times. The rows below are outside the region on purpose: a client
       * using a screen reader is told once that the case is being sent, and can
       * read the steps at their own pace, which is the same deal the sighted
       * version offers.
       */}
      <p role="status" className="text-foreground text-sm font-medium">
        {t('send.sendingTitle')}
      </p>

      <ol className="flex flex-col gap-2">
        {SENDING_STEPS.map((step, index) => {
          const finished = index < done;
          const running = index === done;
          return (
            <li
              key={step.id}
              className={cn(
                'flex items-start gap-2.5 text-sm leading-5 transition-colors',
                finished || running
                  ? 'text-foreground'
                  : 'text-muted-foreground',
              )}
            >
              <span
                aria-hidden="true"
                className="flex size-4 shrink-0 items-center justify-center pt-[2px]"
              >
                {finished ? (
                  <Check className="size-3.5" strokeWidth={2.25} />
                ) : running ? (
                  <Spinner className="size-3.5" />
                ) : (
                  <span className="border-border/60 size-2 rounded-full border" />
                )}
              </span>
              <span className={cn(running && 'shimmer')}>
                {t(step.copyKey)}
              </span>
            </li>
          );
        })}
      </ol>

      {/*
       * The permission to leave, said here as well as on the confirmation.
       *
       * This is the screen it matters most on. A client watching a multi-minute
       * wait is the one most likely to think they have to sit through it, and
       * the confirmation that tells them otherwise is on the far side of the
       * thing they are worried about.
       */}
      <p className="text-muted-foreground text-xs leading-relaxed">
        {t('send.sendingNote')}
      </p>
    </div>
  );
}
