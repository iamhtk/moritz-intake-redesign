import { RouteLoading } from '@/components/design/route-states/route-state';

/**
 * Shown while a dashboard route's server component is still resolving.
 *
 * At the `(dashboard)` level rather than the locale root, which is the
 * difference between the chrome staying put and the whole window blanking:
 * `DashboardShell` lives in this segment's layout, so only the page area is
 * replaced while the wait is on.
 */
export default function DashboardLoading() {
  return <RouteLoading />;
}
