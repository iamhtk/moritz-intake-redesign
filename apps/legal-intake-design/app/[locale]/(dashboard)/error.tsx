'use client';

import { RouteError } from '@/components/design/route-states/route-state';

/**
 * The dashboard's error boundary.
 *
 * Scoped here rather than only at the locale root so the shell survives: an
 * error boundary replaces its own segment's children, and this segment's
 * children are what sit *inside* `DashboardShell`. So the top nav, the
 * account menu and every other destination stay on screen, and the failure is
 * one panel rather than the whole application.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} />;
}
