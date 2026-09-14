import { describe, expect, it } from 'vitest';
import { homePathByCompanyType } from '@/components/navigation/sidebar-nav-items';
import { buildNavForRole } from '@/components/design/top-nav/top-nav-shared';
import { buildAskScope } from '@/lib/ask/scope';
import { MOCK_CASES } from '@/lib/mocks/cases';
import {
  MOCK_ADMIN_USER,
  MOCK_ASSISTANT_USER,
  MOCK_CLIENT_USER,
  MOCK_LEGAL_USER,
} from '@/lib/mocks/users';
import type { AuthUser, Role } from '@/lib/types';
import {
  actionHrefs,
  buildActions,
  buildActionTargets,
  buildDestinations,
  buildEntityGroups,
  type PaletteActionOptions,
} from './items';

/**
 * What the palette offers, tested as data.
 *
 * The two claims worth guarding are the two that would fail silently: that
 * "Jump to" is *derived* from the navigation rather than retyped (so it cannot
 * drift), and that entities come through the Ask boundary (so the palette is
 * not a second way to read a case you may not see).
 */

const USERS: Record<Role, AuthUser> = {
  NON_LEGAL: MOCK_CLIENT_USER,
  LEGAL: MOCK_LEGAL_USER,
  INTERNAL_ADMIN: MOCK_ADMIN_USER,
  INTERNAL_ASSISTANT: MOCK_ASSISTANT_USER,
};

const ROLES = Object.keys(USERS) as Role[];

const navFor = (role: Role) =>
  buildNavForRole(role, homePathByCompanyType[role], {});

describe('destinations', () => {
  /*
   * ⭐ The claim that beats the source, asserted rather than described: every
   * section in the navigation is reachable from the palette. If someone adds a
   * nav item and the palette does not pick it up, this fails.
   */
  /**
   * Destinations the palette deliberately withholds from an otherwise
   * generated list. Kept here as well as in the source so a change has to be
   * made twice, on purpose.
   */
  const DELIBERATELY_ABSENT = ['/admin/sentry-test'];

  it.each(ROLES)('%s can reach every section in its navigation', (role) => {
    const nav = navFor(role);
    const hrefs = buildDestinations(role, nav).map((d) => d.href);
    for (const item of nav) {
      if (DELIBERATELY_ABSENT.includes(item.url)) continue;
      expect(hrefs).toContain(item.url);
    }
  });

  /*
   * `/admin/sentry-test` throws an error on purpose to prove Sentry is wired
   * up. It is a real route and it is in `buildNavMain`, so a generated list
   * picks it up for free — and then the first thing an admin sees on pressing
   * ⌘K and typing "s" is an invitation to crash the app.
   */
  it.each(DELIBERATELY_ABSENT)('never offers %s', (url) => {
    for (const role of ROLES) {
      expect(
        buildDestinations(role, navFor(role)).map((d) => d.href),
      ).not.toContain(url);
    }
  });

  /*
   * The palette and the navigation must agree, flags included. The top nav
   * wraps `buildNavMain` in `withPlaybooks`; the palette used to call
   * `buildNavMain` directly, so with `usePlaybooks` on there was a Playbooks
   * tab on screen that ⌘K could not find. Both now call `buildNavForRole`.
   */
  it.each(['NON_LEGAL', 'LEGAL'] as const)(
    '%s reaches the flag-gated Playbooks tab exactly when the nav shows it',
    (role) => {
      const homePath = homePathByCompanyType[role];

      const off = buildNavForRole(role, homePath, {});
      expect(off.some((i) => i.url === `${homePath}/playbooks`)).toBe(false);
      expect(buildDestinations(role, off).map((d) => d.href)).not.toContain(
        `${homePath}/playbooks`,
      );

      const on = buildNavForRole(role, homePath, { usePlaybooks: true });
      expect(on.some((i) => i.url === `${homePath}/playbooks`)).toBe(true);
      expect(buildDestinations(role, on).map((d) => d.href)).toContain(
        `${homePath}/playbooks`,
      );
    },
  );

  /*
   * One destination, one row. A client's *Start a new case* is an action with a
   * `+` icon and `/client/new` is also in `EXTRA_ROUTES`, so it was appearing
   * twice under two different names — the exact noise that makes a palette feel
   * padded rather than sharp.
   */
  it('does not repeat a destination an action already covers', () => {
    const actions = buildActions('NON_LEGAL', {
      askEnabled: true,
      settingsEnabled: true,
    });
    expect(actionHrefs(actions)).toContain('/client/new');

    const hrefs = buildDestinations(
      'NON_LEGAL',
      navFor('NON_LEGAL'),
      actionHrefs(actions),
    ).map((d) => d.href);
    expect(hrefs).not.toContain('/client/new');
  });

  it.each(ROLES)('%s is offered nothing outside its own area', (role) => {
    const homePath = homePathByCompanyType[role];
    for (const destination of buildDestinations(role, navFor(role))) {
      expect(destination.href.startsWith(homePath)).toBe(true);
    }
  });

  it('offers the client their new-case route, which is not a nav item', () => {
    const labels = buildDestinations('NON_LEGAL', navFor('NON_LEGAL')).map(
      (d) => d.label,
    );
    expect(labels).toContain('New case');
  });

  it('does not repeat a route that is already a nav item', () => {
    const hrefs = buildDestinations(
      'INTERNAL_ADMIN',
      navFor('INTERNAL_ADMIN'),
    ).map((d) => d.href);
    expect(hrefs).toEqual([...new Set(hrefs)]);
  });

  /*
   * The flag interaction. `EXTRA_ROUTES` lists the gated admin sub-pages
   * unconditionally, because its own job is to title a page already being
   * viewed. Offering one while its section is switched off would be a row
   * pointing at a destination the navigation says is not there.
   */
  it('withholds a flag-gated sub-page while its section is off', () => {
    const off = buildDestinations(
      'INTERNAL_ADMIN',
      buildNavForRole('INTERNAL_ADMIN', '/admin', {}),
    ).map((d) => d.href);
    expect(off).not.toContain('/admin/ai-evals');
  });

  it('offers a flag-gated sub-page once its section is on', () => {
    const on = buildDestinations(
      'INTERNAL_ADMIN',
      buildNavForRole('INTERNAL_ADMIN', '/admin', { useAiEvalsAdmin: true }),
    ).map((d) => d.href);
    expect(on).toContain('/admin/ai-evals');
  });
});

describe('entities', () => {
  /*
   * ⚠️ B on the palette. The client's group must hold their four cases and not
   * the nine the list helper would have handed over.
   */
  it('lists only the cases the client’s own scope allows', () => {
    const scope = buildAskScope('NON_LEGAL', MOCK_CLIENT_USER);
    const labels = buildEntityGroups(scope).cases.map((c) => c.label);
    expect(labels.sort()).toEqual([
      'M-2026-0114',
      'M-2026-0121',
      'M-2026-0123',
      'M-2026-0126',
    ]);
    expect(labels).not.toContain('M-2026-0118');
  });

  it.each(ROLES)('%s can never find a case outside its scope', (role) => {
    const scope = buildAskScope(role, USERS[role]);
    const allowed = new Set(
      [...scope.cases, ...scope.claimable].map((c) => c.caseNumber),
    );
    const offered = buildEntityGroups(scope).cases.map((c) => c.label);
    for (const label of offered) {
      expect(allowed.has(label)).toBe(true);
    }
    // And every case the mocks hold that is *not* allowed stays unfindable.
    const forbidden = MOCK_CASES.map((c) => c.caseNumber).filter(
      (number) => !allowed.has(number),
    );
    for (const number of forbidden) {
      expect(offered).not.toContain(number);
    }
  });

  it('gives a client no company list and no directory', () => {
    const groups = buildEntityGroups(
      buildAskScope('NON_LEGAL', MOCK_CLIENT_USER),
    );
    expect(groups.companies).toEqual([]);
    expect(groups.people).toEqual([]);
  });

  it('gives admin a company list and a directory', () => {
    const groups = buildEntityGroups(
      buildAskScope('INTERNAL_ADMIN', MOCK_ADMIN_USER),
    );
    expect(groups.companies.length).toBeGreaterThan(0);
    expect(groups.people.length).toBeGreaterThan(0);
  });

  it('makes a case findable by its number and by its title', () => {
    const scope = buildAskScope('NON_LEGAL', MOCK_CLIENT_USER);
    const row = buildEntityGroups(scope).cases.find(
      (c) => c.label === 'M-2026-0126',
    );
    expect(row?.value).toContain('M-2026-0126');
    expect(row?.value).toContain('MSA review');
  });

  it('points every row at this role’s own area', () => {
    const scope = buildAskScope('INTERNAL_ADMIN', MOCK_ADMIN_USER);
    const groups = buildEntityGroups(scope);
    for (const row of [
      ...groups.cases,
      ...groups.companies,
      ...groups.people,
      ...groups.quoteRounds,
      ...groups.caseTypes,
    ]) {
      expect(row.href.startsWith('/admin')).toBe(true);
    }
  });
});

describe('actions', () => {
  const ids = (role: Role, overrides: Partial<PaletteActionOptions> = {}) =>
    buildActions(role, {
      askEnabled: true,
      settingsEnabled: true,
      ...overrides,
    }).map((a) => a.id);

  it('offers starting a case to the client only', () => {
    expect(ids('NON_LEGAL')).toContain('newCase');
    expect(ids('LEGAL')).not.toContain('newCase');
    expect(ids('INTERNAL_ADMIN')).not.toContain('newCase');
  });

  /* §8.3 withholds the audit log from the internal assistant. */
  it('offers the audit-log export to admin only', () => {
    expect(ids('INTERNAL_ADMIN')).toContain('exportAuditLog');
    expect(ids('INTERNAL_ASSISTANT')).not.toContain('exportAuditLog');
    expect(ids('NON_LEGAL')).not.toContain('exportAuditLog');
    expect(ids('LEGAL')).not.toContain('exportAuditLog');
  });

  /*
   * Both gates guard the same defect: a row that opens nothing. `AskPanel` and
   * `SettingsV2Modal` each render `null` when their flag is off, so an ungated
   * row would be a dead control the reader had to type to find.
   */
  it('drops the Ask row when Ask is switched off', () => {
    expect(ids('NON_LEGAL')).toContain('askNora');
    expect(ids('NON_LEGAL', { askEnabled: false })).not.toContain('askNora');
  });

  it('drops the settings row when the settings modal is switched off', () => {
    expect(ids('NON_LEGAL')).toContain('settings');
    expect(ids('NON_LEGAL', { settingsEnabled: false })).not.toContain(
      'settings',
    );
  });

  it('offers role switching to every role, in the playground group', () => {
    for (const role of ROLES) {
      const actions = buildActions(role, {
        askEnabled: true,
        settingsEnabled: true,
      });
      const switchRole = actions.find((a) => a.id === 'switchRole');
      expect(switchRole?.group).toBe('playground');
      expect(switchRole?.needsTarget).toBe(true);
    }
  });

  /*
   * The playground row must be the only one outside the product group, or the
   * separation that keeps it from reading as a Moritz feature stops meaning
   * anything.
   */
  it('puts every other action in the product group', () => {
    const actions = buildActions('INTERNAL_ADMIN', {
      askEnabled: true,
      settingsEnabled: true,
    });
    const playground = actions.filter((a) => a.group === 'playground');
    expect(playground.map((a) => a.id)).toEqual(['switchRole']);
  });

  it('gives every role something to do', () => {
    for (const role of ROLES) expect(ids(role).length).toBeGreaterThan(0);
  });

  it('marks only the actions that need a target', () => {
    const actions = buildActions('NON_LEGAL', {
      askEnabled: true,
      settingsEnabled: true,
    });
    expect(actions.find((a) => a.id === 'shareCase')?.needsTarget).toBe(true);
    expect(
      actions.find((a) => a.id === 'settings')?.needsTarget,
    ).toBeUndefined();
  });

  it('names a copy key for every action', () => {
    for (const role of ROLES) {
      for (const action of buildActions(role, {
        askEnabled: true,
        settingsEnabled: true,
      })) {
        expect(action.copyKey).toMatch(/^action[A-Z]/);
      }
    }
  });
});

describe('action targets', () => {
  /* The sub-page must not be a back door past the boundary. */
  it.each(ROLES)('%s is offered only in-scope cases as a target', (role) => {
    const scope = buildAskScope(role, USERS[role]);
    expect(buildActionTargets(scope).map((c) => c.label)).toEqual(
      buildEntityGroups(scope).cases.map((c) => c.label),
    );
  });
});
