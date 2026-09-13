'use client';

import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from '@repo/ui/icons';

import { cn } from '@repo/ui/lib/utils';
import { useScrollActivity } from '@repo/ui/hooks/use-scroll-activity';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/design/foundations/components/dialog';
import {
  InputGroup,
  InputGroupAddon,
} from '@/components/design/foundations/components/input-group';

/**
 * Command — the `cmdk` primitive, restyled onto this app's tokens (task S1).
 *
 * Vendored app-local rather than added to `packages/ui` on purpose: `cmdk` is a
 * fourth primitive library in a repo that already carries `radix-ui`,
 * `@base-ui/react` and `@shadcn/react`, and the shared package keeps one
 * primitive story. If a second app ever wants the palette, this file moves.
 *
 * Three deliberate departures from the shadcn-on-cmdk original:
 *
 * 1. **Less glass.** The original leans on `backdrop-filter` with a 92% fill
 *    and a 28px blur. This app's popover idiom is the foundation Combobox's
 *    `bg-popover/75` + a `ring-foreground/10` hairline, and reading as part of
 *    the app rather than as a transplant is what the hairline and the blur are
 *    for.
 *
 *    The fill is the one place this deliberately parts company with the rest of
 *    them, at 95% rather than 75%, and the reason is the backdrop rather than
 *    taste. Every other `bg-popover/75` surface — Popover, HoverCard,
 *    Combobox, DropdownMenu — is anchored over page content, which is white, so
 *    a quarter of show-through is invisible. This one is a `Dialog`, and
 *    `DialogOverlay` is `bg-foreground/50`, so the same recipe was compositing
 *    a quarter of a half-black scrim and the panel read grey. Matching the
 *    number would have meant not matching the appearance, which is the wrong
 *    half of the convention to keep.
 * 2. **No `dark:` utilities.** This app has no class-based dark mode; every
 *    colour resolves through a token (see `input.tsx` for the longer argument).
 * 3. **Selection uses `bg-primary`/`text-primary-foreground`**, the same pair
 *    the Combobox uses for `data-highlighted`, rather than inventing a
 *    `surface-selected` token that does not exist here.
 *
 * The shadcn part names and `data-slot` hooks are kept verbatim so the
 * `cmdk`-shaped composition in `command-palette.tsx` reads like every other
 * shadcn palette, and so `lib/keyboard.ts` can find an open palette by its
 * `[cmdk-dialog]` / `[cmdk-root]` attributes.
 */
function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        'bg-popover text-popover-foreground flex size-full flex-col overflow-hidden rounded-[0.75rem] p-1',
        className,
      )}
      {...props}
    />
  );
}

/**
 * The palette's dialog shell.
 *
 * Seated at `top-1/4` rather than the foundation Dialog's above-centre grid: a
 * palette grows downward as results arrive, and anchoring it higher keeps the
 * input still while the list changes length underneath it. The foundation
 * Dialog's `p-8` panel padding is zeroed because the list owns its own
 * spacing, and its `sm:max-w-lg` cap is kept.
 */
function CommandDialog({
  title,
  description,
  children,
  className,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <Dialog {...props}>
      <DialogContent
        className={cn(
          /*
           * `bg-popover` is pure white (`--mz-white`), and `DialogOverlay` is
           * `bg-foreground/50` — so at 75% the panel was compositing a quarter
           * of a half-black scrim and reading as grey rather than as glass.
           *
           * 95% keeps the frosted character (there is still something for
           * `backdrop-blur-xl` to blur) while the surface reads white. Going
           * fully opaque would make the blur decorative: nothing shows through
           * an opaque panel, and the class would be a lie about what it does.
           */
          'bg-popover/95 ring-foreground/10 overflow-hidden rounded-2xl p-0 ring-1 backdrop-blur-xl sm:mb-0 sm:mt-[15vh]',
          className,
        )}
      >
        {/* The input is the visible label, so the accessible name lives here. */}
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="p-1 pb-0">
      <InputGroup>
        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            'placeholder:text-field-placeholder w-full min-w-0 bg-transparent outline-none disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          {...props}
        />
        <InputGroupAddon>
          <Search
            className="text-muted-foreground size-4 shrink-0"
            aria-hidden
          />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function CommandList({
  className,
  onScroll,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  // T33's idiom, not a hidden bar: the gutter is always reserved and only the
  // thumb's colour changes, so a bar arriving never reflows the list under the
  // reader's cursor. `useScrollActivity` writes the `data-scrolling` mark the
  // class keys off.
  const markScrolling = useScrollActivity();
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      onScroll={(event) => {
        markScrolling(event);
        onScroll?.(event);
      }}
      className={cn(
        'mz-scrollbar-on-scroll max-h-[min(60vh,520px)] scroll-py-1 overflow-y-auto overflow-x-hidden outline-none',
        className,
      )}
      {...props}
    />
  );
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn(
        'text-muted-foreground px-3 py-8 text-center text-sm',
        className,
      )}
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        'text-foreground overflow-hidden p-1',
        '**:[[cmdk-group-heading]]:text-muted-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium',
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn('bg-border -mx-1 h-px', className)}
      {...props}
    />
  );
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        // `min-w-0` so a `truncate` child can actually shrink: a flex item
        // defaults to `min-width: auto`, which refuses to go below its content
        // width, so the ellipsis never engages and a long case title pushes the
        // row past the panel edge at 390px instead.
        'group/command-item outline-hidden relative flex min-w-0 cursor-default select-none items-center gap-2 rounded-[0.5rem] px-2 py-2 text-base sm:py-1.5 sm:text-sm',
        'data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground',
        'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
        "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The trailing hint on a row — a shortcut, a count, or a type.
 *
 * Muted against the resting row and inherited against the selected one, so it
 * never becomes the brightest thing on a row that is already highlighted.
 */
function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        'text-muted-foreground group-data-[selected=true]/command-item:text-primary-foreground ml-auto text-xs tabular-nums',
        className,
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
