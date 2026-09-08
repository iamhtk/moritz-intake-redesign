'use client';

import { ChevronLeft, Loader2 } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@/components/design/design-system/button';
import { OnboardingProgressDots } from '@/components/design/onboarding/onboarding-progress';

interface OnboardingActionsProps {
  /** Label for the primary continue button. */
  continueLabel: string;
  /** Extra classes for the footer wrapper (e.g. `mt-auto` to anchor it). */
  className?: string;
  /**
   * Whether the continue button submits its enclosing form (`submit`) or
   * triggers `onContinue` directly (`button`). Defaults to `button`.
   */
  continueType?: 'button' | 'submit';
  onContinue?: () => void;
  continueDisabled?: boolean;
  isPending?: boolean;
  backLabel?: string;
  onBack?: () => void;
  progressCurrent?: number;
  progressTotal?: number;
  progressLabel?: string;
}

/**
 * Shared onboarding footer: a full-width primary continue button stacked above a
 * row that pairs a quiet "Back" link (left) with a segmented progress indicator
 * (right). Used across the onboarding step forms so the continue / back / progress
 * controls stay visually consistent.
 */
export function OnboardingActions({
  continueLabel,
  className,
  continueType = 'button',
  onContinue,
  continueDisabled,
  isPending,
  backLabel,
  onBack,
  progressCurrent,
  progressTotal,
  progressLabel,
}: OnboardingActionsProps) {
  const showProgress =
    progressCurrent !== undefined && progressTotal !== undefined;

  return (
    <div className={cn('space-y-5 pt-2', className)}>
      <Button
        type={continueType}
        onClick={continueType === 'button' ? onContinue : undefined}
        disabled={continueDisabled || isPending}
        className="w-full"
      >
        {isPending && (
          <Loader2
            data-icon="inline-start"
            aria-hidden="true"
            className="animate-spin"
          />
        )}
        {continueLabel}
      </Button>

      <div className="flex items-center justify-between gap-3">
        {onBack ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            disabled={isPending}
            className="text-muted-foreground -ms-3"
          >
            <ChevronLeft data-icon="inline-start" />
            {backLabel}
          </Button>
        ) : (
          <span aria-hidden />
        )}

        {showProgress && (
          <OnboardingProgressDots
            current={progressCurrent}
            total={progressTotal}
            label={progressLabel}
          />
        )}
      </div>
    </div>
  );
}
