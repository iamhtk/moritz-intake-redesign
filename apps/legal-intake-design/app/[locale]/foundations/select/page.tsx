import type { Metadata } from 'next';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@repo/ui/components/field';
import { Banknote, CreditCard, Wallet } from '@repo/ui/icons';

import { Section } from '@/components/design/foundations/showcase/section';
import { Input } from '@/components/design/foundations/components/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/design/foundations/components/select';
import {
  ControlledSelectExample,
  PhoneNumberSelectExample,
} from '@/components/design/foundations/examples/select-examples';

export const metadata: Metadata = { title: 'Select · Foundations' };

const TIMEZONES = [
  'Pacific Time (PT)',
  'Mountain Time (MT)',
  'Central Time (CT)',
  'Eastern Time (ET)',
  'Greenwich Mean Time (GMT)',
  'Central European Time (CET)',
  'Eastern European Time (EET)',
  'India Standard Time (IST)',
  'China Standard Time (CST)',
  'Japan Standard Time (JST)',
  'Australian Eastern Time (AET)',
  'New Zealand Standard Time (NZST)',
];

export default function SelectFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Select</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          The foundation select, built on the shadcn Select and shared{' '}
          <code>Field</code> primitives: labels, descriptions, groups, icons,
          disabled, and invalid states.
        </p>
      </header>

      <Section
        title="Basic example"
        description="Use the trigger and items to build a single-select dropdown."
      >
        <div className="w-full max-w-sm">
          <Select>
            <SelectTrigger className="w-full" aria-label="Status">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in-progress">In progress</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Section>

      <Section
        title="With label"
        description="Wrap a label and select in a Field, pointing the label at the trigger id."
      >
        <Field className="max-w-sm">
          <FieldLabel htmlFor="label-country">Country</FieldLabel>
          <Select>
            <SelectTrigger id="label-country" className="w-full">
              <SelectValue placeholder="Select a country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ca">Canada</SelectItem>
              <SelectItem value="mx">Mexico</SelectItem>
              <SelectItem value="us">United States</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </Section>

      <Section
        title="With description"
        description="Use FieldDescription to add a helper description below the select."
      >
        <Field className="max-w-sm">
          <FieldLabel htmlFor="desc-country">Country</FieldLabel>
          <Select>
            <SelectTrigger id="desc-country" className="w-full">
              <SelectValue placeholder="Select a country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ca">Canada</SelectItem>
              <SelectItem value="mx">Mexico</SelectItem>
              <SelectItem value="us">United States</SelectItem>
            </SelectContent>
          </Select>
          <FieldDescription>
            We currently only ship to North America.
          </FieldDescription>
        </Field>
      </Section>

      <Section
        title="Sizes"
        description="Use the size prop for a compact (sm) trigger alongside the default."
      >
        <Select>
          <SelectTrigger size="sm" aria-label="Compact status">
            <SelectValue placeholder="Small" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in-progress">In progress</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger aria-label="Default status">
            <SelectValue placeholder="Default" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in-progress">In progress</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </Section>

      <Section
        title="Default value"
        description="Pass defaultValue to render the select with a pre-selected option."
      >
        <div className="w-full max-w-sm">
          <Select defaultValue="in-progress">
            <SelectTrigger className="w-full" aria-label="Status">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in-progress">In progress</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Section>

      <Section
        title="With groups"
        description="Group related options with SelectGroup, a SelectLabel heading, and separators."
      >
        <div className="w-full max-w-sm">
          <Select>
            <SelectTrigger className="w-full" aria-label="Timezone">
              <SelectValue placeholder="Select a timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>North America</SelectLabel>
                <SelectItem value="pt">Pacific Time (PT)</SelectItem>
                <SelectItem value="mt">Mountain Time (MT)</SelectItem>
                <SelectItem value="ct">Central Time (CT)</SelectItem>
                <SelectItem value="et">Eastern Time (ET)</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Europe</SelectLabel>
                <SelectItem value="gmt">Greenwich Mean Time (GMT)</SelectItem>
                <SelectItem value="cet">Central European Time (CET)</SelectItem>
                <SelectItem value="eet">Eastern European Time (EET)</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </Section>

      <Section
        title="With icons"
        description="Add an icon as the first child of an item to render it alongside the label."
      >
        <div className="w-full max-w-sm">
          <Select>
            <SelectTrigger className="w-full" aria-label="Payment method">
              <SelectValue placeholder="Select a payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="card">
                <CreditCard />
                Credit card
              </SelectItem>
              <SelectItem value="bank">
                <Banknote />
                Bank transfer
              </SelectItem>
              <SelectItem value="wallet">
                <Wallet />
                Digital wallet
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Section>

      <Section
        title="Disabled state"
        description="Disable the whole select with the disabled prop, or a single option."
      >
        <Select disabled>
          <SelectTrigger aria-label="Disabled status">
            <SelectValue placeholder="Disabled" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger aria-label="Status with disabled option">
            <SelectValue placeholder="Disabled option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in-progress" disabled>
              In progress (locked)
            </SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </Section>

      <Section
        title="Validation error"
        description="Mark the trigger with aria-invalid for the destructive border and render the message with FieldError."
      >
        <Field className="max-w-sm" data-invalid="true">
          <FieldLabel htmlFor="invalid-country">Country</FieldLabel>
          <Select>
            <SelectTrigger id="invalid-country" aria-invalid className="w-full">
              <SelectValue placeholder="Select a country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ca">Canada</SelectItem>
              <SelectItem value="mx">Mexico</SelectItem>
              <SelectItem value="us">United States</SelectItem>
            </SelectContent>
          </Select>
          <FieldError>Please select a country.</FieldError>
        </Field>
      </Section>

      <Section
        title="Scrollable list"
        description="Long option lists scroll within the panel and surface scroll buttons at the edges."
      >
        <div className="w-full max-w-sm">
          <Select>
            <SelectTrigger className="w-full" aria-label="Timezone">
              <SelectValue placeholder="Select a timezone" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((zone) => (
                <SelectItem key={zone} value={zone}>
                  {zone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Section>

      <Section
        title="Phone number"
        description="A compact country/dial-code select paired with a phone input — the long, flag-prefixed list scrolls within the panel."
      >
        <PhoneNumberSelectExample />
      </Section>

      <Section
        title="Controlled"
        description="Use the value and onValueChange props to drive the select from React state."
      >
        <ControlledSelectExample />
      </Section>

      <Section
        title="In a fieldset"
        description="Group a select with other controls using FieldSet, FieldLegend, and FieldGroup."
      >
        <FieldSet className="w-full max-w-md">
          <FieldLegend>Shipping details</FieldLegend>
          <FieldDescription>
            Without this your odds of getting your order are low.
          </FieldDescription>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="fs-street">Street address</FieldLabel>
              <Input id="fs-street" />
            </Field>
            <Field>
              <FieldLabel htmlFor="fs-country">Country</FieldLabel>
              <Select>
                <SelectTrigger id="fs-country" className="w-full">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ca">Canada</SelectItem>
                  <SelectItem value="mx">Mexico</SelectItem>
                  <SelectItem value="us">United States</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </FieldSet>
      </Section>
    </>
  );
}
