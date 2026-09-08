'use client';

import { IconCheck, IconChevronDown } from '@tabler/icons-react';
import { XIcon } from '@repo/ui/icons';

import { Heading } from '@/components/design/foundations/components/heading';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { resolveActiveNavUrl } from '@/components/design/top-nav/top-nav-shared';
import type { NavItem } from '@/components/navigation/sidebar-nav-items';
import { cn } from '@repo/ui/lib/utils';
import { Link, usePathname } from '@/i18n/navigation';

type TopNavMobileNavProps = {
  items: NavItem[];
  /** Badge counts keyed by nav item `title` (e.g. live case count for "Cases"). */
  badges: Record<string, number>;
  onNavigate: (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => void;
  className?: string;
};

/**
 * Phone-only primary navigation. The desktop segmented pill row collapses at
 * `<sm` (see `TopNav`); here the destinations move into a bottom-sliding drawer
 * opened from a header control that reads the current section name. Listing
 * every destination in a scrollable sheet scales to the admin app's larger set
 * without the desktop "More" overflow.
 *
 * Notifications are intentionally dropped (the bell stays in the right cluster),
 * mirroring the desktop segmented nav. Account, settings, and support live in
 * the top-right avatar menu, so this drawer stays navigation-only.
 */
export function TopNavMobileNav({
  items,
  badges,
  onNavigate,
  className,
}: TopNavMobileNavProps) {
  const pathname = usePathname();

  const destinations = items;
  const activeUrl = resolveActiveNavUrl(pathname, destinations);
  const activeTitle =
    destinations.find((item) => item.url === activeUrl)?.title ?? 'Menu';

  return (
    <Drawer>
      <DrawerTrigger
        className={cn(
          'text-foreground inline-flex items-center gap-1 rounded-lg text-base font-medium outline-none',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2',
          'data-[state=open]:[&_svg]:rotate-180',
          className,
        )}
        aria-label="Open navigation menu"
      >
        <span className="truncate">{activeTitle}</span>
        <IconChevronDown
          className="size-4 transition-transform duration-200"
          aria-hidden
        />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="flex-row items-center justify-between text-left">
          <DrawerTitle asChild>
            <Heading level={4} variant="serif">
              Navigate
            </Heading>
          </DrawerTitle>
          <DrawerClose
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring -mr-1 inline-flex size-8 items-center justify-center rounded-lg outline-none transition-colors focus-visible:ring-2"
            aria-label="Close navigation menu"
          >
            <XIcon className="size-5" aria-hidden />
          </DrawerClose>
        </DrawerHeader>
        <nav
          aria-label="Primary"
          className="flex flex-col gap-1 overflow-y-auto px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-1"
        >
          {destinations.map((item) => {
            const isActive = item.url === activeUrl;
            const badge = badges[item.title];
            return (
              <DrawerClose asChild key={item.title}>
                <Link
                  href={item.url}
                  onClick={(event) => onNavigate(event, item.url)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition-colors',
                    isActive
                      ? 'bg-muted ring-border ring-1'
                      : 'text-foreground hover:bg-foreground/5',
                  )}
                >
                  {item.icon && (
                    <item.icon
                      className={cn(
                        'size-5 shrink-0',
                        isActive ? 'text-foreground' : 'text-muted-foreground',
                      )}
                      aria-hidden
                    />
                  )}
                  <span className="flex-1 truncate">{item.title}</span>
                  {badge != null && (
                    <span className="bg-foreground text-background inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums leading-none">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                  {isActive && (
                    <IconCheck
                      className="text-foreground size-5 shrink-0"
                      aria-hidden
                    />
                  )}
                </Link>
              </DrawerClose>
            );
          })}
        </nav>
      </DrawerContent>
    </Drawer>
  );
}
