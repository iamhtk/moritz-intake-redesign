'use client';

import { useState } from 'react';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@/components/design/design-system/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import { FormattedDate } from '@/components/formatted-date';
import { MOCK_WAITLIST } from '@/lib/mocks/waitlist';
import { toast } from 'sonner';

export function WaitlistTable() {
  const [list, setList] = useState(MOCK_WAITLIST);

  const updateStatus = (id: string, status: 'CONVERTED' | 'REJECTED') => {
    setList((prev) => prev.map((w) => (w.id === id ? { ...w, status } : w)));
    toast.success(`Marked as ${status.toLowerCase()} (mock).`);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((w) => (
            <TableRow key={w.id}>
              <TableCell className="font-medium">{w.email}</TableCell>
              <TableCell className="text-muted-foreground">
                {w.companyName}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {w.country}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    w.status === 'CONVERTED'
                      ? 'success'
                      : w.status === 'PENDING'
                        ? 'warning'
                        : 'destructive'
                  }
                >
                  {w.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                <FormattedDate
                  date={w.createdAt}
                  options={{ dateStyle: 'short', timeStyle: 'short' }}
                />
              </TableCell>
              <TableCell className="text-right">
                {w.status === 'PENDING' ? (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(w.id, 'CONVERTED')}
                    >
                      Convert
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateStatus(w.id, 'REJECTED')}
                    >
                      Reject
                    </Button>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
