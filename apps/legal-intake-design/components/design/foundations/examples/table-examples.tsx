'use client';

import * as React from 'react';

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from '@repo/ui/icons';

import { Badge } from '@/components/design/foundations/components/badge';
import { Button } from '@/components/design/foundations/components/button';
import { Checkbox } from '@/components/design/foundations/components/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/design/foundations/components/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/design/foundations/components/table';

/**
 * Static demo data + interactive table examples for the Table foundation page.
 * Mirrors how the app composes the primitives by hand (sortable header buttons,
 * status badges, clickable rows, custom pagination) without any tRPC/data layer,
 * so the showcase page stays self-contained.
 */

type CaseStatus =
  | 'NEW'
  | 'READY_FOR_CLAIM'
  | 'IN_PROGRESS'
  | 'CLOSED'
  | 'DECLINED';

const CASE_STATUS: Record<
  CaseStatus,
  { label: string; variant: React.ComponentProps<typeof Badge>['variant'] }
> = {
  NEW: { label: 'New', variant: 'default' },
  READY_FOR_CLAIM: { label: 'Ready for claim', variant: 'warning' },
  IN_PROGRESS: { label: 'In progress', variant: 'info' },
  CLOSED: { label: 'Closed', variant: 'secondary' },
  DECLINED: { label: 'Declined', variant: 'destructive' },
};

type CaseRow = {
  id: string;
  caseNumber: number;
  title: string;
  customer: string;
  status: CaseStatus;
  amount: number;
  createdLabel: string;
  createdTs: number;
};

const CASES: CaseRow[] = [
  {
    id: 'c1',
    caseNumber: 1042,
    title: 'Series A financing review',
    customer: 'Acme Robotics',
    status: 'IN_PROGRESS',
    amount: 12500,
    createdLabel: 'Mar 3, 2026',
    createdTs: 1772668800000,
  },
  {
    id: 'c2',
    caseNumber: 1041,
    title: 'Trademark dispute — Northwind',
    customer: 'Northwind Co.',
    status: 'READY_FOR_CLAIM',
    amount: 8200,
    createdLabel: 'Mar 1, 2026',
    createdTs: 1772496000000,
  },
  {
    id: 'c3',
    caseNumber: 1040,
    title: 'Commercial lease termination',
    customer: 'Globex LLC',
    status: 'CLOSED',
    amount: 4500,
    createdLabel: 'Feb 26, 2026',
    createdTs: 1772064000000,
  },
  {
    id: 'c4',
    caseNumber: 1039,
    title: 'Employment agreement redraft',
    customer: 'Initech',
    status: 'NEW',
    amount: 3100,
    createdLabel: 'Feb 24, 2026',
    createdTs: 1771891200000,
  },
  {
    id: 'c5',
    caseNumber: 1038,
    title: 'Vendor contract negotiation',
    customer: 'Soylent Corp',
    status: 'IN_PROGRESS',
    amount: 15750,
    createdLabel: 'Feb 20, 2026',
    createdTs: 1771545600000,
  },
  {
    id: 'c6',
    caseNumber: 1037,
    title: 'IP assignment cleanup',
    customer: 'Hooli',
    status: 'READY_FOR_CLAIM',
    amount: 6400,
    createdLabel: 'Feb 18, 2026',
    createdTs: 1771372800000,
  },
  {
    id: 'c7',
    caseNumber: 1036,
    title: 'Data processing addendum',
    customer: 'Stark Industries',
    status: 'CLOSED',
    amount: 9800,
    createdLabel: 'Feb 14, 2026',
    createdTs: 1771027200000,
  },
  {
    id: 'c8',
    caseNumber: 1035,
    title: 'Founders stock vesting',
    customer: 'Wayne Enterprises',
    status: 'DECLINED',
    amount: 2200,
    createdLabel: 'Feb 11, 2026',
    createdTs: 1770768000000,
  },
  {
    id: 'c9',
    caseNumber: 1034,
    title: 'SaaS terms of service update',
    customer: 'Umbrella Co.',
    status: 'NEW',
    amount: 5300,
    createdLabel: 'Feb 7, 2026',
    createdTs: 1770422400000,
  },
  {
    id: 'c10',
    caseNumber: 1033,
    title: 'Partnership dissolution',
    customer: 'Cyberdyne',
    status: 'IN_PROGRESS',
    amount: 18900,
    createdLabel: 'Feb 4, 2026',
    createdTs: 1770163200000,
  },
  {
    id: 'c11',
    caseNumber: 1032,
    title: 'Privacy policy compliance audit',
    customer: 'Pied Piper',
    status: 'READY_FOR_CLAIM',
    amount: 7100,
    createdLabel: 'Jan 31, 2026',
    createdTs: 1769817600000,
  },
  {
    id: 'c12',
    caseNumber: 1031,
    title: 'Asset purchase agreement',
    customer: 'Tyrell Corp',
    status: 'CLOSED',
    amount: 24500,
    createdLabel: 'Jan 28, 2026',
    createdTs: 1769558400000,
  },
  {
    id: 'c13',
    caseNumber: 1030,
    title: 'NDA bulk template review',
    customer: 'Aperture Labs',
    status: 'NEW',
    amount: 1900,
    createdLabel: 'Jan 24, 2026',
    createdTs: 1769212800000,
  },
];

type SortKey = 'caseNumber' | 'title' | 'customer' | 'amount' | 'createdTs';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 5;
const amountFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function CasesTableExample() {
  const [sortKey, setSortKey] = React.useState<SortKey>('caseNumber');
  const [sortDir, setSortDir] = React.useState<SortDir>('desc');
  const [page, setPage] = React.useState(1);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const sorted = React.useMemo(() => {
    const rows = [...CASES];
    rows.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp: number;
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv;
      } else {
        cmp = String(av).localeCompare(String(bv));
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  }

  function ariaSort(key: SortKey): React.AriaAttributes['aria-sort'] {
    if (key !== sortKey) return 'none';
    return sortDir === 'asc' ? 'ascending' : 'descending';
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (column !== sortKey) {
      return <ArrowUpDown className="text-muted-foreground size-4" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="size-4" />
    ) : (
      <ArrowDown className="size-4" />
    );
  }

  function SortButton({ column, label }: { column: SortKey; label: string }) {
    return (
      <button
        type="button"
        onClick={() => handleSort(column)}
        className="flex w-full cursor-pointer items-center gap-2 text-left font-medium"
      >
        {label}
        <SortIcon column={column} />
      </button>
    );
  }

  return (
    <div className="w-full space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20" aria-sort={ariaSort('caseNumber')}>
              <SortButton column="caseNumber" label="Case" />
            </TableHead>
            <TableHead aria-sort={ariaSort('title')}>
              <SortButton column="title" label="Title" />
            </TableHead>
            <TableHead aria-sort={ariaSort('customer')}>
              <SortButton column="customer" label="Customer" />
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right" aria-sort={ariaSort('amount')}>
              <button
                type="button"
                onClick={() => handleSort('amount')}
                className="flex w-full cursor-pointer items-center justify-end gap-2 font-medium"
              >
                Quote
                <SortIcon column="amount" />
              </button>
            </TableHead>
            <TableHead aria-sort={ariaSort('createdTs')}>
              <SortButton column="createdTs" label="Created" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((row) => (
            <TableRow
              key={row.id}
              role="button"
              tabIndex={0}
              aria-label={`View case ${row.caseNumber}: ${row.title}`}
              data-state={selectedId === row.id ? 'selected' : undefined}
              onClick={() =>
                setSelectedId((id) => (id === row.id ? null : row.id))
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedId((id) => (id === row.id ? null : row.id));
                }
              }}
              className="focus-visible:ring-ring cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
            >
              <TableCell className="text-muted-foreground font-mono text-xs">
                #{row.caseNumber}
              </TableCell>
              <TableCell className="text-foreground font-medium">
                {row.title}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.customer}
              </TableCell>
              <TableCell>
                <Badge variant={CASE_STATUS[row.status].variant}>
                  {CASE_STATUS[row.status].label}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {amountFormatter.format(row.amount)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.createdLabel}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          Showing {(page - 1) * PAGE_SIZE + 1}–
          {Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Previous page"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft />
          </Button>
          {Array.from({ length: totalPages }).map((_, index) => {
            const pageNumber = index + 1;
            return (
              <Button
                key={pageNumber}
                variant={pageNumber === page ? 'secondary' : 'ghost'}
                size="icon-sm"
                aria-label={`Page ${pageNumber}`}
                aria-current={pageNumber === page ? 'page' : undefined}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </Button>
            );
          })}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Next page"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}

type QuoteStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

const QUOTE_STATUS: Record<
  QuoteStatus,
  { label: string; variant: React.ComponentProps<typeof Badge>['variant'] }
> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  SUBMITTED: { label: 'Submitted', variant: 'default' },
  ACCEPTED: { label: 'Accepted', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  WITHDRAWN: { label: 'Withdrawn', variant: 'outline' },
};

type QuoteRow = {
  id: string;
  quoteNumber: number;
  client: string;
  caseTitle: string;
  benchmark: string;
  yourQuote: string;
  status: QuoteStatus;
  expiryLabel: string;
  expired?: boolean;
};

const QUOTES: QuoteRow[] = [
  {
    id: 'q1',
    quoteNumber: 1042,
    client: 'Acme Robotics',
    caseTitle: 'Series A financing review',
    benchmark: '$11,000',
    yourQuote: '$12,500',
    status: 'SUBMITTED',
    expiryLabel: 'in 3 days',
  },
  {
    id: 'q2',
    quoteNumber: 1041,
    client: 'Northwind Co.',
    caseTitle: 'Trademark dispute',
    benchmark: '$8,500',
    yourQuote: '$8,200',
    status: 'ACCEPTED',
    expiryLabel: 'in 6 days',
  },
  {
    id: 'q3',
    quoteNumber: 1038,
    client: 'Soylent Corp',
    caseTitle: 'Vendor contract negotiation',
    benchmark: '$14,000',
    yourQuote: '$15,750',
    status: 'DRAFT',
    expiryLabel: 'in 9 days',
  },
  {
    id: 'q4',
    quoteNumber: 1035,
    client: 'Wayne Enterprises',
    caseTitle: 'Founders stock vesting',
    benchmark: '$2,500',
    yourQuote: '$2,200',
    status: 'REJECTED',
    expiryLabel: 'expired',
    expired: true,
  },
  {
    id: 'q5',
    quoteNumber: 1031,
    client: 'Tyrell Corp',
    caseTitle: 'Asset purchase agreement',
    benchmark: '$23,000',
    yourQuote: '$24,500',
    status: 'WITHDRAWN',
    expiryLabel: 'expired',
    expired: true,
  },
];

export function QuotesTableExample() {
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Quote</TableHead>
            <TableHead>Client</TableHead>
            <TableHead className="w-[280px]">Case title</TableHead>
            <TableHead className="w-28 text-right">Benchmark</TableHead>
            <TableHead className="w-28 text-right">Your quote</TableHead>
            <TableHead className="w-32">Status</TableHead>
            <TableHead className="w-28">Expiry</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {QUOTES.map((row) => (
            <TableRow key={row.id} className="cursor-pointer">
              <TableCell className="text-muted-foreground font-mono text-xs">
                #{row.quoteNumber}
              </TableCell>
              <TableCell className="text-foreground font-medium">
                {row.client}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.caseTitle}
              </TableCell>
              <TableCell className="text-muted-foreground text-right tabular-nums">
                {row.benchmark}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.yourQuote}
              </TableCell>
              <TableCell>
                <Badge variant={QUOTE_STATUS[row.status].variant}>
                  {QUOTE_STATUS[row.status].label}
                </Badge>
              </TableCell>
              <TableCell
                className={
                  row.expired
                    ? 'text-destructive text-sm'
                    : 'text-muted-foreground text-sm'
                }
              >
                {row.expiryLabel}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

type ProductRow = { id: string; name: string; price: string };

const PRODUCTS: ProductRow[] = [
  { id: 'p1', name: 'Engagement letter', price: '$0.00' },
  { id: 'p2', name: 'Hourly billing — partner', price: '$650.00' },
  { id: 'p3', name: 'Hourly billing — associate', price: '$320.00' },
  { id: 'p4', name: 'Fixed-fee NDA review', price: '$450.00' },
];

export function RowActionsTableExample() {
  return (
    <div className="w-full max-w-2xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="w-12 text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {PRODUCTS.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-foreground font-medium">
                {row.name}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.price}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${row.name}`}
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem>Copy item ID</DropdownMenuItem>
                    <DropdownMenuItem>View item</DropdownMenuItem>
                    <DropdownMenuItem>Edit item</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">
                      Delete item
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function RowSelectionTableExample() {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const allSelected = selected.size === PRODUCTS.length;
  const someSelected = selected.size > 0 && !allSelected;
  const headerState: boolean | 'indeterminate' = allSelected
    ? true
    : someSelected
      ? 'indeterminate'
      : false;

  function toggleAll() {
    setSelected((current) =>
      current.size === PRODUCTS.length
        ? new Set()
        : new Set(PRODUCTS.map((row) => row.id)),
    );
  }

  function toggleRow(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="w-full max-w-2xl space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={headerState}
                onCheckedChange={toggleAll}
                aria-label="Select all rows"
              />
            </TableHead>
            <TableHead>Item</TableHead>
            <TableHead className="text-right">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {PRODUCTS.map((row) => {
            const isSelected = selected.has(row.id);
            return (
              <TableRow
                key={row.id}
                data-state={isSelected ? 'selected' : undefined}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleRow(row.id)}
                    aria-label={`Select ${row.name}`}
                  />
                </TableCell>
                <TableCell className="text-foreground font-medium">
                  {row.name}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.price}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <p className="text-muted-foreground text-sm">
        {selected.size} of {PRODUCTS.length} row(s) selected.
      </p>
    </div>
  );
}

const CATALYST_ROWS = CASES.slice(0, 5);

export function StripedTableExample() {
  return (
    <div className="w-full max-w-2xl">
      <Table striped>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Case</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="text-right">Quote</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {CATALYST_ROWS.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-muted-foreground font-mono text-xs">
                #{row.caseNumber}
              </TableCell>
              <TableCell className="text-foreground font-medium">
                {row.title}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.customer}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {amountFormatter.format(row.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function GridTableExample() {
  return (
    <div className="w-full max-w-2xl">
      <Table grid>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Case</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="text-right">Quote</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {CATALYST_ROWS.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-muted-foreground font-mono text-xs">
                #{row.caseNumber}
              </TableCell>
              <TableCell className="text-foreground font-medium">
                {row.title}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.customer}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {amountFormatter.format(row.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function DenseTableExample() {
  return (
    <div className="w-full max-w-2xl">
      <Table dense>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Case</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="text-right">Quote</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {CASES.slice(0, 8).map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-muted-foreground font-mono text-xs">
                #{row.caseNumber}
              </TableCell>
              <TableCell className="text-foreground font-medium">
                {row.title}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.customer}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {amountFormatter.format(row.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function BleedTableExample() {
  return (
    <div className="bg-card w-full max-w-2xl rounded-lg border p-6 [--gutter:--spacing(6)]">
      <Table bleed>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Case</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="text-right">Quote</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {CATALYST_ROWS.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-muted-foreground font-mono text-xs">
                #{row.caseNumber}
              </TableCell>
              <TableCell className="text-foreground font-medium">
                {row.title}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {amountFormatter.format(row.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function RowsAsLinksTableExample() {
  return (
    <div className="w-full max-w-2xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Case</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="text-right">Quote</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {CATALYST_ROWS.map((row) => (
            <TableRow
              key={row.id}
              href={`#case-${row.caseNumber}`}
              title={`View case ${row.caseNumber}`}
            >
              <TableCell className="text-muted-foreground font-mono text-xs">
                #{row.caseNumber}
              </TableCell>
              <TableCell className="text-foreground font-medium">
                {row.title}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.customer}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {amountFormatter.format(row.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
