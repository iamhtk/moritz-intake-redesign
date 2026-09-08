import type { Transition } from 'motion/react';

import { isNavItemActive } from '@/components/navigation/sidebar-active';
import type { NavItem } from '@/components/navigation/sidebar-nav-items';
import { getCasesForRole } from '@/lib/mocks/cases';
import { getVisiblePlaybooks } from '@/components/design/playbook-studio/playbook-studio-data';
import { getPlaybooks as getAdminPlaybooks } from '@/components/design/playbook-studio-admin/playbook-studio-data';
import { mockTabularPlaybooks } from '@/components/design/tabular-playbook/tabular-playbook-data';
import type { CompanyType } from '@/lib/types';

/**
 * Shared spring for the sliding active-pill indicator, used by both the desktop
 * top-nav pills and the mobile bottom tab bar so they animate identically.
 * Pinning an explicit spring (rather than motion's distance-derived default)
 * keeps the feel consistent regardless of how far the indicator travels between
 * items - the desktop pills morph over a short distance while the bottom-bar
 * block slides across full-width cells.
 */
export const ACTIVE_PILL_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 35,
};

/**
 * Badge counts for nav destinations, keyed by the item's full `title` (matched
 * via `badges[item.title]`) so a badge surfaces on both the pinned pills and
 * the "More" overflow entries.
 *
 * The Cases/All cases and playbook counts are derived live from the mocks each
 * section lists, so a pill always matches the table behind it. The remaining
 * destinations keep static demo counts (the playground has no live source).
 * The Notifications pill and the bell both read from the shared notifications
 * mock instead, so they stay in sync with the app.
 */
export function buildNavBadges(
  companyType: CompanyType,
  /**
   * Playbooks not archived. Passed in because archiving is session state the
   * caller subscribes to, so the pill drops as soon as one is archived.
   */
  activeTabularPlaybookCount: number = mockTabularPlaybooks.length,
): Record<string, number> {
  const caseCount = getCasesForRole(companyType).length;
  // The admin Playbooks tab is a separate (pre-MSA) Playbook Studio with its own
  // store, so its count comes from the admin data rather than the sales store.
  const playbookCount =
    companyType === 'INTERNAL_ADMIN'
      ? getAdminPlaybooks().length
      : getVisiblePlaybooks().length;
  return {
    Cases: caseCount,
    'All cases': caseCount,
    // Admin calls the studio "Playbook Studio" so it doesn't clash with the
    // tabular "Playbooks" section; client and legal still say "Playbooks".
    ...(companyType === 'INTERNAL_ADMIN'
      ? {
          'Playbook Studio': playbookCount,
          // Matches the "All" tab on the playbooks index.
          Playbooks: activeTabularPlaybookCount,
        }
      : { Playbooks: playbookCount }),
    Waitlist: 12,
  };
}

/**
 * Human-readable labels for the admin app's sections, keyed by URL slug. Used to
 * build the "Back to <section>" affordance shown on admin detail/new screens.
 */
const ADMIN_SECTION_LABELS: Record<string, string> = {
  cases: 'cases',
  playbooks: 'Playbook Studio',
  'ai-evals': 'AI evals',
  'tabular-playbook': 'playbooks',
  users: 'users',
  companies: 'companies',
  'law-firms': 'law firms',
  'case-types': 'case types',
  countries: 'countries',
  waitlist: 'waitlist',
  'audit-log': 'audit log',
  'sentry-test': 'Sentry test',
};

/**
 * Detail-style screens (new case, case details) swap the nav row for a ghost
 * "back" button that returns to the section the screen belongs to. Returns
 * `null` for top-level screens, where the nav destinations are shown instead.
 */
export function getBackTarget(
  pathname: string,
  homePath: string,
): { href: string; label: string } | null {
  if (
    pathname === `${homePath}/new` ||
    pathname.startsWith(`${homePath}/new/`)
  ) {
    return { href: homePath, label: 'Back to home' };
  }
  // The admin app exposes many sections, each with detail/new sub-routes
  // (`/admin/<section>/<id>`, `/admin/<section>/new`, ...). Any route deeper
  // than a section index returns to that section's list.
  if (homePath === '/admin') {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length >= 3) {
      const section = segments[1]!;
      const label = ADMIN_SECTION_LABELS[section] ?? section.replace(/-/g, ' ');
      return { href: `/admin/${section}`, label: `Back to ${label}` };
    }
  }
  const casesBase = `${homePath}/cases`;
  if (pathname.startsWith(`${casesBase}/`)) {
    return { href: casesBase, label: 'Back to cases' };
  }
  return null;
}

/**
 * Resolves the single active destination: prefer the most specific
 * (longest-matching) url so e.g. `/client/cases/123` highlights "Cases" rather
 * than "Home".
 */
export function resolveActiveNavUrl(
  pathname: string,
  navMain: NavItem[],
): string | undefined {
  return navMain
    .filter((item) => isNavItemActive(pathname, item.url, item.exact))
    .reduce<string | undefined>((best, item) => {
      if (!best || item.url.length > best.length) return item.url;
      return best;
    }, undefined);
}
