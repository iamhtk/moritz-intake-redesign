'use client';

import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@repo/ui/components/badge';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/design/foundations/components/input-group';
import { Button } from '@/components/design/design-system/button';
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
} from '@repo/ui/components/table';
import { Check, ChevronDown, Search } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { FormattedDate } from '@/components/formatted-date';
import { MOCK_COMPANIES } from '@/lib/mocks/companies';
import type { CompanyType } from '@/lib/types';

type Props = { basePath: string };

const TYPE_LABELS: Record<CompanyType, string> = {
  INTERNAL_ADMIN: 'Internal admin',
  INTERNAL_ASSISTANT: 'Internal assistant',
  LEGAL: 'Law firm',
  NON_LEGAL: 'Client company',
};

export function CompaniesTable({ basePath }: Props) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CompanyType | null>(null);

  const rows = useMemo(() => {
    let list = MOCK_COMPANIES;
    if (typeFilter) list = list.filter((c) => c.type === typeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.orgNumber ?? '').toLowerCase().includes(q) ||
          (c.companyUrl ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [search, typeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <span className="text-muted-foreground">Type</span>
              {typeFilter ? TYPE_LABELS[typeFilter] : 'All'}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setTypeFilter(null)}>
              <Check className={cn(typeFilter && 'opacity-0')} />
              All
            </DropdownMenuItem>
            {(Object.keys(TYPE_LABELS) as CompanyType[]).map((t) => (
              <DropdownMenuItem
                key={t}
                onClick={() => setTypeFilter(t)}
                onSelect={(e) => e.preventDefault()}
              >
                <Check className={cn(typeFilter !== t && 'opacity-0')} />
                {TYPE_LABELS[t]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <form
          className="ml-auto flex w-full items-center gap-2 sm:w-auto"
          role="search"
          onSubmit={(e) => e.preventDefault()}
        >
          <InputGroup className="sm:w-64">
            <InputGroupInput
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              placeholder="Search by name, org number, URL"
              type="search"
            />
            <InputGroupAddon align="inline-end">
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </form>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center"
                >
                  No companies match.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Link
                      href={`${basePath}/${c.id}`}
                      className="font-medium hover:underline"
                    >
                      {c.name}
                    </Link>
                    {c.description && (
                      <div className="text-muted-foreground text-xs">
                        {c.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{TYPE_LABELS[c.type]}</Badge>
                  </TableCell>
                  <TableCell>
                    {c.deletedAt ? (
                      <Badge variant="destructive">Archived</Badge>
                    ) : c.whitelisted ? (
                      <Badge variant="success">Whitelisted</Badge>
                    ) : (
                      <Badge variant="warning">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.country}
                  </TableCell>
                  <TableCell className="text-muted-foreground capitalize">
                    {c.paymentPlan.toLowerCase()}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    <FormattedDate date={c.createdAt} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
