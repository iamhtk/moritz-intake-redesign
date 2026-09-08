'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Switch as SwitchPrimitive } from 'radix-ui';

import { cn } from '@repo/ui/lib/utils';

/**
 * Foundation Switch — design-iteration restyle of the shared shadcn Switch that
 * adopts the reference design's switch visual language on top of Radix and our
 * design tokens. Compared with the shared Switch it has a chunkier track with an
 * inset ring, a raised thumb (background fill + soft shadow + hairline ring), and
 * the foundation Button/Toggle focus ring.
 *
 * Sizing is mobile-first like the rest of the foundations: a larger,
 * touch-friendly target on small screens that collapses to a compact desktop
 * density at the `sm:` breakpoint. The `size` prop offers a `default`
 * track (`h-6 w-10` → `sm:h-5 sm:w-8`) and a denser `sm` track
 * (`h-5 w-9` → `sm:h-4 sm:w-7`); the thumb travel is identical across sizes, so
 * the same `translate` values drive the checked thumb for both.
 *
 * The checked state uses the `primary` token (the reference exposes a multi-color
 * palette; we keep a single look consistent with the foundation Button/Toggle).
 * An `aria-invalid` switch swaps the ring to `destructive` so it can pair with
 * the shared Field's invalid state. Colors come from theme tokens rather than
 * `dark:` utilities, because this repo has no class-based `dark` variant —
 * `dark:` would resolve to `prefers-color-scheme` and misfire on a dark-OS
 * machine while the app renders light.
 *
 * TODO(@repo/ui): fold this treatment into
 * `packages/ui/src/components/switch.tsx` during productionisation.
 */
const switchVariants = cva(
  [
    'group relative isolate inline-flex shrink-0 cursor-pointer items-center rounded-full p-[3px] outline-none transition-all',
    // Unchecked: neutral track with a subtle inset ring.
    'bg-input ring-foreground/10 ring-1 ring-inset',
    // Checked: primary fill + matching ring.
    'data-[state=checked]:bg-primary data-[state=checked]:ring-primary',
    // Hover (off state only): deepen the ring.
    'not-disabled:not-data-[state=checked]:hover:ring-foreground/20',
    // Invalid: destructive ring so it pairs with the Field's data-invalid state.
    'aria-invalid:ring-destructive',
    // Focus ring matches the foundation Button/Toggle.
    'focus-visible:outline-solid focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2',
    // Disabled.
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      size: {
        default: 'h-6 w-10 sm:h-5 sm:w-8',
        sm: 'h-5 w-9 sm:h-4 sm:w-7',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

const switchThumbVariants = cva(
  [
    'bg-background ring-foreground/5 pointer-events-none relative block rounded-full border border-transparent shadow-sm ring-1 transition-transform',
    'translate-x-0 data-[state=checked]:translate-x-4 sm:data-[state=checked]:translate-x-3',
  ],
  {
    variants: {
      size: {
        default: 'size-4.5 sm:size-3.5',
        sm: 'size-3.5 sm:size-2.5',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

function Switch({
  className,
  size,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> &
  VariantProps<typeof switchVariants>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(switchVariants({ size }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={switchThumbVariants({ size })}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
