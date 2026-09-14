'use client';

import { RouteError } from '@/components/design/route-states/route-state';

/**
 * The locale-wide error boundary: sign-in, onboarding, the foundations
 * gallery, and anything else outside the dashboard shell.
 *
 * The dashboard has its own (`(dashboard)/error.tsx`) which keeps the top nav
 * on screen. This one is the outer net — it replaces everything below
 * `[locale]/layout.tsx`, so the page is bare apart from the way out.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} />;
}
