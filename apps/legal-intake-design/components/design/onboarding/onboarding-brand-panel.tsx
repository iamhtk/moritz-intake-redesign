'use client';

import { cn } from '@repo/ui/lib/utils';
import {
  useOnboardingPanelVariant,
  type OnboardingPanelVariant,
} from '@/components/design/onboarding/onboarding-panel-context';
import { OnboardingLawyerShowcase } from '@/components/design/onboarding/onboarding-lawyer-showcase';

// All variants are rendered as stacked layers and crossfaded via opacity —
// `background-image` itself can't be transitioned, so fading between layers is
// what produces the smooth grey -> gold -> sky change.
const GRADIENT_LAYERS: {
  variant: OnboardingPanelVariant;
  className: string;
}[] = [
  { variant: 'neutral', className: 'bg-mz-gradient-grey' },
  { variant: 'client', className: 'bg-mz-gradient-gold' },
  { variant: 'legal', className: 'bg-mz-gradient-sky' },
  { variant: 'waitlist', className: 'bg-mz-gradient-sky' },
];

/**
 * Onboarding right-hand panel. Sits in the second grid column (hidden below
 * `lg`) and paints a brand gradient that reflects the chosen path: grey by
 * default, gold for client, sky for lawyer. The variant is driven by the
 * walkthrough via `OnboardingPanelProvider`.
 */
export function OnboardingBrandPanel() {
  const variant = useOnboardingPanelVariant();
  const showLawyers = variant === 'client';

  return (
    <div className="bg-muted relative hidden overflow-hidden lg:block lg:h-svh">
      {GRADIENT_LAYERS.map((layer) => (
        <div
          key={layer.variant}
          aria-hidden
          className={cn(
            'absolute inset-0 transition-opacity duration-700 ease-in-out',
            layer.className,
            variant === layer.variant ? 'opacity-100' : 'opacity-0',
          )}
        />
      ))}

      {/* Lawyer showcase, layered above the gradients. Always mounted so it can
          fade both ways with the wrapper's opacity (unmounting it would make
          leaving the client flow pop instead of fade); visibility is gated to
          the client (gold) flow. Both website signup and the invite walkthrough
          set `client` after mount, so the server render stays hidden and
          hydration-safe. */}
      <div
        aria-hidden={!showLawyers}
        className={cn(
          'absolute inset-0 flex items-center justify-center p-12 transition-opacity duration-700 ease-in-out',
          showLawyers ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <OnboardingLawyerShowcase active={showLawyers} />
      </div>
    </div>
  );
}
