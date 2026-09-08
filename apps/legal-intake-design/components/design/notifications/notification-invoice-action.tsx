'use client';

import { toast } from 'sonner';
import { Button } from '@/components/design/design-system/button';

/**
 * NotificationInvoiceAction — design-playground replica of the production
 * `components/notifications/notification-invoice-action.tsx`. The production
 * version calls `clientCaseBilling.payInvoice` and redirects to Stripe Checkout;
 * per the playground rules we stub the mutation with a toast instead. The button
 * stops event propagation so it doesn't trigger the row's stretched link.
 */
export function NotificationInvoiceAction({
  invoiceId,
}: {
  invoiceId: string;
}) {
  return (
    <Button
      type="button"
      size="sm"
      className="relative z-10"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toast.success('Payment initiated (mock).');
      }}
      data-testid={`notification-pay-invoice-${invoiceId}`}
    >
      Pay invoice
    </Button>
  );
}
