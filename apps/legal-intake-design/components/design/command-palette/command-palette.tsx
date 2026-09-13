'use client';

import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useTranslations } from 'next-intl';
import { useCommandState } from 'cmdk';
import {
  ArrowLeft,
  Bell,
  Building2,
  FileText,
  Files,
  Gavel,
  Plus,
  Settings,
  Share2,
  Sparkles,
  UserCog,
  Users,
} from '@repo/ui/icons';

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import { ShareCaseDialog } from '@/components/cases/share-case-dialog';
import { useCommandPalette } from './command-palette-context';
import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import { useNotificationsPanel } from '@/components/design/notifications/notifications-panel-context';
import { useSettingsV2Modal } from '@/components/design/settings-v2/settings-v2-context';
import { useNavigationGuard } from '@/components/navigation/navigation-guard-context';
import { homePathByCompanyType } from '@/components/navigation/sidebar-nav-items';
import { buildNavForRole } from '@/components/design/top-nav/top-nav-shared';
import { usePlayground } from '@/components/playground/role-context';
import { useRouter } from '@/i18n/navigation';
import { buildAskScope } from '@/lib/ask/scope';
import { commandFilter } from '@/lib/command-filter';
import {
  actionHrefs,
  buildActions,
  buildActionTargets,
  buildDestinations,
  buildEntityGroups,
  type PaletteAction,
  type PaletteActionId,
  type PaletteDestination,
} from '@/lib/command-palette/items';
import { matchesModShortcut, modKeyLabel } from '@/lib/keyboard';
import type { AuthUser, LegalCase, Role } from '@/lib/types';

/**
 * How many rows a group shows before it offers the rest (task K1).
 *
 * Kept from the source, which was tuned against 48 matters and 14 lawyers. At
 * our scale — about 50 palette-addressable records after role-scoping, and nine
 * cases — it will almost never fire. It is twenty lines and it stops a future
 * seed expansion from silently producing a list the reader has to scroll past,
 * which is worth keeping even unseen. The expand/collapse *animation* the
 * source pairs with it is not, and is deliberately absent: motion nobody will
 * see is cost with no return.
 */
const GROUP_CAP = 5;

/** Which screen of the palette is showing. One level deep, never more. */
type Page = 'root' | 'pickCaseToShare' | 'pickRole';

/**
 * How many rows matched, announced rather than only drawn.
 *
 * `aria-live` because the result of typing in this field is that a list
 * somewhere below changes length, which a reader using a screen reader
 * otherwise has to go and discover. Suppressed on an empty query, where the
 * count is "everything" and saying so is noise.
 */
function ResultCount() {
  const t = useTranslations('commandPalette');
  const count = useCommandState((state) => state.filtered.count);
  const search = useCommandState((state) => state.search);
  if (!search.trim()) return null;
  return (
    <p
      className="text-muted-foreground px-3 pb-1 pt-2 text-xs tabular-nums"
      aria-live="polite"
    >
      {t('results', { count })}
    </p>
  );
}

/**
 * A group that shows the first {@link GROUP_CAP} rows and admits the rest.
 *
 * The admission is the point: a list that silently stops at five is a list that
 * lies about how much there is. While a query is active the cap is lifted
 * altogether, because a reader who typed something is looking for one specific
 * row and hiding it behind "show more" would be the worst possible moment.
 */
function CappedGroup({
  heading,
  items,
  expanded,
  onExpand,
}: {
  heading: string;
  items: ReactElement[];
  expanded: boolean;
  onExpand: () => void;
}) {
  const t = useTranslations('commandPalette');
  const search = useCommandState((state) => state.search);
  const searching = search.trim().length > 0;
  const remaining = items.length - GROUP_CAP;
  const visible =
    expanded || searching || remaining <= 0 ? items : items.slice(0, GROUP_CAP);

  if (items.length === 0) return null;

  return (
    <CommandGroup heading={heading}>
      {visible}
      {!expanded && !searching && remaining > 0 ? (
        <CommandItem
          value={`${heading} show more`}
          keywords={['action']}
          onSelect={onExpand}
        >
          <span className="text-muted-foreground text-sm">
            {t('showMore', { count: remaining })}
          </span>
        </CommandItem>
      ) : null}
    </CommandGroup>
  );
}

/**
 * ⌘K — one keyboard entry point to everything the current role can reach.
 *
 * Three things about this one are deliberate and are worth reading before
 * changing it:
 *
 * 1. **Destinations are generated, not listed.** `buildDestinations` reads
 *    `buildNavMain()`, the same function the sidebar and top nav read, so the
 *    palette is role-aware for free and cannot drift from the navigation.
 * 2. **Entities come through `buildAskScope`,** the same boundary Ask uses. A
 *    palette that lists what Ask refuses to discuss is the same leak wearing a
 *    different hat.
 * 3. **Every action mirrors a control that already exists.** Share opens the
 *    very same `ShareCaseDialog` the case header opens; settings and
 *    notifications open the same modal and panel as the account menu and the
 *    bell. There is no palette-only capability, and there must never be one.
 *
 * Navigation routes through `useNavigationGuard()` rather than straight to the
 * router, so jumping out of a half-finished intake prompts exactly as the top
 * nav does. Without that, the palette would be a way to lose work that every
 * other affordance on the screen protects.
 */
export function CommandPalette({
  user,
  onAskNora,
}: {
  user: AuthUser;
  /**
   * Opens Ask. Omitted when Ask is not mounted, in which case the row is not
   * offered at all rather than offered and inert.
   */
  onAskNora?: () => void;
}) {
  const t = useTranslations('commandPalette');
  const { open, setOpen, closePalette } = useCommandPalette();
  const { flags } = useDesignFlags();
  const router = useRouter();
  const navigationGuard = useNavigationGuard();
  const { openModal: openSettings } = useSettingsV2Modal();
  const { openPanel: openNotifications } = useNotificationsPanel();
  const { role: activeRole, setRole } = usePlayground();

  const [page, setPage] = useState<Page>('root');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [shareCase, setShareCase] = useState<LegalCase | null>(null);

  /*
   * Read in an effect, never at render: the server has no `navigator`, and
   * guessing "⌘" during SSR then correcting to "Ctrl" on hydration is both a
   * React warning and a visible flicker.
   */
  const [mod, setMod] = useState('Ctrl');
  useEffect(() => setMod(modKeyLabel()), []);

  const role = user.company.type;
  const homePath = homePathByCompanyType[role];

  /*
   * `buildNavForRole` — the *same* function the top nav calls, flags included.
   * Calling `buildNavMain` directly here was a real bug: the top nav wrapped it
   * in `withPlaybooks` and this did not, so with `usePlaybooks` on there was a
   * Playbooks tab on screen that ⌘K could not find. Sharing the generation but
   * not the flag wrapping is how a "cannot drift" list drifts.
   */
  const navMain = useMemo(
    () => buildNavForRole(role, homePath, flags),
    [role, homePath, flags],
  );

  const scope = useMemo(() => buildAskScope(role, user), [role, user]);
  const entities = useMemo(() => buildEntityGroups(scope), [scope]);
  const actions = useMemo(
    () =>
      buildActions(role, {
        askEnabled: Boolean(onAskNora),
        // `SettingsV2Modal` renders `null` when this flag is off, so without
        // the gate "Open settings" is a row that opens nothing.
        settingsEnabled: Boolean(flags.useSettingsV2),
      }),
    [role, onAskNora, flags.useSettingsV2],
  );
  const destinations = useMemo(
    () => buildDestinations(role, navMain, actionHrefs(actions)),
    [role, navMain, actions],
  );
  const shareTargets = useMemo(() => buildActionTargets(scope), [scope]);

  // Closing the palette resets it: reopening onto a sub-page the reader left
  // three minutes ago, with a stale query, is a palette that remembers the
  // wrong thing.
  useEffect(() => {
    if (open) return;
    setPage('root');
    setExpanded({});
  }, [open]);

  // ⌘K toggles from anywhere, including from inside the palette (which is why
  // `matchesModShortcut` is told it is being called from within an overlay).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!matchesModShortcut(event, 'k', open)) return;
      event.preventDefault();
      setOpen(!open);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open, setOpen]);

  /** Close first, then act. Acting under an open dialog fights the focus trap. */
  const run = (fn: () => void) => {
    closePalette();
    fn();
  };

  const go = (href: string) =>
    run(() => {
      // The guard shows its own confirmation when a form is dirty and navigates
      // itself when it is not, so there is nothing to do on either branch here.
      if (navigationGuard) navigationGuard.navigate(href);
      else router.push(href);
    });

  const runAction = (id: PaletteActionId) => {
    switch (id) {
      case 'newCase':
        return go('/client/new');
      case 'shareCase':
        // The one sub-page: the action needs a target, so it asks for one
        // rather than guessing or acting on nothing.
        return setPage('pickCaseToShare');
      case 'exportAuditLog':
        /*
         * Navigates to the audit log rather than opening the export dialog.
         * `ExportAuditLogDialog` owns its own open state behind its own trigger
         * button, so it cannot be opened from here without duplicating it —
         * and a second export dialog is exactly the "no second path" rule being
         * broken. Taking the reader to the one control is the honest version.
         */
        return go(`${homePath}/audit-log`);
      case 'switchRole':
        // Needs a target, like Share. Opens the one-level sub-page.
        return setPage('pickRole');
      case 'askNora':
        return run(() => onAskNora?.());
      case 'notifications':
        return run(openNotifications);
      case 'settings':
        return run(openSettings);
    }
  };

  const destinationRow = (
    destination: PaletteDestination,
    icon: ReactElement,
    kind: 'nav' | 'entity',
  ) => (
    <CommandItem
      key={destination.id}
      value={destination.value}
      keywords={[kind]}
      onSelect={() => go(destination.href)}
    >
      {icon}
      <span className="min-w-0 truncate">{destination.label}</span>
      {destination.hint ? (
        <span className="text-muted-foreground group-data-[selected=true]/command-item:text-primary-foreground min-w-0 truncate text-sm">
          {destination.hint}
        </span>
      ) : null}
    </CommandItem>
  );

  const actionIcons: Record<PaletteActionId, ReactElement> = {
    newCase: <Plus aria-hidden />,
    shareCase: <Share2 aria-hidden />,
    exportAuditLog: <FileText aria-hidden />,
    askNora: <Sparkles aria-hidden />,
    notifications: <Bell aria-hidden />,
    settings: <Settings aria-hidden />,
    switchRole: <UserCog aria-hidden />,
  };

  /*
   * The four personas, with the human behind each, because "Assistant" alone
   * does not tell a reviewer what they are about to become. Mirrors the list in
   * `playground-settings-section.tsx` — the control this row is a shortcut to.
   */
  const ROLES: { value: Role; copyKey: string; hintKey: string }[] = [
    { value: 'NON_LEGAL', copyKey: 'roleClient', hintKey: 'roleClientHint' },
    { value: 'LEGAL', copyKey: 'roleLawyer', hintKey: 'roleLawyerHint' },
    {
      value: 'INTERNAL_ADMIN',
      copyKey: 'roleAdmin',
      hintKey: 'roleAdminHint',
    },
    {
      value: 'INTERNAL_ASSISTANT',
      copyKey: 'roleAssistant',
      hintKey: 'roleAssistantHint',
    },
  ];

  /**
   * Switch persona, exactly as the settings section does it.
   *
   * A full `window.location.assign` rather than a router push, because the mock
   * user is resolved *server-side* from the freshly written cookie — a client
   * navigation would leave every server component rendering the previous
   * persona until something else forced a reload. Copied deliberately from
   * `playground-settings-section.tsx` so the two paths cannot behave
   * differently; if that one changes, this should follow it.
   */
  const goToRole = (next: Role) => {
    setRole(next);
    window.location.assign(homePathByCompanyType[next]);
  };

  const onSharePage = page === 'pickCaseToShare';
  const onRolePage = page === 'pickRole';

  /** Action rows for one group, so the two groups render identically. */
  const actionRows = (group: PaletteAction['group']) =>
    actions
      .filter((action) => action.group === group)
      .map((action) => (
        <CommandItem
          key={action.id}
          value={t(action.copyKey)}
          keywords={['action']}
          onSelect={() => runAction(action.id)}
        >
          {actionIcons[action.id]}
          <span className="min-w-0">{t(action.copyKey)}</span>
          {action.id === 'askNora' ? (
            <CommandShortcut>{`${mod}J`}</CommandShortcut>
          ) : null}
        </CommandItem>
      ));

  return (
    <>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={
          onSharePage
            ? t('pickCaseTitle')
            : onRolePage
              ? t('pickRoleTitle')
              : t('title')
        }
        description={t('description')}
      >
        {/*
         * `key={page}` remounts the command on a page change, which resets the
         * query and the highlighted row. Carrying a root query into the
         * sub-page would filter the case list by something the reader typed to
         * find the action, and would usually show nothing.
         */}
        <Command key={page} filter={commandFilter} className="bg-transparent">
          <CommandInput
            autoFocus
            aria-label={
              onSharePage
                ? t('pickCaseLabel')
                : onRolePage
                  ? t('pickRoleLabel')
                  : t('fieldLabel')
            }
            placeholder={
              onSharePage
                ? t('pickCasePlaceholder')
                : onRolePage
                  ? t('pickRolePlaceholder')
                  : t('placeholder')
            }
          />
          <ResultCount />
          <CommandList>
            <CommandEmpty>
              {onSharePage
                ? t('pickCaseEmpty')
                : onRolePage
                  ? t('pickRoleEmpty')
                  : t('empty')}
            </CommandEmpty>

            {onRolePage ? (
              <>
                <CommandGroup heading={t('groupPlayground')}>
                  {ROLES.map((entry) => (
                    <CommandItem
                      key={entry.value}
                      value={`${t(entry.copyKey)} ${t(entry.hintKey)}`}
                      keywords={['entity']}
                      // The role you are already in is shown and disabled
                      // rather than hidden: a list that silently drops one of
                      // four makes the reader wonder which is missing.
                      disabled={entry.value === activeRole}
                      onSelect={() => {
                        if (entry.value === activeRole) return;
                        closePalette();
                        goToRole(entry.value);
                      }}
                    >
                      <UserCog aria-hidden />
                      <span className="min-w-0">{t(entry.copyKey)}</span>
                      <span className="text-muted-foreground group-data-[selected=true]/command-item:text-primary-foreground min-w-0 truncate text-sm">
                        {t(entry.hintKey)}
                      </span>
                      {entry.value === activeRole ? (
                        <CommandShortcut>{t('roleCurrent')}</CommandShortcut>
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandGroup>
                  <CommandItem
                    value={t('back')}
                    keywords={['action']}
                    onSelect={() => setPage('root')}
                  >
                    <ArrowLeft aria-hidden />
                    <span>{t('backHint')}</span>
                  </CommandItem>
                </CommandGroup>
              </>
            ) : onSharePage ? (
              <>
                <CommandGroup heading={t('groupCases')}>
                  {shareTargets.map((target) => (
                    <CommandItem
                      key={target.id}
                      value={target.value}
                      keywords={['entity']}
                      onSelect={() => {
                        const found = [...scope.cases, ...scope.claimable].find(
                          (c) => `case:${c.id}` === target.id,
                        );
                        if (!found) return;
                        // Close the palette, then open the very dialog the case
                        // header opens. One share path, two ways in.
                        closePalette();
                        setShareCase(found);
                      }}
                    >
                      <Files aria-hidden />
                      <span className="min-w-0 truncate">{target.label}</span>
                      {target.hint ? (
                        <span className="text-muted-foreground group-data-[selected=true]/command-item:text-primary-foreground min-w-0 truncate text-sm">
                          {target.hint}
                        </span>
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandGroup>
                  <CommandItem
                    value={t('back')}
                    keywords={['action']}
                    onSelect={() => setPage('root')}
                  >
                    <ArrowLeft aria-hidden />
                    <span>{t('backHint')}</span>
                  </CommandItem>
                </CommandGroup>
              </>
            ) : (
              <>
                {/*
                 * Actions first. At our scale the entity groups are thin — nine
                 * cases, and four of them for a client — so leading with the
                 * nav or the cases would open the palette on its emptiest
                 * content. The actions are what carry it, which is the fix §8.5
                 * names for the scale problem: better grouping, not padding.
                 */}
                <CommandGroup heading={t('groupActions')}>
                  {actionRows('action')}
                </CommandGroup>

                <CappedGroup
                  heading={t('groupCases')}
                  expanded={Boolean(expanded.cases)}
                  onExpand={() =>
                    setExpanded((prev) => ({ ...prev, cases: true }))
                  }
                  items={entities.cases.map((c) =>
                    destinationRow(c, <Files aria-hidden />, 'entity'),
                  )}
                />

                <CappedGroup
                  heading={t('groupCompanies')}
                  expanded={Boolean(expanded.companies)}
                  onExpand={() =>
                    setExpanded((prev) => ({ ...prev, companies: true }))
                  }
                  items={entities.companies.map((c) =>
                    destinationRow(c, <Building2 aria-hidden />, 'entity'),
                  )}
                />

                <CappedGroup
                  heading={t('groupPeople')}
                  expanded={Boolean(expanded.people)}
                  onExpand={() =>
                    setExpanded((prev) => ({ ...prev, people: true }))
                  }
                  items={entities.people.map((p) =>
                    destinationRow(p, <Users aria-hidden />, 'entity'),
                  )}
                />

                <CappedGroup
                  heading={t('groupQuoteRounds')}
                  expanded={Boolean(expanded.quotes)}
                  onExpand={() =>
                    setExpanded((prev) => ({ ...prev, quotes: true }))
                  }
                  items={entities.quoteRounds.map((q) =>
                    destinationRow(q, <Gavel aria-hidden />, 'entity'),
                  )}
                />

                <CappedGroup
                  heading={t('groupCaseTypes')}
                  expanded={Boolean(expanded.caseTypes)}
                  onExpand={() =>
                    setExpanded((prev) => ({ ...prev, caseTypes: true }))
                  }
                  items={entities.caseTypes.map((c) =>
                    destinationRow(c, <FileText aria-hidden />, 'entity'),
                  )}
                />

                {/*
                 * Destinations last, and demoted in the ranking too (see
                 * `commandFilter`). They are always available and are the least
                 * likely reason someone opened a palette.
                 */}
                <CommandGroup heading={t('groupJumpTo')}>
                  {destinations.map((destination) =>
                    destinationRow(
                      destination,
                      <ArrowLeft aria-hidden className="rotate-180" />,
                      'nav',
                    ),
                  )}
                </CommandGroup>

                {/*
                 * Last, and under its own heading. Role switching is the
                 * most-used control in this app and belongs in a palette, but
                 * it is explicitly not product — the settings section that owns
                 * it says "Controls that exist only inside this app, never in
                 * production". Its own group is what keeps a reviewer from
                 * reading it as a Moritz feature.
                 */}
                <CommandGroup heading={t('groupPlayground')}>
                  {actionRows('playground')}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>

      {/*
       * The same dialog the case header mounts, with the same props. Rendered
       * as a sibling of the palette so it survives the palette closing — the
       * palette is what opened it, and unmounting the opener must not take the
       * dialog with it.
       */}
      <ShareCaseDialog
        open={shareCase !== null}
        onOpenChange={(next) => {
          if (!next) setShareCase(null);
        }}
        caseNumber={shareCase?.caseNumber}
        participants={shareCase?.participants}
      />
    </>
  );
}
