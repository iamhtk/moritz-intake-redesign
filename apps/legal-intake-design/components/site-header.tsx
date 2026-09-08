'use client';

import { Button } from '@/components/design/design-system/button';
import { PanelRight } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/design/foundations/components/breadcrumb';
import { useIntakeProgressPanel } from '@/components/design/intake/intake-progress-panel-context';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Link, usePathname } from '@/i18n/navigation';
import {
  findActiveNavItem,
  homePathByCompanyType,
} from '@/components/navigation/sidebar-nav-items';
import type { AuthUser } from '@/lib/types';

type SiteHeaderProps = {
  user: AuthUser;
};

export function SiteHeader({ user }: SiteHeaderProps) {
  const pathname = usePathname();
  const companyType = user.company.type;
  const homePath = homePathByCompanyType[companyType];
  const activeNav = findActiveNavItem(pathname, companyType, homePath);
  const title = activeNav?.title ?? '';
  const isTopLevel =
    pathname === homePath || (activeNav != null && pathname === activeNav.url);
  const intakePanel = useIntakeProgressPanel();
  // Reserve the same right-edge space as the body when the intake progress
  // panel is open, so the header's content (breadcrumbs + toggle button)
  // visually slides left in lockstep with the chat below. Padding transition
  // matches the body's (`contract-chat-shell.tsx`).
  const panelSlideOpen = intakePanel?.isAvailable && intakePanel.isOpen;
  const hasInteracted = intakePanel?.hasInteracted ?? false;

  return (
    <header className="h-(--header-height) group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) flex shrink-0 items-center gap-2 transition-[width,height] ease-linear">
      <div
        className={cn(
          'flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6',
          // `lg:px-6` sets `pr-6`, which would otherwise win at lg+ viewports
          // because Tailwind emits `lg:` rules after `md:`. We add an explicit
          // `lg:pr-[376px]` override so the open-panel padding wins at every
          // breakpoint above md.
          //
          // Skip the transition on first paint (before any user interaction)
          // so the header renders already pushed-left rather than sliding in.
          // Mirrors the chat container in `contract-chat-shell.tsx`.
          hasInteracted && 'transition-[padding-right] duration-300 ease-out',
          panelSlideOpen && 'md:pr-[376px] lg:pr-[376px]',
        )}
      >
        <SidebarTrigger className="-ml-1 md:hidden" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 md:hidden"
        />
        <Breadcrumb>
          <BreadcrumbList className="text-base">
            {isTopLevel ? (
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">{title}</BreadcrumbPage>
              </BreadcrumbItem>
            ) : (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild className="text-muted-foreground/60">
                    <Link href={homePath}>Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {title ? (
                  <>
                    <BreadcrumbSeparator>/</BreadcrumbSeparator>
                    <BreadcrumbItem>
                      <BreadcrumbPage className="font-medium">
                        {title}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                ) : null}
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
        {intakePanel?.isAvailable ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-auto size-7"
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
        ) : null}
      </div>
    </header>
  );
}
