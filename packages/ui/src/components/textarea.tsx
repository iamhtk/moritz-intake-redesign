import * as React from 'react';

import { cn } from '@repo/ui/lib/utils';

/**
 * Textarea — shadcn Textarea with a layered surface.
 *
 * Mirrors the Input's layered "optical" treatment: the textarea is wrapped in a
 * `<span data-slot="control">` that hosts two pseudo-elements — a `before` layer
 * painting a `bg-background` fill + drop shadow (so the shadow blends with the
 * border) and an `after` layer drawing the focus ring. The focus ring is an
 * inset 2px ring in the primary (button) color, shown at every breakpoint — the
 * textarea border itself does not change color on focus. The wrapper is required
 * because `::before`/`::after` need a non-replaced host. Radius is
 * `rounded-[0.5rem]` and spacing is border-compensated, matching the Input.
 *
 * Multi-line specifics: a taller `min-h`, `field-sizing-content` (the textarea
 * auto-grows with its content), and `resize-y` so it can still be dragged taller.
 *
 * Colors come from the theme tokens (`--background`, `--primary`) rather than
 * `dark:` utilities: this repo has no class-based `dark` variant.
 *
 * Sizing stays mobile-first (the same `text`/`py` scale as the Input).
 * `className` applies to the wrapper. To override the `<textarea>` itself
 * (e.g. `resize-none`, a height cap, scroll behavior, or padding) pass
 * `textareaClassName` — those classes are tailwind-merged onto the inner
 * element so they win over the defaults. All other props forward to the
 * `<textarea>`.
 */
type TextareaProps = React.ComponentProps<'textarea'> & {
  textareaClassName?: string;
};

function Textarea({ className, textareaClassName, ...props }: TextareaProps) {
  return (
    <span
      data-slot="control"
      className={cn(
        'relative isolate block w-full rounded-[0.5rem]',
        'before:bg-background before:absolute before:inset-px before:-z-10 before:rounded-[calc(0.5rem_-_1px)] before:shadow',
        'focus-within:after:ring-primary after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:ring-inset after:ring-transparent focus-within:after:ring-2',
        '[&:hover>textarea:not(:disabled):not([aria-invalid=true])]:border-field-strong',
        'has-[textarea:disabled]:before:bg-muted has-[textarea:disabled]:opacity-50 has-[textarea:disabled]:before:shadow-none',
        className,
      )}
    >
      <textarea
        data-slot="textarea"
        className={cn(
          'field-sizing-content border-field relative block min-h-24 w-full resize-y appearance-none rounded-[0.5rem] border bg-transparent',
          'px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:px-[calc(--spacing(3)-1px)] sm:py-[calc(--spacing(1.5)-1px)]',
          'text-foreground placeholder:text-field-placeholder selection:bg-accent selection:text-accent-foreground text-base/6 sm:text-sm/6',
          'outline-none focus:outline-none disabled:cursor-not-allowed',
          'aria-invalid:border-error',
          textareaClassName,
        )}
        {...props}
      />
    </span>
  );
}

export { Textarea };
