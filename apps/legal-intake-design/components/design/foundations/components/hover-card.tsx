'use client';

import * as React from 'react';
import { HoverCard as HoverCardPrimitive } from 'radix-ui';

import { cn } from '@repo/ui/lib/utils';

/**
 * Foundation Hover Card — design-iteration port of shadcn's `HoverCard`, built
 * on the Radix HoverCard primitive (unified `radix-ui` import). Reveals rich
 * content when a trigger is hovered or focused — used here for the Message
 * Scroller's transcript outline.
 *
 * Shares the foundation overlay treatment with the Popover/Dropdown Menu: a
 * translucent `bg-popover/75` + `backdrop-blur-xl` surface carried by a `ring-1
 * ring-foreground/10` hairline, with the standard open/close zoom + fade.
 *
 * No `dark:` variants — the app has no class-based dark mode.
 *
 * TODO(@repo/ui): fold this primitive into `packages/ui` during
 * productionisation so production code can consume it directly.
 */
function HoverCard({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  return <HoverCardPrimitive.Root data-slot="hover-card" {...props} />;
}

function HoverCardTrigger({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return (
    <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
  );
}

function HoverCardContent({
  className,
  align = 'center',
  sideOffset = 4,
  // Radix would otherwise let a flipped or shifted card sit flush against the
  // viewport, which reads as clipped against the app shell's 8px inset. Keeping
  // it a gutter clear of the edge leaves the surface visibly floating.
  collisionPadding = 16,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          'origin-(--radix-hover-card-content-transform-origin) text-popover-foreground ring-foreground/10 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 bg-popover/75 z-50 w-64 rounded-[0.75rem] p-4 shadow-lg outline-none ring-1 backdrop-blur-xl',
          className,
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  );
}

export { HoverCard, HoverCardTrigger, HoverCardContent };
