'use client';

import * as React from 'react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/design/foundations/components/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  Plus,
  Search,
} from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

import { Button } from '@/components/design/design-system/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/design/design-system/dropdown-menu';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/design/foundations/components/input-group';
import { FormattedDate } from '@/components/formatted-date';
import { getLawFirmSummaries } from '@/lib/mocks/companies';
import type { LawFirmSummary } from '@/lib/mocks/companies';
import type { Company } from '@/lib/types';
import { AddLawFirmDialog } from './add-law-firm-dialog';

type FirmStatus = 'active' | 'archived';

const STATUS_LABELS: Record<FirmStatus, string> = {
  active: 'Active',
  archived: 'Archived',
};

const COUNTRY_LABELS: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  NO: 'Norway',
  SE: 'Sweden',
  DE: 'Germany',
  FR: 'France',
  IT: 'Italy',
  ES: 'Spain',
  NL: 'Netherlands',
};

type SortKey = 'name' | 'totalCases' | 'members' | 'joined';
type SortDir = 'asc' | 'desc';

function firmStatus(company: Company): FirmStatus {
  return company.deletedAt ? 'archived' : 'active';
}

function statusBadgeVariant(status: FirmStatus) {
  return status === 'active' ? ('success' as const) : ('secondary' as const);
}

export function LawFirmsTable() {
  const [firms, setFirms] = React.useState<LawFirmSummary[]>(() =>
    getLawFirmSummaries(),
  );
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<FirmStatus | null>(
    null,
  );
  const [countryFilter, setCountryFilter] = React.useState<string | null>(null);
  const [sortKey, setSortKey] = React.useState<SortKey>('name');
  const [sortDir, setSortDir] = React.useState<SortDir>('asc');
  const [isAddOpen, setIsAddOpen] = React.useState(false);

  const countries = React.useMemo(() => {
    return Array.from(new Set(firms.map((f) => f.company.country))).sort();
  }, [firms]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const rows = React.useMemo(() => {
    let list = firms;

    if (statusFilter) {
      list = list.filter((f) => firmStatus(f.company) === statusFilter);
    }
    if (countryFilter) {
      list = list.filter((f) => f.company.country === countryFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((f) => {
        const haystack = [
          f.company.name,
          f.company.email ?? '',
          f.company.phone ?? '',
          f.primaryContact?.name ?? '',
          f.primaryContact?.email ?? '',
          f.company.specialties.join(' '),
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.company.name.localeCompare(b.company.name);
          break;
        case 'totalCases':
          cmp = a.totalCases - b.totalCases;
          break;
        case 'members':
          cmp = a.memberCount - b.memberCount;
          break;
        case 'joined':
          cmp =
            new Date(a.company.createdAt).getTime() -
            new Date(b.company.createdAt).getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [firms, statusFilter, countryFilter, search, sortKey, sortDir]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <span className="text-muted-foreground">Status</span>
              {statusFilter ? STATUS_LABELS[statusFilter] : 'All'}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => setStatusFilter(null)}
              onSelect={(e) => e.preventDefault()}
            >
              <Check className={cn(statusFilter && 'opacity-0')} />
              All
            </DropdownMenuItem>
            {(Object.keys(STATUS_LABELS) as FirmStatus[]).map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => setStatusFilter(s)}
                onSelect={(e) => e.preventDefault()}
              >
                <Check className={cn(statusFilter !== s && 'opacity-0')} />
                {STATUS_LABELS[s]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <span className="text-muted-foreground">Country</span>
              {countryFilter
                ? (COUNTRY_LABELS[countryFilter] ?? countryFilter)
                : 'All'}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => setCountryFilter(null)}
              onSelect={(e) => e.preventDefault()}
            >
              <Check className={cn(countryFilter && 'opacity-0')} />
              All
            </DropdownMenuItem>
            {countries.map((c) => (
              <DropdownMenuItem
                key={c}
                onClick={() => setCountryFilter(c)}
                onSelect={(e) => e.preventDefault()}
              >
                <Check className={cn(countryFilter !== c && 'opacity-0')} />
                {COUNTRY_LABELS[c] ?? c}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <form
          className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto"
          role="search"
          onSubmit={(e) => e.preventDefault()}
        >
          <InputGroup className="sm:w-72">
            <InputGroupInput
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              placeholder="Search by name, contact, email"
              type="search"
            />
            <InputGroupAddon align="inline-end">
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </form>

        <Button className="gap-2" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add law firm
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <SortableHead
                label="Law firm"
                column="name"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <TableHead>Main contact</TableHead>
              <TableHead>Country</TableHead>
              <SortableHead
                label="Members"
                column="members"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
                numeric
              />
              <SortableHead
                label="Active / Total cases"
                column="totalCases"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
                numeric
              />
              <SortableHead
                label="Joined"
                column="joined"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground py-8 text-center"
                >
                  No law firms match.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((f) => {
                const status = firmStatus(f.company);
                const contact = f.primaryContact;
                return (
                  <TableRow key={f.company.id} className="hover:bg-muted/50">
                    <TableCell className="py-3 align-middle">
                      <Link
                        href={`/admin/law-firms/${f.company.id}`}
                        className="font-medium hover:underline"
                      >
                        {f.company.name}
                      </Link>
                      {f.company.specialties.length > 0 && (
                        <div
                          className="text-muted-foreground mt-0.5 max-w-[15rem] truncate text-xs"
                          title={f.company.specialties.join(', ')}
                        >
                          {f.company.specialties.join(' · ')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3 align-middle">
                      {contact ? (
                        <div className="flex flex-col">
                          <span>{contact.name}</span>
                          {contact.email && (
                            <a
                              href={`mailto:${contact.email}`}
                              className="text-muted-foreground hover:text-foreground w-fit text-xs hover:underline"
                            >
                              {contact.email}
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground py-3 align-middle">
                      {COUNTRY_LABELS[f.company.country] ?? f.company.country}
                    </TableCell>
                    <TableCell className="py-3 text-center align-middle tabular-nums">
                      {f.memberCount}
                    </TableCell>
                    <TableCell className="py-3 text-center align-middle tabular-nums">
                      <span
                        title={`${f.inProgressCases} active · ${f.closedCases} closed · ${f.totalCases} total`}
                      >
                        <span
                          className={cn(
                            f.inProgressCases === 0 && 'text-muted-foreground',
                          )}
                        >
                          {f.inProgressCases}
                        </span>
                        <span className="text-muted-foreground">
                          /{f.totalCases}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap py-3 align-middle">
                      <FormattedDate date={f.company.createdAt} />
                    </TableCell>
                    <TableCell className="py-3 align-middle">
                      <Badge variant={statusBadgeVariant(status)}>
                        {STATUS_LABELS[status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AddLawFirmDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onCreate={(summary) => setFirms((prev) => [summary, ...prev])}
      />
    </div>
  );
}

function SortableHead({
  label,
  column,
  sortKey,
  sortDir,
  onSort,
  numeric,
}: {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  numeric?: boolean;
}) {
  const active = sortKey === column;
  const Icon = !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <TableHead className={cn(numeric && 'text-center')}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          'text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium transition-colors',
          active && 'text-foreground',
        )}
      >
        {label}
        <Icon className="h-3.5 w-3.5" />
      </button>
    </TableHead>
  );
}
