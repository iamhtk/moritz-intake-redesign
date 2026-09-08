'use client';

import { useState } from 'react';
import { Button } from '@/components/design/design-system/button';
import { Input } from '@/components/design/design-system/input';
import { Field, FieldLabel } from '@repo/ui/components/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/design/design-system/select';
import { MOCK_CASE_TYPES } from '@/lib/mocks/case-types';
import { toast } from 'sonner';
import type { LegalCase } from '@/lib/types';

export function CasePropertiesUpdateForm({
  legalCase,
}: {
  legalCase: LegalCase;
}) {
  const [title, setTitle] = useState(legalCase.title);
  const [caseTypeId, setCaseTypeId] = useState(legalCase.caseTypeId);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        toast.success('Case properties updated (mock).');
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>Case type</FieldLabel>
          <Select value={caseTypeId} onValueChange={setCaseTypeId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOCK_CASE_TYPES.map((ct) => (
                <SelectItem key={ct.id} value={ct.id}>
                  {ct.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit">Save changes</Button>
      </div>
    </form>
  );
}
