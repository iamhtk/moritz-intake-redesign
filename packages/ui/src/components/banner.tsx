import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@repo/ui/lib/utils';

const bannerVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
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
