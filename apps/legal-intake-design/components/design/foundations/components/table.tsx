'use client';

import * as React from 'react';

import { cn } from '@repo/ui/lib/utils';

/**
 * Foundation Table — design-iteration port of the Catalyst table, restyled onto
 * the foundation palette. It brings over Catalyst's full behavior — the
 * `bleed` / `dense` / `grid` / `striped` props (shared via context), rows that
 * act as links, and the `--gutter` scroll model (a `flow-root` wrapper with
 * `overflow-x-auto whitespace-nowrap`, so wide grids scroll horizontally
 * instead of wrapping) — but keeps the shadcn part names the app composes by
 * hand (`TableRow` + `TableCell` with `.map()`), so it stays a drop-in.
 *
 * Note the naming stays shadcn, not Catalyst: `TableHeader` is the `<thead>`
 * and `TableHead` is the `<th>` (the reverse of Catalyst). `TableFooter` and
 * `TableCaption` have no Catalyst equivalent and are kept for the totals row and
 * caption used across the app grids.
 *
 * Colors come from foundation tokens rather than Catalyst's zinc scale:
 * `text-foreground` body text, `text-muted-foreground` headers, `border-border`
 * row/column rules, and a `bg-muted/50` hover / `bg-muted` selected state. The
 * row also lights up on `has-aria-expanded` so a row that owns an expanded
 * control reads as active. No `dark:` variants — the app has no class-based
 * dark mode.
 *
 * TODO(@repo/ui): fold this back into `packages/ui/src/components/table.tsx`
 * during productionisation.
 */

const TableContext = React.createContext<{
  bleed: boolean;
  dense: boolean;
  grid: boolean;
  striped: boolean;
}>({
  bleed: false,
  dense: false,
  grid: false,
  striped: false,
});

function Table({
  bleed = false,
  dense = false,
  grid = false,
  striped = false,
  className,
  ...props
}: {
  bleed?: boolean;
  dense?: boolean;
  grid?: boolean;
  striped?: boolean;
} & React.ComponentProps<'table'>) {
  return (
    <TableContext.Provider value={{ bleed, dense, grid, striped }}>
      <div className="flow-root [--gutter:--spacing(2)]">
        <div
          data-slot="table-container"
          className="-mx-(--gutter) overflow-x-auto whitespace-nowrap"
        >
          <div
            className={cn(
              'inline-block min-w-full align-middle',
              !bleed && 'sm:px-(--gutter)',
            )}
          >
            <table
              data-slot="table"
              className={cn(
                'text-foreground min-w-full caption-bottom text-left text-sm/6',
                className,
              )}
              {...props}
            />
          </div>
        </div>
      </div>
    </TableContext.Provider>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn('text-muted-foreground', className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody data-slot="table-body" className={className} {...props} />;
}

const TableRowContext = React.createContext<{
  href?: string;
  target?: string;
  title?: string;
}>({
  href: undefined,
  target: undefined,
  title: undefined,
});

function TableRow({
  href,
  target,
  title,
  className,
  ...props
}: {
  href?: string;
  target?: string;
  title?: string;
} & React.ComponentProps<'tr'>) {
  const { striped } = React.useContext(TableContext);

  return (
    <TableRowContext.Provider value={{ href, target, title }}>
      <tr
        data-slot="table-row"
        className={cn(
          'transition-colors',
          href &&
            'has-[[data-row-link][data-focus]]:outline-ring has-[[data-row-link][data-focus]]:outline-2 has-[[data-row-link][data-focus]]:-outline-offset-2',
          striped && 'even:bg-muted/50',
          href && striped && 'hover:bg-muted',
          href && !striped && 'hover:bg-muted/50',
          'has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted',
          className,
        )}
        {...props}
      />
    </TableRowContext.Provider>
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        'bg-muted/50 border-t font-medium [&>tr]:last:border-b-0',
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  const { bleed, grid } = React.useContext(TableContext);

  return (
    <th
      data-slot="table-head"
      className={cn(
        'border-border first:pl-(--gutter,--spacing(2)) last:pr-(--gutter,--spacing(2)) border-b px-4 py-2 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        grid && 'border-border border-l first:border-l-0',
        !bleed && 'sm:first:pl-1 sm:last:pr-1',
        className,
      )}
      {...props}
    />
  );
}

function TableCell({
  className,
  children,
  ...props
}: React.ComponentProps<'td'>) {
  const { bleed, dense, grid, striped } = React.useContext(TableContext);
  const { href, target, title } = React.useContext(TableRowContext);
  const [cellRef, setCellRef] = React.useState<HTMLElement | null>(null);

  return (
    <td
      ref={href ? setCellRef : undefined}
      data-slot="table-cell"
      className={cn(
        'first:pl-(--gutter,--spacing(2)) last:pr-(--gutter,--spacing(2)) relative px-4 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        !striped && 'border-border border-b',
        grid && 'border-border border-l first:border-l-0',
        dense ? 'py-2.5' : 'py-4',
        !bleed && 'sm:first:pl-1 sm:last:pr-1',
        className,
      )}
      {...props}
    >
      {href && (
        <a
          data-row-link
          href={href}
          target={target}
          aria-label={title}
          tabIndex={cellRef?.previousElementSibling === null ? 0 : -1}
          className="focus:outline-hidden absolute inset-0"
        />
      )}
      {children}
    </td>
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('text-muted-foreground mt-4 text-sm', className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
