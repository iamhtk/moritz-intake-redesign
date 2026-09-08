import type { ComponentType, ReactNode } from 'react';
import { cn } from '@repo/ui/lib/utils';
import { Card, CardContent } from '@repo/ui/components/card';
import type { LucideProps } from '@repo/ui/icons';

/**
 * Shared shell for a case-timeline event card (payment, counsel assigned, …).
 * Mirrors the Payments tab `PaymentCard` anatomy — a header row (leading
 * media/icon, title + meta, optional right-aligned amount) above a full-width
 * body (an optional italic quoted note and an actions row) — so every in-chat
 * event reads in one consistent language.
 *
 * Rendered centered and width-capped so it presents as a system card in the
 * roomy chat column rather than a stretched panel.
 *
 * Net-new design component: lift alongside the chat when productionised.
 */

export type ChatEventTone = 'default' | 'muted' | 'success' | 'destructive';

const TONE_CLASS: Record<ChatEventTone, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  success: 'text-success',
  destructive: 'text-destructive',
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

type ChatEventCardProps = {
  /** Leading tone-colored lucide icon. Ignored when `media` is provided. */
  icon?: ComponentType<LucideProps>;
  /** Custom leading node (e.g. an avatar); takes precedence over `icon`. */
  media?: ReactNode;
  tone?: ChatEventTone;
  title: ReactNode;
  meta?: ReactNode;
  amount?: number;
  currency?: string;
  amountStruck?: boolean;
  description?: ReactNode;
  actions?: ReactNode;
};

export function ChatEventCard({
  icon: Icon,
  media,
  tone = 'default',
  title,
  meta,
  amount,
  currency,
  amountStruck,
  description,
  actions,
}: ChatEventCardProps) {
  return (
    <div className="flex justify-center py-1">
      <Card className="w-full max-w-md gap-0 py-0 shadow-none">
        <CardContent className="flex flex-col gap-3 p-4">
          {/* Header: leading media/icon + title/meta on the left, amount on the right. */}
          <div className="flex items-start gap-2.5">
            {media ? (
              <div className="mt-0.5 shrink-0">{media}</div>
            ) : Icon ? (
              <Icon
                className={cn('mt-0.5 size-4 shrink-0', TONE_CLASS[tone])}
                aria-hidden="true"
              />
            ) : null}
            <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{title}</p>
                {meta ? (
                  <p className="text-muted-foreground mt-0.5 text-xs">{meta}</p>
                ) : null}
              </div>
              {amount != null && currency ? (
                <p
                  className={cn(
                    'shrink-0 text-sm font-semibold tabular-nums',
                    amountStruck &&
                      'text-muted-foreground font-normal line-through',
                  )}
                >
                  {formatCurrency(amount, currency)}
                </p>
              ) : null}
            </div>
          </div>

          {/* Body: full-width, aligned to the card edge so the icon leads into it. */}
          {description ? (
            <blockquote className="border-border/60 text-muted-foreground border-l-2 pl-3 text-xs italic leading-relaxed">
              &ldquo;{description}&rdquo;
            </blockquote>
          ) : null}

          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
