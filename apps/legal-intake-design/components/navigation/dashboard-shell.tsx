'use client';

import type * as React from 'react';

import { AppSidebar } from '@/components/app-sidebar';
import { usePathname } from 'next/navigation';
import { cn } from '@repo/ui/lib/utils';
import { AskPanel } from '@/components/design/ask/ask-panel';
import { AskProvider, useAsk } from '@/components/design/ask/ask-context';
import { useAskAvailable } from '@/components/design/ask/use-ask-available';
import { CommandPalette } from '@/components/design/command-palette/command-palette';
import { CommandPaletteProvider } from '@/components/design/command-palette/command-palette-context';
import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import { IntakeProgressPanelProvider } from '@/components/design/intake/intake-progress-panel-context';
import { NavigationGuardProvider } from '@/components/navigation/navigation-guard-context';
import { NotificationsPanel } from '@/components/design/notifications/notifications-panel';
import { NotificationsPanelProvider } from '@/components/design/notifications/notifications-panel-context';
import { TalkOverlay } from '@/components/design/talk/talk-overlay';
import { TalkOverlayProvider } from '@/components/design/talk/talk-overlay-context';
import { TourProvider } from '@/components/design/tour/tour-context';
import { tourOffered } from '@/lib/tour/availability';
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
import { isIntakeRoute } from '@/lib/intake/route-match';

/**
 * The intake route now comes from `lib/intake/route-match.ts`.
 *
 * It used to be a local literal here, with a comment noting that three things
 * key off this path and have to agree. A fourth did and was missed: `TopNav`
 * renders the ⌘J Ask trigger, never had a copy of the literal, and so offered
 * a button on `/client/new` for a panel this file was declining to mount. The
 * matcher is shared now, so "the intake owns its screen" is one definition
 * rather than one per file.
 */

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
/**
 * The tour's engine, for the roles it is offered to (`tourOffered`), and a
 * plain fragment for everyone else — so `TourButton` in the nav and the
 * provider it needs are decided by one predicate in one file.
 */
function MaybeTour({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  return tourOffered(user.company.type) ? (
    <TourProvider>{children}</TourProvider>
  ) : (
    <>{children}</>
  );
}

function DashboardOverlays({ user }: { user: AuthUser }) {
  const { flags } = useDesignFlags();
  const { openAsk } = useAsk();

  /*
   * Asked, not computed. `TopNav` renders the trigger from this same hook, so
   * the panel and the ⌘J chord cannot end up on opposite sides of a condition
   * — which is how Ask managed to be inert on one screen and absent on it a
   * fix later. The palette's *Ask Nora* row hangs off the same boolean below,
   * so it is never offered-and-inert either.
   */
  const askAvailable = useAskAvailable(user.company.type);

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
      {/*
       * *Talk to a person*, mounted once for the whole shell.
       *
       * Here rather than beside its triggers, for the reason this component
       * exists: sending navigates, and `useNavigationGuard()` returns `null`
       * outside `NavigationGuardProvider`. Mounted at the shell's tail it would
       * be the one affordance on screen that silently discards a half-finished
       * intake while every link in the top nav prompts.
       *
       * Unconditional, unlike the palette and Ask. Those two are features
       * behind flags; this is the flow's exit, and a client already out of
       * patience with the software is the last person who should find the way
       * out missing. It draws nothing until something opens it.
       */}
      <TalkOverlay />
    </>
  );
}

/**
 * The first thing in the tab order, and invisible until it is needed.
 *
 * Every page in this app puts the same top bar before its content — brand,
 * section nav, four controls in the right cluster, and on the admin app a
 * dozen destinations behind "More". A keyboard user was tabbing through all
 * of it on every single page before reaching the thing they came for, and a
 * screen-reader user was hearing it.
 *
 * `sr-only focus:not-sr-only` is the standard shape: it occupies nothing and
 * is unreachable by pointer, then becomes a real, visible button the moment
 * it takes focus — which is the only moment it is any use. `absolute` rather
 * than `fixed` so it cannot sit over the intake's own sticky bars.
 */
function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="bg-background text-foreground ring-ring sr-only absolute left-4 top-4 z-[100] rounded-lg px-4 py-2 text-sm font-medium shadow-lg outline-none focus:not-sr-only focus:ring-2"
    >
      Skip to content
    </a>
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
  const onIntakeRoute = isIntakeRoute(pathname);
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
      <SkipToContent />
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
            <MaybeTour user={user}>
              <TopNav user={user} />
              <DashboardOverlays user={user} />
              {/*
               * The intake owns its own container so its two columns can run the
               * full height and line up with the header above them. Every other
               * route keeps the shell's width and padding.
               */}
              <main
                id="main-content"
                // `tabIndex={-1}` so the skip link can actually move focus
                // here. Without it the browser scrolls to the anchor and leaves
                // focus on the link, so the next Tab goes back into the nav —
                // which is the thing the link exists to escape.
                tabIndex={-1}
                className={cn(
                  'mx-auto w-full flex-1 overflow-y-auto outline-none',
                  onIntakeRoute
                    ? 'flex min-h-0 flex-col'
                    : 'max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8',
                )}
              >
                {children}
              </main>
            </MaybeTour>
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
      <SkipToContent />
      <AppSidebar variant="inset" user={user} />
      <SidebarInset className="h-svh overflow-hidden md:h-[calc(100svh-1rem)]">
        <IntakeProgressPanelProvider>
          <NavigationGuardProvider>
            <MaybeTour user={user}>
              <SiteHeader user={user} />
              <DashboardOverlays user={user} />
              {/*
               * The intake owns its own container so its columns can run full
               * height and line up with the header. Every other route keeps the
               * shell's padding.
               */}
              <main
                id="main-content"
                tabIndex={-1}
                className={cn(
                  'flex min-h-0 flex-1 flex-col overflow-y-auto outline-none',
                  !onIntakeRoute && 'px-4 pb-10 pt-6 sm:px-6 lg:px-8',
                )}
              >
                {children}
              </main>
            </MaybeTour>
          </NavigationGuardProvider>
        </IntakeProgressPanelProvider>
      </SidebarInset>
    </SidebarProvider>
  ) : (
    <div className="bg-background text-foreground supports-[color-scheme:dark]:bg-background supports-[color-scheme:dark]:text-foreground supports-[color-scheme:light]:bg-background supports-[color-scheme:light]:text-foreground h-screen sm:flex">
      <SkipToContent />
      <Navigation user={user} />

      <main
        id="main-content"
        tabIndex={-1}
        className="supports-[color-scheme:dark]:bg-background supports-[color-scheme:light]:bg-background mx-auto max-w-7xl overflow-y-auto px-4 pb-10 pt-6 outline-none sm:flex-1 sm:px-6 lg:px-8"
      >
        {children}
      </main>
    </div>
  );

  return (
    <SettingsV2Provider>
      <NotificationsPanelProvider>
        <CommandPaletteProvider>
          {/*
           * Outside the chrome branches, like the palette's provider and for
           * the same reason: any face or composer under `children` has to be
           * able to open it, while the dialog itself is mounted once, deeper,
           * inside the navigation guard. See `TalkOverlayProvider`.
           */}
          <TalkOverlayProvider>
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
                {flags.useSupportChat &&
                  !onIntakeRoute &&
                  !flags.useAskNora && <SupportChatLauncher />}
              </SupportChatProvider>
            </AskProvider>
          </TalkOverlayProvider>
        </CommandPaletteProvider>
      </NotificationsPanelProvider>
    </SettingsV2Provider>
  );
}
