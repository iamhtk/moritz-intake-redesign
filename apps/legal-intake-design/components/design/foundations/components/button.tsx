'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { Loader2 } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

/**
 * Foundation Button — design-iteration superset of the shared shadcn Button.
 *
 * Keeps the shadcn foundation (cva + Slot/asChild + data-slot + design tokens),
 * with a layered "optical border" treatment: the element paints the border
 * color behind a 1px transparent border, a `before` pseudo renders the real
 * fill with a drop shadow, and an `after` pseudo adds the inner top highlight +
 * hover overlay. Plus the reference's `0.5rem` radius (matching the foundation
 * Input), border-compensated spacing, `font-semibold`, and outline-based focus.
 *
 * NOTE on the focus ring, because T34 found three places that had copied this
 * pattern and dropped one class from it. `outline-none` sets `outline-style:
 * none`; `focus-visible:outline-2` sets only a WIDTH. Without
 * `focus-visible:outline-solid` to restore the style, the outline never
 * renders and the control is a focus stop a keyboard user cannot see. Every
 * ring hand-rolled outside this file needs all three.
 * Colors stay mapped to our design tokens.
 *
 * Size scale is mobile-first: each size's base classes are the larger
 * (touch-friendly) values, collapsing to the compact desktop padding at `sm:`.
 *
 * Icon spacing follows the shadcn convention — pass an icon as a child with
 * `data-icon="inline-start"` or `data-icon="inline-end"` for correct edge
 * spacing.
 *
 * `isPending` provides a standardized loading state: it disables the button
 * and renders a leading spinner (skipped when `asChild`, since Slot expects a
 * single child). Sizes scale `sm → 2xl`, with `xl`/`2xl` for large CTAs.
 *
 * TODO(@repo/ui): fold this back into `packages/ui/src/components/button.tsx`
 * during productionisation — it adds the layered visual treatment, the
 * mobile-first responsive size scale-up, and the icon-only size scale on top of
 * the existing shared Button.
 */

// Layered "optical border" treatment shared by the solid variants. Each solid
// variant only needs to declare its `--btn-bg` fill + text color; the border
// and hover overlay are derived from the fill.
const solidLayers = [
  // Optical border: the element background is the border color, revealed as a
  // 1px ring under the transparent border once the `before` fill is inset.
  'border-transparent bg-(--btn-border)',
  '[--btn-border:color-mix(in_oklab,var(--btn-bg),var(--mz-black)_12%)]',
  '[--btn-hover-overlay:color-mix(in_oklab,var(--mz-white)_10%,transparent)]',
  // Fill layer + drop shadow. The radius inherits the button's own radius so the
  // layers track both the default `rounded-[0.5rem]` and the `rounded-full` pill
  // overrides (a hardcoded radius here would leave the optical border bleeding at
  // the corners of pill buttons). `shadow-sm` matches the reference exactly: this
  // repo's `shadow-sm` token is `0 1px 2px / 0.05`, identical to the stock Tailwind
  // `shadow-sm` — a subtle shadow that blends with the optical border.
  'before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-(--btn-bg) before:shadow-sm',
  // Inner top highlight + hover overlay.
  'after:absolute after:inset-0 after:-z-10 after:rounded-[inherit] after:shadow-[inset_0_1px_color-mix(in_oklab,var(--mz-white)_15%,transparent)]',
  'not-disabled:hover:after:bg-(--btn-hover-overlay)',
  // Disabled drops the shadows so the button reads as flat/inactive.
  'disabled:before:shadow-none disabled:after:shadow-none',
].join(' ');

const buttonVariants = cva(
  // Disabled handling: a natively-disabled <button> still fires `pointerdown` in
  // Chromium (only `click`/keydown are suppressed), so a disabled trigger composed
  // via Radix `asChild` (which opens on pointerdown) would still open. Rather than
  // `disabled:pointer-events-none` — which would also suppress the `not-allowed`
  // cursor — we keep pointer events on, show `disabled:cursor-not-allowed`, and
  // stop the stray `pointerdown` in the capture handler below.
  // Radius is the reference's `rounded-lg` (stock Tailwind 0.5rem); our theme's own
  // `rounded-lg` token is 10px, so we pin the literal 0.5rem to stay consistent with
  // the foundation Input.
  "relative isolate inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[0.5rem] border border-transparent font-semibold transition-all shrink-0 cursor-pointer outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg[data-icon=inline-start]]:-ms-0.5 [&_svg[data-icon=inline-end]]:-me-0.5",
  {
    variants: {
      variant: {
        default: `${solidLayers} [--btn-bg:var(--primary)] text-primary-foreground`,
        secondary: `${solidLayers} [--btn-bg:var(--secondary)] text-secondary-foreground`,
        destructive: `${solidLayers} [--btn-bg:var(--destructive)] text-destructive-foreground`,
        outline:
          'border-border bg-transparent text-foreground not-disabled:hover:bg-foreground/5',
        ghost: 'text-foreground not-disabled:hover:bg-foreground/5',
        link: 'text-primary underline-offset-4 not-disabled:hover:underline',
      },
      size: {
        // base = mobile (larger touch target); sm: = desktop (compact)
        sm: 'text-sm px-[calc(--spacing(3)-1px)] py-[calc(--spacing(2)-1px)] sm:px-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(1)-1px)]',
        default:
          'text-base px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:text-sm sm:px-[calc(--spacing(3)-1px)] sm:py-[calc(--spacing(1.5)-1px)]',
        lg: 'text-base px-[calc(--spacing(4)-1px)] py-[calc(--spacing(3)-1px)] sm:text-sm sm:px-[calc(--spacing(3.5)-1px)] sm:py-[calc(--spacing(2.5)-1px)]',
        // larger CTA sizes
        xl: 'text-lg px-[calc(--spacing(5)-1px)] py-[calc(--spacing(3.5)-1px)] sm:text-base sm:px-[calc(--spacing(4.5)-1px)] sm:py-[calc(--spacing(3)-1px)]',
        '2xl':
          'text-xl px-[calc(--spacing(6)-1px)] py-[calc(--spacing(4)-1px)] sm:text-lg sm:px-[calc(--spacing(5)-1px)] sm:py-[calc(--spacing(3.5)-1px)]',
        // icon-only sizes; pair with `rounded-full` for circular buttons
        'icon-sm': 'size-8',
        icon: 'size-9',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  isPending = false,
  disabled,
  children,
  onPointerDownCapture,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    isPending?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';
  const showSpinner = isPending && !asChild;
  const isDisabled = disabled || isPending;

  return (
    <Comp
      data-slot="button"
      aria-busy={isPending || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      onPointerDownCapture={(event: React.PointerEvent<HTMLButtonElement>) => {
        // The native `disabled` attribute blocks `click`/keydown but not
        // `pointerdown`, which a Radix `asChild` trigger uses to open. Swallow it
        // here so a disabled trigger stays closed while the button keeps pointer
        // events on (and therefore its `not-allowed` cursor).
        if (isDisabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        onPointerDownCapture?.(event);
      }}
      {...(asChild ? {} : { disabled: isDisabled })}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {showSpinner ? (
            <Loader2
              data-icon="inline-start"
              aria-hidden="true"
              className="animate-spin"
            />
          ) : null}
          {children}
        </>
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
