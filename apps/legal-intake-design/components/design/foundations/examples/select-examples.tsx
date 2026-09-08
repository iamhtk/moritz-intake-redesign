'use client';

import * as React from 'react';
import { Field, FieldDescription, FieldLabel } from '@repo/ui/components/field';

import { Input } from '@/components/design/foundations/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/design/foundations/components/select';
import {
  getDialCodeForCountry,
  getEntryForCountry,
  OTHER_DIAL_CODES,
  PINNED_DIAL_CODES,
} from '@/lib/dial-codes';

/**
 * Stateful select demos used by the foundation showcase page. These live in a
 * client component because they track the selected value with React state, while
 * the showcase page itself stays a server component.
 */

const TIMEZONES = [
  { value: 'pt', label: 'Pacific Time (PT)' },
  { value: 'mt', label: 'Mountain Time (MT)' },
  { value: 'ct', label: 'Central Time (CT)' },
  { value: 'et', label: 'Eastern Time (ET)' },
] as const;

export function ControlledSelectExample() {
  const [value, setValue] = React.useState('');
  const selected = TIMEZONES.find((zone) => zone.value === value);

  return (
    <Field className="max-w-sm">
      <FieldLabel htmlFor="controlled-timezone">Timezone</FieldLabel>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger id="controlled-timezone" className="w-full">
          <SelectValue placeholder="Select a timezone" />
        </SelectTrigger>
        <SelectContent>
          {TIMEZONES.map((zone) => (
            <SelectItem key={zone.value} value={zone.value}>
              {zone.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldDescription>
        Current value: {selected ? selected.label : '(empty)'}
      </FieldDescription>
    </Field>
  );
}

/**
 * Real-world scrollable pattern: a compact country/dial-code Select paired with
 * a phone Input. The trigger renders a custom flag + dial-code summary instead of
 * SelectValue, and the long option list scrolls within the panel (pinned
 * countries first, separator, then the alphabetical remainder).
 */
export function PhoneNumberSelectExample() {
  const [country, setCountry] = React.useState('US');
  const [number, setNumber] = React.useState('');
  const entry = getEntryForCountry(country);

  return (
    <Field className="max-w-sm">
      <FieldLabel htmlFor="phone-number">Phone number</FieldLabel>
      <div className="flex gap-2">
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger
            aria-label="Country dial code"
            className="w-[132px] shrink-0"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden="true">{entry?.flag}</span>
              {country} +{getDialCodeForCountry(country)}
            </span>
          </SelectTrigger>
          <SelectContent>
            {PINNED_DIAL_CODES.map((dialCode) => (
              <SelectItem key={dialCode.code} value={dialCode.code}>
                <span aria-hidden="true">{dialCode.flag}</span> {dialCode.name}{' '}
                (+
                {dialCode.dialCode})
              </SelectItem>
            ))}
            <SelectSeparator />
            {OTHER_DIAL_CODES.map((dialCode) => (
              <SelectItem key={dialCode.code} value={dialCode.code}>
                <span aria-hidden="true">{dialCode.flag}</span> {dialCode.name}{' '}
                (+
                {dialCode.dialCode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id="phone-number"
          type="tel"
          inputMode="tel"
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          placeholder="(555) 000-0000"
          className="flex-1"
        />
      </div>
    </Field>
  );
}
