import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { homePathByCompanyType } from '@/components/navigation/sidebar-nav-items';
import { buildNavForRole } from '@/components/design/top-nav/top-nav-shared';
import { buildAskScope } from '@/lib/ask/scope';
import {
  MOCK_ADMIN_USER,
  MOCK_ASSISTANT_USER,
  MOCK_CLIENT_USER,
  MOCK_LEGAL_USER,
} from '@/lib/mocks/users';
import type { AuthUser, Role } from '@/lib/types';
import {
  buildActionTargets,
  buildDestinations,
  buildEntityGroups,
} from './items';

/**
 * Every row in the palette goes somewhere that exists.
 *
 * This is the test the feature most needed and did not have. The palette builds
 * its hrefs from data, so a plausible-looking pattern —
 * `${homePath}/cases/${id}` for every role — produces rows that *look* right
 * and 404. An audit against the real route tree found **49 such rows across the
 * four roles**: every quote round for a client and an admin, every case type
 * for a client and a lawyer, and all 35 rows of the internal assistant's
 * palette, whose home is `/user` and which has no section routes at all.
 *
 * None of that is visible in a screenshot and none of it fails a type check. So
 * rather than fixing the six cases and moving on, the route tree itself is the
 * fixture: this walks `app/[locale]/(dashboard)` for real `page.tsx` files and
 * checks every generated href against it. A new entity group, a renamed route
 * or a fifth role cannot quietly reintroduce a dead row.
 */

const DASHBOARD = join(process.cwd(), 'app/[locale]/(dashboard)');

/** Every route that has a `page.tsx`, as a path like `/admin/cases/[caseId]`. */
function realRoutes(dir: string, prefix = ''): string[] {
  const found: string[] = [];
  if (existsSync(join(dir, 'page.tsx'))) found.push(prefix || '/');
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    // Route groups like `(dashboard)` do not appear in the URL.
    const segment = entry.name.startsWith('(') ? '' : `/${entry.name}`;
    found.push(...realRoutes(join(dir, entry.name), `${prefix}${segment}`));
  }
  return found;
}

const ROUTES = realRoutes(DASHBOARD);

/**
 * Whether a concrete href matches a route, treating `[param]` as a wildcard.
 *
 * Segment-by-segment rather than a regex over the whole path, so
 * `/admin/cases/new` prefers the literal `/admin/cases/new` and
 * `/admin/cases/case_009` falls to `/admin/cases/[caseId]` — and neither
 * matches the other's shape by accident.
 */
function routeExists(href: string): boolean {
  const actual = href.split('/').filter(Boolean);
  return ROUTES.some((route) => {
    const expected = route.split('/').filter(Boolean);
    if (expected.length !== actual.length) return false;
    return expected.every(
      (segment, index) =>
        (segment.startsWith('[') && segment.endsWith(']')) ||
        segment === actual[index],
    );
  });
}

const USERS: Record<Role, AuthUser> = {
  NON_LEGAL: MOCK_CLIENT_USER,
  LEGAL: MOCK_LEGAL_USER,
  INTERNAL_ADMIN: MOCK_ADMIN_USER,
  INTERNAL_ASSISTANT: MOCK_ASSISTANT_USER,
};

const ROLES = Object.keys(USERS) as Role[];

/** Every href the palette can offer this role, labelled by its group. */
function everyRow(
  role: Role,
): { group: string; label: string; href: string }[] {
  const nav = buildNavForRole(role, homePathByCompanyType[role], {});
  const scope = buildAskScope(role, USERS[role]);
  const groups = buildEntityGroups(scope);
  const row = (group: string) => (d: { label: string; href: string }) => ({
    group,
    label: d.label,
    href: d.href,
  });

  return [
    ...buildDestinations(role, nav).map(row('jump-to')),
    ...groups.cases.map(row('case')),
    ...groups.companies.map(row('company')),
    ...groups.people.map(row('person')),
    ...groups.quoteRounds.map(row('quote-round')),
    ...groups.caseTypes.map(row('case-type')),
    ...buildActionTargets(scope).map(row('action-target')),
  ];
}

describe('the route fixture itself', () => {
  it('found the dashboard routes', () => {
    expect(ROUTES.length).toBeGreaterThan(30);
    expect(ROUTES).toContain('/admin/cases/[caseId]');
    expect(ROUTES).toContain('/client/cases/[id]');
    expect(ROUTES).toContain('/legal/quotes/[legalCaseId]');
  });

  /* Guards the matcher, not the palette. A matcher that said yes to everything
   * would make every test below pass for the wrong reason. */
  it('rejects a route that does not exist', () => {
    expect(routeExists('/client/quotes/case_006')).toBe(false);
    expect(routeExists('/user/cases/case_009')).toBe(false);
    expect(routeExists('/admin/nonsense')).toBe(false);
  });

  it('accepts a real route and a real parameterised route', () => {
    expect(routeExists('/admin/cases')).toBe(true);
    expect(routeExists('/admin/cases/case_009')).toBe(true);
    expect(routeExists('/admin/cases/new')).toBe(true);
  });
});

describe('no dead rows', () => {
  /* ⭐ The headline. Every row, every role, resolves to a real page. */
  it.each(ROLES)('%s', (role) => {
    const dead = everyRow(role)
      .filter((row) => !routeExists(row.href))
      .map((row) => `[${row.group}] ${row.label} -> ${row.href}`);
    expect(dead).toEqual([]);
  });

  it('offers no row twice', () => {
    for (const role of ROLES) {
      const hrefs = everyRow(role)
        .filter((row) => row.group !== 'action-target')
        .map((row) => row.href);
      expect(hrefs).toEqual([...new Set(hrefs)]);
    }
  });
});

describe('what each role can actually open', () => {
  /*
   * The six holes the audit found, pinned individually so a regression names
   * itself rather than appearing as a count.
   */
  it('gives quote rounds only to the lawyer, the one role with a quotes page', () => {
    expect(ROUTES).toContain('/legal/quotes/[legalCaseId]');
    expect(ROUTES.some((r) => r.startsWith('/admin/quotes'))).toBe(false);
    expect(ROUTES.some((r) => r.startsWith('/client/quotes'))).toBe(false);

    for (const role of ROLES) {
      const scope = buildAskScope(role, USERS[role]);
      const rounds = buildEntityGroups(scope).quoteRounds;
      if (role !== 'LEGAL') expect(rounds).toEqual([]);
    }
  });

  it('gives case types only to admin, the one role with a case-types page', () => {
    expect(ROUTES).toContain('/admin/case-types/[caseTypeId]');
    for (const role of ROLES) {
      const types = buildEntityGroups(
        buildAskScope(role, USERS[role]),
      ).caseTypes;
      if (role !== 'INTERNAL_ADMIN') expect(types).toEqual([]);
    }
  });

  it('gives companies and the directory only to admin', () => {
    for (const role of ROLES) {
      const groups = buildEntityGroups(buildAskScope(role, USERS[role]));
      if (role !== 'INTERNAL_ADMIN') {
        expect(groups.companies).toEqual([]);
        expect(groups.people).toEqual([]);
      }
    }
    const admin = buildEntityGroups(
      buildAskScope('INTERNAL_ADMIN', MOCK_ADMIN_USER),
    );
    expect(admin.companies.length).toBeGreaterThan(0);
    expect(admin.people.length).toBeGreaterThan(0);
  });

  /*
   * The internal assistant gets no entity rows — and this is a finding about
   * the *app*, not the palette. §8.3 gives it admin-level data, but its home is
   * `/user` (a settings page) and `buildNavMain` gives it one nav item, so
   * there is nowhere to land. Inventing `/user/cases/{id}` would move the 404
   * somewhere harder to find. If the assistant ever gets its own area, this
   * test is the one to come back to.
   */
  it('gives the internal assistant no entity rows, because it has no pages', () => {
    const scope = buildAskScope('INTERNAL_ASSISTANT', MOCK_ASSISTANT_USER);
    // Its data scope is genuinely wide...
    expect(scope.cases.length).toBeGreaterThan(0);
    expect(scope.companies.length).toBeGreaterThan(0);

    // ...and it still has nowhere to open any of it.
    const groups = buildEntityGroups(scope);
    expect(groups.cases).toEqual([]);
    expect(groups.companies).toEqual([]);
    expect(groups.people).toEqual([]);
    expect(groups.quoteRounds).toEqual([]);
    expect(groups.caseTypes).toEqual([]);

    expect(ROUTES.filter((r) => r.startsWith('/user'))).toEqual(['/user']);
  });

  it('still gives every role something to reach', () => {
    for (const role of ROLES) {
      expect(everyRow(role).length).toBeGreaterThan(0);
    }
  });
});
