'use client';

import * as React from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';

import { cn } from '@repo/ui/lib/utils';

/**
 * Foundation Radio — design-iteration restyle of the shared shadcn RadioGroup on
 * Radix and our design tokens, matched to the foundation Checkbox so the two
 * selection controls read as a set. A round control with a `field` resting
 * border (the same stroke the Input/Select/Switch/Checkbox use) and a subtle
 * shadow that fills with `primary` and reveals a contrasting center dot when
 * selected. The ring swaps to `error` for an invalid state so it pairs with the
 * shared Field's `data-invalid`/`aria-invalid`. Hover deepens the resting border
 * and previews a faint center dot (enabled + unchecked only); the cursor turns
 * to a pointer when interactive and `not-allowed` when disabled.
 *
 * A single `primary` accent is used for consistency with the foundation
 * Checkbox/Switch. Colors come from theme tokens rather than `dark:` utilities —
 * the app has no class-based dark mode.
 *
 * Drop-in replacement for `@repo/ui/components/radio-group`: the public API is
 * identical — same `RadioGroup`/`RadioGroupItem` exports, props, and `data-slot`
 * hooks — so call sites swap with zero changes. `ref`, `className`, and handlers
 * pass straight through via the `...props` spread (React 19 ref-as-prop). Only
 * the visual treatment (the filled dot + hover preview) differs from the shared
 * version. To productionise, copy the body into
 * `packages/ui/src/components/radio-group.tsx` and swap the unified `radix-ui`
 * import for `@radix-ui/react-radio-group` to match that package's convention.
 */
function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('grid gap-3', className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        'border-field bg-background text-primary-foreground shadow-xs group peer relative aspect-square size-4 shrink-0 cursor-pointer rounded-full border outline-none transition-[color,box-shadow]',
        // Hover (unchecked, enabled): deepen the resting border.
        'not-disabled:not-data-[state=checked]:hover:border-foreground/30',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'data-[state=checked]:bg-primary data-[state=checked]:border-primary',
        'aria-invalid:border-error aria-invalid:ring-error/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {/* Faint preview dot shown on hover while unchecked and enabled. */}
      <span
        aria-hidden
        className="group-[[data-state=unchecked]:hover:not(:disabled)]:bg-foreground/15 pointer-events-none absolute inset-0 m-auto size-1.5 rounded-full bg-transparent transition-colors"
      />
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-full items-center justify-center"
      >
        <span className="size-1.5 rounded-full bg-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
