'use client';

import * as React from 'react';
import { Toggle as TogglePrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@repo/ui/lib/utils';

/**
 * Foundation Toggle — design-iteration shadcn Toggle (a two-state button) that
 * shares the foundation Button's design language: the reference `0.5rem` radius
 * (matching the foundation Input), border-compensated mobile-first spacing, and
 * outline-based focus. The `outline` variant carries the same layered surface as
 * the inputs/select — a `before` pseudo paints a `bg-background` fill + blended
 * `shadow-sm` behind a 1px transparent-bordered box, so it reads as a raised
 * control. The pressed ("on") state is a neutral `foreground/10` fill on both
 * variants, keeping selection understated and consistent with the library.
 *
 * Colors come from the theme tokens (`--background`, `--foreground`, `--ring`)
 * rather than `dark:` utilities: this repo has no class-based `dark` variant, so
 * `dark:` resolves to `prefers-color-scheme` and would misfire on a dark-OS
 * machine while the app renders light.
 *
 * Sizing stays mobile-first (the same scale as the Button): a larger,
 * touch-friendly target on small screens that collapses to the compact desktop
 * density at the `sm:` breakpoint (640px). Icon-only sizes are square so toggles
 * line up with the foundation Button's icon buttons.
 *
 * TODO(@repo/ui): fold this into `packages/ui/src/components/toggle.tsx` during
 * productionisation — there is no shared Toggle yet, so this is the seed for it.
 */
const toggleVariants = cva(
  // Radius is the reference's `rounded-lg` (stock Tailwind 0.5rem); our theme's
  // own `rounded-lg` token is 10px, so we pin the literal 0.5rem to stay
  // consistent with the foundation Input/Button.
  "relative isolate inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[0.5rem] border border-transparent font-medium shrink-0 cursor-pointer transition-all outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Ghost: transparent off-state, neutral hover; the pressed ("on") state
        // adopts the primary (button) fill so selection reads as active.
        default:
          'text-foreground not-data-[state=on]:not-disabled:hover:bg-foreground/5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
        // Outline: layered surface (border + before fill + blended shadow), hover
        // darkens the border; the pressed state switches to the primary fill +
        // matching border, mirroring the foundation Button's solid look. The fill
        // is recolored via the `before` layer (not the element background) because
        // `before:-z-10` paints above the element's own background, so an element
        // `bg-primary` would be hidden behind the white `before` fill.
        outline: cn(
          'border-border text-foreground',
          'before:bg-background before:absolute before:inset-px before:-z-10 before:rounded-[calc(0.5rem_-_1px)] before:shadow-sm',
          'not-data-[state=on]:not-disabled:hover:border-field-strong',
          'data-[state=on]:border-primary data-[state=on]:before:bg-primary data-[state=on]:text-primary-foreground',
          'disabled:before:shadow-none',
        ),
      },
      size: {
        // base = mobile (larger touch target); sm: = desktop (compact)
        sm: 'min-w-9 text-sm px-[calc(--spacing(2)-1px)] py-[calc(--spacing(2)-1px)] sm:min-w-8 sm:px-[calc(--spacing(1.5)-1px)] sm:py-[calc(--spacing(1)-1px)]',
        default:
          'min-w-10 text-base px-[calc(--spacing(2.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:min-w-9 sm:text-sm sm:px-[calc(--spacing(2)-1px)] sm:py-[calc(--spacing(1.5)-1px)]',
        lg: 'min-w-11 text-base px-[calc(--spacing(3)-1px)] py-[calc(--spacing(3)-1px)] sm:min-w-10 sm:text-sm sm:px-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(2.5)-1px)]',
        // icon-only sizes (square), matching the foundation Button's icon buttons
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
