'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Ban,
  CheckCircle2,
  CircleAlert,
  CreditCard,
  Plus,
  RotateCcw,
} from '@repo/ui/icons';
import type { LucideProps } from '@repo/ui/icons';
import { Button } from '@repo/ui/components/button';
import { FormattedDate } from '@/components/formatted-date';
import { getInvoicesForCase } from '@/lib/mocks/billing';
import type { Invoice, Message } from '@/lib/types';
import { ChatEventCard, type ChatEventTone } from './chat-event-card';

type PaymentEvent = NonNullable<Message['paymentEvent']>;

type PaymentConfig = {
  icon: ComponentType<LucideProps>;
  tone: ChatEventTone;
  title: string;
  metaLabel: string;
  amountStruck?: boolean;
  actions?: React.ReactNode;
};

function PayButton({ label }: { label: string }) {
  return (
    <Button
      size="sm"
      onClick={() => toast.success('Payment initiated (mock).')}
    >
      {label}
    </Button>
  );
}

function ViewInvoiceLink({ invoice }: { invoice: Invoice | null }) {
  if (!invoice?.hostedUrl) return null;
  return (
    <Button asChild size="sm" variant="link" className="h-auto px-0">
      <Link href={invoice.hostedUrl} target="_blank" rel="noopener noreferrer">
        View invoice
      </Link>
    </Button>
  );
}

function getConfig(
  event: PaymentEvent,
  invoice: Invoice | null,
): PaymentConfig {
  switch (event.kind) {
    case 'completed':
      return {
        icon: CheckCircle2,
        tone: 'success',
        title: 'Payment received',
        metaLabel: 'Paid',
        actions: <ViewInvoiceLink invoice={invoice} />,
      };
    case 'failed':
      return {
        icon: CircleAlert,
        tone: 'destructive',
        title: 'Payment failed',
        metaLabel: 'Last tried',
        actions: (
          <>
            <PayButton label="Try again" />
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.success('Update payment method (mock).')}
            >
              Update payment method
            </Button>
          </>
        ),
      };
    case 'refunded':
      return {
        icon: RotateCcw,
        tone: 'muted',
        title: 'Payment refunded',
        metaLabel: 'Refunded',
      };
    case 'voided':
      return {
        icon: Ban,
        tone: 'muted',
        title: 'Payment request cancelled',
        metaLabel: 'Cancelled',
        amountStruck: true,
      };
    case 'requested':
    default:
      return event.additional
        ? {
            icon: Plus,
            tone: 'default',
            title: 'Additional payment requested',
            metaLabel: 'Requested',
            actions: <PayButton label="Pay invoice" />,
          }
        : {
            icon: CreditCard,
            tone: 'default',
            title: 'Payment requested',
            metaLabel: 'Requested',
            actions: <PayButton label="Pay invoice" />,
          };
  }
}

/**
 * A payment milestone rendered inline in the case chat as an actionable card,
 * using the same icons/tones/copy/CTAs as the client Payments tab.
 */
export function PaymentEventCard({
  event,
  createdAt,
  caseId,
}: {
  event: PaymentEvent;
  createdAt: string;
  caseId: string;
}) {
  const invoice = event.invoiceId
    ? (getInvoicesForCase(caseId).find((i) => i.id === event.invoiceId) ?? null)
    : null;
  const config = getConfig(event, invoice);

  // A linked invoice's note only reads correctly on the milestone it describes
  // (a refund/cancellation/additional-charge explanation). Routine "requested"
  // and "received" cards stay clean, matching how the Payments tab surfaces it.
  const showDescription =
    event.kind === 'refunded' ||
    event.kind === 'voided' ||
    (event.kind === 'requested' && event.additional);

  return (
    <ChatEventCard
      icon={config.icon}
      tone={config.tone}
      title={config.title}
      meta={
        <>
          {config.metaLabel}{' '}
          <FormattedDate date={createdAt} options={{ dateStyle: 'medium' }} />
        </>
      }
      amount={event.amount}
      currency={event.currency}
      amountStruck={config.amountStruck}
      description={
        showDescription ? (invoice?.description ?? undefined) : undefined
      }
      actions={config.actions}
    />
  );
}
