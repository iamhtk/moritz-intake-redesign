'use client';

import type * as React from 'react';

import { AppSidebar } from '@/components/app-sidebar';
import { usePathname } from 'next/navigation';
import { cn } from '@repo/ui/lib/utils';
import { AskPanel } from '@/components/design/ask/ask-panel';
import { AskProvider, useAsk } from '@/components/design/ask/ask-context';
import { isAskAvailableFor } from '@/lib/ask/availability';
import { CommandPalette } from '@/components/design/command-palette/command-palette';
import { CommandPaletteProvider } from '@/components/design/command-palette/command-palette-context';
import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import { IntakeProgressPanelProvider } from '@/components/design/intake/intake-progress-panel-context';
import { NavigationGuardProvider } from '@/components/navigation/navigation-guard-context';
import { NotificationsPanel } from '@/components/design/notifications/notifications-panel';
import { NotificationsPanelProvider } from '@/components/design/notifications/notifications-panel-context';
import { SettingsV2Modal } from '@/components/design/settings-v2/settings-v2-modal';
import { SettingsV2Provider } from '@/components/design/settings-v2/settings-v2-context';
import { SupportChatLauncher } from '@/components/design/support-chat/support-chat-launcher';
import { SupportChatProvider } from '@/components/design/support-chat/support-chat-context';
import { TopNav } from '@/components/design/top-nav/top-nav';
import Navigation from '@/components/navigation/navigation';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { RegistrationState } from '@/components/registration-types';
import type { AuthUser } from '@/lib/types';

/**
 * The intake route, matched once for the whole shell.
 *
 * Three separate things key off this path — the Ask panel, the support
 * launcher and the two layout branches — and they have to agree, because the
 * rule they encode is a single rule: the intake owns its screen. A literal in
 * each place is how one of them ends up matching `/client/new` but not
 * `/client/new/review`.
 */
const INTAKE_ROUTE = /\/client\/new(\/|$)/;

/**
 * The two keyboard surfaces, mounted together (K5, N9).
 *
 * Inside `NavigationGuardProvider` on purpose. Both of them navigate, and
 * `useNavigationGuard()` returns `null` outside the provider — so mounted at the
 * shell's tail they would become the only two affordances on screen that
 * silently discard a half-finished intake, while every link in the top nav
 * prompts. Rendered from one component so the two chrome branches below each
 * carry one line rather than four, and so the palette's *Ask Nora* row has a
 * handle to the panel beside it.
 */
function DashboardOverlays({ user }: { user: AuthUser }) {
  const { flags } = useDesignFlags();
  const { openAsk } = useAsk();

  /*
   * The intake carries its own chat, under its own name. Nora on top of it
   * would put two AI chat surfaces on one screen, which is the thing the
   * flag's own description promises never happens; the support launcher is
   * already excluded from this route for the same reason. Read here rather
   * than in the flag default so a reviewer who turns Nora on still cannot
   * break the invariant.
   */
  const onIntakeRoute = INTAKE_ROUTE.test(usePathname() ?? '');

  /*
   * Ask is a client surface, so the flag alone is not enough: a lawyer or an
   * admin with the flag on still gets no panel. One local, read twice, because
   * the panel and the palette's *Ask Nora* row must never disagree — see
   * `lib/ask/availability.ts` for why the other three roles are off rather
   * than deleted.
   */
  const askAvailable =
    flags.useAskNora && isAskAvailableFor(user.company.type) && !onIntakeRoute;

  return (
    <>
      {flags.useCommandPalette ? (
        <CommandPalette
          user={user}
          // Passed only when Ask is actually mounted, so the palette's Ask row
          // is never offered-and-inert.
          onAskNora={askAvailable ? openAsk : undefined}
        />
      ) : null}
      {askAvailable ? <AskPanel user={user} /> : null}
    </>
  );
}

type DashboardShellProps = {
  user: AuthUser;
  registration: RegistrationState;
  children: React.ReactNode;
};

export function DashboardShell({
  user,
  registration,
  children,
}: DashboardShellProps) {
  const { flags } = useDesignFlags();
  const pathname = usePathname();
  const isIntakeRoute = INTAKE_ROUTE.test(pathname ?? '');
  const companyType = user.company.type;
  // The top nav covers the client, lawyer, and admin areas. The admin app's
  // larger set of sections is absorbed by the center nav's pinned + "More"
  // overflow. The internal-assistant area keeps the existing left sidebar.
  const useTopNav =
    flags.useTopNav &&
    (companyType === 'NON_LEGAL' ||
      companyType === 'LEGAL' ||
      companyType === 'INTERNAL_ADMIN');

  const topNavChrome = (
    <div className="bg-muted text-foreground flex h-svh flex-col md:p-2">
      <div
        className="bg-background flex min-h-0 flex-1 flex-col overflow-hidden md:rounded-xl md:shadow-sm"
        // Brand bar height (h-14 + 1px border-b); the docked intake panel offsets
        // by this so it starts just below the header divider.
        style={
          { '--header-height': 'calc(3.5rem + 1px)' } as React.CSSProperties
        }
      >
        <IntakeProgressPanelProvider>
          <NavigationGuardProvider>
            <TopNav user={user} />
            <DashboardOverlays user={user} />
            {/*
             * The intake owns its own container so its two columns can run the
             * full height and line up with the header above them. Every other
             * route keeps the shell's width and padding.
             */}
            <main
              className={cn(
                'mx-auto w-full flex-1 overflow-y-auto',
                isIntakeRoute
                  ? 'flex min-h-0 flex-col'
                  : 'max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8',
              )}
            >
              {children}
            </main>
          </NavigationGuardProvider>
        </IntakeProgressPanelProvider>
      </div>
    </div>
  );

  const sidebarChrome = flags.useSidebar ? (
    <SidebarProvider
      open={false}
      onOpenChange={() => {}}
      style={
        {
          '--header-height': 'calc(var(--spacing) * 12)',
          '--sidebar': 'var(--muted)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset className="h-svh overflow-hidden md:h-[calc(100svh-1rem)]">
        <IntakeProgressPanelProvider>
          <NavigationGuardProvider>
            <SiteHeader user={user} />
            <DashboardOverlays user={user} />
            {/*
             * The intake owns its own container so its columns can run full
             * height and line up with the header. Every other route keeps the
             * shell's padding.
             */}
            <div
              className={cn(
                'flex min-h-0 flex-1 flex-col overflow-y-auto',
                !isIntakeRoute && 'px-4 pb-10 pt-6 sm:px-6 lg:px-8',
              )}
            >
              {children}
            </div>
          </NavigationGuardProvider>
        </IntakeProgressPanelProvider>
      </SidebarInset>
    </SidebarProvider>
  ) : (
    <div className="bg-background text-foreground supports-[color-scheme:dark]:bg-background supports-[color-scheme:dark]:text-foreground supports-[color-scheme:light]:bg-background supports-[color-scheme:light]:text-foreground h-screen sm:flex">
      <Navigation user={user} />

      <main className="supports-[color-scheme:dark]:bg-background supports-[color-scheme:light]:bg-background mx-auto max-w-7xl overflow-y-auto px-4 pb-10 pt-6 sm:flex-1 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );

  return (
    <SettingsV2Provider>
      <NotificationsPanelProvider>
        <CommandPaletteProvider>
          <AskProvider>
            <SupportChatProvider>
              {useTopNav ? topNavChrome : sidebarChrome}
              <SettingsV2Modal registration={registration} />
              <NotificationsPanel />
              {/*
               * The floating support launcher stands down in two cases (N9,
               * second half — and §8.10 is explicit that if this gets cut, cut
               * Ask).
               *
               * The intake is a single focused task with its own primary action
               * in the brief column; a launcher parked over it competes with that
               * and reads as leftover chrome.
               *
               * And wherever Ask is available it is the answer to "I have a
               * question", so a second floating bubble in the opposite corner is
               * the *chat sprayed everywhere* failure the source's own AI rules
               * were written to prevent. This app already has three chat-ish
               * surfaces; Ask is the fourth, and the top nav plus this condition
               * is what stops it reading as a fifth. The launcher is not deleted
               * — it still covers every surface Ask does not, which is what the
               * plan means by route-scoping it to marketing and onboarding.
               */}
              {flags.useSupportChat && !isIntakeRoute && !flags.useAskNora && (
                <SupportChatLauncher />
              )}
            </SupportChatProvider>
          </AskProvider>
        </CommandPaletteProvider>
      </NotificationsPanelProvider>
    </SettingsV2Provider>
  );
}
