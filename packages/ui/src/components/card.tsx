import * as React from 'react';

import { cn } from '@repo/ui/lib/utils';

/**
 * Card — the surface used across the app (panels, settings sections, the
 * "Danger zone", etc.).
 *
 * Gives the surface a refined treatment on the foundation palette: a
 * generous `rounded-2xl` radius, a roomier gutter, and the same subtle drop
 * shadow as the foundation Input/Textarea — the `shadow` token (NOT the
 * near-invisible `shadow-sm`, which in this repo's scale is `0 1px 2px/0.05`).
 * The fields blend that shadow under their border via an inset `before` pseudo,
 * but that trick only works when a separate element occludes the pseudo's inner
 * edge; on a container it paints a second contour just inside the border (a
 * visible "double border"), so here we apply the `shadow` token directly to the
 * card element instead. Colors come straight from the foundation tokens:
 * `border-field` (Gray 40) for the resting border, `bg-card` (white) for the
 * fill, and `text-card-foreground` (Gray 190) for text. We keep the `border`
 * utility (rather than a `ring-1`) so the `[.border-b]`/`[.border-t]`
 * divider hooks and the `border-destructive/50` override still work, and a
 * transparent footer (rather than a baked-in `bg-muted/50`). No `dark:`
 * variants — the app has no class-based dark mode. On top of that it adds the
 * documented shadcn capabilities:
 *
 * - `size` ("default" | "sm") — sets `data-size` and the `group/card` hook so
 *   the spacing collapses and propagates to the header / content / footer
 *   padding (and the title size) via `group-data-[size=sm]/card:*`.
 * - Media support — an `<img>` as the first/last child sits flush to the edge
 *   (`has-[>img:first-child]:pt-0`) with corner rounding matched to the border's
 *   *inner* radius (`calc(1rem - 1px)`) so it stays concentric with the 1px
 *   border. We round the image itself rather than clipping the whole card with
 *   `overflow-hidden`, so popovers/menus rendered inside a card aren't clipped.
 *
 * Parts mirror shadcn 1:1 (Card, CardHeader, CardTitle, CardDescription,
 * CardAction, CardContent, CardFooter) with the same `data-slot` hooks, so it's
 * a drop-in.
 */
function Card({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<'div'> & { size?: 'default' | 'sm' }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        // Same subtle drop shadow as the foundation fields — the `shadow` token,
        // applied directly (the fields' inset-`before` trick would paint a second
        // contour inside the border on a container). Foundation colors throughout:
        // `border-field` (Gray 40), `bg-card` (white), `text-card-foreground`.
        'group/card bg-card text-card-foreground border-field flex flex-col gap-7 rounded-2xl border py-7 shadow',
        'data-[size=sm]:gap-5 data-[size=sm]:py-5',
        // Media: a leading/trailing <img> sits flush against the edge with the
        // card's own corner radius.
        'has-[>img:first-child]:pt-0 has-[>img:last-child]:pb-0',
        // Match the border's *inner* radius (outer 2xl = 1rem, minus the 1px
        // border) so the image corners sit concentric with the border instead
        // of revealing a sliver of the card at the top/bottom edges.
        '*:[img:first-child]:rounded-t-[calc(1rem-1px)] *:[img:last-child]:rounded-b-[calc(1rem-1px)]',
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-7 grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-7',
        'group-data-[size=sm]/card:[.border-b]:pb-5 group-data-[size=sm]/card:gap-1 group-data-[size=sm]/card:px-5',
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        'text-balance font-semibold leading-none group-data-[size=sm]/card:text-sm',
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-7 group-data-[size=sm]/card:px-5', className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        '[.border-t]:pt-7 flex items-center px-7',
        'group-data-[size=sm]/card:[.border-t]:pt-5 group-data-[size=sm]/card:px-5',
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
