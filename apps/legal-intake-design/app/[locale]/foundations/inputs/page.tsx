import type { Metadata } from 'next';
import { Badge } from '@repo/ui/components/badge';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@repo/ui/components/field';
import { Info, Mail, Search } from '@repo/ui/icons';

import { Section } from '@/components/design/foundations/showcase/section';
import { Input } from '@/components/design/foundations/components/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/design/foundations/components/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/design/foundations/components/select';
import { ControlledInputExample } from '@/components/design/foundations/examples/input-examples';

export const metadata: Metadata = { title: 'Inputs · Foundations' };

export default function InputsFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Input Fields</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          The foundation input, built on the shadcn Input and shared{' '}
          <code>Field</code> primitives: labels, descriptions, icons, types,
          validation, fieldsets, and a mobile-first size scale.
        </p>
      </header>

      {/* --- Input patterns --- */}

      <Section
        title="Basic example"
        description="Use the Input on its own to render a standalone input — provide an aria-label for assistive technology."
      >
        <div className="w-full max-w-sm">
          <Input aria-label="Full name" placeholder="Full name" />
        </div>
      </Section>

      <Section
        title="With label"
        description="Wrap a label and input in a Field to associate them with a generated id."
      >
        <Field className="max-w-sm">
          <FieldLabel htmlFor="label-full-name">Full name</FieldLabel>
          <Input id="label-full-name" />
        </Field>
      </Section>

      <Section
        title="With description"
        description="Use FieldDescription to add a helper description above or below the input."
      >
        <Field className="max-w-sm">
          <FieldLabel htmlFor="desc-product">Product name</FieldLabel>
          <FieldDescription>
            Use the name you&apos;d like people to see in their cart.
          </FieldDescription>
          <Input id="desc-product" />
        </Field>
      </Section>

      <Section
        title="With icon"
        description="Wrap an icon and input with InputGroup to render an input with a leading or trailing icon."
      >
        <div className="grid w-full max-w-sm gap-4">
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              placeholder="Search…"
              aria-label="Search"
            />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <InputGroupText>https://</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput placeholder="example.com" />
          </InputGroup>
          <InputGroup>
            <InputGroupInput type="email" placeholder="you@example.com" />
            <InputGroupAddon align="inline-end">
              <Mail />
            </InputGroupAddon>
          </InputGroup>
        </div>
      </Section>

      <Section
        title="Setting the type"
        description="Use the type prop for any supported text input type — email, password, number, url, and more."
      >
        <FieldGroup className="max-w-sm">
          <Field>
            <FieldLabel htmlFor="type-email">Email</FieldLabel>
            <Input id="type-email" type="email" placeholder="you@example.com" />
          </Field>
          <Field>
            <FieldLabel htmlFor="type-password">Password</FieldLabel>
            <Input id="type-password" type="password" placeholder="••••••••" />
          </Field>
          <Field>
            <FieldLabel htmlFor="type-number">Amount</FieldLabel>
            <Input id="type-number" type="number" placeholder="0" />
          </Field>
          <Field>
            <FieldLabel htmlFor="type-url">Your website</FieldLabel>
            <Input id="type-url" type="url" placeholder="https://example.com" />
          </Field>
        </FieldGroup>
      </Section>

      <Section
        title="Disabled state"
        description="Add data-disabled to the Field and disabled to the input to disable it and dim its label."
      >
        <Field className="max-w-sm" data-disabled="true">
          <FieldLabel htmlFor="disabled-full-name">Full name</FieldLabel>
          <Input id="disabled-full-name" placeholder="Jane Doe" disabled />
        </Field>
      </Section>

      <Section
        title="Validation errors"
        description="Mark the input with aria-invalid for the destructive border and render the message with FieldError."
      >
        <Field className="max-w-sm" data-invalid="true">
          <FieldLabel htmlFor="invalid-email">Email</FieldLabel>
          <Input
            id="invalid-email"
            type="email"
            defaultValue="not-an-email"
            aria-invalid
          />
          <FieldError>Please enter a valid email address.</FieldError>
        </Field>
      </Section>

      <Section
        title="Constraining width"
        description="Pass className to the Input to constrain its width — e.g. max-w-24 for short fields like a CVC."
      >
        <Field className="max-w-sm">
          <FieldLabel htmlFor="cvc">CVC</FieldLabel>
          <Input
            id="cvc"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="123"
            className="max-w-24"
          />
        </Field>
      </Section>

      <Section
        title="With custom layout"
        description="Use a horizontal Field to place the label and input inline."
      >
        <Field orientation="horizontal" className="max-w-md">
          <FieldLabel htmlFor="custom-full-name">Full name</FieldLabel>
          <Input id="custom-full-name" placeholder="Jane Doe" />
        </Field>
      </Section>

      <Section
        title="Controlled component"
        description="Use the value and onChange props to drive the input from React state."
      >
        <ControlledInputExample />
      </Section>

      {/* --- Fieldset patterns --- */}

      <Section
        title="Fieldset"
        description="Group a subset of controls with FieldSet, FieldLegend, and FieldGroup."
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
              <FieldDescription>
                We currently only ship to North America.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </FieldSet>
      </Section>

      <Section
        title="Fieldset without legend"
        description="Use a FieldSet with aria-label to group controls without a visible legend."
      >
        <FieldSet className="w-full max-w-md" aria-label="Shipping details">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="nl-street">Street address</FieldLabel>
              <Input id="nl-street" />
            </Field>
            <Field>
              <FieldLabel htmlFor="nl-city">City</FieldLabel>
              <Input id="nl-city" />
            </Field>
          </FieldGroup>
        </FieldSet>
      </Section>

      <Section
        title="Fieldset with grid layout"
        description="Wrap fields in grid divs inside a FieldGroup for more complex layouts."
      >
        <FieldSet className="w-full max-w-lg">
          <FieldLegend>Shipping details</FieldLegend>
          <FieldDescription>
            Without this your odds of getting your order are low.
          </FieldDescription>
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="grid-first">First name</FieldLabel>
                <Input id="grid-first" />
              </Field>
              <Field>
                <FieldLabel htmlFor="grid-last">Last name</FieldLabel>
                <Input id="grid-last" />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="grid-street">Street address</FieldLabel>
              <Input id="grid-street" />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="grid-country">Country</FieldLabel>
                <Select>
                  <SelectTrigger id="grid-country" className="w-full">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ca">Canada</SelectItem>
                    <SelectItem value="mx">Mexico</SelectItem>
                    <SelectItem value="us">United States</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="grid-postal">Postal code</FieldLabel>
                <Input id="grid-postal" />
              </Field>
            </div>
          </FieldGroup>
        </FieldSet>
      </Section>

      <Section
        title="Disabled fieldset"
        description="Add disabled to a FieldSet to disable every control inside it at once."
      >
        <FieldSet className="w-full max-w-md" disabled>
          <FieldLegend>Shipping details</FieldLegend>
          <FieldDescription>
            Without this your odds of getting your order are low.
          </FieldDescription>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="dfs-street">Street address</FieldLabel>
              <Input id="dfs-street" placeholder="123 Main St" />
            </Field>
            <Field>
              <FieldLabel htmlFor="dfs-city">City</FieldLabel>
              <Input id="dfs-city" placeholder="Springfield" />
            </Field>
          </FieldGroup>
        </FieldSet>
      </Section>

      {/* --- System-specific extras --- */}

      <Section
        title="File"
        description="Use type='file' to create a file input."
      >
        <Field className="max-w-sm">
          <FieldLabel htmlFor="file-picture">Picture</FieldLabel>
          <Input id="file-picture" type="file" />
          <FieldDescription>Select a picture to upload.</FieldDescription>
        </Field>
      </Section>

      <Section
        title="Required"
        description="Mark required inputs with the required attribute and an asterisk."
      >
        <Field className="max-w-sm">
          <FieldLabel htmlFor="required-field">
            Required field <span className="text-destructive">*</span>
          </FieldLabel>
          <Input id="required-field" placeholder="Required" required />
          <FieldDescription>This field must be filled out.</FieldDescription>
        </Field>
      </Section>

      <Section
        title="Read-only"
        description="A read-only input keeps its value but cannot be edited."
      >
        <Field className="max-w-sm">
          <FieldLabel htmlFor="readonly-field">API key</FieldLabel>
          <Input
            id="readonly-field"
            readOnly
            defaultValue="sk_live_•••••••••"
          />
        </Field>
      </Section>

      <Section
        title="Badge in label"
        description="Use a badge in the label to highlight a recommended or beta field."
      >
        <Field className="max-w-sm">
          <FieldLabel htmlFor="badge-webhook">
            Webhook URL
            <Badge variant="secondary">Beta</Badge>
          </FieldLabel>
          <Input
            id="badge-webhook"
            type="url"
            placeholder="https://example.com/webhook"
          />
        </Field>
      </Section>

      <Section
        title="Input group with info"
        description="Combine an input group with a helper description and a trailing info icon."
      >
        <Field className="max-w-sm">
          <FieldLabel htmlFor="info-key">API key</FieldLabel>
          <InputGroup>
            <InputGroupInput id="info-key" placeholder="sk_live_…" />
            <InputGroupAddon align="inline-end">
              <Info />
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription>
            Your API key is encrypted and stored securely.
          </FieldDescription>
        </Field>
      </Section>
    </>
  );
}
