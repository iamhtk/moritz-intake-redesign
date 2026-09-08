'use client';

import * as React from 'react';
import { type Icon } from '@tabler/icons-react';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarLink,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { usePathname } from '@/i18n/navigation';
import { isNavItemActive } from '@/components/navigation/sidebar-active';

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string;
    shortTitle?: string;
    url: string;
    icon: Icon;
    exact?: boolean;
    onClick?: () => void;
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile, state } = useSidebar();
  const isIconRail = state === 'collapsed' && !isMobile;

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = item.onClick
              ? false
              : isNavItemActive(pathname, item.url, item.exact);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className="data-[active=true]:bg-black data-[active=true]:text-white data-[active=true]:hover:bg-black data-[active=true]:hover:text-white"
                >
                  {item.onClick ? (
                    <button
                      type="button"
                      onClick={() => {
                        item.onClick?.();
                        if (isMobile) setOpenMobile(false);
                      }}
                    >
                      <item.icon />
                      <span>
                        {isIconRail
                          ? (item.shortTitle ?? item.title)
                          : item.title}
                      </span>
                    </button>
                  ) : (
                    <SidebarLink href={item.url}>
                      <item.icon />
                      <span>
                        {isIconRail
                          ? (item.shortTitle ?? item.title)
                          : item.title}
                      </span>
                    </SidebarLink>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
