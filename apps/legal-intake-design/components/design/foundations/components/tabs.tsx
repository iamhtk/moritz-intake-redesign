'use client';

import * as React from 'react';
import { LayoutGroup, motion } from 'motion/react';
import { Slot, Tabs as TabsPrimitive } from 'radix-ui';

import { cn } from '@repo/ui/lib/utils';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/design/foundations/components/select';

/**
 * Foundation Tabs — design-iteration tab set: a transparent strip of text
 * triggers with an animated underline that slides under the active tab (a
 * `motion` `LayoutGroup` + shared `layoutId` pattern), rather than a filled
 * pill. Keeps the shadcn part structure (`Tabs`, `TabsList`, `TabsTrigger`,
 * `TabsContent`) and `data-slot` hooks so it stays a drop-in replacement.
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
 * - `TabsTrigger` supports `asChild` (via Radix `Slottable`, so the animated
 *   indicator coexists with the slotted element) for rendering a trigger as a
 *   link or router control — e.g. tabs-as-navigation.
 * - RTL follows the Radix `dir`; the vertical accent uses a logical
 *   inline-start offset so it mirrors correctly.
 *
 * Responsive: on phones the tab strip is hidden and `TabsList` renders a
 * Foundation Select instead (the Tailwind UI "tabs collapse to a dropdown"
 * pattern), switching to the full strip at `sm+`. The dropdown is wired to the
 * same state as the tabs: the root is lightly controlled (via
 * `useControllableState`, supporting both `defaultValue` and a controlled
 * `value`) and publishes `{ value, setValue }` on an internal context that
 * `TabsList` consumes — Radix does not expose its own context to children. The
 * dropdown options are derived from the `TabsTrigger` children.
 *
 * Built on the unified `radix-ui` import (for consistency with the rest of the
 * foundation library) rather than `@radix-ui/react-tabs`. To productionise,
 * copy the body into `packages/ui/src/components/tabs.tsx` and swap the unified
 * `radix-ui` import for `@radix-ui/react-tabs`. `ref`, `className`, and handlers
 * pass straight through via the `...props` spread (React 19 ref-as-prop).
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
  React.useEffect(() => {
    onChangeRef.current = onChange;
  });

  const setValue = React.useCallback(
    (next: string) => {
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
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Foundation Tabs parts must be used within <Tabs>.');
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
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const [tabValue, setTabValue] = useControllableState({
    prop: value,
    defaultProp: defaultValue,
    onChange: onValueChange,
  });

  return (
    <TabsContext.Provider value={{ value: tabValue, setValue: setTabValue }}>
      <TabsPrimitive.Root
        data-slot="tabs"
        value={tabValue}
        onValueChange={setTabValue}
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

function TabsList({
  className,
  children,
  mobileSelectLabel = 'Select a tab',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & {
  /**
   * Accessible label + placeholder for the phone-width Select the list
   * collapses into. Kept in lockstep with `packages/ui`'s tabs.
   */
  mobileSelectLabel?: string;
}) {
  const { value, setValue } = useTabsContext();
  // Scope the sliding indicator's `layoutId` to this list so multiple Tabs on
  // one page each animate their own bar instead of fighting over a shared one.
  const layoutGroupId = React.useId();

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
        <TabsPrimitive.List
          data-slot="tabs-list"
          className={cn(
            'text-muted-foreground hidden h-auto w-fit items-center justify-start gap-1 sm:inline-flex',
            'group-data-[orientation=vertical]/tabs:flex-col group-data-[orientation=vertical]/tabs:gap-0.5',
            className,
          )}
          {...props}
        >
          {children}
        </TabsPrimitive.List>
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
  const isActive = value !== undefined && value === activeValue;

  const indicator = isActive ? (
    <motion.span
      layoutId="tab-indicator"
      aria-hidden="true"
      className={cn(
        'bg-primary pointer-events-none absolute rounded-full',
        // Horizontal: bottom underline. Vertical: inline-start bar.
        'group-data-[orientation=horizontal]/tabs:inset-x-2 group-data-[orientation=horizontal]/tabs:-bottom-2.5 group-data-[orientation=horizontal]/tabs:h-0.5',
        'group-data-[orientation=vertical]/tabs:inset-y-1 group-data-[orientation=vertical]/tabs:-start-px group-data-[orientation=vertical]/tabs:w-0.5',
      )}
    />
  ) : null;

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      value={value}
      asChild={asChild}
      className={cn(
        // Transparent text trigger with a subtle hover surface, mapped onto
        // foundation tokens — the underline does the work.
        "text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring not-disabled:hover:bg-muted not-disabled:hover:text-foreground data-[state=active]:text-foreground relative inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-base/6 font-medium transition-colors focus-visible:outline-1 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm/5 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        // Vertical orientation: full-width, left-aligned triggers.
        'group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start',
        className,
      )}
      {...props}
    >
      {asChild ? <Slot.Slottable>{children}</Slot.Slottable> : children}
      {indicator}
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
