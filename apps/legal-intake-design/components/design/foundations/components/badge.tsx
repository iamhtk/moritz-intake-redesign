import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@repo/ui/lib/utils';

/**
 * Foundation Badge — design-iteration copy of the shared shadcn Badge, restyled
 * to a soft tinted-pill look while keeping the shadcn foundation (cva +
 * Slot/asChild + `data-slot`).
 *
 * Treatment (mapping our semantic variants onto Tailwind palette colors):
 * - Surface — a translucent wash (`bg-{color}-500/15`-ish) instead of a solid
 *   fill, so badges read as soft pills. No border on the tinted variants; only
 *   `outline` keeps a hairline stroke.
 * - Text — a deepened palette label (`text-{color}-700`) for legible contrast
 *   on the wash.
 * - Hover — deepens the wash toward `/25` for both interaction modes:
 *   `[a&]:hover:*` for `asChild` links, and `group-hover:*` for the
 *   `BadgeButton` wrapper below.
 * - Variant -> color: `default`/`secondary`/`outline` -> zinc,
 *   `destructive` -> red, `success` -> green, `warning` -> amber, `info` -> sky,
 *   `accent` -> blue.
 *
 * Light-only — no `dark:` rules, since the app has no class-based dark mode.
 *
 * `asChild` swaps the wrapper for a Slot so a badge can render as a link
 * (`<Badge asChild><a … /></Badge>`); for a focusable button/link with a focus
 * ring, use `BadgeButton`.
 *
 * TODO(@repo/ui): fold this treatment back into
 * `packages/ui/src/components/badge.tsx` during productionisation.
 */
const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-x-1.5 overflow-hidden rounded-md font-medium whitespace-nowrap forced-colors:outline transition-colors focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      size: {
        default: 'px-1.5 py-0.5 text-sm/5 sm:text-xs/5',
        /**
         * For badges that sit inline with 14px content — a data grid cell, say —
         * where the default pill reads as undersized next to the text around it.
         * Sits just under body size at a regular weight so the label reads as
         * quietly as the plain-text cells beside it; the pill still keeps
         * `default`'s padding and 20px line box, so it grows with the label
         * rather than turning into a chunky block.
         */
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
        /**
         * For labels that classify rather than report state — a taxonomy chip.
         * Carries a hue so it doesn't disappear into the greys of a table, but
         * stays clear of the red / amber / green a status badge owns, so it is
         * never read as good or bad news.
         */
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
 * `.group` carrying the focus ring, so the inner Badge's `group-hover:*` rules
 * darken on hover. Built on plain elements (no Headless UI / TouchTarget / next
 * Link) to stay consistent with the rest of the foundation library.
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
