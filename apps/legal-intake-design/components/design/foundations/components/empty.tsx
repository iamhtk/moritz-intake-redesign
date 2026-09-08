import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@repo/ui/lib/utils';

/**
 * Foundation Empty — design-iteration port of shadcn's `Empty`. A centered
 * empty-state block with an optional media slot, title, description, and
 * actions — used here as the placeholder for a Message Scroller with no
 * messages yet.
 *
 * Composition: Empty > EmptyHeader > (EmptyMedia, EmptyTitle, EmptyDescription),
 * with an optional EmptyContent for actions below. `EmptyMedia` frames the glyph
 * either in a muted rounded box (`icon`) or in the hairline ring the onboarding
 * and intake screens use (`ring`).
 *
 * No `dark:` variants — the app has no class-based dark mode.
 *
 * TODO(@repo/ui): fold this primitive into `packages/ui` during
 * productionisation so production code can consume it directly.
 */
function Empty({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty"
      className={cn(
        'flex w-full flex-col items-center justify-center gap-6 text-balance p-6 text-center',
        className,
      )}
      {...props}
    />
  );
}

function EmptyHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-header"
      className={cn(
        'flex max-w-sm flex-col items-center gap-2 text-center',
        className,
      )}
      {...props}
    />
  );
}

const emptyMediaVariants = cva('flex shrink-0 items-center justify-center', {
  variants: {
    variant: {
      default: '',
      icon: 'mb-1 size-10 rounded-lg bg-muted text-foreground [&>svg]:size-5',
      /**
       * The onboarding and intake hero treatment: a hairline ring around a
       * drawn glyph, monochrome to match the app's editorial screens. Use it
       * where the empty state is the whole view rather than a slot inside one.
       */
      ring: 'border-border text-foreground mb-1 size-12 rounded-full border [&>svg]:size-5',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

function EmptyMedia({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-media"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant }), className)}
      {...props}
    />
  );
}

function EmptyTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-title"
      className={cn('text-lg font-medium tracking-tight', className)}
      {...props}
    />
  );
}

function EmptyDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="empty-description"
      className={cn('text-muted-foreground text-sm/relaxed', className)}
      {...props}
    />
  );
}

function EmptyContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        'flex w-full max-w-sm flex-col items-center gap-2 text-sm',
        className,
      )}
      {...props}
    />
  );
}

export {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  emptyMediaVariants,
};
