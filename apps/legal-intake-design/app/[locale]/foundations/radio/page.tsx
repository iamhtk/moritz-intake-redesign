import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '@repo/ui/components/field';

import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/design/foundations/components/radio-group';
import { ControlledRadioExample } from '@/components/design/foundations/examples/radio-examples';
import { Section } from '@/components/design/foundations/showcase/section';

export default function RadioFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Radio</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          The foundation radio, built on the shadcn Radio Group and shared{' '}
          <code>Field</code> primitives: a round control that fills with the
          primary color and reveals a center dot when selected. Used to pick a
          single option from a set.
        </p>
      </header>

      <Section
        title="Usage"
        description="A single-select group: choose one option at a time."
      >
        <RadioGroup defaultValue="comfortable" className="max-w-sm">
          <div className="flex items-center gap-3">
            <RadioGroupItem value="default" id="r-default" />
            <FieldLabel htmlFor="r-default">Default</FieldLabel>
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem value="comfortable" id="r-comfortable" />
            <FieldLabel htmlFor="r-comfortable">Comfortable</FieldLabel>
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem value="compact" id="r-compact" />
            <FieldLabel htmlFor="r-compact">Compact</FieldLabel>
          </div>
        </RadioGroup>
      </Section>

      <Section
        title="Description"
        description="Pair each item with a label and helper text using a horizontal Field."
      >
        <RadioGroup defaultValue="default" className="max-w-sm gap-4">
          <Field orientation="horizontal">
            <RadioGroupItem value="default" id="d-default" />
            <FieldContent>
              <FieldLabel htmlFor="d-default">Default</FieldLabel>
              <FieldDescription>
                Standard spacing for most use cases.
              </FieldDescription>
            </FieldContent>
          </Field>
          <Field orientation="horizontal">
            <RadioGroupItem value="comfortable" id="d-comfortable" />
            <FieldContent>
              <FieldLabel htmlFor="d-comfortable">Comfortable</FieldLabel>
              <FieldDescription>More space between elements.</FieldDescription>
            </FieldContent>
          </Field>
          <Field orientation="horizontal">
            <RadioGroupItem value="compact" id="d-compact" />
            <FieldContent>
              <FieldLabel htmlFor="d-compact">Compact</FieldLabel>
              <FieldDescription>
                Minimal spacing for dense layouts.
              </FieldDescription>
            </FieldContent>
          </Field>
        </RadioGroup>
      </Section>

      <Section
        title="Custom layout"
        description="Arrange items in any layout — here a horizontal row of options — while keeping the styled control."
      >
        <fieldset>
          <legend className="text-sm font-medium">
            How would you rate your experience?
          </legend>
          <RadioGroup
            defaultValue="3"
            className="mt-4 flex flex-row gap-6"
            aria-label="How would you rate your experience?"
          >
            {['1', '2', '3', '4', '5'].map((rating) => (
              <div key={rating} className="flex items-center gap-2">
                <RadioGroupItem value={rating} id={`rating-${rating}`} />
                <FieldLabel htmlFor={`rating-${rating}`}>{rating}</FieldLabel>
              </div>
            ))}
          </RadioGroup>
        </fieldset>
      </Section>

      <Section
        title="Choice card"
        description="Wrap the entire Field in a FieldLabel for a clickable card-style selection that highlights when checked."
      >
        <RadioGroup defaultValue="pro" className="max-w-sm">
          <FieldLabel htmlFor="plan-plus">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Plus</FieldTitle>
                <FieldDescription>
                  For individuals and small teams.
                </FieldDescription>
              </FieldContent>
              <RadioGroupItem value="plus" id="plan-plus" />
            </Field>
          </FieldLabel>
          <FieldLabel htmlFor="plan-pro">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Pro</FieldTitle>
                <FieldDescription>For growing businesses.</FieldDescription>
              </FieldContent>
              <RadioGroupItem value="pro" id="plan-pro" />
            </Field>
          </FieldLabel>
          <FieldLabel htmlFor="plan-enterprise">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Enterprise</FieldTitle>
                <FieldDescription>
                  For large teams and enterprises.
                </FieldDescription>
              </FieldContent>
              <RadioGroupItem value="enterprise" id="plan-enterprise" />
            </Field>
          </FieldLabel>
        </RadioGroup>
      </Section>

      <Section
        title="Fieldset"
        description="Use FieldSet and FieldLegend to group radio items with a label and description."
      >
        <FieldSet className="max-w-sm">
          <FieldLegend>Subscription plan</FieldLegend>
          <FieldDescription>
            Yearly and lifetime plans offer significant savings.
          </FieldDescription>
          <RadioGroup defaultValue="yearly">
            <div className="flex items-center gap-3">
              <RadioGroupItem value="monthly" id="sub-monthly" />
              <FieldLabel htmlFor="sub-monthly">
                Monthly ($9.99/month)
              </FieldLabel>
            </div>
            <div className="flex items-center gap-3">
              <RadioGroupItem value="yearly" id="sub-yearly" />
              <FieldLabel htmlFor="sub-yearly">Yearly ($99.99/year)</FieldLabel>
            </div>
            <div className="flex items-center gap-3">
              <RadioGroupItem value="lifetime" id="sub-lifetime" />
              <FieldLabel htmlFor="sub-lifetime">Lifetime ($299.99)</FieldLabel>
            </div>
          </RadioGroup>
        </FieldSet>
      </Section>

      <Section
        title="Controlled"
        description="Drive the selected value with value and onValueChange to use the group as a controlled component."
      >
        <ControlledRadioExample />
      </Section>

      <Section
        title="Disabled"
        description="Add disabled to a RadioGroupItem to disable individual items."
      >
        <RadioGroup defaultValue="on" className="max-w-sm">
          <div className="flex items-center gap-3">
            <RadioGroupItem value="on" id="r-disabled-on" disabled />
            <FieldLabel htmlFor="r-disabled-on">Disabled, selected</FieldLabel>
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem value="two" id="r-disabled-two" />
            <FieldLabel htmlFor="r-disabled-two">Option 2</FieldLabel>
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem value="three" id="r-disabled-three" />
            <FieldLabel htmlFor="r-disabled-three">Option 3</FieldLabel>
          </div>
        </RadioGroup>
      </Section>

      <Section
        title="Invalid"
        description="Use aria-invalid on the RadioGroupItem and data-invalid on the Field to show validation errors, then render the message with FieldError."
      >
        <FieldSet className="max-w-sm" data-invalid="true">
          <FieldLegend>Notification preferences</FieldLegend>
          <FieldDescription>
            Choose how you want to receive notifications.
          </FieldDescription>
          <RadioGroup>
            <div className="flex items-center gap-3">
              <RadioGroupItem value="email" id="n-email" aria-invalid />
              <FieldLabel htmlFor="n-email">Email only</FieldLabel>
            </div>
            <div className="flex items-center gap-3">
              <RadioGroupItem value="sms" id="n-sms" aria-invalid />
              <FieldLabel htmlFor="n-sms">SMS only</FieldLabel>
            </div>
            <div className="flex items-center gap-3">
              <RadioGroupItem value="both" id="n-both" aria-invalid />
              <FieldLabel htmlFor="n-both">Both email &amp; SMS</FieldLabel>
            </div>
          </RadioGroup>
          <FieldError>Select a notification preference to continue.</FieldError>
        </FieldSet>
      </Section>
    </>
  );
}
