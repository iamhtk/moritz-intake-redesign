'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconCalendar,
  IconChevronRight,
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
import {
  MobileSheet,
  MobileSheetGroup,
  MobileSheetRow,
} from '@/components/design/mobile/mobile-sheet';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
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

  /*
   * The phone version: a bottom sheet, not the desktop dropdown.
   *
   * A menu anchored under a 40px avatar in the top-right corner is the one
   * shape on this app that a phone cannot do well. It opens at the far end of
   * the screen from the thumb, its rows are sized for a cursor, and it is
   * dismissed by tapping "somewhere else" — which on a full-bleed layout is
   * usually something else's control.
   *
   * So on a phone the avatar opens the same card the rest of the top bar
   * opens (`MobileSheet`), laid out the way a phone account screen is laid
   * out: the identity as a real header with the face at a readable size, then
   * grouped, hairline-separated rows on the iOS settings model — related
   * things in a card together, destructive things in a card of their own at
   * the bottom. Same items, same order, same handlers as the dropdown; only
   * the shape changes.
   */
  if (isMobile) {
    const close = () => setSheetOpen(false);

    return (
      <>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className={cn(
            'flex size-11 cursor-pointer items-center justify-center rounded-lg outline-none sm:size-9',
            'focus-visible:outline-ring focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2',
            sheetOpen && 'ring-foreground/10 ring-2',
          )}
          aria-label="Open account menu"
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
        >
          <Avatar square className="size-10 grayscale sm:size-8">
            <AvatarImage src={avatarSrc} alt={user.display_name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>

        <MobileSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title="Account"
          description="Your account, settings and support."
          closeLabel="Close account menu"
          bodyClassName="space-y-4 pt-1"
        >
          {/*
           * The identity card. It is the same two lines the dropdown's label
           * carried, at the size a phone reads them at — this sheet is the
           * account screen, and an account screen that whispers whose account
           * it is has got its own subject wrong.
           */}
          <div className="bg-muted/40 ring-border/60 flex items-center gap-3 rounded-2xl p-4 ring-1">
            <Avatar className="size-12 rounded-xl">
              <AvatarImage src={avatarSrc} alt={user.display_name} />
              <AvatarFallback className="rounded-xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-base font-medium">
                {user.display_name}
              </p>
              <p className="text-muted-foreground truncate text-sm">
                {user.company.name}
              </p>
            </div>
          </div>

          <MobileSheetGroup>
            {flags.useSettingsV2 ? (
              <MobileSheetRow
                onClick={() => {
                  close();
                  openModal();
                }}
              >
                <IconSettings />
                <span className="flex-1">Settings</span>
                <IconChevronRight className="text-muted-foreground/60 size-4 shrink-0" />
              </MobileSheetRow>
            ) : (
              <MobileSheetRow asChild>
                <Link href="/user" onClick={close}>
                  <IconSettings />
                  <span className="flex-1">Settings</span>
                  <IconChevronRight className="text-muted-foreground/60 size-4 shrink-0" />
                </Link>
              </MobileSheetRow>
            )}
            <MobileSheetRow
              onClick={() => {
                close();
                openChat();
              }}
            >
              <IconMessageCircle />
              <span className="flex-1">Support</span>
              <IconChevronRight className="text-muted-foreground/60 size-4 shrink-0" />
            </MobileSheetRow>
            <MobileSheetRow asChild>
              <a
                href="https://cal.com/marissa-chung/moritz20min"
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
              >
                <IconCalendar />
                <span className="flex-1">Book a call</span>
                <IconExternalLink className="text-muted-foreground/60 size-4 shrink-0" />
              </a>
            </MobileSheetRow>
          </MobileSheetGroup>

          <MobileSheetGroup>
            <MobileSheetRow asChild>
              <Link
                href="/foundations"
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
              >
                <IconPalette />
                <span className="flex-1">Moritz Design system</span>
                <IconExternalLink className="text-muted-foreground/60 size-4 shrink-0" />
              </Link>
            </MobileSheetRow>
            <MobileSheetRow asChild>
              <Link
                href="/onboarding"
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
              >
                <IconUserPlus />
                <span className="flex-1">User onboarding</span>
                <IconExternalLink className="text-muted-foreground/60 size-4 shrink-0" />
              </Link>
            </MobileSheetRow>
          </MobileSheetGroup>

          {/*
           * The two ways out, in their own card. Grouping is the only
           * emphasis used here: "Log out" is not styled as destructive
           * because it is not — nothing is lost by it — but it does not
           * belong in the same block as a link to the design system.
           */}
          <MobileSheetGroup>
            <MobileSheetRow
              onClick={() => {
                close();
                void lockPlayground();
              }}
            >
              <IconLock />
              <span className="flex-1">Password screen</span>
            </MobileSheetRow>
            <MobileSheetRow onClick={close}>
              <IconLogout />
              <span className="flex-1">Log out</span>
            </MobileSheetRow>
          </MobileSheetGroup>
        </MobileSheet>
      </>
    );
  }

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
