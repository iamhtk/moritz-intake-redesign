'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@repo/ui/icons';

import { cn } from '@repo/ui/lib/utils';

/**
 * Select — shadcn Select with a layered surface.
 *
 * The trigger mirrors the Input: it's wrapped in a `<span data-slot="control">`
 * that hosts two pseudo-elements — a `before` layer painting a `bg-background`
 * fill + drop shadow (so the shadow blends with the border) and an `after` layer
 * drawing the inset 2px primary focus ring — while the border + border-compensated
 * mobile-first padding live on the inner Radix Trigger button. Height is
 * padding-driven (no fixed `h-*`), so the trigger tracks the Input at both
 * breakpoints. The hover border is driven by the WRAPPER's `:hover` (not the
 * button's) so a label-forwarded `:hover` doesn't misfire.
 *
 * The content panel and items reuse the Dropdown Menu's language: a translucent
 * blurred surface carried by a ring, `rounded-[0.5rem]` items with mobile-first
 * padding, muted icons, and a saturated `primary` focus highlight. Colors come
 * from theme tokens, not `dark:` utilities (this repo has no class-based dark
 * variant).
 */

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  size = 'default',
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: 'sm' | 'default';
}) {
  return (
    <span
      data-slot="control"
      className={cn(
        // Content-width by default (matching the shared Select); the inner Trigger
        // is `w-full`, so a width passed via `className` (e.g. `w-full`, `w-48`)
        // widens the wrapper and the Trigger fills it, while the layered surface
        // (before/after) keeps tracking the Trigger box.
        'relative isolate block w-fit rounded-[0.5rem]',
        // White fill + blended drop shadow (before is inset 1px, so its radius is
        // 1px smaller).
        'before:bg-background before:absolute before:inset-px before:-z-10 before:rounded-[calc(0.5rem_-_1px)] before:shadow',
        // Focus ring — inset, 2px, primary color, shown at every breakpoint.
        'focus-within:after:ring-primary after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:ring-inset after:ring-transparent focus-within:after:ring-2',
        // Hover: darken the border, driven by the WRAPPER so a label-forwarded
        // `:hover` on the trigger button doesn't misfire.
        '[&:hover>button:not(:disabled):not([aria-invalid=true])]:border-field-strong',
        // Disabled: dim + flatten the shadow.
        'has-[button:disabled]:before:bg-muted has-[button:disabled]:opacity-50 has-[button:disabled]:before:shadow-none',
        className,
      )}
    >
      <SelectPrimitive.Trigger
        data-slot="select-trigger"
        data-size={size}
        className={cn(
          'border-field relative flex w-full appearance-none items-center justify-between gap-2 whitespace-nowrap rounded-[0.5rem] border bg-transparent',
          // Mobile-first padding drives height (no fixed `h-*`).
          size === 'sm'
            ? 'px-[calc(--spacing(3)-1px)] py-[calc(--spacing(2)-1px)] sm:px-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(1)-1px)]'
            : 'px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:px-[calc(--spacing(3)-1px)] sm:py-[calc(--spacing(1.5)-1px)]',
          'text-foreground data-[placeholder]:text-field-placeholder text-base sm:text-sm',
          'cursor-pointer outline-none focus:outline-none disabled:cursor-not-allowed',
          'aria-invalid:border-error',
          "[&_svg:not([class*='text-'])]:text-muted-foreground [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
          '*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2',
        )}
        {...props}
      >
        {children}
        <SelectPrimitive.Icon asChild>
          <ChevronDownIcon className="opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
    </span>
  );
}

function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          'max-h-(--radix-select-content-available-height) origin-(--radix-select-content-transform-origin) text-popover-foreground ring-foreground/10 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 bg-popover/75 relative z-50 min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-[0.75rem] shadow-lg ring-1 backdrop-blur-xl',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className,
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1',
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        'text-muted-foreground px-3.5 pb-1 pt-2 text-sm font-medium sm:px-3 sm:text-xs',
        className,
      )}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "outline-hidden focus:bg-primary focus:text-primary-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus:[&_svg:not([class*='text-'])]:text-primary-foreground *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2 group relative flex w-full cursor-default select-none items-center gap-2 rounded-[0.5rem] py-2.5 pl-8 pr-3.5 text-base data-[disabled]:pointer-events-none data-[disabled]:opacity-50 sm:py-1.5 sm:pr-3 sm:text-sm [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        'bg-foreground/5 pointer-events-none mx-3.5 my-1 h-px sm:mx-3',
        className,
      )}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        'text-muted-foreground flex cursor-default items-center justify-center py-1',
        className,
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        'text-muted-foreground flex cursor-default items-center justify-center py-1',
        className,
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
