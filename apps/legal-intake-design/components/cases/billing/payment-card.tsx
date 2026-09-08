'use client';

import type { ComponentType, ReactNode } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import {
  Ban,
  CheckCircle2,
  CircleAlert,
  CreditCard,
  Loader2,
  Plus,
  RotateCcw,
} from '@repo/ui/icons';
import type { LucideProps } from '@repo/ui/icons';
import { FormattedDate } from '@/components/formatted-date';
import type { Invoice } from '@/lib/types';

/**
 * A payment as the client sees it — the same card whether the client is being
 * asked to pay it or an admin is checking what was asked. Admins render it
 * read-only, since the actions are the client's to take.
 */

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * The state each invoice presents to the client. Derived from the raw invoice
 * status plus a couple of signals (a failed payment attempt, whether the case
 * already has a completed payment, and any refund) so a single case can show a
 * realistic mix of payment moments.
 */
export type PaymentState =
  | 'requested'
  | 'additional'
  | 'failed'
  | 'processing'
  | 'completed'
  | 'refunded'
  | 'cancelled';

/** Active states sit above the "History" divider; the rest below it. */
const ACTIVE_STATES: ReadonlySet<PaymentState> = new Set([
  'requested',
  'additional',
  'failed',
  'processing',
]);

function deriveState(
  invoice: Invoice,
  caseHasCompleted: boolean,
): PaymentState {
  switch (invoice.status) {
    case 'PROCESSING':
      return 'processing';
    case 'PAID':
      return invoice.refundedAmount ? 'refunded' : 'completed';
    case 'VOID':
    case 'UNCOLLECTIBLE':
      return 'cancelled';
    case 'OPEN':
    case 'DRAFT':
    default:
      if (invoice.failure) return 'failed';
      return caseHasCompleted ? 'additional' : 'requested';
  }
}

export type PaymentEntry = { invoice: Invoice; state: PaymentState };

/** Splits a case's invoices into what still needs doing and what is done. */
export function groupPayments(invoices: Invoice[]): {
  active: PaymentEntry[];
  history: PaymentEntry[];
} {
  const caseHasCompleted = invoices.some((inv) => inv.status === 'PAID');
  const withState = invoices.map((invoice) => ({
    invoice,
    state: deriveState(invoice, caseHasCompleted),
  }));

  const byCreatedAsc = (a: PaymentEntry, b: PaymentEntry) =>
    new Date(a.invoice.createdAt).getTime() -
    new Date(b.invoice.createdAt).getTime();

  return {
    active: withState
      .filter((i) => ACTIVE_STATES.has(i.state))
      .sort(byCreatedAsc),
    history: withState
      .filter((i) => !ACTIVE_STATES.has(i.state))
      .sort((a, b) => {
        const dateA = new Date(
          a.invoice.paidAt ?? a.invoice.createdAt,
        ).getTime();
        const dateB = new Date(
          b.invoice.paidAt ?? b.invoice.createdAt,
        ).getTime();
        return dateA - dateB;
      }),
  };
}

type Tone = 'default' | 'muted' | 'success' | 'destructive';

const TONE_CLASS: Record<Tone, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  success: 'text-success',
  destructive: 'text-destructive',
};

type CardConfig = {
  icon: ComponentType<LucideProps>;
  tone: Tone;
  title: string;
  meta: ReactNode;
  amount: number;
  amountStruck?: boolean;
  detail?: ReactNode;
  actions?: ReactNode;
};

function PayButton({
  invoiceId,
  label,
  variant,
}: {
  invoiceId: string;
  label: string;
  variant?: 'default' | 'outline';
}) {
  return (
    <Button
      size="sm"
      variant={variant}
      onClick={() => toast.success('Payment initiated (mock).')}
      data-testid={`pay-invoice-${invoiceId}`}
    >
      {label}
    </Button>
  );
}

function ViewInvoiceLink({ invoice }: { invoice: Invoice }) {
  if (!invoice.hostedUrl) return null;
  return (
    <Button asChild size="sm" variant="link" className="h-auto px-0">
      <Link href={invoice.hostedUrl} target="_blank" rel="noopener noreferrer">
        View invoice
      </Link>
    </Button>
  );
}

function getConfig(invoice: Invoice, state: PaymentState): CardConfig {
  const { currency } = invoice;
  const total = invoice.amount + (invoice.taxAmount ?? 0);
  const dateMeta = (label: string, date: string) => (
    <>
      {label} <FormattedDate date={date} options={{ dateStyle: 'medium' }} />
    </>
  );

  switch (state) {
    case 'failed':
      return {
        icon: CircleAlert,
        tone: 'destructive',
        title: 'Payment failed',
        meta: invoice.failure
          ? dateMeta('Last tried', invoice.failure.attemptedAt)
          : 'Payment could not be processed',
        amount: total,
        detail: invoice.failure ? (
          <span className="text-destructive">{invoice.failure.reason}</span>
        ) : null,
        actions: (
          <>
            <PayButton invoiceId={invoice.id} label="Try again" />
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
    case 'processing':
      return {
        icon: (props) => (
          <Loader2 {...props} className={cn(props.className, 'animate-spin')} />
        ),
        tone: 'muted',
        title: 'Payment processing',
        meta: 'Awaiting bank confirmation',
        amount: total,
      };
    case 'completed':
      return {
        icon: CheckCircle2,
        tone: 'success',
        title: 'Paid',
        meta: dateMeta('Paid', invoice.paidAt ?? invoice.createdAt),
        amount: total,
        actions: <ViewInvoiceLink invoice={invoice} />,
      };
    case 'refunded': {
      const refunded = invoice.refundedAmount ?? 0;
      const isPartial = refunded < total;
      return {
        icon: RotateCcw,
        tone: 'muted',
        title: isPartial ? 'Partially refunded' : 'Refunded',
        meta: (
          <>
            {formatCurrency(refunded, currency)} refunded ·{' '}
            <FormattedDate
              date={invoice.refundedAt ?? invoice.paidAt ?? invoice.createdAt}
              options={{ dateStyle: 'medium' }}
            />
          </>
        ),
        amount: total - refunded,
        actions: <ViewInvoiceLink invoice={invoice} />,
      };
    }
    case 'cancelled':
      return {
        icon: Ban,
        tone: 'muted',
        title: 'Request cancelled',
        meta: 'Cancelled by your legal team',
        amount: total,
        amountStruck: true,
      };
    case 'additional':
      return {
        icon: Plus,
        tone: 'default',
        title: 'Additional payment',
        meta: dateMeta('Requested', invoice.createdAt),
        amount: total,
        actions: <PayButton invoiceId={invoice.id} label="Pay invoice" />,
      };
    case 'requested':
    default:
      return {
        icon: CreditCard,
        tone: 'default',
        title: 'Payment requested',
        meta: dateMeta('Requested', invoice.createdAt),
        amount: total,
        actions: <PayButton invoiceId={invoice.id} label="Pay invoice" />,
      };
  }
}

/**
 * The admin's optional "note for client" on the invoice (the `description`
 * field). Surfaced as a distinct callout so it reads as a message from the
 * legal team rather than a system field.
 */
function ClientNote({ note }: { note: string }) {
  return (
    <blockquote className="border-border/60 text-muted-foreground border-l-2 pl-3 text-xs italic leading-relaxed">
      &ldquo;{note}&rdquo;
    </blockquote>
  );
}

export function PaymentCard({
  invoice,
  state,
  readOnly = false,
}: {
  invoice: Invoice;
  state: PaymentState;
  /** Drops the client's own buttons — an admin is reading, not paying. */
  readOnly?: boolean;
}) {
  const config = getConfig(invoice, state);
  const Icon = config.icon;

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="flex flex-col gap-3 p-4">
        {/* Header: status marker + title/meta on the left, amount on the right. */}
        <div className="flex items-start gap-2.5">
          <Icon
            className={cn('mt-0.5 size-4 shrink-0', TONE_CLASS[config.tone])}
            aria-hidden="true"
          />
          <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight">
                {config.title}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {config.meta}
              </p>
            </div>
            <p
              className={cn(
                'shrink-0 text-sm font-semibold tabular-nums',
                config.amountStruck &&
                  'text-muted-foreground font-normal line-through',
              )}
            >
              {formatCurrency(config.amount, invoice.currency)}
            </p>
          </div>
        </div>

        {/* Body: full-width, aligned to the card edge so the icon leads into it. */}
        {invoice.description ? <ClientNote note={invoice.description} /> : null}

        {config.detail ? <p className="text-xs">{config.detail}</p> : null}

        {config.actions && !readOnly ? (
          <div className="flex flex-wrap items-center gap-2">
            {config.actions}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
