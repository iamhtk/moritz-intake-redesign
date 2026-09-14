'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/design/design-system/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/design/foundations/components/input-group';
import { Badge } from '@/components/design/foundations/components/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/design/design-system/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/design/foundations/components/table';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Hourglass,
  Search,
  Square,
  SquareCheck,
} from '@repo/ui/icons';
import { FormattedDate } from '@/components/formatted-date';
import CaseStatusBadge, { caseStatusLabels } from './case-status-badge';
import { formatCurrency } from '@/lib/utils';
import type { LegalCase, LegalCaseStatus } from '@/lib/types';

type SortField = 'status' | 'title' | 'createdAt' | 'lastActivityAt';
type SortDirection = 'asc' | 'desc';

type Props = {
  cases: LegalCase[];
  basePath: string;
  proposalBasePath?: string;
  pageSize?: number;
  showCustomer?: boolean;
  showCompany?: boolean;
  showCounsel?: boolean;
  showStatus?: boolean;
  showQuoteAmount?: boolean;
  showCreatedAt?: boolean;
  allowedStatuses?: LegalCaseStatus[];
  sortDefaults?: { order?: SortField; dir?: SortDirection };
};

const ALL_STATUSES: LegalCaseStatus[] = [
  'READY_FOR_SUBMISSION_REVIEW',
  'READY_FOR_ASSIGNMENT',
  'READY_FOR_CLAIM',
  'IN_PROGRESS',
  'CLOSED',
];

export default function CasesTable({
  cases,
  basePath,
  proposalBasePath,
  pageSize = 20,
  showCustomer = false,
  showCompany = false,
  showCounsel = false,
  showStatus = true,
  showQuoteAmount = false,
  showCreatedAt = true,
  allowedStatuses,
  sortDefaults,
}: Props) {
  const t = useTranslations('casesPage');
  const tCaseList = useTranslations('caseList');
  const locale = useLocale();

  const [search, setSearch] = useState('');
  const [statusFilters, setStatusFilters] = useState<LegalCaseStatus[]>([]);
  const [order, setOrder] = useState<SortField>(
    sortDefaults?.order ?? 'lastActivityAt',
  );
  const [dir, setDir] = useState<SortDirection>(sortDefaults?.dir ?? 'desc');
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const filtered = useMemo(() => {
    let list = cases;
    if (allowedStatuses) {
      list = list.filter((c) => allowedStatuses.includes(c.status));
    }
    if (statusFilters.length > 0) {
      list = list.filter((c) => statusFilters.includes(c.status));
    }
    if (unreadOnly) {
      list = list.filter((c) => c.unreadCount > 0);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.caseNumber.toLowerCase().includes(q) ||
          c.client.name.toLowerCase().includes(q) ||
          c.ownerCompanyName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [cases, allowedStatuses, statusFilters, unreadOnly, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const mod = dir === 'asc' ? 1 : -1;
      switch (order) {
        case 'status':
          return a.status.localeCompare(b.status) * mod;
        case 'title':
          return a.title.localeCompare(b.title) * mod;
        case 'createdAt':
          return (
            (new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()) *
            mod
          );
        case 'lastActivityAt':
        default:
          return (
            (new Date(a.updatedAt).getTime() -
              new Date(b.updatedAt).getTime()) *
            mod
          );
      }
    });
    return arr;
  }, [filtered, order, dir]);

  const totalPages = Math.max(Math.ceil(sorted.length / pageSize), 1);
  const start = (page - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  const toggleStatus = (status: LegalCaseStatus) => {
    setPage(1);
    setStatusFilters((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const handleSort = (field: SortField) => {
    if (order === field) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrder(field);
      setDir('desc');
    }
    setPage(1);
  };

  const renderSortIcon = (field: SortField) => {
    if (order !== field) {
      return <ArrowUpDown className="text-muted-foreground size-4" />;
    }
    return dir === 'desc' ? (
      <ArrowDown className="size-4" />
    ) : (
      <ArrowUp className="size-4" />
    );
  };

  const ariaSort = (field: SortField): React.AriaAttributes['aria-sort'] => {
    if (order !== field) return 'none';
    return dir === 'asc' ? 'ascending' : 'descending';
  };

  const isFixedStatus = !!allowedStatuses && allowedStatuses.length === 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {!isFixedStatus && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <span className="text-muted-foreground">
                  {t('filters.statusLabel')}
                </span>
                {statusFilters.length === 0
                  ? t('filters.allWithCount', { count: cases.length })
                  : t('filters.statusCount', { count: statusFilters.length })}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {(allowedStatuses ?? ALL_STATUSES).map((status) => {
                const checked = statusFilters.includes(status);
                const count = cases.filter((c) => c.status === status).length;
                return (
                  <DropdownMenuItem
                    key={status}
                    onSelect={(e) => e.preventDefault()}
                    onClick={() => toggleStatus(status)}
                  >
                    {checked ? (
                      <SquareCheck className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                    {caseStatusLabels[status]} ({count})
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {!isFixedStatus && (
          <Button
            variant={unreadOnly ? 'default' : 'outline'}
            size="sm"
            aria-pressed={unreadOnly}
            onClick={() => {
              setPage(1);
              setUnreadOnly((v) => !v);
            }}
          >
            {t('filters.unreadOnly')}
          </Button>
        )}

        <form
          className="ml-auto flex w-full items-center gap-2 sm:w-auto"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
          }}
        >
          <InputGroup className="sm:w-64">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.currentTarget.value);
                setPage(1);
              }}
              placeholder={t('filters.searchPlaceholder')}
              aria-label={t('filters.searchLabel')}
              autoComplete="off"
            />
          </InputGroup>
        </form>
      </div>

      {/*
       * ─────────────────────────────────────────────────────────────────────
       * THE SAME LIST, TWICE: CARDS ON A PHONE, A TABLE FROM `md` UP.
       * ─────────────────────────────────────────────────────────────────────
       *
       * The table has up to eight columns and `whitespace-nowrap`, so on a
       * phone it became a sideways scroller. That is not broken — everything
       * is reachable — but a horizontal scrollbar inside a vertically
       * scrolling page is the affordance people miss most reliably, and what
       * they miss here is the status and the date, which are the two things
       * they came to check. The visible column ends up being the case
       * number.
       *
       * So below `md` the same rows are stacked cards, ordered the way the
       * question is actually asked: what is it, where has it got to, and
       * when did it last move. No column is dropped — the ones that were
       * off-screen are now a wrapped meta row under the title.
       *
       * Two renderings of one list rather than a responsive table, because
       * the honest mobile shape for tabular data is not a table: it has no
       * column headers to align to, and forcing one produces either a
       * two-column squeeze or the scroller this replaces. The filters, the
       * sort and the pagination above and below are shared, so there is one
       * source of rows and no second state to keep in step.
       */}
      <ul className="flex flex-col gap-2 md:hidden">
        {pageRows.length === 0 ? (
          <li className="border-border text-muted-foreground rounded-xl border border-dashed px-4 py-10 text-center text-sm">
            {tCaseList('noCases')}
          </li>
        ) : (
          pageRows.map((legalCase) => {
            const isProposal = legalCase.status === 'READY_FOR_CLAIM';
            const path =
              isProposal && proposalBasePath ? proposalBasePath : basePath;
            const href = `/${locale}${path}/${legalCase.id}`;
            return (
              <li key={legalCase.id}>
                <a
                  href={href}
                  className="border-border hover:bg-foreground/[0.02] focus-visible:ring-ring block rounded-xl border p-3.5 outline-none transition-colors focus-visible:ring-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-foreground min-w-0 flex-1 font-medium">
                      {legalCase.title}
                    </span>
                    {isProposal && legalCase.claimDeadline ? (
                      <DeadlineBadge deadline={legalCase.claimDeadline} />
                    ) : legalCase.unreadCount > 0 ? (
                      <Badge variant="destructive" className="shrink-0">
                        {legalCase.unreadCount}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                    {showStatus && (
                      <CaseStatusBadge status={legalCase.status} />
                    )}
                    <span className="text-muted-foreground font-mono text-[11.5px]">
                      {legalCase.caseNumber}
                    </span>
                  </div>

                  {/*
                   * The columns a phone had no room for, as label/value
                   * pairs. A `<dl>` because that is what they are, and
                   * because the label has to travel with the value once the
                   * column header is gone — "Unassigned" on its own says
                   * nothing.
                   */}
                  <dl className="text-muted-foreground mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    {showQuoteAmount && (
                      <CardMeta label={t('columns.quote')}>
                        {legalCase.quoteAmount
                          ? formatCurrency(
                              legalCase.quoteAmount,
                              legalCase.currency,
                            )
                          : 'None'}
                      </CardMeta>
                    )}
                    {showCompany && (
                      <CardMeta label={t('columns.company')}>
                        {legalCase.ownerCompanyName}
                      </CardMeta>
                    )}
                    {showCounsel && (
                      <CardMeta label={t('columns.counsel')}>
                        {legalCase.legalCompanyName ?? 'Unassigned'}
                      </CardMeta>
                    )}
                    {showCustomer && (
                      <CardMeta label={t('columns.customer')}>
                        {legalCase.client.name}
                      </CardMeta>
                    )}
                    <CardMeta label={t('columns.updated')}>
                      <FormattedDate
                        date={legalCase.updatedAt}
                        options={{ dateStyle: 'short' }}
                      />
                    </CardMeta>
                  </dl>
                </a>
              </li>
            );
          })
        )}
      </ul>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">{t('columns.caseNumber')}</TableHead>
              {showStatus && (
                <TableHead className="w-44" aria-sort={ariaSort('status')}>
                  <SortButton
                    label={t('columns.status')}
                    active={order === 'status'}
                    onClick={() => handleSort('status')}
                    icon={renderSortIcon('status')}
                  />
                </TableHead>
              )}
              <TableHead aria-sort={ariaSort('title')}>
                <SortButton
                  label={t('columns.case')}
                  active={order === 'title'}
                  onClick={() => handleSort('title')}
                  icon={renderSortIcon('title')}
                />
              </TableHead>
              {showQuoteAmount && (
                <TableHead className="w-32">{t('columns.quote')}</TableHead>
              )}
              {showCompany && (
                <TableHead className="w-48">{t('columns.company')}</TableHead>
              )}
              {showCounsel && (
                <TableHead className="w-48">{t('columns.counsel')}</TableHead>
              )}
              {showCustomer && (
                <TableHead className="w-48">{t('columns.customer')}</TableHead>
              )}
              {showCreatedAt && (
                <TableHead className="w-28" aria-sort={ariaSort('createdAt')}>
                  <SortButton
                    label={t('columns.created')}
                    active={order === 'createdAt'}
                    onClick={() => handleSort('createdAt')}
                    icon={renderSortIcon('createdAt')}
                  />
                </TableHead>
              )}
              <TableHead
                className="w-28"
                aria-sort={ariaSort('lastActivityAt')}
              >
                <SortButton
                  label={t('columns.updated')}
                  active={order === 'lastActivityAt'}
                  onClick={() => handleSort('lastActivityAt')}
                  icon={renderSortIcon('lastActivityAt')}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={20}
                  className="text-muted-foreground py-10 text-center"
                >
                  {tCaseList('noCases')}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((legalCase) => {
                const isProposal = legalCase.status === 'READY_FOR_CLAIM';
                const path =
                  isProposal && proposalBasePath ? proposalBasePath : basePath;
                const href = `/${locale}${path}/${legalCase.id}`;
                return (
                  <TableRow
                    key={legalCase.id}
                    href={href}
                    title={legalCase.title}
                    className="cursor-pointer"
                  >
                    <TableCell className="text-muted-foreground">
                      <span>{legalCase.caseNumber}</span>
                    </TableCell>
                    {showStatus && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CaseStatusBadge status={legalCase.status} />
                          {isProposal && legalCase.claimDeadline ? (
                            <DeadlineBadge deadline={legalCase.claimDeadline} />
                          ) : legalCase.unreadCount > 0 ? (
                            <Badge variant="destructive" className="shrink-0">
                              {legalCase.unreadCount}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <span className="text-foreground font-medium">
                        {legalCase.title}
                      </span>
                    </TableCell>
                    {showQuoteAmount && (
                      <TableCell className="text-muted-foreground">
                        {legalCase.quoteAmount
                          ? formatCurrency(
                              legalCase.quoteAmount,
                              legalCase.currency,
                            )
                          : 'None'}
                      </TableCell>
                    )}
                    {showCompany && (
                      <TableCell className="text-muted-foreground">
                        <span className="block max-w-48 truncate">
                          {legalCase.ownerCompanyName}
                        </span>
                      </TableCell>
                    )}
                    {showCounsel && (
                      <TableCell className="text-muted-foreground">
                        <span className="block max-w-48 truncate">
                          {legalCase.legalCompanyName ?? 'Unassigned'}
                        </span>
                      </TableCell>
                    )}
                    {showCustomer && (
                      <TableCell className="text-muted-foreground">
                        <span className="block max-w-48 truncate">
                          {legalCase.client.name}
                        </span>
                      </TableCell>
                    )}
                    {showCreatedAt && (
                      <TableCell className="text-muted-foreground">
                        <FormattedDate
                          date={legalCase.createdAt}
                          options={{ dateStyle: 'short' }}
                        />
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground">
                      <FormattedDate
                        date={legalCase.updatedAt}
                        options={{ dateStyle: 'short' }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground shrink-0 text-sm">
          {sorted.length === 0
            ? t('pagination.empty')
            : t('pagination.showing', {
                start: start + 1,
                end: Math.min(start + pageSize, sorted.length),
              })}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t('pagination.previous')}
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft />
            </Button>
            {Array.from({ length: totalPages }, (_, idx) => {
              const pageNumber = idx + 1;
              return (
                <Button
                  key={pageNumber}
                  variant={pageNumber === page ? 'secondary' : 'ghost'}
                  size="icon-sm"
                  aria-label={`Page ${pageNumber}`}
                  aria-current={pageNumber === page ? 'page' : undefined}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </Button>
              );
            })}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t('pagination.next')}
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/** One label/value pair in a phone card's meta row. */
function CardMeta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-baseline gap-1">
      <dt className="text-muted-foreground/70">{label}</dt>
      <dd className="text-foreground/80 truncate">{children}</dd>
    </div>
  );
}

function SortButton({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex w-full cursor-pointer items-center gap-2 text-left font-medium"
    >
      {label}
      {icon}
    </button>
  );
}

function DeadlineBadge({ deadline }: { deadline: string }) {
  const parsed = new Date(deadline);
  const now = new Date();
  const isPast = parsed < now;
  return (
    <Badge
      variant={isPast ? 'destructive' : 'secondary'}
      className="shrink-0 gap-1 text-xs"
    >
      <Hourglass className="h-3 w-3" />
      {isPast ? (
        'Expired'
      ) : (
        <FormattedDate date={parsed} options={{ dateStyle: 'short' }} />
      )}
    </Badge>
  );
}
