'use client';

import * as React from 'react';
import { Field, FieldDescription } from '@repo/ui/components/field';

import { Checkbox } from '@/components/design/foundations/components/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/design/foundations/components/table';

/**
 * Stateful checkbox demos used by the foundation showcase page. These live in a
 * client component because they track checked state with React state, while the
 * showcase page itself stays a server component. The set mirrors the shadcn
 * Checkbox docs' interactive examples: a controlled checkbox and a table whose
 * header drives a select-all with an indeterminate (partial) state.
 */

export function ControlledCheckboxExample() {
  const [checked, setChecked] = React.useState(false);

  return (
    <Field orientation="horizontal" className="max-w-sm">
      <Checkbox
        id="cb-controlled"
        checked={checked}
        onCheckedChange={(value) => setChecked(value === true)}
        aria-label="Enable notifications"
      />
      <FieldDescription className="text-foreground">
        {checked ? 'Notifications on' : 'Notifications off'}
      </FieldDescription>
    </Field>
  );
}

type Person = { id: string; name: string; email: string; role: string };

const PEOPLE: Person[] = [
  {
    id: 'sarah',
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    role: 'Admin',
  },
  {
    id: 'marcus',
    name: 'Marcus Rodriguez',
    email: 'marcus.rodriguez@example.com',
    role: 'User',
  },
  {
    id: 'priya',
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    role: 'User',
  },
  {
    id: 'david',
    name: 'David Kim',
    email: 'david.kim@example.com',
    role: 'Editor',
  },
];

export function CheckboxTableExample() {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const allSelected = selected.size === PEOPLE.length;
  const someSelected = selected.size > 0 && !allSelected;
  const headerChecked: boolean | 'indeterminate' = allSelected
    ? true
    : someSelected
      ? 'indeterminate'
      : false;

  function toggleAll(value: boolean | 'indeterminate') {
    setSelected(value === true ? new Set(PEOPLE.map((p) => p.id)) : new Set());
  }

  function toggleRow(id: string, value: boolean | 'indeterminate') {
    setSelected((prev) => {
      const next = new Set(prev);
      if (value === true) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  return (
    <div className="w-full max-w-2xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-0">
              <Checkbox
                checked={headerChecked}
                onCheckedChange={toggleAll}
                aria-label="Select all rows"
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {PEOPLE.map((person) => {
            const isSelected = selected.has(person.id);
            return (
              <TableRow
                key={person.id}
                data-state={isSelected ? 'selected' : undefined}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(value) => toggleRow(person.id, value)}
                    aria-label={`Select ${person.name}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{person.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {person.email}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {person.role}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
