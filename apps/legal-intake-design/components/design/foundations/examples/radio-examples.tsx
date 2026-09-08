'use client';

import * as React from 'react';

import { FieldLabel } from '@repo/ui/components/field';

import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/design/foundations/components/radio-group';

/**
 * Stateful radio demo used by the foundation showcase page. This lives in a
 * client component because it tracks the selected value with React state, while
 * the showcase page itself stays a server component.
 */

export function ControlledRadioExample() {
  const [value, setValue] = React.useState('permit');

  return (
    <div className="space-y-3">
      <RadioGroup
        value={value}
        onValueChange={setValue}
        aria-label="Resale and transfers"
        className="max-w-sm"
      >
        <div className="flex items-center gap-3">
          <RadioGroupItem value="permit" id="c-permit" />
          <FieldLabel htmlFor="c-permit">Allow tickets to be resold</FieldLabel>
        </div>
        <div className="flex items-center gap-3">
          <RadioGroupItem value="forbid" id="c-forbid" />
          <FieldLabel htmlFor="c-forbid">
            Don&apos;t allow tickets to be resold
          </FieldLabel>
        </div>
      </RadioGroup>
      <p className="text-muted-foreground text-sm">
        Selected: <code>{value}</code>
      </p>
    </div>
  );
}
