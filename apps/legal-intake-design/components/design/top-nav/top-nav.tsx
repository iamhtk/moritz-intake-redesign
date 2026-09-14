'use client';

import { Fragment } from 'react';
import Logo from '@/components/logo';
import { Button } from '@/components/design/design-system/button';
import { useIntakeProgressPanel } from '@/components/design/intake/intake-progress-panel-context';
import { AskTrigger } from '@/components/design/ask/ask-trigger';
import { isAskAvailableFor } from '@/lib/ask/availability';
import { isIntakeRoute } from '@/lib/intake/route-match';
import { CommandPaletteTrigger } from '@/components/design/command-palette/command-palette-trigger';
import { NotificationMenu } from '@/components/design/top-nav/notification-menu';
import { TopNavMobileNav } from '@/components/design/top-nav/top-nav-mobile-nav';
import { TopNavSegmented } from '@/components/design/top-nav/top-nav-segmented';
import { TopNavUser } from '@/components/design/top-nav/top-nav-user';
import {
  findActiveNavItem,
  homePathByCompanyType,
} from '@/components/navigation/sidebar-nav-items';
import { useNavigationGuard } from '@/components/navigation/navigation-guard-context';
import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import {
  buildNavBadges,
  buildNavForRole,
  getBackTarget,
} from '@/components/design/top-nav/top-nav-shared';
import { useTabularPlaybooksByArchiveState } from '@/components/design/tabular-playbook/tabular-playbook-archive';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/design/foundations/components/breadcrumb';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronLeft, PanelRight } from '@repo/ui/icons';
import { Link, usePathname } from '@/i18n/navigation';
import { getCaseById } from '@/lib/mocks/cases';
import { getPlaybook } from '@/components/design/playbook-studio-admin/playbook-studio-data';
import { EVAL_RUNS } from '@/components/design/ai-evals-admin/ai-evals-data';
import {
  DEMO_TABULAR_PLAYBOOK_NAME,
  isNewTabularPlaybook,
  NEW_TABULAR_PLAYBOOK_NAME,
} from '@/components/design/tabular-playbook/tabular-playbook-data';
import type { AuthUser } from '@/lib/types';

type TopNavProps = {
  user: AuthUser;
};

/**
 * Top navigation bar for the client and lawyer areas. A single calm, balanced
 * row with three zones: the brand (plus a contextual back affordance) on the
 * left, a centered segmented control of section destinations in the middle, and
 * the notifications + account cluster on the right.
 *
 * The center nav and back affordance are mutually exclusive and both collapse
 * on detail flows (case detail renders its own in-page header); the brand and
 * right cluster persist everywhere.
 */
export function TopNav({ user }: TopNavProps) {
  const pathname = usePathname();
  // Read once and shared with the Ask gate below, which must agree with
  // `DashboardOverlays`. See `lib/intake/route-match.ts`.
  const onIntakeRoute = isIntakeRoute(pathname);
  const companyType = user.company.type;
  const homePath = homePathByCompanyType[companyType];
  const { flags } = useDesignFlags();
  // One shared builder, so the command palette's generated "Jump to" cannot
  // drift from this list. See `buildNavForRole`.
  const navMain = buildNavForRole(companyType, homePath, flags);
  const { active: activeTabularPlaybooks } =
    useTabularPlaybooksByArchiveState();
  const navBadges = buildNavBadges(companyType, activeTabularPlaybooks.length);
  const intakePanel = useIntakeProgressPanel();
  const navigationGuard = useNavigationGuard();

  // Intercept in-app navigation when a screen has unsaved changes, deferring to
  // the guard's confirmation modal instead of leaving immediately.
  const handleGuardedNavigation = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (navigationGuard?.isBlocked()) {
      event.preventDefault();
      navigationGuard.navigate(href);
    }
  };

  const backTarget = getBackTarget(pathname, homePath);
  const activeNav = findActiveNavItem(pathname, companyType, homePath);
  const pageTitle = activeNav?.title ?? '';

  const isCaseDetailPage = pathname.startsWith(`${homePath}/cases/`);
  const isPlaybookDetailPage = pathname.startsWith(`${homePath}/playbooks/`);
  const isAiEvalDetailPage = pathname.startsWith(`${homePath}/ai-evals/`);
  const isTabularPlaybookDetailPage = pathname.startsWith(
    `${homePath}/tabular-playbook/`,
  );

  // Build the left-zone breadcrumb trail. Case detail pages get a full
  // Home / Cases / <case> trail (their in-page header no longer carries one);
  // other sub-pages (new-case flow, admin detail) get Home / <page>. Top-level
  // pages show the centered segmented nav instead.
  const breadcrumbs: { label: string; href?: string }[] = [];
  if (isCaseDetailPage) {
    // Cases is the root of this section, so the trail starts there (no Home).
    const caseId =
      pathname.slice(`${homePath}/cases/`.length).split('/')[0] ?? '';
    const detailCase = caseId ? getCaseById(caseId) : undefined;
    breadcrumbs.push(
      { label: 'Cases', href: `${homePath}/cases` },
      { label: detailCase?.title ?? 'Case' },
    );
  } else if (isPlaybookDetailPage) {
    // Playbooks is the root of this section, so the trail starts there (no
    // Home). Unnamed drafts read as "New Playbook".
    const playbookId =
      pathname.slice(`${homePath}/playbooks/`.length).split('/')[0] ?? '';
    const playbook = playbookId ? getPlaybook(playbookId) : undefined;
    breadcrumbs.push(
      {
        // Admin distinguishes the studio from its tabular "Playbooks" section.
        label:
          companyType === 'INTERNAL_ADMIN' ? 'Playbook Studio' : 'Playbooks',
        href: `${homePath}/playbooks`,
      },
      { label: playbook?.name.trim() ? playbook.name.trim() : 'New Playbook' },
    );
  } else if (isAiEvalDetailPage) {
    const runId =
      pathname.slice(`${homePath}/ai-evals/`.length).split('/')[0] ?? '';
    const evalRun = EVAL_RUNS.find((run) => run.id === runId);
    breadcrumbs.push(
      { label: 'AI Evals', href: `${homePath}/ai-evals` },
      { label: evalRun?.matter ?? 'Evaluation' },
    );
  } else if (isTabularPlaybookDetailPage) {
    const playbookId =
      pathname.slice(`${homePath}/tabular-playbook/`.length).split('/')[0] ??
      '';
    breadcrumbs.push(
      { label: 'Playbooks', href: `${homePath}/tabular-playbook` },
      {
        label: isNewTabularPlaybook(playbookId)
          ? NEW_TABULAR_PLAYBOOK_NAME
          : DEMO_TABULAR_PLAYBOOK_NAME,
      },
    );
  } else if (backTarget) {
    breadcrumbs.push({ label: 'Home', href: homePath });
    if (pageTitle) breadcrumbs.push({ label: pageTitle });
  }

  const showBreadcrumb = breadcrumbs.length > 0;
  const showSegmentedNav = !showBreadcrumb;

  // On phones the ancestor trail collapses into a single back-chevron pointing
  // at the immediate parent, leaving the (truncating) current page beside it.
  const currentCrumb = breadcrumbs.at(-1);
  const parentCrumb =
    breadcrumbs.length >= 2 ? breadcrumbs[breadcrumbs.length - 2] : undefined;

  return (
    <TooltipProvider delayDuration={300}>
      <header className="bg-background shrink-0">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
          {/* Left zone: brand + contextual back affordance. */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {/*
             * The phone's way to the other sections, on every page.
             *
             * It used to be an either/or with the back chevron: the drawer on
             * top-level pages, a back arrow on detail flows. So on a case page
             * — the deepest place in the app, and the likeliest place to want
             * to be somewhere else — there was no route to another section
             * without first going back. A hamburger says nothing about where
             * you are, so it does not have to compete with the label beside
             * it, and it can simply always be there.
             */}
            <TopNavMobileNav
              className="-ms-1.5 sm:hidden"
              items={navMain}
              badges={navBadges}
              onNavigate={handleGuardedNavigation}
            />
            <Link
              href={homePath}
              aria-label="Moritz"
              className="text-foreground hidden shrink-0 items-center sm:inline-flex"
              onClick={(event) => handleGuardedNavigation(event, homePath)}
            >
              <Logo />
            </Link>
            {showBreadcrumb ? (
              <>
                <span
                  aria-hidden
                  className="bg-border/60 mx-1 hidden h-5 w-px shrink-0 sm:block"
                />
                <Breadcrumb className="min-w-0">
                  <BreadcrumbList className="flex-nowrap gap-2 text-sm sm:gap-2">
                    {/* Phone-only compact back affordance to the parent. */}
                    {parentCrumb?.href ? (
                      <BreadcrumbItem className="sm:hidden">
                        <BreadcrumbLink
                          asChild
                          className="text-muted-foreground -ms-1"
                        >
                          <Link
                            href={parentCrumb.href}
                            aria-label={`Back to ${parentCrumb.label}`}
                            onClick={(event) =>
                              handleGuardedNavigation(
                                event,
                                parentCrumb.href as string,
                              )
                            }
                          >
                            <ChevronLeft className="size-4" aria-hidden />
                          </Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                    ) : null}

                    {/* Full ancestor trail (sm+ only). */}
                    {breadcrumbs.slice(0, -1).map((crumb, index) => {
                      const href = crumb.href;
                      return (
                        <Fragment key={`${crumb.label}-${index}`}>
                          {index > 0 ? (
                            <BreadcrumbSeparator className="text-muted-foreground/50 hidden sm:block">
                              /
                            </BreadcrumbSeparator>
                          ) : null}
                          <BreadcrumbItem className="hidden sm:inline-flex">
                            {href ? (
                              <BreadcrumbLink
                                asChild
                                className="text-muted-foreground"
                              >
                                <Link
                                  href={href}
                                  onClick={(event) =>
                                    handleGuardedNavigation(event, href)
                                  }
                                >
                                  {crumb.label}
                                </Link>
                              </BreadcrumbLink>
                            ) : (
                              crumb.label
                            )}
                          </BreadcrumbItem>
                        </Fragment>
                      );
                    })}

                    {/* Separator before the current page (sm+ only). */}
                    {parentCrumb ? (
                      <BreadcrumbSeparator className="text-muted-foreground/50 hidden sm:block">
                        /
                      </BreadcrumbSeparator>
                    ) : null}

                    {/* Current page, on every viewport. On phones — where the
                        ancestor trail collapses to a back chevron — the current
                        label doubles as a tap target back to the parent; on sm+
                        it stays the static current page. */}
                    {currentCrumb ? (
                      <BreadcrumbItem className="min-w-0">
                        {/*
                         * The current page, and on a phone that is *all* it
                         * is now.
                         *
                         * It used to double as a second tap target back to
                         * the parent, sitting immediately beside the back
                         * chevron that already does that — two controls, one
                         * destination, in 40px of each other. With the
                         * hamburger now on the row as well, three of the four
                         * things in the left zone were navigation and none of
                         * them said where you were. The chevron keeps *back*;
                         * this keeps *here*.
                         */}
                        <BreadcrumbPage className="truncate font-medium">
                          {currentCrumb.label}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    ) : null}
                  </BreadcrumbList>
                </Breadcrumb>
              </>
            ) : (
              /*
               * Top-level pages have no trail, so the section name is the
               * whole answer to "where am I". Phone-only: from `sm` up the
               * centred segmented nav marks the active section already, and a
               * second copy of the same word on the left would be the two-top-
               * bars problem in miniature.
               */
              <span className="text-foreground truncate text-sm font-medium sm:hidden">
                {pageTitle || 'Home'}
              </span>
            )}
          </div>

          {/* Center zone: segmented section navigation (sm+). */}
          {showSegmentedNav ? (
            <TopNavSegmented
              items={navMain}
              badges={navBadges}
              onNavigate={handleGuardedNavigation}
            />
          ) : null}

          {/* Right zone: notifications, intake panel toggle, account. The panel
              toggle is mobile-only — on md+ the progress panel is docked open at
              all times, so the button is hidden there. */}
          {/*
           * `gap-1` on a phone. Four 44px targets at `gap-3` is 212px of a
           * 358px content box, which leaves the page name about six
           * characters. The targets themselves stay 44px — the spacing is
           * what gives, not the tap area.
           */}
          <div className="flex min-w-0 flex-1 items-center justify-end gap-1 sm:gap-3">
            {/*
             * K6 — the palette's discoverability affordance, first in the right
             * cluster so it reads as a search field rather than as one more
             * icon button. Ask's own entry point (N9) sits beside it.
             */}
            {flags.useCommandPalette ? <CommandPaletteTrigger /> : null}
            {/*
             * N9 / decision 2 — Ask beside the bell, not a floating bubble.
             *
             * Client-only (`isAskAvailableFor`). The ⌘J chord is bound inside
             * the trigger, so not mounting it is also what unbinds the
             * shortcut: a lawyer pressing ⌘J gets nothing rather than a panel
             * with no entry point.
             *
             * `!onIntakeRoute` is the third term and it is not cosmetic. This
             * condition has to match `DashboardOverlays`' `askAvailable`
             * exactly, because that is what decides whether `AskPanel` is
             * mounted at all. Without it the intake route rendered this button
             * and bound ⌘J over a panel that was never there, so both opened
             * nothing: `setOpen(true)` on a context with no listener. Same
             * matcher on both sides (`isIntakeRoute`) so they cannot drift
             * again.
             */}
            {flags.useAskNora &&
            isAskAvailableFor(companyType) &&
            !onIntakeRoute ? (
              <AskTrigger />
            ) : null}
            <NotificationMenu />
            {intakePanel?.isAvailable ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="inline-flex size-9 md:hidden"
                    onClick={intakePanel.toggle}
                    aria-expanded={intakePanel.isOpen}
                    aria-controls="intake-progress-panel"
                    aria-label={
                      intakePanel.isOpen
                        ? 'Hide intake progress panel'
                        : 'Show intake progress panel'
                    }
                  >
                    <PanelRight aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {intakePanel.isOpen ? 'Hide panel' : 'Show panel'}
                </TooltipContent>
              </Tooltip>
            ) : null}
            <TopNavUser user={user} />
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
