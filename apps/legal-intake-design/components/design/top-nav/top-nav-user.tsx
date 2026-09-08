'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconCalendar,
  IconExternalLink,
  IconLock,
  IconLogout,
  IconMessageCircle,
  IconPalette,
  IconSettings,
  IconUserPlus,
} from '@tabler/icons-react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/design/foundations/components/avatar';
import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import { useSettingsV2Modal } from '@/components/design/settings-v2/settings-v2-context';
import { useSupportChat } from '@/components/design/support-chat/support-chat-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/design/design-system/dropdown-menu';
import { Link } from '@/i18n/navigation';
import { getInitials } from '@/lib/utils';
import { cn } from '@repo/ui/lib/utils';
import type { AuthUser } from '@/lib/types';

/**
 * Avatar-initials dropdown for the top navigation bar. Mirrors the menu items
 * in `NavUser`, but is built on a plain Avatar trigger + design-system
 * `DropdownMenu` so it does not depend on the sidebar (`useSidebar`) context.
 */
export function TopNavUser({ user }: { user: AuthUser }) {
  const { flags } = useDesignFlags();
  const { openModal } = useSettingsV2Modal();
  const { openChat } = useSupportChat();
  const router = useRouter();
  const initials = getInitials(user.display_name);

  // Clear the playground unlock cookie and refresh so the locale layout
  // re-renders the password screen.
  const lockPlayground = async () => {
    await fetch('/api/gate', { method: 'DELETE' });
    router.refresh();
  };
  const avatarSrc = user.image ?? '/onboarding-lawyers/sofia-marchetti.jpg';

  // Track how the menu was opened so we only return focus (and show the
  // focus-visible outline) to the trigger on close for keyboard users. Mouse
  // users would otherwise see the outline pop in when Radix restores focus.
  const openedByPointerRef = useRef(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex size-11 cursor-pointer items-center justify-center rounded-lg outline-none sm:size-9',
          'focus-visible:outline-ring focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2',
          'data-[state=open]:ring-foreground/10 data-[state=open]:ring-2',
        )}
        aria-label="Open account menu"
        onPointerDown={() => {
          openedByPointerRef.current = true;
        }}
        onKeyDown={() => {
          openedByPointerRef.current = false;
        }}
      >
        <Avatar square className="size-10 grayscale sm:size-8">
          <AvatarImage src={avatarSrc} alt={user.display_name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 rounded-lg"
        side="bottom"
        align="end"
        onCloseAutoFocus={(event) => {
          // Skip returning focus to the trigger for pointer interactions so the
          // focus-visible outline only appears for keyboard users.
          if (openedByPointerRef.current) event.preventDefault();
        }}
        sideOffset={8}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={avatarSrc} alt={user.display_name} />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.display_name}</span>
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
          <DropdownMenuItem onSelect={() => openChat()}>
            <IconMessageCircle />
            Support
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
  );
}
