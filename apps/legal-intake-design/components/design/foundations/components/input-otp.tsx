'use client';

import * as React from 'react';
import { OTPInput, OTPInputContext } from 'input-otp';
import { Minus } from '@repo/ui/icons';

import { cn } from '@repo/ui/lib/utils';

/**
 * Foundation Input OTP — design-iteration restyle of the shadcn InputOTP whose
 * slots match the foundation Input.
 *
 * The stock shadcn slot uses the neutral `border-input` border with a `ring-ring`
 * focus halo. Here each slot adopts the foundation field tokens instead, matching
 * the foundation Input exactly: a `border-field` border on a `bg-background` fill
 * with the blended `shadow` token (NOT `shadow-sm` — see the foundation Input for
 * why that token reads as no shadow on a light surface); hover darkens the whole
 * field to `border-field-strong`; the active slot replaces the grey border with a
 * uniform 2px primary border on all four sides (so the focus stroke fully takes
 * over the grey, like the Input's 2px primary focus ring) rather than an inset ring
 * that would leave the grey visible outside it; and invalid groups flip to
 * `border-error`.
 *
 * Hover and invalid are driven from the container `group/input-otp` rather than the
 * slot itself: the underlying `input-otp` library renders a single overlay `<input>`
 * (carrying `aria-invalid` / `disabled`) on top of the slots with `pointer-events:
 * all`, so per-slot `:hover` and slot-level `aria-invalid:` never fire — the state
 * lives on that input, and the container is the only shared ancestor.
 *
 * Sizing stays mobile-first like the rest of the foundation inputs: a larger,
 * touch-friendly slot on small screens that collapses to the compact desktop
 * density at the `sm:` breakpoint (640px).
 *
 * Colors come from the theme tokens rather than `dark:` utilities: this repo has
 * no class-based `dark` variant, so `dark:` resolves to `prefers-color-scheme`
 * and would misfire on a dark-OS machine while the app renders light.
 *
 * TODO(@repo/ui): fold this restyle back into
 * `packages/ui/src/components/input-otp.tsx` during productionisation — it swaps
 * the slot onto the foundation field tokens and adds the mobile-first size scale
 * on top of the existing shared InputOTP.
 */
function InputOTP({
  className,
  containerClassName,
  value,
  defaultValue,
  onChange,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
}) {
  // `input-otp` seeds its internal state from `defaultValue` but then also
  // spreads that same `defaultValue` onto the overlay `<input>` it renders —
  // which always carries a `value` — tripping React's "both value and
  // defaultValue" warning. Own the uncontrolled state here so a `defaultValue`
  // is translated into an initial `value` and never reaches that spread.
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    typeof defaultValue === 'string' ? defaultValue : '',
  );
  const resolvedValue = value !== undefined ? value : uncontrolledValue;

  const handleChange = React.useCallback(
    (next: string) => {
      if (!isControlled) {
        setUncontrolledValue(next);
      }
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        'group/input-otp flex items-center gap-2 has-disabled:opacity-50',
        containerClassName,
      )}
      className={cn('disabled:cursor-not-allowed', className)}
      value={resolvedValue}
      onChange={handleChange}
      {...props}
    />
  );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn('flex items-center', className)}
      {...props}
    />
  );
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  index: number;
}) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        // Surface + border: foundation field tokens on a white fill with the
        // blended drop shadow. Adjacent slots share borders; the group rounds
        // its outer corners (literal 0.5rem to match the foundation Input).
        'border-field bg-background text-foreground relative flex items-center justify-center border-y border-r shadow outline-none',
        'first:rounded-l-[0.5rem] first:border-l last:rounded-r-[0.5rem]',
        // Mobile-first sizing: roomy touch target that collapses to the compact
        // desktop slot at the `sm:` breakpoint.
        'h-11 w-11 text-base sm:h-9 sm:w-9 sm:text-sm',
        // Hover: darken the field's borders to `border-field-strong`, just like
        // the Input — driven from the container group (the overlay input intercepts
        // pointer events, so per-slot hover never fires), excluded when the field
        // is disabled or invalid. Scoped to non-active slots (`data-[active=false]`)
        // so it never overrides the active slot's primary border on hover — the
        // hover darkening and the active border both set `border-color`, so without
        // this the higher-specificity hover rule would turn the focused slot grey.
        'group-[&:hover:not(:has(input:disabled)):not(:has(input[aria-invalid=true]))]/input-otp:data-[active=false]:border-field-strong',
        // Active slot: replace the grey field border with a uniform 2px primary
        // border on all four sides. `border-2` overrides the resting
        // `border-y`/`border-r` widths (higher specificity via the data variant),
        // so the primary stroke fully takes over the grey instead of leaving it
        // visible outside an inset ring — matching the Input's 2px primary focus
        // stroke. Border-box keeps the slot size fixed; z-10 lifts it so the
        // border sits on top at the edges shared with its neighbours.
        'data-[active=true]:border-primary data-[active=true]:z-10 data-[active=true]:border-2',
        // Invalid: destructive border, driven from the container group since the
        // `aria-invalid` attribute lives on the overlay input, not the slots.
        'group-has-[input[aria-invalid=true]]/input-otp:border-error',
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
        </div>
      )}
    </div>
  );
}

function InputOTPSeparator({ ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-otp-separator"
      role="separator"
      className="text-muted-foreground"
      {...props}
    >
      <Minus className="size-4" />
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
