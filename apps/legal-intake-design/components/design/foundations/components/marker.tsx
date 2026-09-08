'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@repo/ui/lib/utils';

/**
 * Foundation Marker — design-iteration port of shadcn's `Marker`. Inline
 * conversation markers such as status updates, system notes, bordered rows, and
 * labeled separators. Compose it with a message thread.
 *
 * Built on the shadcn foundation pattern (`cva` + `Slot`/`asChild` +
 * `data-slot`). The root is presentational by default and forwards `role`, so
 * callers choose the semantics (`role="status"` for streaming/progress, `asChild`
 * for an interactive link/button, or none for a labeled separator).
 *
 * Variants:
 * - `default` — an inline marker for status, notes, and actions.
 * - `border` — a default marker with a bottom border under the row.
 * - `separator` — a centered label with decorative divider lines on each side
 *   (CSS pseudo-elements, so the visible text is announced as ordinary content).
 *
 * Pairs with the `shimmer` utility (app stylesheet) on `MarkerContent` for
 * streaming status text.
 *
 * No `dark:` variants — the app has no class-based dark mode.
 *
 * TODO(@repo/ui): fold this primitive into `packages/ui` during
 * productionisation so production code can consume it directly.
 */
const markerVariants = cva(
  'flex items-center gap-2 text-sm text-muted-foreground',
  {
    variants: {
      variant: {
        default: '',
        border: 'border-b border-border pb-3',
        separator:
          "justify-center text-center before:h-px before:flex-1 before:bg-border before:content-[''] after:h-px after:flex-1 after:bg-border after:content-['']",
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

type MarkerProps = React.ComponentProps<'div'> &
  VariantProps<typeof markerVariants> & {
    asChild?: boolean;
  };

function Marker({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: MarkerProps) {
  const Comp = asChild ? Slot : 'div';

  return (
    <Comp
      data-slot="marker"
      data-variant={variant ?? 'default'}
      className={cn(markerVariants({ variant }), className)}
      {...props}
    />
  );
}

function MarkerIcon({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="marker-icon"
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center [&>svg]:size-4',
        className,
      )}
      {...props}
    />
  );
}

function MarkerContent({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="marker-content"
      className={cn('min-w-0', className)}
      {...props}
    />
  );
}

export { Marker, MarkerIcon, MarkerContent, markerVariants };
