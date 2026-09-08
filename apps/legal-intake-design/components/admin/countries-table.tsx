'use client';

import { useState } from 'react';
import { Switch } from '@/components/design/design-system/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import { Badge } from '@repo/ui/components/badge';
import { MOCK_COUNTRIES } from '@/lib/mocks/countries';
import { toast } from 'sonner';
import type { Country } from '@/lib/types';

export function CountriesTable() {
  const [list, setList] = useState(MOCK_COUNTRIES);

  const toggle = (
    code: string,
    field: keyof Pick<Country, 'legalAutoApprove' | 'nonLegalAutoApprove'>,
  ) => {
    setList((prev) =>
      prev.map((c) => (c.code === code ? { ...c, [field]: !c[field] } : c)),
    );
    toast.success('Setting updated (mock).');
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Country</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Timezone</TableHead>
            <TableHead>Stripe market</TableHead>
            <TableHead>Auto-approve legal</TableHead>
            <TableHead>Auto-approve client</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((c) => (
            <TableRow key={c.code}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell className="text-muted-foreground font-mono">
                {c.code}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {c.timezone}
              </TableCell>
              <TableCell>
                {c.stripeMarket ? (
                  <Badge variant="secondary">{c.stripeMarket}</Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <Switch
                  checked={c.legalAutoApprove}
                  onCheckedChange={() => toggle(c.code, 'legalAutoApprove')}
                />
              </TableCell>
              <TableCell>
                <Switch
                  checked={c.nonLegalAutoApprove}
                  onCheckedChange={() => toggle(c.code, 'nonLegalAutoApprove')}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
