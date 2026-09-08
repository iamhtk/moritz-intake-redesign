'use client';

import { useMemo } from 'react';
import { toast } from 'sonner';
import { Field, FieldLabel } from '@repo/ui/components/field';
import { Separator } from '@repo/ui/components/separator';
import { Button } from '@/components/design/design-system/button';
import { Input } from '@/components/design/design-system/input';
import { Textarea } from '@/components/design/design-system/textarea';
import {
  PaymentCard,
  groupPayments,
} from '@/components/cases/billing/payment-card';
import {
  PanelEmpty,
  PanelSection,
} from '@/components/cases/case-detail-primitives';
import { getInvoicesForCase } from '@/lib/mocks/billing';
import type { LegalCase } from '@/lib/types';

/**
 * Client-facing admin controls in the "Case details" panel: request a payment
 * and review the invoices the client sees. The case's files live in their own
 * Documents tab, as they do for the client.
 */
export function AdminForClientPanel({ legalCase }: { legalCase: LegalCase }) {
  const invoices = getInvoicesForCase(legalCase.id);
  const { active, history } = useMemo(
    () => groupPayments(invoices),
    [invoices],
  );

  return (
    <div className="mz-animate-step space-y-8">
      <PanelSection title="Billing">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            toast.success('Invoice created (mock).');
          }}
          className="border-field space-y-3 rounded-xl border p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="invoice-amount">Amount</FieldLabel>
              <Input id="invoice-amount" type="number" placeholder="0.00" />
            </Field>
            <Field>
              <FieldLabel htmlFor="invoice-currency">Currency</FieldLabel>
              <Input id="invoice-currency" defaultValue={legalCase.currency} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="invoice-note">Note for client</FieldLabel>
            <Textarea
              id="invoice-note"
              rows={3}
              placeholder="Optional — a short message the client sees with this payment request (e.g. what it covers, or why an extra payment is needed)."
            />
          </Field>
          <Button type="submit" className="w-full">
            Create invoice
          </Button>
        </form>

        {/*
         * The same payment cards the client is looking at, minus their buttons,
         * so an admin can see exactly what was asked of them and in what words.
         */}
        {invoices.length === 0 ? (
          <PanelEmpty>No invoices yet.</PanelEmpty>
        ) : (
          <div className="space-y-3">
            {active.map(({ invoice, state }) => (
              <PaymentCard
                key={invoice.id}
                invoice={invoice}
                state={state}
                readOnly
              />
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
              <PaymentCard
                key={invoice.id}
                invoice={invoice}
                state={state}
                readOnly
              />
            ))}
          </div>
        )}
      </PanelSection>
    </div>
  );
}
