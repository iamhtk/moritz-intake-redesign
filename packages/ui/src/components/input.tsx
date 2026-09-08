import * as React from 'react';

import { cn } from '@repo/ui/lib/utils';

/**
 * Input — shadcn Input with a layered surface.
 *
 * Mirrors the Button's layered "optical" treatment: the input is wrapped in a
 * `<span data-slot="control">` that hosts two pseudo-elements — a `before` layer
 * painting a `bg-background` fill + drop shadow (so the shadow blends with the
 * border) and an `after` layer drawing the focus ring. The focus ring is an
 * inset 2px ring in the primary (button) color, shown at every breakpoint — the
 * input border itself does not change color on focus. The wrapper is required
 * because `::before`/`::after` don't render on a bare `<input>` (a replaced
 * element). Radius is `rounded-[0.5rem]` and spacing is border-compensated,
 * matching the Button.
 *
 * Colors come from the theme tokens (`--background`, `--primary`) rather than
 * `dark:` utilities: this repo has no class-based `dark` variant.
 *
 * Sizing stays mobile-first (the same `text`/`py` scale as the Button): a
 * larger, touch-friendly target on small screens that collapses to the compact
 * desktop density at the `sm:` breakpoint (640px). `className` applies to the
 * wrapper. To override the `<input>` itself (e.g. inner padding to clear an
 * adornment icon, a height, font, or a highlight border/ring) pass
 * `inputClassName` — those classes are tailwind-merged onto the inner element
 * so they win over the defaults. All other props forward to the `<input>`.
 */
type InputProps = React.ComponentProps<'input'> & {
  inputClassName?: string;
};

function Input({ className, inputClassName, type, ...props }: InputProps) {
  return (
    <span
      data-slot="control"
      className={cn(
        // Radius is the reference's `rounded-lg` (stock Tailwind 0.5rem); our theme's
        // own `rounded-lg` token is 10px, so we pin the literal to match the reference.
        'relative isolate block w-full rounded-[0.5rem]',
        // White fill + blended drop shadow (before is inset 1px, so its radius is 1px
        // smaller). Use the `shadow` token, NOT `shadow-sm`: the design reference is
        // Tailwind v4, whose `shadow-sm` is `0 1px 3px /0.1, 0 1px 2px -1px /0.1`. In
        // this repo's (v3-era) scale that value lives on the `shadow` token, while our
        // `shadow-sm` is the much fainter `0 1px 2px /0.05` that reads as no shadow at
        // all on a light surface. So `before:shadow` is what actually matches it.
        'before:bg-background before:absolute before:inset-px before:-z-10 before:rounded-[calc(0.5rem_-_1px)] before:shadow',
        // Focus ring — inset, 2px, primary (button) color, shown at every breakpoint.
        'focus-within:after:ring-primary after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:ring-inset after:ring-transparent focus-within:after:ring-2',
        // Hover: darken the border (neutral). Driven by the WRAPPER's `:hover` rather
        // than the input's own, because the HTML spec treats a control as `:hover`
        // whenever its `<label htmlFor>` is hovered — so an input-level `:hover` would
        // misfire on label hover. `aria-invalid` fields keep their destructive border
        // on hover.
        '[&:hover>input:not(:disabled):not([aria-invalid=true])]:border-field-strong',
        // Disabled: dim + flatten the shadow (input keeps the not-allowed cursor)
        'has-[input:disabled]:before:bg-muted has-[input:disabled]:opacity-50 has-[input:disabled]:before:shadow-none',
        className,
      )}
    >
      <input
        type={type}
        data-slot="input"
        className={cn(
          'border-field relative block w-full appearance-none rounded-[0.5rem] border bg-transparent',
          'px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:px-[calc(--spacing(3)-1px)] sm:py-[calc(--spacing(1.5)-1px)]',
          'text-foreground placeholder:text-field-placeholder selection:bg-accent selection:text-accent-foreground text-base sm:text-sm',
          'outline-none focus:outline-none disabled:cursor-not-allowed',
          'file:text-foreground file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium sm:file:h-7',
          'aria-invalid:border-error',
          inputClassName,
        )}
        {...props}
      />
    </span>
  );
}

export { Input };
