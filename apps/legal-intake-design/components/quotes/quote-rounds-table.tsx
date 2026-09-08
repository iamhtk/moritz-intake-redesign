'use client';

import { Link } from '@/i18n/navigation';
import { Badge } from '@repo/ui/components/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import { FormattedDate } from '@/components/formatted-date';
import { MOCK_QUOTE_ROUNDS } from '@/lib/mocks/quotes';
import { formatCurrency } from '@/lib/utils';

const STATUS_VARIANT = {
  NONE: 'secondary',
  SUBMITTED: 'info',
  WITHDRAWN: 'secondary',
  CONFLICT: 'destructive',
  WON: 'success',
  LOST: 'secondary',
} as const;

export function QuoteRoundsTable() {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Case</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Benchmark</TableHead>
            <TableHead>Your quote</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Expires</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {MOCK_QUOTE_ROUNDS.map((q) => (
            <TableRow key={q.id}>
              <TableCell>
                <Link
                  href={`/legal/quotes/${q.caseId}`}
                  className="font-medium hover:underline"
                >
                  {q.caseTitle}
                </Link>
                <div className="text-muted-foreground font-mono text-xs">
                  {q.caseNumber}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {q.clientCompany}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {q.benchmarkAmount
                  ? formatCurrency(q.benchmarkAmount, q.currency)
                  : '—'}
              </TableCell>
              <TableCell>
                {q.yourQuoteAmount
                  ? formatCurrency(q.yourQuoteAmount, q.currency)
                  : '—'}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[q.yourQuoteStatus]}>
                  {q.yourQuoteStatus}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                <FormattedDate
                  date={q.expiresAt}
                  options={{ dateStyle: 'short', timeStyle: 'short' }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
