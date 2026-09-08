'use client';

import * as React from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';

import { cn } from '@repo/ui/lib/utils';

/**
 * Foundation Dialog — general-purpose modal. Keeps the shadcn Dialog API and
 * `data-slot` hooks (drop-in part names), with a refined surface, positioning,
 * and action layout mapped onto foundation tokens.
 *
 * Built on the Radix Dialog primitive (for consistency with the rest of the
 * foundation library and `@repo/ui`). It has no built-in close (X) button —
 * dismiss it by clicking the backdrop, pressing Escape, or via a DialogClose
 * button in the footer.
 *
 * Treatment:
 * - Surface — a `p-8` panel with a translucent `ring-1 ring-foreground/10`
 *   hairline (rather than a solid border), `shadow-lg`, and `bg-background` fill.
 *   On mobile it is a bottom sheet (`rounded-t-3xl`, only the top corners
 *   rounded); on `sm+` it is a fully rounded card (`sm:rounded-2xl`).
 * - Backdrop — a token-driven `bg-foreground/50` scrim (a deeper dim than
 *   shadcn's light overlay) plus a support-gated, subtle `backdrop-blur-[2px]`,
 *   so the page behind reads as a clearly dimmed, softly frosted wash. Shared
 *   verbatim with the foundation Alert (modal confirmation).
 * - Positioning — a full-page scroll container. On mobile the grid
 *   (`grid-rows-[1fr_auto]`) pins the full-width panel to the bottom edge; on
 *   `sm+` (`grid-rows-[1fr_auto_3fr]`) it seats the capped-width panel above
 *   center. The whole container scrolls when content is taller than the
 *   viewport, rather than an internal body scroll.
 * - Motion — the panel slides up from the bottom on mobile
 *   (`slide-in-from-bottom-12`) and scales in on `sm+` (`sm:zoom-in-95`), both
 *   with a fade, at `duration-100`.
 * - Spacing — margin-based (`mt-2` description, `mt-6` body, `mt-8` actions)
 *   rather than a flex `gap`.
 * - Actions — full-width stacked buttons on mobile, right-aligned row on desktop
 *   (`*:w-full sm:*:w-auto`).
 * - A `size` prop (`xs`–`5xl`, default `lg`) caps the panel width on `sm+`.
 *
 * No `dark:` variants — the app has no class-based dark mode.
 *
 * Drop-in replacement for `@repo/ui/components/dialog`: every export matches
 * (`Dialog`, `DialogTrigger`, `DialogPortal`, `DialogClose`, `DialogOverlay`,
 * `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`,
 * `DialogDescription`), plus an additive `DialogBody` and an optional `size`
 * prop on `DialogContent` (default `lg`). `ref`, `className`, and handlers pass
 * straight through via the `...props` spread (React 19 ref-as-prop). The one
 * behavioral change vs the current shared Dialog is that there is no built-in
 * top-right X close button — dismiss via the backdrop, Escape, or a footer
 * `DialogClose`. To productionise, copy the body into
 * `packages/ui/src/components/dialog.tsx` and swap the unified `radix-ui` import
 * for `@radix-ui/react-dialog` to match that package's convention.
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

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'bg-foreground/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 isolate z-50 duration-100 supports-[backdrop-filter]:backdrop-blur-[2px]',
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  size = 'lg',
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  size?: keyof typeof sizes;
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <div className="fixed inset-0 z-50 w-screen overflow-y-auto pt-6 sm:pt-0">
        {/* Mobile: a single flexible row above the panel pins it to the bottom
            edge (bottom sheet). sm+: a 1fr/auto/3fr grid seats the panel above
            center. The container itself scrolls when content is tall. */}
        <div className="grid min-h-full grid-rows-[1fr_auto] justify-items-center sm:grid-rows-[1fr_auto_3fr] sm:p-4">
          <DialogPrimitive.Content
            data-slot="dialog-content"
            className={cn(
              sizes[size],
              'bg-background ring-foreground/10 row-start-2 w-full min-w-0 rounded-t-3xl p-8 shadow-lg ring-1 sm:mb-auto sm:rounded-2xl forced-colors:outline',
              // Slide up from the bottom on mobile, scale in on sm+, both with a fade.
              'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-12 data-[state=open]:slide-in-from-bottom-12 sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95 duration-100 will-change-transform data-[state=closed]:ease-in data-[state=open]:ease-out',
              className,
            )}
            {...props}
          />
        </div>
      </div>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('text-left', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'mt-8 flex flex-col-reverse items-center justify-end gap-3 *:w-full sm:flex-row sm:*:w-auto',
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        'text-foreground text-balance text-lg/6 font-semibold sm:text-base/6',
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        'text-muted-foreground mt-2 text-pretty text-base/6 sm:text-sm/6',
        className,
      )}
      {...props}
    />
  );
}

function DialogBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="dialog-body" className={cn('mt-6', className)} {...props} />
  );
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogBody,
};
