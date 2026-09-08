'use client';

import * as React from 'react';
import { Field, FieldDescription, FieldLabel } from '@repo/ui/components/field';

import { Input } from '@/components/design/foundations/components/input';

/**
 * Stateful input demos used by the foundation showcase page. These live in a
 * client component because they track the input value with React state, while
 * the showcase page itself stays a server component.
 */

export function ControlledInputExample() {
  const [value, setValue] = React.useState('');

  return (
    <Field className="max-w-sm">
      <FieldLabel htmlFor="controlled-full-name">Full name</FieldLabel>
      <Input
        id="controlled-full-name"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Type to see the value echo below."
      />
      <FieldDescription>
        Current value: {value ? value : '(empty)'}
      </FieldDescription>
    </Field>
  );
}
