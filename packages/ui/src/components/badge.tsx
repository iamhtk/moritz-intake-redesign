import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@repo/ui/lib/utils';

/**
 * Badge — soft tinted-pill treatment. Variants render as a translucent wash
 * with a deepened palette label rather than a solid fill; only `outline`
 * carries a stroke. Promoted from the design playground's foundation Badge
 * (its `TODO(@repo/ui)`).
 *
 * - Hover deepens the wash for both interaction modes: `[a&]:hover:*` for
 *   `asChild` links, `group-hover:*` for the `BadgeButton` wrapper below.
 * - `accent` is for labels that classify rather than report state — a
 *   taxonomy chip. It carries a hue so it doesn't disappear into a table's
 *   greys, but stays clear of the red / amber / green a status badge owns.
 * - `size="lg"` is for badges inline with 14px content (a data grid cell)
 *   where the default pill reads as undersized: just under body size at a
 *   regular weight, same padding and 20px line box.
 */
const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-x-1.5 overflow-hidden rounded-md font-medium whitespace-nowrap forced-colors:outline transition-colors focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      size: {
        default: 'px-1.5 py-0.5 text-sm/5 sm:text-xs/5',
        lg: 'px-1.5 py-0.5 text-[0.8125rem]/5 font-normal',
      },
      variant: {
        default:
          'bg-zinc-600/10 text-zinc-700 [a&]:hover:bg-zinc-600/20 group-hover:bg-zinc-600/20',
        secondary:
          'bg-zinc-500/10 text-zinc-600 [a&]:hover:bg-zinc-500/20 group-hover:bg-zinc-500/20',
        destructive:
          'bg-red-500/15 text-red-700 [a&]:hover:bg-red-500/25 group-hover:bg-red-500/25',
        success:
          'bg-green-500/15 text-green-700 [a&]:hover:bg-green-500/25 group-hover:bg-green-500/25',
        warning:
          'bg-amber-400/20 text-amber-700 [a&]:hover:bg-amber-400/30 group-hover:bg-amber-400/30',
        info: 'bg-sky-500/15 text-sky-700 [a&]:hover:bg-sky-500/25 group-hover:bg-sky-500/25',
        accent:
          'bg-blue-500/10 text-blue-700 [a&]:hover:bg-blue-500/20 group-hover:bg-blue-500/20',
        outline:
          'border border-field text-zinc-700 [a&]:hover:bg-zinc-600/5 group-hover:bg-zinc-600/5',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant ?? 'default'}
      data-size={size ?? 'default'}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

/**
 * BadgeButton — a focusable badge for clickable / link use. Renders a
 * `<button>` by default, or an `<a>` when `href` is set. The wrapper is a
 * `.group` carrying the focus ring, so the inner Badge's `group-hover:*`
 * rules darken on hover.
 */
type BadgeButtonProps = VariantProps<typeof badgeVariants> & {
  className?: string;
  children: React.ReactNode;
} & (
    | ({ href?: undefined } & React.ComponentPropsWithoutRef<'button'>)
    | ({ href: string } & React.ComponentPropsWithoutRef<'a'>)
  );

function BadgeButton({
  variant,
  size,
  className,
  children,
  ...props
}: BadgeButtonProps) {
  const classes = cn(
    'group relative inline-flex cursor-pointer rounded-md outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]',
    className,
  );

  if (typeof props.href === 'string') {
    return (
      <a data-slot="badge-button" className={classes} {...props}>
        <Badge variant={variant} size={size}>
          {children}
        </Badge>
      </a>
    );
  }

  return (
    <button
      type="button"
      data-slot="badge-button"
      className={classes}
      {...props}
    >
      <Badge variant={variant} size={size}>
        {children}
      </Badge>
    </button>
  );
}

export { Badge, BadgeButton, badgeVariants };
