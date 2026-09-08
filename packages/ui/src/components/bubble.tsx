'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@repo/ui/lib/utils';

/**
 * Bubble — the framed conversational surface for chat text, short structured
 * output, quoted replies, suggestions, and reactions. Scoped to the bubble
 * surface only — avatars, names, timestamps, and message-level actions belong
 * on the surrounding message layout. Promoted from the design playground's
 * foundation Bubble (its `TODO(@repo/ui)`).
 *
 * Built on the shadcn foundation pattern (`cva` + `Slot`/`asChild` + `data-slot`).
 * The root owns `align` (and removes the max-width for `ghost`) and shares
 * `variant`/`align` with the parts via a small context so `BubbleContent` can
 * colour the surface and round the near corner, and `BubbleReactions` can anchor
 * to the correct edge.
 *
 * A bubble sizes to its content up to 80% of the container width; the `ghost`
 * variant removes the max-width so assistant text and rich content can span the
 * full row. Reactions overlap the bubble edge, so leave vertical space (a larger
 * `gap`) between rows.
 *
 * No `dark:` variants — the app has no class-based dark mode.
 */

type BubbleVariant =
  | 'default'
  | 'secondary'
  | 'muted'
  | 'tinted'
  | 'outline'
  | 'ghost'
  | 'destructive';
type BubbleAlign = 'start' | 'end';

type BubbleContextValue = {
  variant: BubbleVariant;
  align: BubbleAlign;
};

const BubbleContext = React.createContext<BubbleContextValue | null>(null);

function useBubbleContext() {
  const context = React.useContext(BubbleContext);

  if (!context) {
    throw new Error('Bubble parts must be used within a <Bubble>.');
  }

  return context;
}

const bubbleVariants = cva('relative flex w-fit max-w-[80%] flex-col', {
  variants: {
    align: {
      start: 'me-auto items-start',
      end: 'ms-auto items-end',
    },
    variant: {
      default: '',
      secondary: '',
      muted: '',
      tinted: '',
      outline: '',
      ghost: 'w-full max-w-full',
      destructive: '',
    },
  },
  defaultVariants: {
    align: 'start',
    variant: 'default',
  },
});

type BubbleProps = React.ComponentProps<'div'> &
  VariantProps<typeof bubbleVariants>;

function Bubble({
  className,
  variant = 'default',
  align = 'start',
  ...props
}: BubbleProps) {
  const context = React.useMemo<BubbleContextValue>(
    () => ({ variant: variant ?? 'default', align: align ?? 'start' }),
    [variant, align],
  );

  return (
    <BubbleContext.Provider value={context}>
      <div
        data-slot="bubble"
        data-variant={context.variant}
        data-align={context.align}
        className={cn(bubbleVariants({ variant, align }), className)}
        {...props}
      />
    </BubbleContext.Provider>
  );
}

const bubbleContentVariants = cva(
  'w-fit max-w-full overflow-hidden rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words outline-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        muted: 'bg-muted text-foreground',
        tinted: 'bg-primary/10 text-foreground',
        outline: 'border border-border bg-background text-foreground',
        ghost:
          'w-full overflow-visible bg-transparent px-0 py-0 text-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
      },
      align: {
        start: 'rounded-tl-sm',
        end: 'rounded-tr-sm',
      },
      interactive: {
        true: 'cursor-pointer text-left transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
        false: '',
      },
    },
    compoundVariants: [
      // The ghost surface has no frame, so it keeps square corners.
      { variant: 'ghost', align: 'start', className: 'rounded-tl-2xl' },
      { variant: 'ghost', align: 'end', className: 'rounded-tr-2xl' },
    ],
    defaultVariants: {
      variant: 'default',
      align: 'start',
      interactive: false,
    },
  },
);

type BubbleContentProps = React.ComponentProps<'div'> & {
  asChild?: boolean;
};

function BubbleContent({
  className,
  asChild = false,
  ...props
}: BubbleContentProps) {
  const { variant, align } = useBubbleContext();
  const Comp = asChild ? Slot : 'div';

  return (
    <Comp
      data-slot="bubble-content"
      className={cn(
        bubbleContentVariants({ variant, align, interactive: asChild }),
        className,
      )}
      {...props}
    />
  );
}

const bubbleReactionsVariants = cva(
  'absolute z-10 flex items-center gap-1 rounded-full border bg-background px-1.5 py-0.5 text-xs shadow-sm',
  {
    variants: {
      side: {
        top: 'top-0 -translate-y-1/2',
        bottom: 'bottom-0 translate-y-1/2',
      },
      align: {
        start: 'start-2',
        end: 'end-2',
      },
    },
    defaultVariants: {
      side: 'bottom',
      align: 'end',
    },
  },
);

type BubbleReactionsProps = React.ComponentProps<'div'> &
  VariantProps<typeof bubbleReactionsVariants>;

function BubbleReactions({
  className,
  side = 'bottom',
  align = 'end',
  ...props
}: BubbleReactionsProps) {
  return (
    <div
      data-slot="bubble-reactions"
      className={cn(bubbleReactionsVariants({ side, align }), className)}
      {...props}
    />
  );
}

function BubbleGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="bubble-group"
      className={cn('flex flex-col gap-1', className)}
      {...props}
    />
  );
}

export {
  Bubble,
  BubbleContent,
  BubbleReactions,
  BubbleGroup,
  bubbleVariants,
  bubbleContentVariants,
};
