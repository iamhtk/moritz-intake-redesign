import { cn } from '@repo/ui/lib/utils';
import { H2, Muted } from '@/components/design/design-system/typography';

interface OnboardingStepHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

/**
 * Shared header for every onboarding step so the serif title + muted subtitle
 * treatment stays identical across the flow (customer type, details, waitlist).
 */
export function OnboardingStepHeader({
  title,
  description,
  className,
}: OnboardingStepHeaderProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <H2>{title}</H2>
      {description ? <Muted>{description}</Muted> : null}
    </div>
  );
}
