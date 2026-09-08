import {
  BanknoteArrowUp,
  Bot,
  FolderOpen,
  MessageSquare,
} from '@repo/ui/icons';
import type { LucideIcon } from '@repo/ui/icons';
import { Link } from '@/i18n/navigation';
import type { LegalHomeSummary } from './summary';

type Stat = {
  label: string;
  value: number;
  href: string;
  icon: LucideIcon;
};

/**
 * At-a-glance stat strip for the lawyer homepage. Compact foundation surfaces
 * (`border-field rounded-xl`), each linking to the relevant destination.
 */
export function LegalHomeStats({ summary }: { summary: LegalHomeSummary }) {
  const stats: Stat[] = [
    {
      label: 'Active cases',
      value: summary.activeCases.length,
      href: '/legal/cases',
      icon: FolderOpen,
    },
    {
      label: 'Unread messages',
      value: summary.totalUnread,
      href: '/legal/cases',
      icon: MessageSquare,
    },
    {
      label: 'Quotes to respond',
      value: summary.quoteRoundsToRespond.length,
      href: '/legal/quotes',
      icon: BanknoteArrowUp,
    },
    {
      label: 'Drafts ready',
      value: summary.draftsReadyCount,
      href: '/legal/cases',
      icon: Bot,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ label, value, href, icon: Icon }) => (
        <Link
          key={label}
          href={href}
          className="border-field bg-background hover:bg-foreground/5 flex flex-col gap-4 rounded-xl border p-4 transition-colors"
        >
          <Icon className="text-muted-foreground size-4" />
          <div className="space-y-0.5">
            <div className="font-serif text-3xl font-semibold tabular-nums tracking-tight">
              {value}
            </div>
            <div className="text-muted-foreground text-xs">{label}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
