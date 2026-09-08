'use client';

import { Badge } from '@repo/ui/components/badge';
import { Button } from '@/components/design/design-system/button';
import { Input } from '@/components/design/design-system/input';
import { Field, FieldLabel } from '@repo/ui/components/field';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import { FormattedDate } from '@/components/formatted-date';
import { getInvoicesForCase } from '@/lib/mocks/billing';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { LegalCase } from '@/lib/types';

export function AdminBillingPanel({ legalCase }: { legalCase: LegalCase }) {
  const invoices = getInvoicesForCase(legalCase.id);

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast.success('Invoice created (mock).');
        }}
        className="bg-muted/40 grid gap-3 rounded-md p-3 md:grid-cols-3"
      >
        <Field>
          <FieldLabel htmlFor="amount">Amount</FieldLabel>
          <Input id="amount" type="number" placeholder="0.00" />
        </Field>
        <Field>
          <FieldLabel htmlFor="currency">Currency</FieldLabel>
          <Input id="currency" defaultValue={legalCase.currency} />
        </Field>
        <div className="flex items-end">
          <Button type="submit" className="w-full">
            Create invoice
          </Button>
        </div>
      </form>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground p-6 text-center"
                >
                  No invoices yet.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">
                    {inv.number}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(inv.amount, inv.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        inv.status === 'PAID'
                          ? 'success'
                          : inv.status === 'OPEN'
                            ? 'info'
                            : 'secondary'
                      }
                    >
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    <FormattedDate date={inv.createdAt} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {inv.paidAt ? (
                      <FormattedDate date={inv.paidAt} />
                    ) : (
                      'Unpaid'
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
