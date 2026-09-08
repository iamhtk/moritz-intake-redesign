'use client';

import { useState } from 'react';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Label } from '@repo/ui/components/label';
import { Button } from '@/components/design/design-system/button';
import { MOCK_COMPANIES } from '@/lib/mocks/companies';
import { toast } from 'sonner';
import { Muted } from '@/components/design/design-system/typography';
import type { LegalCase } from '@/lib/types';

export function ClaimableCompaniesForm({
  legalCase,
}: {
  legalCase: LegalCase;
}) {
  const [selected, setSelected] = useState<string[]>(
    legalCase.claimableCompanyIds,
  );
  const legalCompanies = MOCK_COMPANIES.filter(
    (c) => c.type === 'LEGAL' && c.whitelisted,
  );

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div className="space-y-3">
      <Muted>
        Pick which firms should be able to claim this case once it&apos;s
        published.
      </Muted>
      <ul className="space-y-2">
        {legalCompanies.map((c) => {
          const checked = selected.includes(c.id);
          return (
            <li
              key={c.id}
              className="flex items-start gap-3 rounded-md border p-3"
            >
              <Checkbox
                id={`claim-${c.id}`}
                checked={checked}
                onCheckedChange={() => toggle(c.id)}
              />
              <div>
                <Label htmlFor={`claim-${c.id}`} className="font-medium">
                  {c.name}
                </Label>
                {c.description && (
                  <p className="text-muted-foreground text-xs">
                    {c.description}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex justify-end">
        <Button onClick={() => toast.success('Proposal published (mock).')}>
          Publish proposal to selected firms
        </Button>
      </div>
    </div>
  );
}
