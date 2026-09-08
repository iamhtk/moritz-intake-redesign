'use client';

import { useMemo } from 'react';
import { Separator } from '@repo/ui/components/separator';
import { Text } from '@repo/ui/components/text';
import {
  PaymentCard,
  groupPayments,
} from '@/components/cases/billing/payment-card';
import { getInvoicesForCase } from '@/lib/mocks/billing';
import type { LegalCase } from '@/lib/types';

export function ClientPaymentsList({ legalCase }: { legalCase: LegalCase }) {
  const invoices = getInvoicesForCase(legalCase.id);
  const { active, history } = useMemo(
    () => groupPayments(invoices),
    [invoices],
  );

  if (invoices.length === 0) {
    return (
      <Text className="mz-animate-step text-muted-foreground text-sm">
        No payments have been requested for this case yet.
      </Text>
    );
  }

  return (
    <div className="mz-animate-step space-y-3">
      {active.map(({ invoice, state }) => (
        <PaymentCard key={invoice.id} invoice={invoice} state={state} />
      ))}

      {active.length > 0 && history.length > 0 && (
        <div className="flex items-center gap-3 pt-1">
          <Separator className="flex-1" />
          <span className="text-muted-foreground text-xs font-medium">
            History
          </span>
          <Separator className="flex-1" />
        </div>
      )}

      {history.map(({ invoice, state }) => (
        <PaymentCard key={invoice.id} invoice={invoice} state={state} />
      ))}
    </div>
  );
}
