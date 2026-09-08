'use client';

import { useEffect, useState } from 'react';
import { IconDots, type Icon } from '@tabler/icons-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/design/design-system/dropdown-menu';
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

function useResponsiveNavCap() {
  const { isMobile } = useSidebar();
  const [cap, setCap] = useState<number>(Number.POSITIVE_INFINITY);

  useEffect(() => {
    function compute() {
      if (isMobile) {
        setCap(Number.POSITIVE_INFINITY);
        return;
      }
      const available = window.innerHeight - 300;
      const fit = Math.max(1, Math.floor(available / 56));
      setCap(Math.min(6, fit));
    }
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [isMobile]);

  return cap;
}

export function NavMain({
  items,
}: {
  items: {
    title: string;
    shortTitle?: string;
    url: string;
    icon?: Icon;
    exact?: boolean;
    secondary?: boolean;
  }[];
}) {
  const pathname = usePathname();
  const cap = useResponsiveNavCap();
  const { state, isMobile } = useSidebar();
  // Use the short label only in the desktop icon rail; full title in the mobile drawer.
  const isIconRail = state === 'collapsed' && !isMobile;

  // When items declare an explicit priority via `secondary`, honor that split
  // (most-used pinned, the rest under "More"). Otherwise fall back to the
  // responsive cap that overflows whatever doesn't fit.
  const hasExplicitGroups = items.some((item) => item.secondary);

  let visible: typeof items;
  let overflow: typeof items;
  if (hasExplicitGroups) {
    visible = items.filter((item) => !item.secondary);
    overflow = items.filter((item) => item.secondary);
  } else {
    let maxVisible = Math.min(items.length, cap);
    if (maxVisible < items.length) {
      maxVisible = Math.max(1, maxVisible - 1);
    }
    visible = items.slice(0, maxVisible);
    overflow = items.slice(maxVisible);
  }

  const activeUrl = items
    .filter((item) => isNavItemActive(pathname, item.url, item.exact))
    .reduce<string | undefined>((best, item) => {
      if (!best || item.url.length > best.length) return item.url;
      return best;
    }, undefined);

  const isOverflowActive = overflow.some((item) => item.url === activeUrl);

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {visible.map((item) => {
            const isActive = item.url === activeUrl;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className="data-[active=true]:bg-black data-[active=true]:text-white data-[active=true]:hover:bg-black data-[active=true]:hover:text-white"
                >
                  <SidebarLink href={item.url}>
                    {item.icon && <item.icon />}
                    <span>
                      {isIconRail
                        ? (item.shortTitle ?? item.title)
                        : item.title}
                    </span>
                  </SidebarLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
          {overflow.length > 0 && (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    isActive={isOverflowActive}
                    className="data-[active=true]:bg-black data-[active=true]:text-white data-[active=true]:hover:bg-black data-[active=true]:hover:text-white"
                  >
                    <IconDots />
                    <span>More</span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="right"
                  align="start"
                  sideOffset={4}
                  className="min-w-48"
                >
                  {overflow.map((item) => {
                    const itemActive = item.url === activeUrl;
                    return (
                      <DropdownMenuItem
                        key={item.title}
                        asChild
                        data-active={itemActive || undefined}
                        className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
                      >
                        <SidebarLink href={item.url}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                        </SidebarLink>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
