'use client';

import { Badge } from '@repo/ui/components/badge';
import { Button } from '@/components/design/design-system/button';
import { Card, CardContent } from '@/components/design/design-system/card';
import { Input } from '@/components/design/design-system/input';
import { Field, FieldLabel } from '@repo/ui/components/field';
import { FormattedDate } from '@/components/formatted-date';
import { MOCK_QUOTE_ROUNDS } from '@/lib/mocks/quotes';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Muted } from '@/components/design/design-system/typography';
import type { LegalCase } from '@/lib/types';

export function AdminQuoteRoundPanel({ legalCase }: { legalCase: LegalCase }) {
  const round = MOCK_QUOTE_ROUNDS.find((q) => q.caseId === legalCase.id);

  if (!round) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast.success('Quote round created (mock).');
        }}
        className="space-y-3"
      >
        <Muted>Open a quote round to collect bids from invited firms.</Muted>
        <div className="grid gap-3 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="benchmark">Benchmark price</FieldLabel>
            <Input id="benchmark" type="number" placeholder="0" />
          </Field>
          <Field>
            <FieldLabel htmlFor="expiry">Auction expiry</FieldLabel>
            <Input id="expiry" type="datetime-local" />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button type="submit">Open quote round</Button>
        </div>
      </form>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="font-mono text-xs">
            {round.caseNumber}
          </Badge>
          {round.conflictReported && (
            <Badge variant="destructive">Conflict</Badge>
          )}
        </div>
        <div className="grid gap-3 text-sm md:grid-cols-3">
          <div>
            <div className="text-muted-foreground text-xs">Benchmark</div>
            <div className="font-medium">
              {round.benchmarkAmount
                ? formatCurrency(round.benchmarkAmount, round.currency)
                : '—'}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Your quote</div>
            <div className="font-medium">
              {round.yourQuoteAmount
                ? formatCurrency(round.yourQuoteAmount, round.currency)
                : '—'}{' '}
              <span className="text-muted-foreground text-xs">
                ({round.yourQuoteStatus})
              </span>
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Expires</div>
            <div className="text-xs">
              <FormattedDate
                date={round.expiresAt}
                options={{ dateStyle: 'short', timeStyle: 'short' }}
              />
            </div>
          </div>
        </div>
        {round.adminNotes && (
          <p className="text-muted-foreground text-xs italic">
            {round.adminNotes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
