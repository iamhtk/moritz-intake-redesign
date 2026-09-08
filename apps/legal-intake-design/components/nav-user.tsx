'use client';

import { useRouter } from 'next/navigation';
import {
  IconCalendar,
  IconDotsVertical,
  IconExternalLink,
  IconLock,
  IconLogout,
  IconPalette,
  IconSettings,
  IconUserPlus,
} from '@tabler/icons-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import { useSettingsV2Modal } from '@/components/design/settings-v2/settings-v2-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/design/design-system/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Link } from '@/i18n/navigation';
import { getInitials } from '@/lib/utils';
import type { AuthUser } from '@/lib/types';

export function NavUser({ user }: { user: AuthUser }) {
  const { isMobile } = useSidebar();
  const { flags } = useDesignFlags();
  const { openModal } = useSettingsV2Modal();
  const router = useRouter();
  const initials = getInitials(user.display_name);

  // Clear the playground unlock cookie and refresh so the locale layout
  // re-renders the password screen.
  const lockPlayground = async () => {
    await fetch('/api/gate', { method: 'DELETE' });
    router.refresh();
  };
  const avatarSrc = user.image ?? undefined;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="rounded-lg grayscale">
                <AvatarImage src={avatarSrc} alt={user.display_name} />
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">
                  {user.display_name}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.company.name}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={avatarSrc} alt={user.display_name} />
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user.display_name}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.company.name}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                {flags.useSettingsV2 ? (
                  <button type="button" onClick={openModal} className="w-full">
                    <IconSettings />
                    Settings
                  </button>
                ) : (
                  <Link href="/user" className="w-full">
                    <IconSettings />
                    Settings
                  </Link>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href="https://cal.com/marissa-chung/moritz20min"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <IconCalendar />
                  Book a call
                  <IconExternalLink className="ml-auto size-4 opacity-60" />
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/foundations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <IconPalette />
                  Moritz Design system
                  <IconExternalLink className="ml-auto size-4 opacity-60" />
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/onboarding"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <IconUserPlus />
                  User onboarding
                  <IconExternalLink className="ml-auto size-4 opacity-60" />
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void lockPlayground()}>
              <IconLock />
              Password screen
            </DropdownMenuItem>
            <DropdownMenuItem>
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
