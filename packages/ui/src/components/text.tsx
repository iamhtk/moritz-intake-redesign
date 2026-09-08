import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@repo/ui/lib/utils';

/**
 * Text family — the dashboard body-copy primitives.
 *
 * `Text` is the muted paragraph used for any custom copy that should match the
 * text built into the other components; `Strong`, `TextLink`, and `Code` are the
 * inline emphasis, link, and inline-code treatments used within it. Everything
 * stays on the Inter sans face (the default `font-sans`) and the theme tokens.
 * Sizing is mobile-first: a larger base on small screens collapsing to the
 * compact desktop density at the `sm:` breakpoint.
 *
 * `Text` accepts `asChild`: pass `asChild` to render the text styling on a
 * different element (e.g. a `<span>` for inline copy, or an `<h3>` to keep a
 * heading's semantics while rendering it as muted body text). Override the size
 * via `className` (e.g. `text-xs`) when a specific step is needed.
 */

function Text({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'p'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'p';

  return (
    <Comp
      data-slot="text"
      className={cn(
        'text-muted-foreground text-base/6 sm:text-sm/6',
        className,
      )}
      {...props}
    />
  );
}

function Strong({ className, ...props }: React.ComponentProps<'strong'>) {
  return (
    <strong
      data-slot="text-strong"
      className={cn('text-foreground font-medium', className)}
      {...props}
    />
  );
}

function TextLink({ className, ...props }: React.ComponentProps<'a'>) {
  return (
    <a
      data-slot="text-link"
      className={cn(
        'text-foreground decoration-foreground/40 hover:decoration-foreground underline underline-offset-4 transition-colors',
        className,
      )}
      {...props}
    />
  );
}

function Code({ className, ...props }: React.ComponentProps<'code'>) {
  return (
    <code
      data-slot="text-code"
      className={cn(
        'border-border bg-muted/60 text-foreground rounded border px-[0.4em] py-[0.1em] font-mono text-[0.8125rem] font-medium',
        className,
      )}
      {...props}
    />
  );
}

export { Code, Strong, Text, TextLink };
