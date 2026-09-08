'use client';

import * as React from 'react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';

import { cn } from '@repo/ui/lib/utils';

/**
 * Foundation Checkbox — design-iteration checkbox built on Radix's Checkbox
 * primitive (shadcn logic) and our design tokens. A small rounded box that fills
 * with the `primary` accent when checked, with checked, indeterminate, disabled,
 * and invalid states.
 *
 * A layered "optical" box: a `before` pseudo paints the `bg-background` fill +
 * blended `shadow-sm` (flipping to the `primary` accent when checked) and an
 * `after` pseudo draws a subtle inset top highlight, all inside a thin
 * `border-field` stroke that darkens on hover and goes `primary` when checked.
 * The indicator is an inline SVG: a checkmark that swaps to a horizontal dash in
 * the indeterminate state, toggled purely on the Root group's `data-state`.
 * Colors come from our design tokens (`border-field`, `border-field-strong`,
 * `bg-background`, `primary`, `primary-foreground`, `error`) with no `dark:`
 * utilities (this app has no class-based dark variant).
 *
 * Handover to @repo/ui: this is a drop-in replacement for
 * `packages/ui/src/components/checkbox.tsx` — same `Checkbox` export and
 * `React.ComponentProps<typeof CheckboxPrimitive.Root>` props, so no call sites
 * change. To lift it: copy the Root className + Indicator over, and change the
 * import `import { Checkbox as CheckboxPrimitive } from 'radix-ui'` to
 * `import * as CheckboxPrimitive from '@radix-ui/react-checkbox'` (same
 * `.Root`/`.Indicator` API, matching the package's convention). Additive vs the
 * current @repo/ui checkbox: the indeterminate-dash indicator and the layered
 * box styling. Every token used (`border-field`, `border-field-strong`,
 * `bg-background`, `primary`, `primary-foreground`, `error`) already exists in
 * @repo/ui's globals.css.
 */
function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // Basic layout: a centered box, slightly larger on mobile (size-4.5
        // sm:size-4) with a 5px radius.
        'size-4.5 group peer relative isolate flex shrink-0 items-center justify-center rounded-[0.3125rem] text-current outline-none sm:size-4',
        // Fill + blended shadow on a `before` layer so the shadow reads as part
        // of the border in the resting state; flips to the primary accent when
        // checked/indeterminate.
        'before:bg-background before:absolute before:inset-0 before:-z-10 before:rounded-[calc(0.3125rem-1px)] before:shadow-sm',
        'data-[state=checked]:before:bg-primary data-[state=indeterminate]:before:bg-primary',
        // Inner top highlight (white/15 inset) for a touch of depth.
        'after:pointer-events-none after:absolute after:inset-0 after:rounded-[calc(0.3125rem-1px)] after:shadow-[inset_0_1px_rgb(255_255_255/0.15)]',
        // Border: resting field stroke, neutral darken on hover (border-field ->
        // border-field-strong), primary when checked. The hover darken is gated
        // to the unchecked state so the accent box keeps a clean edge on hover
        // (no contrasting ring).
        'border-field border',
        'data-[state=unchecked]:enabled:hover:border-field-strong enabled:cursor-pointer',
        'data-[state=checked]:border-primary data-[state=indeterminate]:border-primary',
        // Check color drives `stroke-current` on the indicator SVG.
        'data-[state=checked]:text-primary-foreground data-[state=indeterminate]:text-primary-foreground',
        // Focus ring: offset primary outline. `outline-solid` is required because
        // the resting `outline-none` above sets `--tw-outline-style: none`, which
        // the width utility would otherwise inherit and paint nothing.
        'focus-visible:outline-primary focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2',
        // Invalid + disabled.
        'aria-invalid:border-error',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center"
      >
        <svg
          className="size-4 stroke-current sm:size-3.5"
          viewBox="0 0 14 14"
          fill="none"
        >
          {/* Checkmark — hidden while indeterminate */}
          <path
            className="group-data-[state=indeterminate]:opacity-0"
            d="M3 8L6 11L11 3.5"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Indeterminate dash — shown only while indeterminate */}
          <path
            className="opacity-0 group-data-[state=indeterminate]:opacity-100"
            d="M3 7H11"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
