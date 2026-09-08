'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';

import { cn } from '@repo/ui/lib/utils';

/**
 * Foundation Drawer — design-iteration port of the shadcn Drawer (Vaul), mapped
 * onto the foundation surface treatment shared by the Dialog and Alert. Keeps
 * the shadcn Drawer API and `data-slot` hooks (drop-in part names) plus all of
 * Vaul's functionality (drag-to-dismiss, the four directions, internal scroll);
 * only the visuals change.
 *
 * Treatment (matching Dialog / Alert):
 * - Backdrop — the shared token-driven `bg-foreground/50` scrim plus a
 *   support-gated `backdrop-blur-[2px]`, so the page behind reads as a clearly
 *   dimmed, softly frosted wash (rather than shadcn's flat `bg-black/50`).
 * - Surface — `bg-background` carried by a translucent `ring-1
 *   ring-foreground/10` hairline (not a solid border), with `shadow-lg`. The
 *   leading edge is rounded on the foundation radius scale: bottom/top read as
 *   sheets (`rounded-t-3xl` / `rounded-b-3xl`, like the Dialog bottom sheet) and
 *   the side drawers round their inner edge as a card (`rounded-l-2xl` /
 *   `rounded-r-2xl`).
 * - Spacing — a roomy `p-6` gutter on the header and footer (vs shadcn's `p-4`).
 * - Type — title `text-foreground font-semibold text-base/6`, description
 *   `text-muted-foreground text-sm/6`, matching the Dialog/Alert.
 * - Actions — full-width stacked buttons on mobile, right-aligned row on desktop
 *   (`*:w-full sm:*:w-auto`), like the Dialog/Alert footer.
 *
 * No `dark:` variants — the app has no class-based dark mode.
 *
 * TODO(@repo/ui): fold this back into `packages/ui` during productionisation —
 * it adds the foundation surface treatment (scrim, ring hairline, shadow, radius
 * scale, type, and footer layout) on top of the stock shadcn Drawer.
 */
function Drawer({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />;
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        'bg-foreground/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 isolate z-50 duration-100 supports-[backdrop-filter]:backdrop-blur-[2px]',
        className,
      )}
      {...props}
    />
  );
}

function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          'group/drawer-content bg-background ring-foreground/10 fixed z-50 flex h-auto flex-col shadow-lg ring-1 forced-colors:outline',
          'data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-3xl',
          'data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-3xl',
          'data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:rounded-l-2xl data-[vaul-drawer-direction=right]:sm:max-w-sm',
          'data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:rounded-r-2xl data-[vaul-drawer-direction=left]:sm:max-w-sm',
          className,
        )}
        {...props}
      >
        <div className="bg-muted mx-auto mt-4 hidden h-1 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        'flex flex-col gap-1 p-6 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:text-left',
        className,
      )}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn(
        'mt-auto flex flex-col-reverse items-center justify-center gap-3 p-6 *:w-full sm:flex-row sm:*:w-auto',
        'group-data-[vaul-drawer-direction=right]/drawer-content:sm:justify-start group-data-[vaul-drawer-direction=left]/drawer-content:sm:justify-end',
        className,
      )}
      {...props}
    />
  );
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn(
        'text-foreground text-balance text-base/6 font-semibold',
        className,
      )}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn('text-muted-foreground text-pretty text-sm/6', className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
