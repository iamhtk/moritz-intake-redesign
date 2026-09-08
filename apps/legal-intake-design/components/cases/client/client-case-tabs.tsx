'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs';
import { DocumentList } from '@/components/cases/document-list';
import { ParticipantList } from '@/components/cases/participant-list';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@/components/design/design-system/button';
import { Link } from '@/i18n/navigation';
import { FormattedDate } from '@/components/formatted-date';
import { Muted } from '@/components/design/design-system/typography';
import { getInvoicesForCase } from '@/lib/mocks/billing';
import { formatCurrency } from '@/lib/utils';
import type { LegalCase } from '@/lib/types';

export function ClientCaseTabs({ legalCase }: { legalCase: LegalCase }) {
  const invoices = getInvoicesForCase(legalCase.id);
  return (
    <Tabs defaultValue="documents">
      <TabsList>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="participants">Participants</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>

      <TabsContent value="documents" className="mt-4">
        <DocumentList documents={legalCase.documents} />
      </TabsContent>

      <TabsContent value="participants" className="mt-4">
        <ParticipantList participants={legalCase.participants} />
      </TabsContent>

      <TabsContent value="billing" className="mt-4">
        {invoices.length === 0 ? (
          <Muted>No invoices yet.</Muted>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
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
                  <TableCell className="text-right">
                    {inv.status === 'OPEN' && inv.hostedUrl && (
                      <Button asChild size="sm">
                        <Link
                          href={`/client/cases/${legalCase.id}/payment-success`}
                        >
                          Pay
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>
    </Tabs>
  );
}
