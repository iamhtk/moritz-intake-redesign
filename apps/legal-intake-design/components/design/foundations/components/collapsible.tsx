'use client';

import * as React from 'react';
import { Collapsible as CollapsiblePrimitive } from 'radix-ui';

import { cn } from '@repo/ui/lib/utils';

/**
 * Foundation Collapsible — design-iteration port of shadcn's `Collapsible`,
 * built on the Radix Collapsible primitive (unified `radix-ui` import). An
 * expandable region toggled by a trigger — used here for a Bubble's show
 * more/less interaction.
 *
 * No `dark:` variants — the app has no class-based dark mode.
 *
 * TODO(@repo/ui): fold this primitive into `packages/ui` during
 * productionisation so production code can consume it directly.
 */
function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  );
}

function CollapsibleContent({
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      className={cn('overflow-hidden', className)}
      {...props}
    />
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
