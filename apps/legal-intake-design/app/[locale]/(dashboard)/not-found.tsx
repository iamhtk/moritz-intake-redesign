import { RouteNotFound } from '@/components/design/route-states/route-state';

/**
 * A record that is not there — a case id that does not resolve, a company
 * that has been removed. Inside the shell, so the person can go somewhere
 * else without using the browser's back button.
 */
export default function DashboardNotFound() {
  return <RouteNotFound />;
}
