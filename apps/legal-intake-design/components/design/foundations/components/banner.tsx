import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@repo/ui/lib/utils';

/**
 * Foundation Banner — design-iteration inline callout, built on the shared
 * shadcn Alert. This is the inline status callout/banner (`role="alert"`), NOT
 * the modal confirmation (that's the foundation Alert). Brought into the
 * playground so the status callouts used across the app can be refined in one
 * place.
 *
 * Faithful port of `@repo/ui/components/alert` — the same Title/Description grid
 * (icon auto-sizes a leading column via `has-[>svg]`), `role="alert"`, and the
 * `data-slot` hooks — with one additive variant (`warning`, on the foundation
 * `--warning` token) so it covers the full status spectrum (default,
 * destructive, warning, success). Colors come straight from the foundation
 * tokens; the surface stays flat (no shadow) since a callout sits inline in the
 * page rather than floating like the Card.
 *
 * TODO(@repo/ui): fold the `warning` variant back into the shared Alert during
 * productionisation.
 */
const bannerVariants = cva(
  'relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        destructive:
          'text-destructive bg-card [&>svg]:text-current *:data-[slot=banner-description]:text-destructive/90',
        warning:
          'text-warning bg-card [&>svg]:text-current *:data-[slot=banner-description]:text-warning/90',
        success:
          'text-success bg-card [&>svg]:text-current *:data-[slot=banner-description]:text-success/90',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Banner({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof bannerVariants>) {
  return (
    <div
      data-slot="banner"
      role="alert"
      className={cn(bannerVariants({ variant }), className)}
      {...props}
    />
  );
}

function BannerTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="banner-title"
      className={cn(
        'col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight',
        className,
      )}
      {...props}
    />
  );
}

function BannerDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="banner-description"
      className={cn(
        'text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed',
        className,
      )}
      {...props}
    />
  );
}

export { Banner, BannerTitle, BannerDescription };
