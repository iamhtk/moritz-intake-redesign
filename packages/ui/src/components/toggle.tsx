'use client';

import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@repo/ui/lib/utils';

/**
 * Toggle — a two-state button sharing the Button's design language: the
 * reference `0.5rem` radius, border-compensated mobile-first spacing, and
 * outline-based focus. Promoted from the design playground's foundation
 * Toggle (its `TODO(@repo/ui)`).
 *
 * The `outline` variant carries the layered surface of the inputs — a
 * `before` pseudo paints a `bg-background` fill + blended `shadow-sm` behind
 * a 1px transparent-bordered box, so it reads as a raised control. The
 * pressed ("on") state adopts the primary fill on both variants.
 *
 * Sizing is mobile-first, the same scale as the Button: a larger touch
 * target on small screens that collapses to compact desktop density at
 * `sm:`. Icon-only sizes are square so toggles line up with icon buttons.
 */
const toggleVariants = cva(
  "relative isolate inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[0.5rem] border border-transparent font-medium shrink-0 cursor-pointer transition-all outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'text-foreground not-data-[state=on]:not-disabled:hover:bg-foreground/5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
        outline: cn(
          'border-border text-foreground',
          'before:bg-background before:absolute before:inset-px before:-z-10 before:rounded-[calc(0.5rem_-_1px)] before:shadow-sm',
          'not-data-[state=on]:not-disabled:hover:border-mz-gray-60',
          'data-[state=on]:border-primary data-[state=on]:before:bg-primary data-[state=on]:text-primary-foreground',
          'disabled:before:shadow-none',
        ),
      },
      size: {
        sm: 'min-w-9 text-sm px-[calc(--spacing(2)-1px)] py-[calc(--spacing(2)-1px)] sm:min-w-8 sm:px-[calc(--spacing(1.5)-1px)] sm:py-[calc(--spacing(1)-1px)]',
        default:
          'min-w-10 text-base px-[calc(--spacing(2.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:min-w-9 sm:text-sm sm:px-[calc(--spacing(2)-1px)] sm:py-[calc(--spacing(1.5)-1px)]',
        lg: 'min-w-11 text-base px-[calc(--spacing(3)-1px)] py-[calc(--spacing(3)-1px)] sm:min-w-10 sm:text-sm sm:px-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(2.5)-1px)]',
        'icon-sm': 'size-8',
        icon: 'size-9',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
