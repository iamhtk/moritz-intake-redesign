import type { Metadata } from 'next';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@repo/ui/components/field';

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/design/foundations/components/input-otp';
import { Section } from '@/components/design/foundations/showcase/section';
import {
  CompletionOTPExample,
  ControlledOTPExample,
  FormOTPExample,
} from '@/components/design/foundations/examples/otp-examples';

export const metadata: Metadata = { title: 'Otp · Foundations' };

// Mirror input-otp's `REGEXP_ONLY_DIGITS` / `REGEXP_ONLY_DIGITS_AND_CHARS`
// constants inline: this is a server component, and importing them from the
// `input-otp` package would evaluate its `createContext` call on the server.
const REGEXP_ONLY_DIGITS = '^\\d+$';
const REGEXP_ONLY_DIGITS_AND_CHARS = '^[a-zA-Z0-9]+$';

export default function InputOTPFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Input OTP</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          The foundation one-time-code input, built on the shadcn Input OTP:
          grouped slots, a separator, labels, patterns, disabled, and invalid
          states, with a mobile-first size scale.
        </p>
      </header>

      <Section
        title="Basic example"
        description="Use a single InputOTPGroup of slots to render a continuous code input."
      >
        <InputOTP maxLength={6} aria-label="One-time code">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </Section>

      <Section
        title="With separator"
        description="Split the slots into two groups with an InputOTPSeparator for a 3-3 layout."
      >
        <InputOTP maxLength={6} aria-label="One-time code">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </Section>

      <Section
        title="With label"
        description="Wrap the input in a Field to associate it with a FieldLabel and an optional description."
      >
        <Field className="max-w-sm">
          <FieldLabel htmlFor="labelled-otp">Verification code</FieldLabel>
          <InputOTP id="labelled-otp" maxLength={6}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <FieldDescription>
            Enter the 6-digit code we sent to your phone.
          </FieldDescription>
        </Field>
      </Section>

      <Section
        title="Digits only"
        description="Pass pattern={REGEXP_ONLY_DIGITS} to restrict input to numeric characters."
      >
        <InputOTP
          maxLength={6}
          pattern={REGEXP_ONLY_DIGITS}
          aria-label="Numeric one-time code"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </Section>

      <Section
        title="Four digits"
        description="A common PIN-code pattern — four slots with maxLength={4} and pattern={REGEXP_ONLY_DIGITS}."
      >
        <InputOTP
          maxLength={4}
          pattern={REGEXP_ONLY_DIGITS}
          aria-label="Four-digit PIN"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>
      </Section>

      <Section
        title="Alphanumeric"
        description="Pass pattern={REGEXP_ONLY_DIGITS_AND_CHARS} to allow letters and digits."
      >
        <InputOTP
          maxLength={6}
          pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
          aria-label="Alphanumeric one-time code"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </Section>

      <Section
        title="Disabled state"
        description="Add the disabled prop to dim the whole group and block input (uses has-disabled:opacity-50)."
      >
        <InputOTP
          maxLength={6}
          disabled
          aria-label="One-time code"
          defaultValue="123"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </Section>

      <Section
        title="Validation error"
        description="Mark the input with aria-invalid for the destructive slot borders and render the message with FieldError."
      >
        <Field className="max-w-sm" data-invalid="true">
          <FieldLabel htmlFor="invalid-otp">Verification code</FieldLabel>
          <InputOTP
            id="invalid-otp"
            maxLength={6}
            aria-invalid
            defaultValue="123456"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <FieldError>That code is incorrect or has expired.</FieldError>
        </Field>
      </Section>

      <Section
        title="Controlled component"
        description="Use the value and onChange props to drive the code from React state."
      >
        <ControlledOTPExample />
      </Section>

      <Section
        title="On complete"
        description="Use the onComplete callback to react once every slot is filled."
      >
        <CompletionOTPExample />
      </Section>

      <Section
        title="Form"
        description="Compose the input into a verification form with a submit action and a resend control."
      >
        <FormOTPExample />
      </Section>
    </>
  );
}
