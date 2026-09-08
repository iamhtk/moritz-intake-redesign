'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Field, FieldDescription, FieldLabel } from '@repo/ui/components/field';
import { CircleCheck } from '@repo/ui/icons';

import { Button } from '@/components/design/foundations/components/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/design/foundations/components/input-otp';

/**
 * Stateful OTP demos used by the foundation showcase page. These live in a
 * client component because they track the entered code with React state, while
 * the showcase page itself stays a server component.
 */

export function ControlledOTPExample() {
  const [value, setValue] = React.useState('');

  return (
    <Field className="max-w-sm">
      <FieldLabel htmlFor="controlled-otp">Verification code</FieldLabel>
      <InputOTP
        id="controlled-otp"
        maxLength={6}
        pattern={REGEXP_ONLY_DIGITS}
        value={value}
        onChange={setValue}
      >
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
      <FieldDescription>
        Current value: {value ? value : '(empty)'}
      </FieldDescription>
    </Field>
  );
}

export function CompletionOTPExample() {
  const [completed, setCompleted] = React.useState(false);

  return (
    <Field className="max-w-sm">
      <FieldLabel htmlFor="complete-otp">Verification code</FieldLabel>
      <InputOTP
        id="complete-otp"
        maxLength={6}
        pattern={REGEXP_ONLY_DIGITS}
        onComplete={() => setCompleted(true)}
        onChange={(next) => {
          if (next.length < 6) setCompleted(false);
        }}
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
      <FieldDescription>
        {completed ? (
          <span className="text-success inline-flex items-center gap-1.5">
            <CircleCheck className="size-4" aria-hidden="true" />
            Code complete — ready to verify.
          </span>
        ) : (
          'Enter all six digits to trigger onComplete.'
        )}
      </FieldDescription>
    </Field>
  );
}

export function FormOTPExample() {
  const [value, setValue] = React.useState('');

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (value.length !== 6) return;
    toast.success('Code verified (mock).');
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <Field>
        <FieldLabel htmlFor="form-otp">Verification code</FieldLabel>
        <InputOTP
          id="form-otp"
          maxLength={6}
          pattern={REGEXP_ONLY_DIGITS}
          value={value}
          onChange={setValue}
        >
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
        <FieldDescription>
          Enter the 6-digit code we sent to your email address.
        </FieldDescription>
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={value.length !== 6}>
          Verify
        </Button>
        <Button
          type="button"
          variant="link"
          onClick={() => toast.success('A new code is on its way (mock).')}
        >
          Resend code
        </Button>
      </div>
    </form>
  );
}
