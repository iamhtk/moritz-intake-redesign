'use client';

import * as React from 'react';

import Logo from '@/components/logo';
import MoritzSymbol from '@/components/icons/moritz-symbol';
import { NavMain } from '@/components/nav-main';
import { Link } from '@/i18n/navigation';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  buildNavMain,
  buildNavSecondary,
  homePathByCompanyType,
} from '@/components/navigation/sidebar-nav-items';
import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import type { AuthUser } from '@/lib/types';

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: AuthUser;
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const { flags } = useDesignFlags();
  const companyType = user.company.type;
  const homePath = homePathByCompanyType[companyType];
  const navMain = buildNavMain(companyType, homePath, {
    adminPlaybooks: Boolean(flags.usePlaybooksAdmin),
    adminAiEvals: Boolean(flags.useAiEvalsAdmin),
    adminTabularPlaybooks: Boolean(flags.useTabularPlaybooksAdmin),
  });
  const navSecondary = buildNavSecondary(companyType);
  const { isMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link
          href={homePath}
          aria-label="Moritz"
          className="text-sidebar-foreground flex h-12 items-center justify-start px-2 md:justify-center md:px-0"
        >
          {isMobile ? <Logo /> : <MoritzSymbol className="h-11 w-auto" />}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
