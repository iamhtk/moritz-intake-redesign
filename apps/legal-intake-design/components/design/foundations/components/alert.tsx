'use client';

import * as React from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';

import { cn } from '@repo/ui/lib/utils';

import { buttonVariants } from '@/components/design/foundations/components/button';

/**
 * Foundation Alert — design-iteration confirmation modal. Keeps the shadcn
 * AlertDialog part structure and `data-slot` hooks, with a refined surface,
 * positioning, and action layout mapped onto foundation tokens. (This is the
 * modal confirmation; for the inline status callout see the Banner component.)
 *
 * Built on the Radix *Dialog* primitive (not the alert-dialog primitive) so it
 * is dismissible: clicking the backdrop or pressing Escape closes it, like a
 * shadcn Dialog. (Radix's alert-dialog hardcodes `onPointerDownOutside`/
 * `onInteractOutside` to `preventDefault`, so outside-click-to-close can't be
 * re-enabled there.) Dismissing is equivalent to cancelling, which stays safe
 * even for the destructive confirmation. The action and cancel buttons were
 * already `DialogClose` under the hood, so the API is unchanged.
 *
 * Treatment:
 * - Surface — a `rounded-2xl` panel with a translucent `ring-1 ring-foreground/10`
 *   hairline (rather than a solid border), `shadow-lg`, and a counter-intuitive
 *   `p-8 sm:p-6` gutter (roomier on mobile, tighter on desktop). `bg-background`
 *   fill.
 * - Backdrop — a token-driven `bg-foreground/50` scrim (a deeper dim than
 *   shadcn's light overlay) plus a support-gated, subtle `backdrop-blur-[2px]`,
 *   so the page behind reads as a clearly dimmed, softly frosted wash.
 * - Positioning — a full-page scroll container with a
 *   `grid-rows-[1fr_auto_3fr]` (on `sm+`) that seats the panel above center,
 *   instead of dead-center translate. The panel caps at the viewport height and
 *   the body (AlertBody) scrolls internally so the title and actions stay
 *   pinned on-screen.
 * - Spacing — margin-based (`mt-2` description, `mt-4` body, `mt-6 sm:mt-4`
 *   actions) rather than a flex `gap`.
 * - Actions — full-width stacked buttons on mobile, right-aligned row on
 *   desktop (`*:w-full sm:*:w-auto`).
 * - A `size` prop (`xs`–`5xl`, default `md`) caps the panel width on `sm+`.
 *
 * The action/cancel buttons use the foundation `buttonVariants`. No `dark:`
 * variants — the app has no class-based dark mode.
 *
 * Drop-in replacement for `@repo/ui/components/alert-dialog`, with the parts
 * renamed off the `AlertDialog*` prefix. Mapping for call sites:
 *   AlertDialog        -> Alert
 *   AlertDialogTrigger -> AlertTrigger
 *   AlertDialogPortal  -> AlertPortal
 *   AlertDialogOverlay -> AlertOverlay
 *   AlertDialogContent -> AlertContent
 *   AlertDialogHeader  -> AlertHeader
 *   AlertDialogFooter  -> AlertFooter
 *   AlertDialogTitle   -> AlertTitle
 *   AlertDialogDescription -> AlertDescription
 *   AlertDialogAction  -> AlertAction
 *   AlertDialogCancel  -> AlertCancel
 * Adds an `AlertBody` part and an optional `size` prop on `AlertContent`
 * (default `md`). `ref`, `className`, and handlers pass straight through via the
 * `...props` spread (React 19 ref-as-prop). Behavioral difference: this is built
 * on the Radix Dialog primitive, so it is dismissible (Escape / outside click
 * close, equivalent to cancel) — unlike the shared alert-dialog, which blocks
 * outside dismissal.
 *
 * To productionise, move this into `@repo/ui`. Note `@repo/ui` already ships an
 * inline-callout `Alert` (`components/alert.tsx`); the foundation renames that
 * one to `Banner`, so productionising this modal under the name `Alert` means
 * renaming the existing `packages/ui/src/components/alert.tsx` -> `banner.tsx`
 * first. On copy, also swap the unified `radix-ui` import for
 * `@radix-ui/react-dialog` and repoint `buttonVariants` to
 * `@repo/ui/components/button`.
 */
const sizes = {
  xs: 'sm:max-w-xs',
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '3xl': 'sm:max-w-3xl',
  '4xl': 'sm:max-w-4xl',
  '5xl': 'sm:max-w-5xl',
} as const;

function Alert({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="alert" {...props} />;
}

function AlertTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="alert-trigger" {...props} />;
}

function AlertPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="alert-portal" {...props} />;
}

function AlertOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="alert-overlay"
      className={cn(
        'bg-foreground/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 isolate z-50 duration-100 supports-[backdrop-filter]:backdrop-blur-[2px]',
        className,
      )}
      {...props}
    />
  );
}

function AlertContent({
  className,
  size = 'md',
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  size?: keyof typeof sizes;
}) {
  return (
    <AlertPortal>
      <AlertOverlay />
      <div className="fixed inset-0 z-50 w-screen overflow-y-auto pt-6 sm:pt-0">
        <div className="grid min-h-full grid-rows-[1fr_auto_1fr] justify-items-center p-8 sm:grid-rows-[1fr_auto_3fr] sm:p-4">
          <DialogPrimitive.Content
            data-slot="alert-content"
            className={cn(
              sizes[size],
              // Cap the panel to the viewport (minus the container gutter) and lay it
              // out as a column so a tall body scrolls internally while the title and
              // actions stay pinned and on-screen — instead of the whole panel growing
              // past the viewport and pushing the buttons out of reach.
              'flex max-h-[calc(100dvh-5rem)] flex-col sm:max-h-[calc(100dvh-2rem)]',
              'bg-background ring-foreground/10 row-start-2 w-full rounded-2xl p-8 shadow-lg ring-1 sm:p-6 forced-colors:outline',
              'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 transition duration-100 will-change-transform data-[state=closed]:ease-in data-[state=open]:ease-out',
              className,
            )}
            {...props}
          />
        </div>
      </div>
    </AlertPortal>
  );
}

function AlertHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-header"
      className={cn('text-center sm:text-left', className)}
      {...props}
    />
  );
}

function AlertFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-footer"
      className={cn(
        'mt-6 flex flex-col-reverse items-center justify-end gap-3 *:w-full sm:mt-4 sm:flex-row sm:*:w-auto',
        className,
      )}
      {...props}
    />
  );
}

function AlertTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="alert-title"
      className={cn(
        'text-foreground text-balance text-center text-base/6 font-semibold sm:text-wrap sm:text-left sm:text-sm/6',
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="alert-description"
      className={cn(
        'text-muted-foreground mt-2 text-pretty text-center text-base/6 sm:text-left sm:text-sm/6',
        className,
      )}
      {...props}
    />
  );
}

function AlertBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-body"
      // The flex-1 scroll region: when the panel hits its max height, the body
      // shrinks (min-h-0 lets it go below content size) and scrolls on its own,
      // keeping the header and footer visible. Short bodies stay their natural
      // height since the panel isn't height-constrained.
      className={cn('mt-4 min-h-0 flex-1 overflow-y-auto', className)}
      {...props}
    />
  );
}

function AlertAction({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return (
    <DialogPrimitive.Close
      data-slot="alert-action"
      className={cn(buttonVariants(), className)}
      {...props}
    />
  );
}

function AlertCancel({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return (
    <DialogPrimitive.Close
      data-slot="alert-cancel"
      className={cn(buttonVariants({ variant: 'outline' }), className)}
      {...props}
    />
  );
}

export {
  Alert,
  AlertPortal,
  AlertOverlay,
  AlertTrigger,
  AlertContent,
  AlertHeader,
  AlertFooter,
  AlertTitle,
  AlertDescription,
  AlertBody,
  AlertAction,
  AlertCancel,
};
