'use client';

import * as React from 'react';
import { Avatar as AvatarPrimitive } from 'radix-ui';

import { cn } from '@repo/ui/lib/utils';

/**
 * Foundation Avatar — design-iteration shadcn Avatar with a refined treatment.
 *
 * Keeps the shadcn foundation (Radix Avatar primitives + `data-slot` hooks +
 * design tokens, no `dark:` — this app is light-only), with a refined look:
 * - A hairline inner outline ring (`outline outline-foreground/10
 *   -outline-offset-1`) that traces the avatar edge and reads cleanly over any
 *   image.
 * - A squircle radius system: `[--avatar-radius:20%]` with a `square` prop that
 *   swaps the default `rounded-full` for a soft-cornered square.
 *
 * The shape clip lives on `AvatarImage`/`AvatarFallback` (via `rounded-[inherit]`)
 * rather than as `overflow-hidden` on the root, so the corner `AvatarBadge` can
 * sit proud of the avatar edge without being sliced off by the round/square clip.
 *
 * A `size` prop (`sm | default | lg | xl | 2xl`) scales the root via
 * `data-size`, and a `group/avatar` marker lets the fallback and `AvatarBadge`
 * re-flow off the active size.
 *
 * Exposes the full surface: `AvatarImage`, `AvatarFallback`, a corner
 * `AvatarBadge` (status dot / count), and `AvatarGroup` + `AvatarGroupCount`
 * for stacked rows with an overflow chip. `AvatarGroup` isolates a stacking
 * context; its `stacking` prop chooses which avatar overlaps its neighbour —
 * `first` (default) walks the z-index down so the leading avatar sits on top,
 * `last` leaves the natural DOM order so the trailing avatar sits on top.
 *
 * TODO(@repo/ui): fold this back into `packages/ui/src/components/avatar.tsx`
 * during productionisation.
 */

function Avatar({
  className,
  size = 'default',
  square = false,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: 'default' | 'sm' | 'lg' | 'xl' | '2xl';
  square?: boolean;
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        'group/avatar outline-foreground/10 relative flex size-8 shrink-0 select-none outline -outline-offset-1 [--avatar-radius:20%] data-[size=2xl]:size-14 data-[size=lg]:size-10 data-[size=sm]:size-6 data-[size=xl]:size-12',
        square ? 'rounded-(--avatar-radius)' : 'rounded-full',
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        'aspect-square size-full rounded-[inherit] object-cover',
        className,
      )}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'bg-muted text-muted-foreground flex size-full items-center justify-center rounded-[inherit] text-sm group-data-[size=2xl]/avatar:text-lg group-data-[size=sm]/avatar:text-xs group-data-[size=xl]/avatar:text-base',
        className,
      )}
      {...props}
    />
  );
}

function AvatarBadge({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        'bg-primary text-primary-foreground ring-background absolute bottom-0 right-0 z-10 inline-flex select-none items-center justify-center rounded-full ring-2',
        'group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden',
        'group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2',
        'group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2',
        'group-data-[size=xl]/avatar:size-3.5 group-data-[size=xl]/avatar:[&>svg]:size-2.5',
        'group-data-[size=2xl]/avatar:size-4 group-data-[size=2xl]/avatar:[&>svg]:size-3',
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroup({
  className,
  children,
  stacking = 'first',
  ...props
}: React.ComponentProps<'div'> & {
  /**
   * Which avatar overlaps its neighbour. `first` walks the z-index down so the
   * leading avatar sits on top; `last` keeps the natural DOM order so the
   * trailing avatar sits on top.
   */
  stacking?: 'first' | 'last';
}) {
  // For `first`, walk the z-index down across children so the leading avatar
  // stacks on top of the next. `isolate` keeps the stacking context local to
  // the group; for `last` the natural DOM order already paints later children
  // on top, so no z-index is injected.
  const items = React.Children.toArray(children);

  return (
    <div
      data-slot="avatar-group"
      className={cn(
        'group/avatar-group *:data-[slot=avatar]:ring-background isolate flex -space-x-2 *:data-[slot=avatar]:ring-2',
        className,
      )}
      {...props}
    >
      {stacking === 'first'
        ? items.map((child, index) =>
            React.isValidElement(child)
              ? React.cloneElement(
                  child as React.ReactElement<{ style?: React.CSSProperties }>,
                  {
                    style: {
                      zIndex: items.length - index,
                      ...(child.props as { style?: React.CSSProperties }).style,
                    },
                  },
                )
              : child,
          )
        : children}
    </div>
  );
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        'bg-muted text-muted-foreground ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 group-has-data-[size=xl]/avatar-group:size-12 group-has-data-[size=2xl]/avatar-group:size-14 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3 group-has-data-[size=xl]/avatar-group:[&>svg]:size-6 group-has-data-[size=2xl]/avatar-group:[&>svg]:size-7 relative flex size-8 shrink-0 items-center justify-center rounded-full text-sm ring-2 [&>svg]:size-4',
        className,
      )}
      {...props}
    />
  );
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
};
