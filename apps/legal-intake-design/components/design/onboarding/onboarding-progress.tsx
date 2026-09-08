'use client';

import { useEffect, useState } from 'react';
import { cn } from '@repo/ui/lib/utils';

interface OnboardingProgressDotsProps {
  current: number;
  total: number;
  label?: string;
  className?: string;
}

// Remembers the last rendered step across remounts. Each onboarding step swaps
// in a fresh form (and a fresh dots instance), so without this the active pill
// would pop into place with no transition. Only one dots instance is visible at
// a time, so a single module-scoped value is sufficient.
let lastRenderedStep: number | null = null;

/**
 * Segmented dot progress for the onboarding footer. Completed steps render as
 * small filled dots, the current step as a wider filled pill, and upcoming
 * steps as muted dots — a compact indicator that sits beside the Back link.
 *
 * On mount it renders at the previously shown step, then transitions to the
 * current one on the next frame so the pill glides between dots even though the
 * surrounding form remounts on every step change.
 */
export function OnboardingProgressDots({
  current,
  total,
  label,
  className,
}: OnboardingProgressDotsProps) {
  const [displayedStep, setDisplayedStep] = useState(
    lastRenderedStep ?? current,
  );

  useEffect(() => {
    lastRenderedStep = current;

    // Two rAFs: let the initial (previous-step) state paint before flipping to
    // the current step, otherwise the browser collapses both into one frame and
    // skips the transition.
    let innerFrame = 0;
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => setDisplayedStep(current));
    });

    return () => {
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(innerFrame);
    };
  }, [current]);

  return (
    <div
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={label}
      className={cn('flex items-center gap-1.5', className)}
    >
      {Array.from({ length: total }, (_, index) => {
        const step = index + 1;
        const isCurrent = step === displayedStep;
        const isComplete = step < displayedStep;

        return (
          <span
            key={step}
            className={cn(
              'h-1.5 rounded-full transition-[width,background-color] duration-500 ease-in-out',
              isCurrent
                ? 'bg-foreground w-6'
                : isComplete
                  ? 'bg-foreground w-1.5'
                  : 'bg-border w-1.5',
            )}
          />
        );
      })}
    </div>
  );
}
