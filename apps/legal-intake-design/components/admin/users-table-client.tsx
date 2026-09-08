'use client';

import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@repo/ui/components/badge';
import { Input } from '@/components/design/design-system/input';
import { Button } from '@/components/design/design-system/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/design/design-system/dropdown-menu';
import { MoreHorizontal, Search } from '@repo/ui/icons';
import { MOCK_USERS } from '@/lib/mocks/users';
import { toast } from 'sonner';

type Props = { currentUserId: string };

export function UsersTableClient({ currentUserId: _ }: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return MOCK_USERS;
    const q = search.trim().toLowerCase();
    return MOCK_USERS.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.company.name.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <div className="space-y-4">
      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        className="ml-auto flex max-w-sm items-center"
      >
        <div className="relative w-full">
          <Input
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            placeholder="Search users…"
            type="search"
          />
          <span className="text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2">
            <Search className="h-4 w-4" />
          </span>
        </div>
      </form>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-6 text-center"
                >
                  No users.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="font-medium hover:underline"
                    >
                      {u.display_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.email}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/companies/${u.company.id}`}
                      className="text-muted-foreground hover:underline"
                    >
                      {u.company.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{u.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {u.enabled ? (
                      <Badge variant="success">Enabled</Badge>
                    ) : (
                      <Badge variant="destructive">Disabled</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => toast.success('Toggled user (mock).')}
                        >
                          {u.enabled ? 'Disable user' : 'Enable user'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toast.success('Role updated (mock).')}
                        >
                          {u.role === 'OWNER'
                            ? 'Demote to member'
                            : 'Promote to owner'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
