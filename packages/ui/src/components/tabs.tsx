'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { LayoutGroup, motion } from 'motion/react';

import { cn } from '@repo/ui/lib/utils';
import { useDragScroll } from '@repo/ui/hooks/use-drag-scroll';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';

/**
 * Tabs — a transparent strip of text triggers with an animated underline that
 * slides under the active tab (a `motion` `LayoutGroup` + shared `layoutId`
 * pattern), rather than a filled pill. Keeps the shadcn part structure
 * (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`) and `data-slot` hooks so
 * it stays a drop-in replacement. Promoted from the design playground's
 * foundation Tabs.
 *
 * Treatment, mapped onto foundation tokens (no `dark:` — the app is light-only):
 * - Inactive trigger text `text-muted-foreground`; hover paints the subtle
 *   `muted` surface and lifts text to `foreground`; the active trigger is
 *   `foreground`.
 * - The sliding indicator is the `primary` token (how the rest of the library
 *   expresses the active/selected state). Each `TabsList` wraps its strip in a
 *   `LayoutGroup` keyed by `useId`, so several Tabs on one page each animate
 *   their own indicator instead of sharing one.
 *
 * Feature parity with shadcn's Radix Tabs:
 * - `orientation` on `Tabs` — `horizontal` (default) or `vertical`; the root,
 *   list, triggers, and the indicator re-flow off the Radix `data-orientation`
 *   attribute via a `group/tabs` marker (bottom underline vs. inline-start bar).
 * - Disabled triggers and leading icons come straight from Radix / the base
 *   trigger styles.
 * - `TabsTrigger` supports `asChild` (the animated indicator is cloned into
 *   the slotted element) for rendering a trigger as a link or router control
 *   — e.g. tabs-as-navigation.
 * - RTL follows the Radix `dir`; the vertical accent uses a logical
 *   inline-start offset so it mirrors correctly.
 *
 * A strip too wide for its container scrolls, and scrolls by being dragged as
 * well as by the wheel: pressing and pulling it moves it like a map. The press
 * that starts the pull is held back until release, so a drag never lands on the
 * tab it passed over — see `useDragScroll`. Lists that would rather stay fully
 * visible opt into `wrap` instead: the strip breaks onto further rows, and the
 * active underline moves inside the trigger so it cannot collide with the row
 * below it.
 *
 * Responsive: on phones the tab strip is hidden and `TabsList` renders a
 * Select instead (the Tailwind UI "tabs collapse to a dropdown" pattern),
 * switching to the full strip at `sm+`. The dropdown is wired to the same
 * state as the tabs: the root is lightly controlled (via
 * `useControllableState`, supporting both `defaultValue` and a controlled
 * `value`) and publishes `{ value, setValue }` on an internal context that
 * `TabsList` consumes — Radix does not expose its own context to children. The
 * dropdown options are derived from the `TabsTrigger` children.
 */

function useControllableState({
  prop,
  defaultProp,
  onChange,
}: {
  prop?: string;
  defaultProp?: string;
  onChange?: (value: string) => void;
}) {
  const [uncontrolled, setUncontrolled] = React.useState<string | undefined>(
    defaultProp,
  );
  const isControlled = prop !== undefined;
  const value = isControlled ? prop : uncontrolled;

  const onChangeRef = React.useRef(onChange);
  // The selection has to be readable from inside a callback that may have been
  // built several renders ago: a strip that puts a withheld press back selects
  // the tab twice in one tick, and a closed-over value sees the old tab both
  // times and reports both as changes.
  const valueRef = React.useRef(value);
  React.useEffect(() => {
    onChangeRef.current = onChange;
    valueRef.current = value;
  });

  const setValue = React.useCallback(
    (next: string) => {
      // A press on the tab that is already active is not a change, and
      // reporting it as one makes consumers redo whatever a change costs them.
      if (next === valueRef.current) return;
      valueRef.current = next;
      if (!isControlled) setUncontrolled(next);
      onChangeRef.current?.(next);
    },
    [isControlled],
  );

  return [value, setValue] as const;
}

type TabsContextValue = {
  value: string | undefined;
  setValue: (value: string) => void;
  orientation: 'horizontal' | 'vertical';
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs parts must be used within <Tabs>.');
  }
  return context;
}

/** Extracts readable text from a trigger's children, skipping icon elements. */
function getNodeText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(getNodeText).join('');
  }
  if (React.isValidElement(node)) {
    return getNodeText((node.props as { children?: React.ReactNode }).children);
  }
  return '';
}

function Tabs({
  className,
  value,
  defaultValue,
  onValueChange,
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const [tabValue, setTabValue] = useControllableState({
    prop: value,
    defaultProp: defaultValue,
    onChange: onValueChange,
  });

  return (
    <TabsContext.Provider
      value={{ value: tabValue, setValue: setTabValue, orientation }}
    >
      <TabsPrimitive.Root
        data-slot="tabs"
        value={tabValue}
        onValueChange={setTabValue}
        orientation={orientation}
        className={cn(
          // Below `sm` the strip collapses into the full-width Select, so keep the
          // root stacked there; only go side-by-side for vertical orientation at
          // `sm+` where the actual list is shown.
          'group/tabs flex flex-col gap-2 sm:data-[orientation=vertical]:flex-row',
          className,
        )}
        {...props}
      />
    </TabsContext.Provider>
  );
}

type TabOption = { value: string; label: string; disabled?: boolean };

// Triggers restyle their indicator off the list's overflow mode. The mode
// travels by context rather than a CSS ancestor variant so the two `bottom`
// utilities never coexist on the indicator — an override that would otherwise
// hang on selector specificity and utility order.
const TabsListWrapContext = React.createContext(false);

function TabsList({
  className,
  children,
  mobileSelectLabel = 'Select a tab',
  wrap = false,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & {
  /**
   * Accessible label + placeholder for the phone-width Select the list
   * collapses into. The package has no i18n runtime, so pass a translated
   * string from the app; the English default is the fallback.
   */
  mobileSelectLabel?: string;
  /**
   * Break onto further rows instead of scrolling when the strip is wider
   * than its container — every tab stays visible at any width.
   */
  wrap?: boolean;
}) {
  const { value, setValue, orientation } = useTabsContext();
  // Scope the sliding indicator's `layoutId` to this list so multiple Tabs on
  // one page each animate their own bar instead of fighting over a shared one.
  const layoutGroupId = React.useId();

  // The drag withholds the press that started it, so a press that turns out to
  // be a click has to be put back: focus the trigger it landed on, as the press
  // would have, and select it. Focus alone already selects under automatic
  // activation, so the selection leans on `setValue` deduplicating itself —
  // without which every press would be reported twice.
  const selectPressedTrigger = React.useCallback(
    (target: HTMLElement) => {
      const trigger = target.closest<HTMLElement>('[data-slot="tabs-trigger"]');
      const pressedValue = trigger?.dataset.value;
      if (!trigger || !pressedValue || trigger.hasAttribute('data-disabled')) {
        return;
      }
      trigger.focus({ preventScroll: true });
      setValue(pressedValue);
    },
    [setValue],
  );

  // Vertical lists stack and wrapped lists reflow, so neither scrolls
  // sideways and there is nothing to grab.
  const dragScroll = useDragScroll<HTMLDivElement>({
    enabled: orientation === 'horizontal' && !wrap,
    onPress: selectPressedTrigger,
  });

  // Derive the mobile dropdown options from the TabsTrigger children so the
  // Select stays in lockstep with the strip without a separate config.
  const options = React.useMemo<TabOption[]>(() => {
    const result: TabOption[] = [];
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      const childProps = child.props as {
        value?: string;
        children?: React.ReactNode;
        disabled?: boolean;
      };
      if (typeof childProps.value !== 'string') return;
      result.push({
        value: childProps.value,
        label: getNodeText(childProps.children) || childProps.value,
        disabled: childProps.disabled,
      });
    });
    return result;
  }, [children]);

  return (
    <>
      <div className="sm:hidden">
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger className="w-full" aria-label={mobileSelectLabel}>
            <SelectValue placeholder={mobileSelectLabel} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <LayoutGroup id={layoutGroupId}>
        <TabsListWrapContext.Provider value={wrap}>
          <TabsPrimitive.List
            data-slot="tabs-list"
            data-wrap={wrap ? '' : undefined}
            ref={dragScroll.ref}
            className={cn(
              'text-muted-foreground hidden h-auto w-fit items-center justify-start gap-1 sm:inline-flex',
              wrap
                ? // Every tab stays visible: the strip reflows onto further
                  // rows instead of hiding what does not fit behind a scroll.
                  'max-w-full flex-wrap'
                : [
                    // A strip wider than its container scrolls rather than
                    // clipping: these lists sit in docked panels whose width
                    // the reader controls, and a tab you cannot reach is worse
                    // than one you have to scroll to.
                    'max-w-full overflow-x-auto',
                    // The active indicator hangs below the triggers, so the
                    // scroll box needs that much room inside it or scrolling
                    // either clips the indicator away or shows a vertical
                    // scrollbar for it. The padding buys the room and the
                    // negative margin gives it back to the layout, so the
                    // strip takes no more space than the tabs do.
                    '-mb-3 pb-3',
                    // Dragged and swiped, not tracked: the bar itself is only
                    // noise on a one-line strip.
                    '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                    // Vertical lists stack, so the scroll box and the room it
                    // reserves for the indicator both come back off.
                    'group-data-[orientation=vertical]/tabs:mb-0 group-data-[orientation=vertical]/tabs:overflow-visible group-data-[orientation=vertical]/tabs:pb-0',
                  ],
              'group-data-[orientation=vertical]/tabs:flex-col group-data-[orientation=vertical]/tabs:gap-0.5',
              // The triggers cover the strip, so the grab cursor only shows if
              // they take it from the list instead of keeping their own.
              dragScroll.isScrollable &&
                'cursor-grab [&_[data-slot=tabs-trigger]]:cursor-[inherit]',
              dragScroll.isDragging && 'cursor-grabbing select-none',
              className,
            )}
            {...dragScroll.props}
            {...props}
          >
            {children}
          </TabsPrimitive.List>
        </TabsListWrapContext.Provider>
      </LayoutGroup>
    </>
  );
}

function TabsTrigger({
  className,
  value,
  children,
  asChild = false,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const { value: activeValue } = useTabsContext();
  const wrap = React.useContext(TabsListWrapContext);
  const isActive = value !== undefined && value === activeValue;

  const indicator = isActive ? (
    <motion.span
      layoutId="tab-indicator"
      aria-hidden="true"
      className={cn(
        'bg-primary pointer-events-none absolute rounded-full',
        // Horizontal: bottom underline. Vertical: inline-start bar. A wrapped
        // strip keeps the underline inside the trigger, where a hanging one
        // would sit on top of the row below.
        'group-data-[orientation=horizontal]/tabs:inset-x-2 group-data-[orientation=horizontal]/tabs:h-0.5',
        wrap
          ? 'group-data-[orientation=horizontal]/tabs:bottom-0'
          : 'group-data-[orientation=horizontal]/tabs:-bottom-2.5',
        'group-data-[orientation=vertical]/tabs:inset-y-1 group-data-[orientation=vertical]/tabs:-start-px group-data-[orientation=vertical]/tabs:w-0.5',
      )}
    />
  ) : null;

  // With `asChild` the indicator is cloned INTO the slotted element rather
  // than placed beside it in a `Slottable`: Radix recognises a Slottable by a
  // per-package-copy symbol, and pnpm can resolve a second copy of
  // @radix-ui/react-slot for react-tabs, in which case the Slottable goes
  // unrecognised and the Slot refuses its two children (React.Children.only).
  const content =
    asChild &&
    React.isValidElement<{ children?: React.ReactNode }>(children) ? (
      React.cloneElement(
        children,
        undefined,
        children.props.children,
        indicator,
      )
    ) : (
      <>
        {children}
        {indicator}
      </>
    );

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      // Readable from the DOM so the list can select the trigger a withheld
      // press landed on without holding a map of its children.
      data-value={value}
      value={value}
      asChild={asChild}
      className={cn(
        // Transparent text trigger with a subtle hover surface, mapped onto
        // foundation tokens — the underline does the work.
        "text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring not-disabled:hover:bg-muted not-disabled:hover:text-foreground data-[state=active]:text-foreground relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-base/6 font-medium transition-colors focus-visible:outline-1 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm/5 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        // Vertical orientation: full-width, left-aligned triggers.
        'group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start',
        className,
      )}
      {...props}
    >
      {content}
    </TabsPrimitive.Trigger>
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
