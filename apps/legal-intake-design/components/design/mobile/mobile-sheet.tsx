'use client';

import type * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { XIcon } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

import { Heading } from '@/components/design/foundations/components/heading';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/design/foundations/components/drawer';

/**
 * The phone card: one shape for every overlay the top bar can open.
 *
 * The reference is the navigation drawer the section name already opens
 * (`top-nav-mobile-nav.tsx`) — a sheet that rises from the bottom edge, on the
 * foundation surface, with a grab handle you can drag it away by and a single
 * × in the corner. Notifications, the command palette, Ask and the account
 * menu all used desktop shapes on a phone: a drawer sliding in from the right
 * (which is the gesture edge, and reads as a sidebar), a centred dialog, and a
 * dropdown anchored under a 36px avatar. Four surfaces, four ways to open,
 * four ways to dismiss.
 *
 * This is the one way. Everything the reader can summon from the top bar
 * arrives from the same edge, with the same handle, and closes with the same
 * swipe — which is what "native" actually means on a phone: not a visual
 * style, a consistent physical model.
 *
 * Desktop keeps its own shapes. Each caller switches on `useIsMobile()` rather
 * than this component trying to be both, because a dropdown and a sheet are
 * genuinely different compositions and a single component pretending otherwise
 * ends up with a prop for every difference.
 */
export function MobileSheet({
  open,
  onOpenChange,
  title,
  description,
  /** Rendered in the header row, before the close button. */
  headerAccessory,
  /** Under the title row, inside the header block (filter tabs, a search field). */
  headerBelow,
  children,
  className,
  bodyClassName,
  closeLabel = 'Close',
  /**
   * Let vaul move focus into the sheet on open.
   *
   * Off by default: on a phone, focusing the first control raises the
   * keyboard over a sheet the reader has not looked at yet. On for the
   * command palette, where the field *is* the surface and a palette you have
   * to tap before you can type is a palette that wasted the gesture.
   */
  autoFocus = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  headerAccessory?: React.ReactNode;
  headerBelow?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  closeLabel?: string;
  autoFocus?: boolean;
}) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction="bottom"
      autoFocus={autoFocus}
    >
      <DrawerContent
        className={cn(
          /*
           * `svh`, not `vh`. On iOS Safari `vh` is the *large* viewport — it
           * measures as if the address bar were hidden — so an 88vh sheet is
           * taller than the window it is in and its last row sits under the
           * browser chrome.
           */
          'data-[vaul-drawer-direction=bottom]:max-h-[88svh]',
          className,
        )}
      >
        <DrawerHeader className="gap-3 p-4 pb-3 text-left md:text-left">
          <div className="flex items-center justify-between gap-3">
            <DrawerTitle asChild>
              <Heading level={4} variant="serif" className="min-w-0 truncate">
                {title}
              </Heading>
            </DrawerTitle>
            <div className="flex shrink-0 items-center gap-1">
              {headerAccessory}
              <DrawerClose
                className={cn(
                  'text-muted-foreground hover:text-foreground focus-visible:ring-ring bg-muted/70 hover:bg-muted -me-1 inline-flex size-8 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2',
                )}
                aria-label={closeLabel}
              >
                <XIcon className="size-4" aria-hidden />
              </DrawerClose>
            </div>
          </div>
          {description ? (
            <DrawerDescription className="sr-only">
              {description}
            </DrawerDescription>
          ) : null}
          {headerBelow}
        </DrawerHeader>
        <div
          className={cn(
            'mz-scrollbar-on-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]',
            bodyClassName,
          )}
        >
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/**
 * An iOS-style grouped list: rounded card, hairline-separated rows.
 *
 * The account menu is a settings list on a phone, not a dropdown, and this is
 * the shape a reader already knows one by.
 */
export function MobileSheetGroup({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'bg-muted/40 ring-border/60 divide-border/60 overflow-hidden rounded-2xl ring-1 [&>*]:border-0',
        'divide-y',
        className,
      )}
      {...props}
    />
  );
}

/** One row in a {@link MobileSheetGroup}. 48px minimum, per the iOS target. */
export function MobileSheetRow({
  className,
  asChild = false,
  type,
  ...props
}: React.ComponentProps<'button'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      {...(asChild ? {} : { type: type ?? 'button' })}
      className={cn(
        'text-foreground hover:bg-foreground/[0.04] active:bg-foreground/[0.07] focus-visible:ring-ring flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left text-[15px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset',
        '[&>svg]:text-muted-foreground [&>svg]:size-5 [&>svg]:shrink-0',
        className,
      )}
      {...props}
    />
  );
}
