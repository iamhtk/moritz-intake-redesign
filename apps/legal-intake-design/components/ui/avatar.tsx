'use client';

import * as React from 'react';
import { Avatar as AvatarPrimitive } from 'radix-ui';

import { cn } from '@repo/ui/lib/utils';

function Avatar({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: 'default' | 'sm' | 'lg';
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        'group/avatar relative flex size-8 shrink-0 select-none overflow-hidden rounded-full data-[size=lg]:size-10 data-[size=sm]:size-6',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Renders nothing until the image has loaded, and reports its status to the
 * root so the fallback knows whether to show.
 *
 * **Render it unconditionally, even when there is no image.** The root holds the
 * loading status in state and nothing resets it when this unmounts, so a caller
 * that swaps `<AvatarImage>` out for `null` when a person has no photograph
 * leaves the root still believing an image is loaded — and `AvatarFallback`
 * renders nothing at all, giving a blank circle where the initials should be.
 * It only shows up when the avatar had *already* displayed a photograph in the
 * same position, which is why it reads as intermittent: the intake's lead
 * lawyer follows the matter type, so a matter that resolved to the one partner
 * with no headshot lost her monogram, but only if a photographed colleague had
 * been on screen first.
 *
 * An absent `src` is passed through as `''`, which the primitive resolves to
 * `error` — synchronously, with no request issued — and that is what tells the
 * root to show the fallback.
 */
function AvatarImage({
  className,
  src,
  ...props
}: Omit<React.ComponentProps<typeof AvatarPrimitive.Image>, 'src'> & {
  /** `null` and `''` are both "this person has no photograph". */
  src?: string | null;
}) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      src={src ?? ''}
      className={cn('aspect-square size-full', className)}
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
        'bg-muted text-muted-foreground flex size-full items-center justify-center rounded-full text-sm group-data-[size=sm]/avatar:text-xs',
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
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        'group/avatar-group *:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2',
        className,
      )}
      {...props}
    />
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
        'bg-muted text-muted-foreground ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3 relative flex size-8 shrink-0 items-center justify-center rounded-full text-sm ring-2 [&>svg]:size-4',
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
