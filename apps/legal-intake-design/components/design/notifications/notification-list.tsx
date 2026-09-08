'use client';

import type { ComponentType } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Bell,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  FileDiff,
  FileText,
  Inbox,
  MessageSquare,
  Receipt,
  UserMinus,
  UserPlus,
  Wand2,
  XCircle,
} from '@repo/ui/icons';
import type { LucideProps } from '@repo/ui/icons';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui/components/tooltip';
import { cn } from '@repo/ui/lib/utils';
import { FormattedDate } from '@/components/formatted-date';
import { Link } from '@/i18n/navigation';
import { OpenInSlackButton } from '@/components/design/slack/open-in-slack-button';
import { NotificationInvoiceAction } from '@/components/design/notifications/notification-invoice-action';
import type { InboxNotificationType, Notification } from '@/lib/types';

/**
 * NotificationList — sleek, borderless notification rows in the foundation
 * design language, structured after Linear / Notion inboxes and matching the
 * production `/notifications` list (see apps/legal-intake).
 *
 * Each notification is a self-contained, separated row: a leading unread dot,
 * the actor's avatar (or a neutral outlined type-icon tile when there's no
 * actor image), and a title / case subtitle / body / timestamp block. The whole
 * row is a stretched click target that navigates to the notification's target;
 * INVOICE_CREATED rows additionally surface a Pay button (unpaid) or an
 * "Invoice paid" indicator, and the "Open in Slack" affordance sits above the
 * link and reveals on hover / focus. Unread state reads through the dot + a
 * semibold title; hover is a soft rounded wash inset from the panel gutter.
 */

// One glyph per notification type, mirroring the production
// `notification-icon.tsx` mapping. Used as the avatar fallback and when a
// notification has no actor image.
const TYPE_ICONS: Record<InboxNotificationType, ComponentType<LucideProps>> = {
  NEW_MESSAGE: MessageSquare,
  CASE_READY_FOR_CLAIM: Briefcase,
  CASE_COLLABORATOR_ADDED: UserPlus,
  CASE_COLLABORATOR_REMOVED: UserMinus,
  CASE_OWNER_CHANGED: ArrowRight,
  CASE_CLOSED: XCircle,
  QUOTE_ROUND_INVITATION: FileText,
  QUOTE_ROUND_CLOSED: FileText,
  LAWYER_DIRECTLY_ASSIGNED: Briefcase,
  FIRST_DRAFT_HANDED_OFF: FileDiff,
  QA_REVIEW_COMPLETE: ClipboardCheck,
  DRAFT_REVISION_READY: Wand2,
  INVOICE_CREATED: Receipt,
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

function NotificationLeading({
  notification,
  unread,
}: {
  notification: Notification;
  unread: boolean;
}) {
  const Icon = TYPE_ICONS[notification.type] ?? Bell;
  const image = notification.triggeredBy?.image;

  if (image) {
    return (
      <Avatar className="size-9 shrink-0 rounded-xl">
        <AvatarImage
          src={image}
          alt={notification.triggeredBy?.name ?? ''}
          className="rounded-xl object-cover"
        />
        <AvatarFallback
          className={cn(
            'rounded-xl text-xs font-medium',
            unread && 'bg-primary/10 text-primary',
          )}
        >
          {getInitials(notification.triggeredBy?.name ?? '')}
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <span className="border-border bg-background text-foreground flex size-9 shrink-0 items-center justify-center rounded-xl border">
      <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
    </span>
  );
}

// Renders a single-line, truncated title and reveals the full text in a
// tooltip on hover / focus — but only when the text is actually clipped.
function TruncatedTitle({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => setIsTruncated(el.scrollWidth > el.clientWidth);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [title]);

  const heading = (
    <h3 ref={ref} className={className}>
      {title}
    </h3>
  );

  if (!isTruncated) return heading;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{heading}</TooltipTrigger>
      <TooltipContent className="max-w-xs">{title}</TooltipContent>
    </Tooltip>
  );
}

function NotificationRow({
  notification,
  slackEnabled,
}: {
  notification: Notification;
  slackEnabled: boolean;
}) {
  const unread = !notification.read;
  const caseSubtitle = `Case ${notification.caseNumber}: ${notification.caseTitle}`;
  const invoice = notification.invoice;
  const showInvoiceAction =
    notification.type === 'INVOICE_CREATED' && invoice != null;

  return (
    <div className="group/row hover:bg-muted/60 relative flex gap-3 rounded-xl px-3 py-2.5 transition-colors">
      {/* Stretched click target — the whole row navigates to the notification. */}
      {notification.href && (
        <Link
          href={notification.href}
          aria-label={notification.title}
          className="absolute inset-0 rounded-xl"
        />
      )}

      {/* Unread dot column, kept present (empty when read) so tiles align. */}
      <span className="mt-1.5 flex w-1.5 shrink-0 justify-center">
        {unread && (
          <span aria-hidden className="bg-primary size-1.5 rounded-full" />
        )}
      </span>

      <NotificationLeading notification={notification} unread={unread} />

      <div className="relative min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <TruncatedTitle
            title={notification.title}
            className={cn(
              'truncate text-sm',
              unread
                ? 'text-foreground font-semibold'
                : 'text-foreground font-medium',
            )}
          />
          <FormattedDate
            date={notification.createdAt}
            options={{ month: 'short', day: 'numeric' }}
            className="text-muted-foreground shrink-0 text-xs tabular-nums"
          />
        </div>

        <p className="text-muted-foreground mt-0.5 text-sm">
          {caseSubtitle}
          {notification.content ? ` — ${notification.content}` : ''}
        </p>

        {showInvoiceAction &&
          (invoice.status === 'PAID' ? (
            <div className="text-muted-foreground mt-2 inline-flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Invoice paid
            </div>
          ) : (
            <div className="mt-2">
              <NotificationInvoiceAction invoiceId={invoice.id} />
            </div>
          ))}

        {slackEnabled && notification.href && (
          <div className="relative z-10 mt-1.5 transition-opacity sm:opacity-0 sm:group-focus-within/row:opacity-100 sm:group-hover/row:opacity-100">
            <OpenInSlackButton
              variant="link"
              size="sm"
              className="h-auto px-0"
              context={notification.title}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function NotificationList({
  notifications,
  slackEnabled,
}: {
  notifications: Notification[];
  slackEnabled: boolean;
}) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <span className="border-border bg-background text-muted-foreground flex size-12 items-center justify-center rounded-2xl border">
          <Inbox className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <p className="text-foreground text-sm font-medium">
            You&apos;re all caught up
          </p>
          <p className="text-muted-foreground text-sm">
            New activity across your cases will show up here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {notifications.map((notification) => (
        <NotificationRow
          key={notification.id}
          notification={notification}
          slackEnabled={slackEnabled}
        />
      ))}
    </div>
  );
}
