'use client';

import { useState } from 'react';
import { Button } from '@/components/design/design-system/button';
import { Input } from '@/components/design/design-system/input';
import { Textarea } from '@/components/design/design-system/textarea';
import { Field, FieldLabel } from '@repo/ui/components/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/design/design-system/select';
import { Switch } from '@/components/design/design-system/switch';
import { Label } from '@repo/ui/components/label';
import { MOCK_COUNTRIES } from '@/lib/mocks/countries';
import { toast } from 'sonner';

export function CreateEnterpriseForm() {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('US');
  const [siem, setSiem] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        toast.success('Enterprise account created (mock).');
      }}
      className="space-y-4"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="name">Company name</FieldLabel>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Corp."
          />
        </Field>
        <Field>
          <FieldLabel>Country</FieldLabel>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOCK_COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="domains">SCIM domains</FieldLabel>
        <Input id="domains" placeholder="acme.com, acme.io" />
      </Field>
      <Field>
        <FieldLabel htmlFor="workos">WorkOS organization id</FieldLabel>
        <Input id="workos" placeholder="org_…" />
      </Field>
      <Field>
        <FieldLabel htmlFor="notes">Internal notes</FieldLabel>
        <Textarea
          id="notes"
          rows={4}
          placeholder="Notes visible only to admins"
        />
      </Field>
      <div className="flex items-center gap-3 rounded-md border p-3">
        <Switch id="siem" checked={siem} onCheckedChange={setSiem} />
        <Label htmlFor="siem" className="text-sm">
          Enable SIEM audit log export
        </Label>
      </div>
      <div className="flex justify-end">
        <Button type="submit">Create enterprise</Button>
      </div>
    </form>
  );
}
