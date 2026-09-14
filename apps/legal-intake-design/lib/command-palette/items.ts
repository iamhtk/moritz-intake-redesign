/**
 * What the command palette offers, as data (tasks K2, K3, K4).
 *
 * Pure builders, deliberately separated from the component that renders them,
 * because the interesting claims about this feature are all testable without a
 * DOM: that destinations are derived from the navigation rather than retyped,
 * that entities come through the same privacy boundary Ask uses, and that no
 * action exists here which does not exist in a row somewhere else.
 */

import {
  EXTRA_ROUTES,
  homePathByCompanyType,
  type NavItem,
} from '@/components/navigation/sidebar-nav-items';
import type { AskScope } from '@/lib/ask/scope';
import type { Role } from '@/lib/types';

/** A row in the palette, independent of how it is drawn. */
export type PaletteEntry = {
  /** Stable key. */
  id: string;
  /** The text `cmdk` matches against — label plus anything worth searching. */
  value: string;
  /** What the reader reads. */
  label: string;
  /** The muted second half of the row, where there is one. */
  hint?: string;
};

/** A destination. */
export type PaletteDestination = PaletteEntry & { href: string };

/**
 * Sections that exist only while a design flag is on.
 *
 * `EXTRA_ROUTES` lists their detail pages unconditionally, because its job is
 * to title a page that is being viewed — by which point the flag is moot. The
 * palette's job is the opposite: it offers a destination *before* anyone goes
 * there, so offering one whose section is switched off would be a row that
 * leads somewhere the navigation says does not exist.
 */
const FLAG_GATED_PREFIXES = [
  '/admin/playbooks',
  '/admin/ai-evals',
  '/admin/tabular-playbook',
];

/**
 * Destinations that exist in the app but have no business in a palette.
 *
 * `/admin/sentry-test` is a page for deliberately throwing an error to check
 * that Sentry is wired up. It is a real route and it is in `buildNavMain`, so
 * a palette generated from the navigation picks it up for free — and then the
 * first thing an admin sees when they press ⌘K and type "s" is an invitation to
 * crash the app. The nav keeps it (tucked under "More", where a developer
 * looking for it will find it); the palette, which is a *fast* path, does not.
 *
 * This list is the one place the palette is allowed to disagree with the
 * navigation, and it is deliberately a list of exact URLs rather than a
 * pattern, so adding to it is a decision somebody has to write down.
 */
const NOT_WORTH_A_SHORTCUT = ['/admin/sentry-test'];

/**
 * Every place this role can go, generated from the navigation.
 *
 * ⭐ The source palette hardcodes three routes. This reads `buildNavMain()` —
 * the same function the sidebar and the top nav read — so the palette is
 * role-aware for free and *cannot* drift from the navigation: a section added
 * to the nav appears here with no second edit, and one removed disappears.
 * Retyping the list would have been fewer lines and would have started rotting
 * the first time anyone touched the nav.
 *
 * `navMain` is passed in rather than rebuilt so the caller's flag options (the
 * gated admin sections) are honoured exactly as the nav honoured them.
 */
export function buildDestinations(
  role: Role,
  navMain: NavItem[],
  /**
   * Destinations already offered as an action, so they are not listed twice.
   *
   * A client's *Start a new case* is an action row with a `+` icon **and** was
   * appearing again under "Jump to" as "New case", because `/client/new` is in
   * `EXTRA_ROUTES`. Two rows, one destination, different wording: exactly the
   * noise that makes a palette feel padded.
   */
  claimedByActions: readonly string[] = [],
): PaletteDestination[] {
  const homePath = homePathByCompanyType[role];

  const sections: PaletteDestination[] = navMain
    .filter((item) => !NOT_WORTH_A_SHORTCUT.includes(item.url))
    .map((item) => ({
      id: `nav:${item.url}`,
      value: item.title,
      label: item.title,
      href: item.url,
    }));

  const known = new Set([
    ...sections.map((section) => section.href),
    ...claimedByActions,
  ]);

  /*
   * Sub-pages under this role's own area. `EXTRA_ROUTES` holds every role's, so
   * the `homePath` filter is what keeps a client from being offered
   * `/admin/users` — the palette is not a place to discover other roles' areas.
   */
  const extras: PaletteDestination[] = EXTRA_ROUTES.filter((route) => {
    if (!route.url.startsWith(homePath)) return false;
    if (known.has(route.url)) return false;
    if (NOT_WORTH_A_SHORTCUT.includes(route.url)) return false;
    const gated = FLAG_GATED_PREFIXES.find((prefix) =>
      route.url.startsWith(prefix),
    );
    // A gated section's sub-page is offered only when that section is in the nav.
    if (gated) return navMain.some((item) => item.url.startsWith(gated));
    return true;
  }).map((route) => ({
    id: `nav:${route.url}`,
    value: route.title,
    label: route.title,
    href: route.url,
  }));

  return [...sections, ...extras];
}

/**
 * Where each role can actually *open* each kind of record.
 *
 * `null` means this role has no page for that record, so the palette must not
 * offer it. This table exists because the obvious version — `${homePath}/cases/${id}`
 * for everything — is wrong, and wrong in a way that looks right: an audit of
 * the generated hrefs against the real route tree found **49 rows across the
 * four roles pointing at routes that do not exist.** A palette full of rows
 * that 404 is worse than a smaller palette, because the reader learns not to
 * trust it.
 *
 * The specific holes, all verified against `app/[locale]/(dashboard)`:
 *
 * - **Quote rounds live only at `/legal/quotes/[legalCaseId]`.** There is no
 *   admin or client quotes page, so only a lawyer gets quote rows.
 * - **Case types live only at `/admin/case-types/[caseTypeId]`.** They are
 *   reference data every role's *scope* contains, but only admin can open one.
 * - **Companies and the user directory live only under `/admin`.**
 * - **`INTERNAL_ASSISTANT` has no section routes at all.** Its home is `/user`,
 *   a settings page, and `buildNavMain` gives it exactly one nav item. So it
 *   gets **no** entity rows — not because of the privacy boundary (§8.3 gives it
 *   admin-level data) but because there is nowhere in the app to land. That is a
 *   gap in the app, not in the palette, and inventing `/user/cases/{id}` to fill
 *   it would just move the 404 somewhere harder to find.
 */
type EntityRouter = (id: string) => string;

const ENTITY_ROUTES: Record<
  Role,
  {
    legalCase: EntityRouter | null;
    company: EntityRouter | null;
    person: EntityRouter | null;
    quoteRound: EntityRouter | null;
    caseType: EntityRouter | null;
  }
> = {
  NON_LEGAL: {
    legalCase: (id) => `/client/cases/${id}`,
    company: null,
    person: null,
    quoteRound: null,
    caseType: null,
  },
  LEGAL: {
    legalCase: (id) => `/legal/cases/${id}`,
    company: null,
    person: null,
    // Keyed by case id, which is what this route's `[legalCaseId]` segment is.
    quoteRound: (caseId) => `/legal/quotes/${caseId}`,
    caseType: null,
  },
  INTERNAL_ADMIN: {
    legalCase: (id) => `/admin/cases/${id}`,
    company: (id) => `/admin/companies/${id}`,
    person: (id) => `/admin/users/${id}`,
    quoteRound: null,
    caseType: (id) => `/admin/case-types/${id}`,
  },
  INTERNAL_ASSISTANT: {
    legalCase: null,
    company: null,
    person: null,
    quoteRound: null,
    caseType: null,
  },
};

/** A company's kind, as a reader would say it rather than as an enum. */
function companyKind(type: Role): string {
  switch (type) {
    case 'LEGAL':
      return 'Law firm';
    case 'NON_LEGAL':
      return 'Client';
    case 'INTERNAL_ADMIN':
    case 'INTERNAL_ASSISTANT':
      return 'Moritz internal';
  }
}

/**
 * The entity groups, built from the scope and from nothing else.
 *
 * `scope` is an `AskScope` on purpose. A palette that lists what Ask refuses to
 * discuss is the same leak wearing a different hat, so both surfaces read the
 * one boundary: if a case is not in the projection, it is not findable here
 * either. Passing `MOCK_CASES` in directly would be the quick version and would
 * reintroduce ⚠️ B on the other surface.
 *
 * Two filters therefore apply to every row, and they are independent: **may
 * this role see it** (the scope) and **can this role open it** (the table
 * above). A row needs both.
 */
export function buildEntityGroups(scope: AskScope): {
  cases: PaletteDestination[];
  companies: PaletteDestination[];
  people: PaletteDestination[];
  quoteRounds: PaletteDestination[];
  caseTypes: PaletteDestination[];
} {
  /*
   * Each router is pulled into its own const so TypeScript can narrow it.
   * Reading `routes.legalCase` inside the callback below leaves it
   * `EntityRouter | null` as far as the compiler is concerned, because a
   * property read is not a narrowing it can carry into a closure.
   */
  const {
    legalCase: caseRoute,
    company: companyRoute,
    person: personRoute,
    quoteRound: quoteRoute,
    caseType: caseTypeRoute,
  } = ENTITY_ROUTES[scope.role];

  /*
   * Claimable work is listed with the cases rather than in a group of its own:
   * at this scale a group holding one row is more chrome than help. The scope
   * keeps them apart because an *answer* must not call them "my matters"; a
   * findable row has no such problem.
   */
  const cases: PaletteDestination[] = caseRoute
    ? [...scope.cases, ...scope.claimable].map((legalCase) => ({
        id: `case:${legalCase.id}`,
        // Both the number and the title are searchable, so "0126" and "MSA"
        // both find the same row.
        value: `${legalCase.caseNumber} ${legalCase.title}`,
        label: legalCase.caseNumber,
        hint: legalCase.title,
        href: caseRoute(legalCase.id),
      }))
    : [];

  const companies: PaletteDestination[] = companyRoute
    ? scope.companies.map((company) => ({
        id: `company:${company.id}`,
        // The type is searchable too, so "law firm" finds every law firm.
        value: `${company.name} ${companyKind(company.type)}`,
        label: company.name,
        /*
         * Kind before country, because the country does not disambiguate and
         * the kind does. Two of the eleven mock companies are both called
         * "Moritz" — the law-firm entity and the internal one — so on
         * `country` alone the admin palette showed two identical rows reading
         * "Moritz · US" and the reader had to guess. "Moritz · Law firm" and
         * "Moritz · Moritz internal" are tellable apart at a glance.
         */
        hint: `${companyKind(company.type)} · ${company.country}`,
        href: companyRoute(company.id),
      }))
    : [];

  const people: PaletteDestination[] = personRoute
    ? scope.people.map((person) => ({
        id: `person:${person.id}`,
        value: `${person.name} ${person.email}`,
        label: person.name,
        hint: person.company.name,
        href: personRoute(person.id),
      }))
    : [];

  const quoteRounds: PaletteDestination[] = quoteRoute
    ? scope.quoteRounds.map((round) => ({
        id: `quote:${round.id}`,
        value: `${round.caseNumber} ${round.caseTitle}`,
        label: round.caseNumber,
        hint: round.caseTitle,
        href: quoteRoute(round.caseId),
      }))
    : [];

  const caseTypes: PaletteDestination[] = caseTypeRoute
    ? scope.caseTypes.map((caseType) => ({
        id: `case-type:${caseType.id}`,
        value: caseType.name,
        label: caseType.name,
        href: caseTypeRoute(caseType.id),
      }))
    : [];

  return { cases, companies, people, quoteRounds, caseTypes };
}

/**
 * The actions a role may run from the palette.
 *
 * Every one of these mirrors a control that already exists elsewhere in the UI
 * — `newCase` is the button on the home screen, `settings` opens the same modal
 * the account menu does, `notifications` opens the same panel as the bell, and
 * `switchRole` drives the same `setRole` the Design playground settings section
 * drives. **No palette-only capability, ever**: a palette is a faster way to
 * reach the product, not a second product with its own powers. The day one of
 * these is the *only* way to do something, the palette has become a place where
 * work hides.
 *
 * Returned as identifiers rather than as callbacks so this stays pure and
 * testable; the component maps each to the handler it already has.
 *
 * **Every action is also gated on its target existing.** An action whose
 * surface is switched off is a dead row, which is the defect T34 spent its time
 * removing — and a dead row in a palette is worse than a dead button on a page,
 * because the reader had to type to find it.
 */
export type PaletteActionId =
  | 'newCase'
  | 'shareCase'
  | 'exportAuditLog'
  | 'askNora'
  | 'notifications'
  | 'settings'
  | 'switchRole';

/**
 * Which group an action belongs under.
 *
 * `playground` is separated on purpose. Role switching is the most-used control
 * in this app and belongs in a palette, but it is explicitly *not* product —
 * the settings section that owns it says "Controls that exist only inside this
 * app, never in production". Grouping it under its own heading means nobody
 * mistakes it for a Moritz feature while it sits two rows below ones that are.
 */
export type PaletteActionGroup = 'action' | 'playground';

export type PaletteAction = {
  id: PaletteActionId;
  /** `commandPalette.*` copy key for the label. */
  copyKey: string;
  group: PaletteActionGroup;
  /** Opens a sub-page to choose a target instead of acting at once (K7). */
  needsTarget?: boolean;
  /**
   * The destination this action navigates to, where it navigates at all.
   *
   * Passed to `buildDestinations` so the same place is never offered twice
   * under two different names.
   */
  href?: string;
};

export type PaletteActionOptions = {
  /** Ask is mounted, so the row leads somewhere. */
  askEnabled: boolean;
  /**
   * `useSettingsV2` is on. `SettingsV2Modal` returns `null` when it is off, so
   * without this the *Open settings* row opens nothing at all.
   */
  settingsEnabled: boolean;
};

export function buildActions(
  role: Role,
  options: PaletteActionOptions,
): PaletteAction[] {
  const actions: PaletteAction[] = [];

  // Starting a case is a client capability. A lawyer or an admin opening the
  // client intake would be filing work as somebody else. Admin has its own
  // `/admin/cases/new`, which arrives as a "Jump to" destination.
  if (role === 'NON_LEGAL') {
    actions.push({
      id: 'newCase',
      copyKey: 'actionNewCase',
      group: 'action',
      href: '/client/new',
    });
  }

  // Sharing needs a case to share, so it opens the one sub-page (K7). Offered
  // only where there is somewhere to open a case from in the first place.
  if (role !== 'INTERNAL_ASSISTANT') {
    actions.push({
      id: 'shareCase',
      copyKey: 'actionShareCase',
      group: 'action',
      needsTarget: true,
    });
  }

  // The audit log is admin-only, matching the §8.3 row that withholds it from
  // the internal assistant.
  if (role === 'INTERNAL_ADMIN') {
    actions.push({
      id: 'exportAuditLog',
      copyKey: 'actionExportAuditLog',
      group: 'action',
      href: '/admin/audit-log',
    });
  }

  if (options.askEnabled) {
    actions.push({ id: 'askNora', copyKey: 'actionAskNora', group: 'action' });
  }

  actions.push({
    id: 'notifications',
    copyKey: 'actionOpenNotifications',
    group: 'action',
  });

  if (options.settingsEnabled) {
    actions.push({
      id: 'settings',
      copyKey: 'actionOpenSettings',
      group: 'action',
    });
  }

  actions.push({
    id: 'switchRole',
    copyKey: 'actionSwitchRole',
    group: 'playground',
    needsTarget: true,
  });

  return actions;
}

/** The destinations the action rows already cover, for de-duplication. */
export function actionHrefs(actions: readonly PaletteAction[]): string[] {
  return actions
    .map((action) => action.href)
    .filter((href): href is string => href !== undefined);
}

/**
 * Cases offered as the target of an action, on the K7 sub-page.
 *
 * The same scope again, so the sub-page cannot become a back door to a case
 * the root palette would not have shown.
 */
export function buildActionTargets(scope: AskScope): PaletteDestination[] {
  return buildEntityGroups(scope).cases;
}
