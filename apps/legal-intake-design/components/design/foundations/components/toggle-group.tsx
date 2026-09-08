'use client';

import * as React from 'react';
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui';
import { type VariantProps } from 'class-variance-authority';

import { cn } from '@repo/ui/lib/utils';
import { toggleVariants } from './toggle';

/**
 * Foundation Toggle Group — design-iteration port of shadcn's `ToggleGroup`,
 * built on the Radix ToggleGroup primitive (unified `radix-ui` import). A set of
 * related two-state buttons used as a single- or multi-select control — used
 * here to pick the Message Scroller's anchor role.
 *
 * Reuses the foundation Toggle's `toggleVariants` for each item, and shares the
 * group's `variant`/`size` with the items via context (overridable per item).
 * Items are laid out in a `gap-1` row so they read as a small segmented control.
 *
 * No `dark:` variants — the app has no class-based dark mode.
 *
 * TODO(@repo/ui): fold this primitive into `packages/ui` during
 * productionisation so production code can consume it directly.
 */
const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  variant: 'outline',
  size: 'default',
});

function ToggleGroup({
  className,
  variant = 'outline',
  size = 'default',
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={cn('inline-flex items-center gap-1', className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
}

function ToggleGroupItem({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        toggleVariants({
          variant: variant ?? context.variant,
          size: size ?? context.size,
        }),
        className,
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
