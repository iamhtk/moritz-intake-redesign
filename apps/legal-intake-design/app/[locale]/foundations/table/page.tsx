import type { Metadata } from 'next';
import { Skeleton } from '@repo/ui/components/skeleton';

import { Badge } from '@/components/design/foundations/components/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/design/foundations/components/table';
import {
  BleedTableExample,
  CasesTableExample,
  DenseTableExample,
  GridTableExample,
  QuotesTableExample,
  RowActionsTableExample,
  RowSelectionTableExample,
  RowsAsLinksTableExample,
  StripedTableExample,
} from '@/components/design/foundations/examples/table-examples';
import { Section } from '@/components/design/foundations/showcase/section';

export const metadata: Metadata = { title: 'Table · Foundations' };

export default function TableFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Table</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          The foundation table, built on the shadcn Table: the data grid used
          across the app for the lawyer cases list, quote rounds, and admin
          views. Grids are composed by hand from the primitives — sortable
          headers, status badges, loading and empty states, clickable rows, and
          pagination — rather than a column-definition abstraction.
        </p>
      </header>

      <Section
        title="Anatomy"
        description="The primitives: a header row of TableHead cells, a TableBody of rows, an optional TableFooter for totals, and a TableCaption below."
      >
        <div className="w-full max-w-2xl">
          <Table>
            <TableCaption>
              Open matters for the current billing period.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Case</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="text-right">Quote</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-muted-foreground font-mono text-xs">
                  #1042
                </TableCell>
                <TableCell className="font-medium">
                  Series A financing review
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  $12,500
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground font-mono text-xs">
                  #1041
                </TableCell>
                <TableCell className="font-medium">
                  Trademark dispute — Northwind
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  $8,200
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground font-mono text-xs">
                  #1040
                </TableCell>
                <TableCell className="font-medium">
                  Commercial lease termination
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  $4,500
                </TableCell>
              </TableRow>
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-right tabular-nums">
                  $25,200
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </Section>

      <Section
        title="Cases — sortable, clickable, paginated"
        description="The full lawyer cases grid: header cells carry aria-sort and a sort button (click a column to toggle direction), status cells render a Badge, rows are clickable (click to select — Enter/Space work too), and pagination sits below the table."
      >
        <CasesTableExample />
      </Section>

      <Section
        title="Row actions"
        description="Give each row a trailing actions column: a ghost icon button opens a DropdownMenu of per-row actions, with a destructive item separated at the end."
      >
        <RowActionsTableExample />
      </Section>

      <Section
        title="Row selection"
        description="A leading checkbox column. The header checkbox selects all and shows an indeterminate dash on a partial selection; selecting a row sets data-state=selected so the row highlights."
      >
        <RowSelectionTableExample />
      </Section>

      <Section
        title="Status badges"
        description="Statuses map to Badge variants so each state reads at a glance — the same pills used in the cases and quotes grids."
      >
        <div className="w-full max-w-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stage</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Intake</TableCell>
                <TableCell>
                  <Badge>New</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Claim</TableCell>
                <TableCell>
                  <Badge variant="warning">Ready for claim</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Active</TableCell>
                <TableCell>
                  <Badge variant="info">In progress</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Done</TableCell>
                <TableCell>
                  <Badge variant="success">Accepted</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Closed</TableCell>
                <TableCell>
                  <Badge variant="secondary">Closed</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Declined</TableCell>
                <TableCell>
                  <Badge variant="destructive">Declined</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Section>

      <Section
        title="Loading state"
        description="While data loads, render skeleton rows in place of cells so the grid keeps its shape — the app fills each row with a Skeleton bar."
      >
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
              {Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell colSpan={4} className="py-3">
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Section>

      <Section
        title="Empty state"
        description="When there are no rows, render a single full-width cell with a centered message using colSpan across every column."
      >
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
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-muted-foreground py-10 text-center"
                >
                  No cases match your filters.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Section>

      <Section
        title="Striped rows"
        description="Use the striped prop to render zebra rows with no horizontal borders — even rows take a bg-muted/50 wash."
      >
        <StripedTableExample />
      </Section>

      <Section
        title="Grid lines"
        description="Use the grid prop to add vertical column rules between cells."
      >
        <GridTableExample />
      </Section>

      <Section
        title="Condensed spacing"
        description="Use the dense prop to tighten the vertical cell padding for information-dense grids."
      >
        <DenseTableExample />
      </Section>

      <Section
        title="Full-width (bleed)"
        description="Use the bleed prop and set the --gutter variable to the container padding so the table runs edge to edge, bleeding into the gutter."
      >
        <BleedTableExample />
      </Section>

      <Section
        title="Rows as links"
        description="Give a TableRow an href to make the whole row a link: an overlay anchor spans the row, keyboard focus outlines the row, and hover highlights it."
      >
        <RowsAsLinksTableExample />
      </Section>

      <Section
        title="Quotes — fixed columns"
        description="The lawyer quote rounds list: a simpler grid with fixed columns, right-aligned amounts, status badges, and an expiry that turns destructive once passed."
      >
        <QuotesTableExample />
      </Section>
    </>
  );
}
