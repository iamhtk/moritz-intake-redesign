import type { ReactNode } from 'react';
import { BanknoteArrowUp, ChevronRight, MessageSquare } from '@repo/ui/icons';
import type { LucideIcon } from '@repo/ui/icons';
import { Link } from '@/i18n/navigation';
import { FormattedDate } from '@/components/formatted-date';
import { SectionHeader } from './section-header';
import type { LegalHomeSummary } from './summary';

type AttentionItem = {
  key: string;
  href: string;
  icon: LucideIcon;
  title: string;
  meta: ReactNode;
};

/**
 * "Needs your attention" — a merged, prioritized action list. Quote rounds still
 * awaiting a response come first (time-sensitive, driven by `expiresAt`),
 * followed by cases with unread messages. Renders a calm empty state when the
 * lawyer is all caught up.
 */
export function LegalAttentionList({ summary }: { summary: LegalHomeSummary }) {
  const items: AttentionItem[] = [
    ...summary.quoteRoundsToRespond.map((q) => ({
      key: `qr-${q.id}`,
      href: `/legal/quotes/${q.caseId}`,
      icon: BanknoteArrowUp,
      title: q.caseTitle,
      meta: (
        <>
          Quote round · respond by{' '}
          <FormattedDate date={q.expiresAt} options={{ dateStyle: 'medium' }} />
        </>
      ),
    })),
    ...summary.unreadCases.map((c) => ({
      key: `case-${c.id}`,
      href: `/legal/cases/${c.id}`,
      icon: MessageSquare,
      title: c.title,
      meta: `${c.unreadCount} new message${c.unreadCount === 1 ? '' : 's'} from ${c.client.name}`,
    })),
  ];

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title="Needs your attention" />

      {items.length === 0 ? (
        <div className="border-field text-muted-foreground rounded-xl border border-dashed px-4 py-8 text-center text-sm">
          You&apos;re all caught up — nothing needs your attention right now.
        </div>
      ) : (
        <ul className="border-field divide-border/70 divide-y rounded-xl border">
          {items.map(({ key, href, icon: Icon, title, meta }) => (
            <li key={key}>
              <Link
                href={href}
                className="hover:bg-foreground/5 flex items-center gap-3 px-4 py-3 transition-colors"
              >
                <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-full">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{title}</div>
                  <div className="text-muted-foreground truncate text-xs">
                    {meta}
                  </div>
                </div>
                <ChevronRight className="text-muted-foreground size-4 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
