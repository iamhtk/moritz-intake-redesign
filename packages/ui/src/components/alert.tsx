'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

import { cn } from '@repo/ui/lib/utils';
import { buttonVariants } from '@repo/ui/components/button';

/**
 * Alert — confirmation modal built on the Radix Dialog primitive (not the
 * alert-dialog primitive) so it is dismissible: clicking the backdrop or
 * pressing Escape closes it. Dismissing is equivalent to cancelling, which
 * stays safe even for destructive confirmations. (For the inline status
 * callout, see the Banner component.)
 *
 * Provides an optional `AlertBody` scroll region and a `size` prop (`xs`–`5xl`,
 * default `md`) on `AlertContent` that caps the panel width on `sm+`. The body
 * scrolls internally when the panel hits the viewport height, keeping the title
 * and actions pinned on-screen.
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
  onOpenAutoFocus,
  onCloseAutoFocus,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  size?: keyof typeof sizes;
}) {
  /*
   * Whatever had focus when the alert opened, so closing can give it back.
   *
   * Radix's modal Content restores to its *trigger*, which is nothing when the
   * alert is controlled by state instead of opened by an `AlertTrigger` - and
   * because it also calls preventDefault, FocusScope's own restore never runs
   * either, so a dismissal drops the reader on document.body. Opening through
   * a trigger lands here too: the trigger is what held focus, so this restores
   * the same element Radix would have.
   */
  const restoreFocusRef = React.useRef<HTMLElement | null>(null);

  return (
    <AlertPortal>
      <AlertOverlay />
      <div className="fixed inset-0 z-50 w-screen overflow-y-auto pt-6 sm:pt-0">
        <div className="grid min-h-full grid-rows-[1fr_auto_1fr] justify-items-center p-8 sm:grid-rows-[1fr_auto_3fr] sm:p-4">
          <DialogPrimitive.Content
            onOpenAutoFocus={(event) => {
              restoreFocusRef.current =
                document.activeElement instanceof HTMLElement
                  ? document.activeElement
                  : null;
              onOpenAutoFocus?.(event);
            }}
            onCloseAutoFocus={(event) => {
              // The caller decides first, and preventDefault means they are
              // placing focus themselves.
              onCloseAutoFocus?.(event);
              if (event.defaultPrevented) return;
              const restore = restoreFocusRef.current;
              // Gone from the document: whatever replaced it owns focus now,
              // and stealing it back would fight that.
              if (!restore?.isConnected) return;
              event.preventDefault();
              restore.focus();
            }}
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
