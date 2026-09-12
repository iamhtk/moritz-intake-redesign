'use client';

import type * as React from 'react';

import { AppSidebar } from '@/components/app-sidebar';
import { usePathname } from 'next/navigation';
import { cn } from '@repo/ui/lib/utils';
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
  const isIntakeRoute = /\/client\/new(\/|$)/.test(pathname ?? '');
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
        <SupportChatProvider>
          {useTopNav ? topNavChrome : sidebarChrome}
          <SettingsV2Modal registration={registration} />
          <NotificationsPanel />
          {/*
           * The intake is a single focused task with its own primary action in
           * the brief column; a floating launcher parked over it competes with
           * that and reads as leftover chrome.
           */}
          {flags.useSupportChat && !isIntakeRoute && <SupportChatLauncher />}
        </SupportChatProvider>
      </NotificationsPanelProvider>
    </SettingsV2Provider>
  );
}
