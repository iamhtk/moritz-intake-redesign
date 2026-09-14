import {
  IconBook2,
  IconBriefcase,
  IconBuilding,
  IconClock,
  IconFiles,
  IconFileText,
  IconHome,
  IconMessageCircle,
  IconFlask2,
  IconScale,
  IconShieldCheck,
  IconTable,
  IconUsers,
  IconWorld,
  type Icon,
} from '@tabler/icons-react';

import type { CompanyType } from '@/lib/types';
import { isNavItemActive } from './sidebar-active';

export type NavItem = {
  title: string;
  /**
   * Optional concise label rendered in the collapsed icon rail (≤ ~6 chars).
   * Falls back to `title` when not set. Breadcrumbs and page titles always
   * use `title`.
   */
  shortTitle?: string;
  url: string;
  icon?: Icon;
  exact?: boolean;
  /**
   * When set, the item is treated as lower-priority and collapsed under the
   * "More" overflow menu rather than pinned to the main rail. Used to keep the
   * most-used tabs visible and tuck the rest away.
   */
  secondary?: boolean;
};

export type NavSecondaryItem = {
  title: string;
  shortTitle?: string;
  url: string;
  icon: Icon;
  exact?: boolean;
  onClick?: () => void;
};

export const homePathByCompanyType: Record<CompanyType, string> = {
  INTERNAL_ADMIN: '/admin',
  INTERNAL_ASSISTANT: '/user',
  LEGAL: '/legal',
  NON_LEGAL: '/client',
};

export type BuildNavMainOptions = {
  /**
   * Design-flag-gated Playbooks destination for the admin app (real-usage
   * version). Inserted immediately after "All cases" when set. Only affects the
   * `INTERNAL_ADMIN` area.
   */
  adminPlaybooks?: boolean;
  /** Adds the internal AI Evals quality workspace after Playbooks. */
  adminAiEvals?: boolean;
  /** Adds the internal Tabular Playbook contract-review workspace after AI Evals. */
  adminTabularPlaybooks?: boolean;
};

export function buildNavMain(
  companyType: CompanyType,
  homePath: string,
  options: BuildNavMainOptions = {},
): NavItem[] {
  const items: NavItem[] = [{ title: 'Home', url: homePath, icon: IconHome }];

  if (companyType === 'NON_LEGAL' || companyType === 'LEGAL') {
    items.push({
      title: 'Cases',
      url: `${homePath}/cases`,
      icon: IconFiles,
    });
  }

  if (companyType === 'LEGAL') {
    items.push({
      title: 'Quotes',
      url: `${homePath}/quotes`,
      icon: IconBriefcase,
    });
  }

  if (companyType === 'INTERNAL_ADMIN') {
    items.push(
      // Most-used tabs — pinned to the main rail.
      {
        title: 'All cases',
        shortTitle: 'Cases',
        url: `${homePath}/cases`,
        icon: IconBriefcase,
      },
      ...(options.adminPlaybooks
        ? [
            {
              title: 'Playbook Studio',
              shortTitle: 'Studio',
              url: `${homePath}/playbooks`,
              icon: IconBook2,
            },
          ]
        : []),
      ...(options.adminAiEvals
        ? [
            {
              title: 'AI Evals',
              url: `${homePath}/ai-evals`,
              icon: IconFlask2,
            },
          ]
        : []),
      ...(options.adminTabularPlaybooks
        ? [
            {
              title: 'Playbooks',
              url: `${homePath}/tabular-playbook`,
              icon: IconTable,
            },
          ]
        : []),
      { title: 'Users', url: `${homePath}/users`, icon: IconUsers },
      {
        title: 'Companies',
        shortTitle: 'Firms',
        url: `${homePath}/companies`,
        icon: IconBuilding,
      },
      {
        title: 'Law firms',
        shortTitle: 'Law',
        url: `${homePath}/law-firms`,
        icon: IconScale,
      },
      // Potentially useful tabs — collapsed under "More".
      {
        title: 'Waitlist',
        shortTitle: 'Queue',
        url: `${homePath}/waitlist`,
        icon: IconClock,
        secondary: true,
      },
      {
        title: 'Countries',
        shortTitle: 'World',
        url: `${homePath}/countries`,
        icon: IconWorld,
        secondary: true,
      },
      {
        title: 'Audit Log',
        shortTitle: 'Audit',
        url: `${homePath}/audit-log`,
        icon: IconFileText,
        secondary: true,
      },
      {
        title: 'Case types',
        shortTitle: 'Types',
        url: `${homePath}/case-types`,
        icon: IconBriefcase,
        secondary: true,
      },
      {
        title: 'Sentry Test',
        shortTitle: 'Sentry',
        url: `${homePath}/sentry-test`,
        icon: IconShieldCheck,
        secondary: true,
      },
    );
  }

  return items;
}

const navSecondaryItems: NavSecondaryItem[] = [
  { title: 'Support', url: '#', icon: IconMessageCircle },
];

export function buildNavSecondary(
  _companyType: CompanyType,
): NavSecondaryItem[] {
  return navSecondaryItems;
}

export type ExtraRoute = { title: string; url: string; exact?: boolean };

/**
 * Page-specific titles for routes that don't appear as a sidebar nav item.
 * Matched with the same startsWith/exact logic as the nav items, and ranked
 * by URL specificity (longest match wins) so e.g. `/client/new/receipt`
 * outranks `/client/cases` and the home path.
 *
 * Exported as `EXTRA_ROUTES` for the command palette's "Jump to" group (K2),
 * which is generated from `buildNavMain()` plus this list rather than from a
 * hardcoded set. That is what keeps the palette's destinations from drifting
 * away from the navigation's: there is one list, and both read it.
 */
const extraRoutes: ExtraRoute[] = [
  { title: 'New case', url: '/client/new' },
  /*
   * Its own title, which is the whole reason this is a separate route. A client
   * who asked to speak to a human would otherwise have sat under "New case" —
   * the page title and the command palette's "Jump to" both read this list.
   */
  { title: 'Talk to a person', url: '/client/talk' },
  { title: 'Playbook Studio', url: '/admin/playbooks' },
  { title: 'AI Evals', url: '/admin/ai-evals' },
  { title: 'Playbooks', url: '/admin/tabular-playbook' },
  { title: 'New case', url: '/admin/cases/new' },
  { title: 'New enterprise', url: '/admin/companies/new-enterprise' },
  { title: 'New proposal', url: '/legal/proposals' },
  { title: 'Verify email', url: '/verify-email' },
  { title: 'Settings', url: '/user' },
];

/** Public name for `extraRoutes`. See the comment on it for why it is shared. */
export const EXTRA_ROUTES: readonly ExtraRoute[] = extraRoutes;

/**
 * Returns the nav item that matches the given pathname.
 * Prefers the most specific (longest matching URL) item so e.g. a `/admin/cases/123`
 * route picks "All cases" rather than "Home".
 */
export function findActiveNavItem(
  pathname: string,
  companyType: CompanyType,
  homePath: string,
): { title: string; url: string } | undefined {
  const candidates: ExtraRoute[] = [
    ...buildNavMain(companyType, homePath),
    ...buildNavSecondary(companyType),
    ...extraRoutes,
  ];

  let best: { title: string; url: string } | undefined;
  for (const item of candidates) {
    if (!isNavItemActive(pathname, item.url, item.exact)) continue;
    if (!best || item.url.length > best.url.length) {
      best = { title: item.title, url: item.url };
    }
  }
  return best;
}

/**
 * Returns the title of the nav item that matches the given pathname.
 */
export function findActiveNavTitle(
  pathname: string,
  companyType: CompanyType,
  homePath: string,
): string | undefined {
  return findActiveNavItem(pathname, companyType, homePath)?.title;
}
