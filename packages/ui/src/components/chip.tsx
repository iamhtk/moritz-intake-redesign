import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@repo/ui/lib/utils';

/**
 * Chip — a spacious, pill-shaped trigger that pairs a leading icon with a label.
 * Used for lightweight quick actions (e.g. "Browse cases", "Book a call").
 *
 * Distinct from a Button: chips are deliberately roomier (`rounded-full` with
 * generous padding) and read as lightweight action affordances rather than
 * primary CTAs.
 *
 * Shares the Button/Toggle design language: outline-based focus, `border-border`
 * on the outline variant, the mobile-first border-compensated size scale (a
 * larger touch target on small screens collapsing to compact desktop density at
 * `sm:`), and the same responsive icon sizing + `data-icon` edge spacing. The
 * two variants mirror the Button: `outline` (hairline stroke) and `ghost`
 * (borderless, de-emphasized).
 *
 * Built on the shadcn foundation pattern (`cva` + `Slot`/`asChild` +
 * `data-slot`). Renders a `<button type="button">` by default, or any element
 * via `asChild` (e.g. an `<a>` for link chips).
 */
const chipVariants = cva(
  // We deliberately avoid `disabled:pointer-events-none` so a disabled chip can
  // still show the `not-allowed` cursor on hover (mirroring the Button); hover
  // styling is gated behind `not-disabled:`. Icon sizing and the outline-based
  // focus match the Button/Toggle.
  "inline-flex w-fit shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-transparent whitespace-nowrap font-medium transition-all outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg[data-icon=inline-start]]:-ms-0.5 [&_svg[data-icon=inline-end]]:-me-0.5",
  {
    variants: {
      variant: {
        outline:
          'border-border bg-transparent text-foreground not-disabled:hover:bg-foreground/5',
        ghost: 'text-foreground not-disabled:hover:bg-foreground/5',
      },
      size: {
        // base = mobile (larger touch target); sm: = desktop (compact). Kept a
        // step roomier than the Button so chips still read spacious. As on the
        // Button, `default` and `lg` share the type scale and differ by padding
        // only; `sm` steps the text down.
        default:
          'text-base px-[calc(--spacing(4.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:text-sm sm:px-[calc(--spacing(4)-1px)] sm:py-[calc(--spacing(2)-1px)]',
        sm: 'text-sm px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(2)-1px)] sm:text-xs sm:px-[calc(--spacing(3)-1px)] sm:py-[calc(--spacing(1.5)-1px)]',
        lg: 'text-base px-[calc(--spacing(5.5)-1px)] py-[calc(--spacing(3)-1px)] sm:text-sm sm:px-[calc(--spacing(5)-1px)] sm:py-[calc(--spacing(2.5)-1px)]',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'default',
    },
  },
);

type ChipProps = React.ComponentProps<'button'> &
  VariantProps<typeof chipVariants> & { asChild?: boolean };

function Chip({
  className,
  variant,
  size,
  asChild = false,
  type,
  ...props
}: ChipProps) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="chip"
      data-variant={variant ?? 'outline'}
      className={cn(chipVariants({ variant, size }), className)}
      {...(asChild ? {} : { type: type ?? 'button' })}
      {...props}
    />
  );
}

export { Chip, chipVariants };
