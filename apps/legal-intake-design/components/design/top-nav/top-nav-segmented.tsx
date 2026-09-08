'use client';

import { useId } from 'react';
import { LayoutGroup, motion } from 'motion/react';
import { IconChevronDown } from '@tabler/icons-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/design/design-system/dropdown-menu';
import {
  ACTIVE_PILL_TRANSITION,
  resolveActiveNavUrl,
} from '@/components/design/top-nav/top-nav-shared';
import type { NavItem } from '@/components/navigation/sidebar-nav-items';
import { cn } from '@repo/ui/lib/utils';
import { Link, usePathname } from '@/i18n/navigation';

type TopNavSegmentedProps = {
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
 * Centered primary navigation for the "place" destinations (Home, Cases, and —
 * for lawyers — Quotes). Rendered as clean, label-only floating pills with a
 * spring-animated black pill sliding to the active item (no enclosing track).
 *
 * Larger areas (the admin app) declare a pinned/overflow split via each item's
 * `secondary` flag: pinned destinations stay as pills while the rest collapse
 * into a trailing "More" dropdown, keeping the center row compact regardless of
 * how many sections the area exposes.
 *
 * Notifications are intentionally dropped here — the bell in the action cluster
 * is the single desktop entry point — so this row stays a pure set of section
 * destinations. On phones it collapses (`hidden sm:flex`); the bottom tab bar
 * surfaces the same destinations instead.
 */
export function TopNavSegmented({
  items,
  badges,
  onNavigate,
  className,
}: TopNavSegmentedProps) {
  const pathname = usePathname();
  // Scope the sliding indicator's layoutId to this nav instance.
  const layoutGroupId = useId();

  const destinations = items;
  const activeUrl = resolveActiveNavUrl(pathname, destinations);

  // When items declare an explicit priority via `secondary`, keep the most-used
  // pinned as pills and tuck the rest under "More". Areas without the flag
  // (client/lawyer) render every destination as a pill unchanged.
  const visible = destinations.filter((item) => !item.secondary);
  const overflow = destinations.filter((item) => item.secondary);
  const isOverflowActive = overflow.some((item) => item.url === activeUrl);

  return (
    <LayoutGroup id={layoutGroupId}>
      <nav
        aria-label="Primary"
        className={cn('hidden items-center gap-1 sm:flex', className)}
      >
        {visible.map((item) => {
          const isActive = item.url === activeUrl;
          const badge = badges[item.title];
          return (
            <Link
              key={item.title}
              href={item.url}
              onClick={(event) => onNavigate(event, item.url)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative isolate inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                isActive
                  ? 'text-white'
                  : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="topnav-active-pill"
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 rounded-full bg-black"
                  transition={ACTIVE_PILL_TRANSITION}
                />
              )}
              <span>{item.title}</span>
              {badge != null && (
                <span
                  className={cn(
                    'text-xs tabular-nums leading-none',
                    isActive ? 'text-white/60' : 'text-muted-foreground/60',
                  )}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
        {overflow.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-current={isOverflowActive ? 'page' : undefined}
                className={cn(
                  'relative isolate inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  'data-[state=open]:[&_svg]:rotate-180',
                  isOverflowActive
                    ? 'text-white'
                    : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
                )}
              >
                {isOverflowActive && (
                  <motion.span
                    layoutId="topnav-active-pill"
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 rounded-full bg-black"
                    transition={ACTIVE_PILL_TRANSITION}
                  />
                )}
                <span>More</span>
                <IconChevronDown
                  className="size-4 transition-transform duration-200"
                  aria-hidden
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="min-w-48"
            >
              {overflow.map((item) => {
                const itemActive = item.url === activeUrl;
                const badge = badges[item.title];
                return (
                  <DropdownMenuItem
                    key={item.title}
                    asChild
                    data-active={itemActive || undefined}
                    className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
                  >
                    <Link
                      href={item.url}
                      onClick={(event) => onNavigate(event, item.url)}
                      aria-current={itemActive ? 'page' : undefined}
                    >
                      {item.icon && <item.icon aria-hidden />}
                      <span className="flex-1">{item.title}</span>
                      {badge != null && (
                        <span className="text-muted-foreground/60 text-xs tabular-nums leading-none">
                          {badge}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </nav>
    </LayoutGroup>
  );
}
