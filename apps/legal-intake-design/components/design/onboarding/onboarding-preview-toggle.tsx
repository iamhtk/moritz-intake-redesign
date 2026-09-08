'use client';

import { Eye, EyeOff } from '@repo/ui/icons';
import { Button } from '@/components/design/design-system/button';
import { useOnboardingDevChrome } from '@/components/design/onboarding/onboarding-panel-context';

/**
 * Playground-only control: toggles the walkthrough's dev chrome (step badge +
 * Back/Next) so testers can preview the production onboarding experience.
 */
export function OnboardingPreviewToggle() {
  const { visible, toggle } = useOnboardingDevChrome();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-pressed={!visible}
      title={visible ? 'Preview production view' : 'Show walkthrough controls'}
      aria-label={
        visible ? 'Preview production view' : 'Show walkthrough controls'
      }
    >
      {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
    </Button>
  );
}
