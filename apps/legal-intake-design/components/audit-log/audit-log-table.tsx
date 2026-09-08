'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@repo/ui/components/badge';
import { Input } from '@/components/design/design-system/input';
import { Button } from '@/components/design/design-system/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/design/design-system/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import { Download, Search } from '@repo/ui/icons';
import { FormattedDate } from '@/components/formatted-date';
import { MOCK_AUDIT_LOG } from '@/lib/mocks/audit-log';
import { toast } from 'sonner';
import type { AuditLogCategory } from '@/lib/types';

const CATEGORY_LABELS: Record<AuditLogCategory, string> = {
  case: 'Case',
  company: 'Company',
  user: 'User',
  document: 'Document',
  billing: 'Billing',
  auth: 'Auth',
  admin: 'Admin',
};

export function AuditLogTable() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<AuditLogCategory | 'all'>('all');

  const filtered = useMemo(() => {
    let list = MOCK_AUDIT_LOG;
    if (category !== 'all') list = list.filter((e) => e.category === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.actorName.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q) ||
          e.targetEntityLabel.toLowerCase().includes(q),
      );
    }
    return list;
  }, [search, category]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as AuditLogCategory | 'all')}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {(Object.keys(CATEGORY_LABELS) as AuditLogCategory[]).map((k) => (
              <SelectItem key={k} value={k}>
                {CATEGORY_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <form
          role="search"
          className="ml-auto flex w-full items-center gap-2 sm:w-auto"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="relative w-full sm:w-72">
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              placeholder="Filter by actor, action, target…"
            />
            <span className="text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2">
              <Search className="h-4 w-4" />
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => toast.success('Audit log exported (mock).')}
          >
            <Download className="h-4 w-4" /> Export
          </Button>
        </form>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-6 text-center"
                >
                  No matches.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div className="font-medium">{entry.actorName}</div>
                    <div className="text-muted-foreground text-xs">
                      {entry.actorCompany}
                    </div>
                  </TableCell>
                  <TableCell>{entry.action}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.targetEntityLabel}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {CATEGORY_LABELS[entry.category]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        entry.outcome === 'success' ? 'success' : 'destructive'
                      }
                    >
                      {entry.outcome}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    <FormattedDate
                      date={entry.createdAt}
                      options={{ dateStyle: 'short', timeStyle: 'short' }}
                    />
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
