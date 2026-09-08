'use client';

import Logo from '@/components/logo';
import { Link } from '@/i18n/navigation';
import { useOnboardingHeaderLogo } from '@/components/design/onboarding/onboarding-panel-context';

/**
 * Header wordmark for the onboarding layout. Hidden on the first step (where the
 * "Welcome to Moritz" heading already carries the brand) and shown from the
 * second step onward. Renders an empty placeholder while hidden so the adjacent
 * controls stay right-aligned in the `justify-between` header row.
 */
export function OnboardingHeaderLogo() {
  const { visible } = useOnboardingHeaderLogo();

  if (!visible) {
    return <span aria-hidden />;
  }

  return (
    <Link href="/" aria-label="Moritz">
      <Logo />
    </Link>
  );
}
