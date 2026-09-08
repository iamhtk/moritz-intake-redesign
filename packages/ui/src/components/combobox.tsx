'use client';

import * as React from 'react';
import { Combobox as ComboboxPrimitive } from '@base-ui/react';
import { CheckIcon, XIcon } from '@repo/ui/icons';

import { cn } from '@repo/ui/lib/utils';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@repo/ui/components/input-group';

/**
 * Foundation Combobox — design-iteration combobox built on Base UI's Combobox
 * primitive (shadcn logic) and our design tokens. An autocomplete input paired
 * with a filtered popup list; supports single and multi (chips) selection, a
 * trigger button, an inline clear action, groups, and an empty state.
 *
 * Visual treatment: a flush double up/down selector at the trigger edge, a
 * translucent blurred `bg-popover/75` panel carried by a ring, and options with
 * a left-aligned selected check (matching the foundation Select), a `primary`
 * highlight, and optional secondary description text. Colors come from our
 * design tokens (`border-field`, `bg-background`, `primary`, `field-placeholder`,
 * `border-error`) with no `dark:` utilities (this app has no class-based dark
 * variant). The input row reuses the foundation `InputGroup` layered "optical"
 * surface.
 */

const Combobox = ComboboxPrimitive.Root;

function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />;
}

function ComboboxTrigger({
  className,
  children,
  ...props
}: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={cn("[&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    >
      {children}
      <svg
        data-slot="combobox-trigger-icon"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none size-5 stroke-current sm:size-4"
      >
        <path
          d="M5.75 10.75L8 13L10.25 10.75"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10.25 5.25L8 3L5.75 5.25"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </ComboboxPrimitive.Trigger>
  );
}

function ComboboxClear({ className, ...props }: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      // Flush icon button matching the trigger: no fixed-size button box, so it
      // occupies the same footprint as the chevron and keeps the field the same
      // height as the other comboboxes (a ghost Button's larger box grew it).
      render={<button type="button" />}
      className={cn(
        'hover:[&_svg]:text-foreground -mr-1 flex cursor-pointer items-center outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <XIcon className="pointer-events-none" />
    </ComboboxPrimitive.Clear>
  );
}

function ComboboxInput({
  className,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  ...props
}: ComboboxPrimitive.Input.Props & {
  showTrigger?: boolean;
  showClear?: boolean;
}) {
  return (
    // Render the foundation InputGroup through Base UI's `Combobox.InputGroup`
    // so it registers as the popup's anchor (`inputGroupElement`). Without this,
    // Base UI falls back to the inner `<input>`, which is narrower than the
    // bordered field (it excludes the padding + trigger/clear addon), making the
    // popup render noticeably narrower than the control.
    <ComboboxPrimitive.InputGroup
      render={<InputGroup className={cn('w-auto', className)} />}
    >
      <ComboboxPrimitive.Input
        // `min-w-0` lets the flex-1 input shrink below its intrinsic (size-based)
        // width so a narrow field (e.g. a constrained `max-w-*` or a long
        // selected value) keeps the trailing trigger/clear addon inside the
        // border instead of pushing it past the edge. The value scrolls within
        // the input as usual.
        render={<InputGroupInput disabled={disabled} className="min-w-0" />}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        {showTrigger && (
          <ComboboxTrigger
            disabled={disabled}
            // The selector is flush and transparent — a plain icon button that
            // only changes color, with no hover/pressed fill. Hidden once a
            // clear button is shown (the InputGroup is the `group/input-group`).
            className="group-has-data-[slot=combobox-clear]/input-group:hidden hover:[&_svg]:text-foreground -mr-1 flex cursor-pointer items-center outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          />
        )}
        {showClear && <ComboboxClear disabled={disabled} />}
      </InputGroupAddon>
      {children}
    </ComboboxPrimitive.InputGroup>
  );
}

function ComboboxContent({
  className,
  side = 'bottom',
  sideOffset = 6,
  align = 'start',
  alignOffset = 0,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<
    ComboboxPrimitive.Positioner.Props,
    'side' | 'align' | 'sideOffset' | 'alignOffset' | 'anchor'
  >) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          data-chips={!!anchor}
          className={cn(
            'group/combobox-content w-(--anchor-width) min-w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) bg-popover/75 text-popover-foreground ring-foreground/10 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 relative max-h-96 select-none overflow-hidden rounded-[0.75rem] shadow-lg ring-1 backdrop-blur-xl duration-100',
            // When an InputGroup (the search input) is rendered inside the popup —
            // e.g. the "Popup" variant triggered from a button — inset it from the
            // panel edges and flatten its shadow so it reads as part of the surface.
            '*:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mb-0 *:data-[slot=input-group]:before:shadow-none',
            className,
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn(
        'data-empty:p-0 max-h-[min(calc(--spacing(96)---spacing(9)),calc(var(--available-height)---spacing(9)))] scroll-py-1 overflow-y-auto p-1',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        // Option row with the selected check on the LEFT (matching the
        // foundation Select): an absolute indicator at `left-2` and `pl-8` to
        // clear it. Saturated `primary` highlight on focus.
        'group/combobox-item outline-hidden data-highlighted:bg-primary data-highlighted:text-primary-foreground relative flex w-full cursor-default select-none items-center gap-2 rounded-[0.5rem] py-2.5 pl-8 pr-3.5 text-base data-[disabled]:pointer-events-none data-[disabled]:opacity-50 sm:py-1.5 sm:text-sm',
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <ComboboxPrimitive.ItemIndicator data-slot="combobox-item-indicator">
          <CheckIcon className="size-4" />
        </ComboboxPrimitive.ItemIndicator>
      </span>
      <span
        className={cn(
          // label/description/leading-icon content. Icons (and the
          // `data-[slot=icon]` slot) are muted, flipping to `primary-foreground`
          // while the row is highlighted.
          'flex w-full min-w-0 items-center',
          "[&_svg:not([class*='text-'])]:text-muted-foreground group-data-[highlighted]/combobox-item:[&_svg:not([class*='text-'])]:text-primary-foreground [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
          '*:data-[slot=icon]:text-muted-foreground group-data-[highlighted]/combobox-item:*:data-[slot=icon]:text-primary-foreground *:data-[slot=icon]:size-5 *:data-[slot=icon]:shrink-0 sm:*:data-[slot=icon]:size-4',
        )}
      >
        {children}
      </span>
    </ComboboxPrimitive.Item>
  );
}

/**
 * Option label — truncating primary text for a `ComboboxItem`. Gains a left
 * margin when it follows a leading icon/avatar (`first:ml-0`).
 */
function ComboboxItemLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      data-slot="combobox-item-label"
      className={cn(
        'ml-2.5 truncate first:ml-0 sm:ml-2 sm:first:ml-0',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Option description — secondary text shown after the label, flipping to
 * `primary-foreground` while the row is highlighted.
 */
function ComboboxItemDescription({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      data-slot="combobox-item-description"
      className={cn(
        'text-muted-foreground group-data-[highlighted]/combobox-item:text-primary-foreground flex flex-1 overflow-hidden before:w-2 before:min-w-0 before:shrink',
        className,
      )}
      {...props}
    >
      <span className="flex-1 truncate">{children}</span>
    </span>
  );
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return (
    <ComboboxPrimitive.Group
      data-slot="combobox-group"
      className={cn(className)}
      {...props}
    />
  );
}

function ComboboxLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-label"
      className={cn(
        'text-muted-foreground px-3.5 pb-1 pt-2 text-sm font-medium sm:px-3 sm:text-xs',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxCollection({ ...props }: ComboboxPrimitive.Collection.Props) {
  return (
    <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
  );
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        // Non-interactive "no results" row: muted text on the option type scale
        // (text-base sm:text-sm) with option-matched horizontal padding. Extra
        // vertical padding gives the empty popup a bit more height so it doesn't
        // read as a cramped sliver.
        'text-muted-foreground group-data-empty/combobox-content:flex hidden w-full items-center justify-center px-3.5 py-8 text-center text-base sm:px-3 sm:text-sm',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxSeparator({
  className,
  ...props
}: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      className={cn('bg-foreground/5 -mx-1 my-1 h-px', className)}
      {...props}
    />
  );
}

function ComboboxChips({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof ComboboxPrimitive.Chips> &
  ComboboxPrimitive.Chips.Props) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn(
        // Layered "optical" surface matching the foundation InputGroup: a
        // `before` layer paints the `bg-background` fill + blended shadow, and an
        // `after` layer draws the inset 2px primary focus ring. Border + tokens
        // come from the theme — no `dark:` utilities (this app has no class-based
        // dark variant).
        // Padding is conditional so the two states each look right:
        // - Empty (no chips): the InputGroup's exact border-compensated padding,
        //   so the field matches the single-select comboboxes in height AND the
        //   placeholder lines up horizontally with their placeholders.
        // - Filled (chips present): switch to symmetric padding (slightly tighter
        //   than the horizontal value) so chips get an even gap from every edge
        //   (top/bottom = left/right). Chips wrap and grow the field downward.
        'border-field relative isolate flex w-full flex-wrap items-center gap-1.5 rounded-[0.5rem] border bg-transparent bg-clip-padding text-base sm:text-sm',
        'px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:px-[calc(--spacing(3)-1px)] sm:py-[calc(--spacing(1.5)-1px)]',
        'has-[[data-slot=combobox-chip]]:p-[calc(--spacing(3)-1px)] sm:has-[[data-slot=combobox-chip]]:p-[calc(--spacing(2.5)-1px)]',
        // Hover: darken the border with a neutral tone, matching the InputGroup
        // and standalone Input. Gated on the inner chips input being enabled.
        'has-[input:enabled]:hover:border-field-strong',
        'before:bg-background before:absolute before:inset-0 before:-z-10 before:rounded-[calc(0.5rem_-_1px)] before:shadow-sm',
        'focus-within:after:ring-primary after:pointer-events-none after:absolute after:-inset-px after:rounded-[inherit] after:ring-inset after:ring-transparent focus-within:after:ring-2',
        // Disabled: dim + flatten the shadow, matching the InputGroup.
        'has-[input:disabled]:before:bg-muted has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50 has-[input:disabled]:before:shadow-none',
        'has-aria-invalid:border-error',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxChip({
  className,
  children,
  showRemove = true,
  ...props
}: ComboboxPrimitive.Chip.Props & {
  showRemove?: boolean;
}) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        // Soft tinted pill matching the foundation Badge default: translucent
        // fill, rounded-md, natural height. Default padding is symmetric
        // (px-1.5); when a remove button is present the right padding tightens to
        // pr-1 so the X's own box keeps the inset even.
        'bg-foreground/10 text-foreground has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-data-[slot=combobox-chip-remove]:pr-1.5 sm:has-data-[slot=combobox-chip-remove]:pr-1 inline-flex w-fit items-center gap-x-1.5 whitespace-nowrap rounded-md px-2 py-1 text-sm font-medium sm:gap-x-1 sm:px-1.5 sm:py-0.5 sm:text-xs',
        className,
      )}
      {...props}
    >
      {children}
      {showRemove && (
        <ComboboxPrimitive.ChipRemove
          render={<button type="button" />}
          className="focus-visible:outline-primary flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm text-current opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 sm:size-4"
          data-slot="combobox-chip-remove"
        >
          <XIcon className="pointer-events-none size-3.5 sm:size-3" />
        </ComboboxPrimitive.ChipRemove>
      )}
    </ComboboxPrimitive.Chip>
  );
}

function ComboboxChipsInput({
  className,
  ...props
}: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-chip-input"
      // `min-w-32` (not `min-w-16`) so the input keeps a usable width: when chips
      // fill most of the row and the leftover space is narrower than this, the
      // flex-wrap container pushes the input onto its own full-width line instead
      // of squeezing it into a sliver that crops the placeholder.
      // TODO(@repo/ui): apply the same `min-w-32` to ComboboxChipsInput in
      // packages/ui/src/components/combobox.tsx so the shared component wraps the
      // input instead of cropping its placeholder when chips fill the row.
      className={cn(
        'placeholder:text-field-placeholder min-w-32 flex-1 bg-transparent text-inherit outline-none',
        className,
      )}
      {...props}
    />
  );
}

function useComboboxAnchor() {
  return React.useRef<HTMLDivElement | null>(null);
}

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxItemLabel,
  ComboboxItemDescription,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
};
