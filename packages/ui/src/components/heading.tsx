import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@repo/ui/lib/utils';

/**
 * Heading / Subheading — the dashboard page-title primitives.
 *
 * The API mirrors a typical heading component: `Heading` renders an `<h1>` and
 * `Subheading` an `<h2>` by default, and a `level` prop (1–6) swaps the rendered
 * element for semantics. `Heading` picks a step on the `.heading-*` scale from
 * `level` (1 → `heading-1` / 36px, 2 → `heading-2` / 30px, 3+ → `heading-3` /
 * 24px). `Subheading` always maps to `heading-4` (20px).
 *
 * The `variant` prop swaps only the typeface: `serif` (Cormorant Garamond, the
 * default display face) or `sans` (Inter, matching the body face). It sets a
 * `data-font` attribute that an unlayered rule in `globals.css` keys off to
 * override the family — a Tailwind `font-sans`/`font-serif` utility would lose to
 * the unlayered `.heading-*` family rule, so the attribute hook is the reliable
 * lever. Size, weight, and tracking are unchanged across variants.
 */

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

type HeadingVariant = 'serif' | 'sans';

const HEADING_SCALE: Record<HeadingLevel, string> = {
  1: 'heading-1',
  2: 'heading-2',
  3: 'heading-3',
  4: 'heading-3',
  5: 'heading-3',
  6: 'heading-3',
};

type HeadingProps = Omit<React.ComponentProps<'h1'>, 'children'> & {
  level?: HeadingLevel;
  /** Typeface: `serif` (Cormorant Garamond, default) or `sans` (Inter). */
  variant?: HeadingVariant;
  /**
   * Merge styling onto the child element (Radix `Slot`) instead of rendering
   * the `level`-derived heading tag. Lets call sites control the semantic
   * element (e.g. wrap a page title in `<h1>`) while keeping the foundation
   * face/scale.
   */
  asChild?: boolean;
  children?: React.ReactNode;
};

function Heading({
  className,
  level = 1,
  variant = 'serif',
  asChild = false,
  ...props
}: HeadingProps) {
  const Comp = asChild ? Slot : (`h${level}` as const);

  return (
    <Comp
      data-slot="heading"
      data-font={variant}
      className={cn(
        HEADING_SCALE[level],
        'text-foreground text-balance',
        className,
      )}
      {...props}
    />
  );
}

function Subheading({
  className,
  level = 2,
  variant = 'serif',
  asChild = false,
  ...props
}: HeadingProps) {
  const Comp = asChild ? Slot : (`h${level}` as const);

  return (
    <Comp
      data-slot="subheading"
      data-font={variant}
      className={cn('heading-4 text-foreground text-balance', className)}
      {...props}
    />
  );
}

export { Heading, Subheading };
