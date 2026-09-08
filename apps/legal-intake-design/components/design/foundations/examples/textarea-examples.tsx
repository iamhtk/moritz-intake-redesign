'use client';

import * as React from 'react';
import { Field, FieldDescription, FieldLabel } from '@repo/ui/components/field';

import { Textarea } from '@/components/design/foundations/components/textarea';

/**
 * Stateful textarea demos used by the foundation showcase page. These live in a
 * client component because they track the textarea value with React state, while
 * the showcase page itself stays a server component.
 */

export function ControlledExample() {
  const [value, setValue] = React.useState('');

  return (
    <Field className="max-w-sm">
      <FieldLabel htmlFor="controlled-description">Description</FieldLabel>
      <Textarea
        id="controlled-description"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Type to see the count update."
      />
      <FieldDescription>{value.length} characters</FieldDescription>
    </Field>
  );
}
