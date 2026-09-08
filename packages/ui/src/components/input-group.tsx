import * as React from 'react';

import { cn } from '@repo/ui/lib/utils';

/**
 * Foundation Input Group — design-iteration port of the shadcn Input Group.
 *
 * Lets you place icons, text, or other decorations on either edge of an input
 * while keeping a single bordered field. The group carries the same layered
 * surface as the foundation Input — `before` paints a `bg-background` fill +
 * `shadow-sm` and `after` draws the inset 2px focus ring (primary color, shown
 * at every breakpoint) — plus the matching radius and border-compensated padding.
 * The inner `InputGroupInput` is borderless and transparent so the whole row
 * reads as one control. Colors come from theme tokens, not `dark:` utilities
 * (see input.tsx for why).
 *
 * Compose with `InputGroupAddon align="inline-start|inline-end"` for edge
 * decorations and `InputGroupText` for inline prefixes/suffixes (e.g. `https://`).
 *
 * TODO(@repo/ui): fold this back into `packages/ui/src/components/` (alongside
 * input.tsx) during productionisation.
 */
function InputGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        'border-field relative isolate flex w-full min-w-0 items-center gap-2 rounded-[0.5rem] border bg-transparent text-base',
        // Mobile-first size: the group's own padding drives height so it tracks
        // the standalone Input at both breakpoints (no fixed h-*).
        'px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:px-[calc(--spacing(3)-1px)] sm:py-[calc(--spacing(1.5)-1px)] sm:text-sm',
        // Hover: darken the border with a neutral tone (matching the reference's
        // `zinc-950/20` and the standalone Input). A neutral darken blends with the
        // inset `before` shadow so they read as one stroke; a colored ring would look
        // like a second, mismatched stroke. Gated on the inner input being enabled
        // (the group is a div, so it has no `:disabled` of its own).
        'has-[input:enabled]:hover:border-field-strong',
        // White fill + blended drop shadow. The border lives on THIS element, so the
        // `before` containing block is the padding box (already inside the border) —
        // hence `inset-0` (not `inset-px`), which would leave a 1px gap/line between the
        // border and the fill. The 7px radius matches the inner (padding-box) corner.
        // `shadow-sm` (not `shadow`) matches the reference exactly: this repo's
        // `shadow-sm` token is `0 1px 2px / 0.05`, identical to stock Tailwind
        // `shadow-sm`. It's intentionally subtle so it blends into the
        // border; the heavier `shadow` (10%, 3px blur) bleeds past the fill and shows
        // through the translucent `foreground/20` hover border as a second inner stroke.
        'before:bg-background before:absolute before:inset-0 before:-z-10 before:rounded-[calc(0.5rem_-_1px)] before:shadow-sm',
        // Focus ring — inset, 2px, primary (button) color. We drop the reference's
        // `sm:` gate so the focus stroke shows at every breakpoint (incl. phones).
        // Unlike the `before` fill (which stays inside the border at `inset-0` =
        // padding box), the ring extends to the border-box edge with `-inset-px` so
        // the 2px stroke overlays the 1px border — a single clean stroke matching the
        // standalone Input (whose ring sits on a borderless wrapper over the input).
        // At plain `inset-0` the ring would sit 1px inside the still-visible border,
        // reading as a second, mismatched stroke.
        'focus-within:after:ring-primary after:pointer-events-none after:absolute after:-inset-px after:rounded-[inherit] after:ring-inset after:ring-transparent focus-within:after:ring-2',
        // Disabled: dim + flatten the shadow (input keeps the not-allowed cursor)
        'has-[input:disabled]:before:bg-muted has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50 has-[input:disabled]:before:shadow-none',
        // Invalid: destructive border (the focus ring stays the accent color, like the reference)
        'has-[input[aria-invalid=true]]:border-error',
        className,
      )}
      {...props}
    />
  );
}

function InputGroupInput({
  className,
  type,
  ...props
}: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input-group-input"
      className={cn(
        // No vertical padding here — the group's padding drives the height; the
        // input inherits the group's font-size/line-height.
        'placeholder:text-field-placeholder selection:bg-primary selection:text-primary-foreground flex-1 bg-transparent text-inherit outline-none disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  );
}

function InputGroupAddon({
  className,
  align = 'inline-start',
  ...props
}: React.ComponentProps<'div'> & {
  align?: 'inline-start' | 'inline-end';
}) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(
        // Icons scale with the field: larger on mobile, compact at sm: (matches
        // the foundation Button's icon scale).
        'text-muted-foreground flex shrink-0 items-center gap-2 [&_svg:not([class*="size-"])]:size-5 sm:[&_svg:not([class*="size-"])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0',
        align === 'inline-end' && 'order-last',
        className,
      )}
      {...props}
    />
  );
}

function InputGroupText({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="input-group-text"
      className={cn(
        'text-muted-foreground shrink-0 text-base sm:text-sm',
        className,
      )}
      {...props}
    />
  );
}

export { InputGroup, InputGroupInput, InputGroupAddon, InputGroupText };
