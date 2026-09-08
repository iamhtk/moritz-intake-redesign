import { ArrowRight, ChevronRight } from '@repo/ui/icons';
import { Badge } from '@repo/ui/components/badge';
import CaseStatusBadge from '@/components/cases/case-status-badge';
import { Link } from '@/i18n/navigation';
import type { LegalCase } from '@/lib/types';
import { SectionHeader } from './section-header';

/**
 * Condensed active-cases list — the top few IN_PROGRESS cases in the panel row
 * style, each linking to its detail page. The full table lives on `/legal/cases`
 * (reachable via the "View all" action).
 */
export function LegalActiveCases({ cases }: { cases: LegalCase[] }) {
  const shown = cases.slice(0, 5);

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader
        title="Active cases"
        action={
          <Link
            href="/legal/cases"
            className="text-muted-foreground hover:text-foreground group inline-flex items-center gap-1 text-xs font-medium transition-colors"
          >
            View all
            <ArrowRight className="size-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
          </Link>
        }
      />

      {shown.length === 0 ? (
        <div className="border-field text-muted-foreground rounded-xl border border-dashed px-4 py-8 text-center text-sm">
          No active cases right now.
        </div>
      ) : (
        <ul className="border-field divide-border/70 divide-y rounded-xl border">
          {shown.map((c) => (
            <li key={c.id}>
              <Link
                href={`/legal/cases/${c.id}`}
                className="hover:bg-foreground/5 flex items-center gap-3 px-4 py-3 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{c.title}</div>
                  <div className="text-muted-foreground truncate text-xs">
                    {c.client.name}
                    {c.client.companyName ? ` · ${c.client.companyName}` : ''}
                  </div>
                </div>
                {c.unreadCount > 0 ? (
                  <Badge variant="info">{c.unreadCount} new</Badge>
                ) : null}
                <CaseStatusBadge status={c.status} />
                <ChevronRight className="text-muted-foreground size-4 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
