'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Field, FieldError, FieldLabel } from '@repo/ui/components/field';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/design/foundations/components/input-otp';
import { Button } from '@/components/design/design-system/button';
import {
  Card,
  CardContent,
} from '@/components/design/foundations/components/card';
import { Input } from '@/components/design/design-system/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from '@/components/design/design-system/select';
import { Muted } from '@/components/design/design-system/typography';
import { OnboardingActions } from '@/components/design/onboarding/onboarding-actions';
import { OnboardingStepHeader } from '@/components/design/onboarding/onboarding-step-header';
import {
  PINNED_DIAL_CODES,
  OTHER_DIAL_CODES,
  getDefaultCountryCode,
  getDialCodeForCountry,
  getEntryForCountry,
  formatNationalNumber,
  isValidNationalNumber,
} from '@/lib/dial-codes';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

/**
 * The verified-phone state the flow retains across navigation. Lifting this out
 * of the step (which remounts on every navigation) is what lets a user return
 * to the step and see their already-verified number instead of a blank field.
 */
export interface PhoneVerificationValue {
  /** ISO country whose dial code is selected (re-seeds the Select). */
  dialCountry: string;
  /** National number as the user typed it (already formatted for display). */
  localNumber: string;
  /** Full E.164 number, e.g. `+14155550123`. */
  phoneE164: string;
  /** True once this exact number has passed OTP verification. */
  verified: boolean;
}

interface PhoneVerifyStepProps {
  /** Seeds the dial-code selector (defaults to the client's selected country). */
  defaultDialCountry?: string | null;
  /** Advance to the next flow step once the number is verified. */
  onContinue?: () => void;
  /** Flow back navigation (shown on the "enter number" sub-step). */
  onBack?: () => void;
  progressCurrent?: number;
  progressTotal?: number;
  /**
   * The last verified phone, owned by the flow. When present and verified, the
   * step opens on a confirmation view so the number survives back-navigation.
   */
  value?: PhoneVerificationValue | null;
  /**
   * Lifts the number + verified flag to the flow so it persists across steps
   * (and the main app can save it). Called only once a number is verified.
   */
  onChange?: (value: PhoneVerificationValue) => void;
  /**
   * Main-app seam: send the OTP (`registration.sendPhoneVerification`). The
   * playground defaults to a simulated delay so no backend is needed.
   */
  onSendCode?: (phoneE164: string) => void | Promise<void>;
  /**
   * Main-app seam: check the OTP (`registration.checkPhoneVerification`). The
   * playground default accepts any 6-digit code after a short delay.
   */
  onVerifyCode?: (code: string) => void | Promise<void>;
}

/**
 * Dedicated phone-verification onboarding step. Captures the mobile number and
 * confirms ownership via a one-time code, inline (no modal) so it reads as a
 * first-class step in the linear flow. Two sub-steps share the bottom-anchored
 * footer: `phone` (enter the number) -> `code` (enter the OTP).
 *
 * Production parity: this mirrors `apps/legal-intake/components/phone-verification.tsx`
 * (dial-code + number, `InputOTP`, resend countdown, change-number) but as a
 * full screen rather than a dialog, and with the tRPC mutations replaced by the
 * injectable `onSendCode` / `onVerifyCode` seams (mock `setTimeout` by default).
 */
export function PhoneVerifyStep({
  defaultDialCountry,
  onContinue,
  onBack,
  progressCurrent,
  progressTotal,
  value,
  onChange,
  onSendCode,
  onVerifyCode,
}: PhoneVerifyStepProps) {
  const t = useTranslations('registration');
  const tVerify = useTranslations('onboarding.verify');

  // A number is "remembered as verified" only if the flow handed us a verified
  // value. Editing is local until re-verified, so backing out of an edit keeps
  // this baseline — an unchanged number never needs re-verifying.
  const hasVerifiedNumber = Boolean(value?.verified && value.localNumber);

  // Seed from the retained value (the step remounts on every navigation, so
  // reading `value` once at init is correct — no syncing effect needed).
  const [subStep, setSubStep] = useState<'phone' | 'code' | 'verified'>(
    hasVerifiedNumber ? 'verified' : 'phone',
  );
  const [dialCountry, setDialCountry] = useState(
    value?.dialCountry ?? getDefaultCountryCode(defaultDialCountry ?? null),
  );
  const [localNumber, setLocalNumber] = useState(value?.localNumber ?? '');
  const [phoneInvalid, setPhoneInvalid] = useState(false);
  const [code, setCode] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const phoneInputRef = useRef<HTMLInputElement>(null);
  // See details-form.tsx: keep the caret stable across live reformatting by
  // counting digits before it, then restoring after the value reformats.
  const caretDigitsRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useLayoutEffect(() => {
    const input = phoneInputRef.current;
    const targetDigits = caretDigitsRef.current;
    if (!input || targetDigits === null) return;
    caretDigitsRef.current = null;

    const formatted = input.value;
    let seen = 0;
    let caret = formatted.length;
    for (let i = 0; i < formatted.length; i++) {
      if (seen === targetDigits) {
        caret = i;
        break;
      }
      if (/\d/.test(formatted[i]!)) seen++;
    }
    input.setSelectionRange(caret, caret);
  }, [localNumber]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const startResendTimer = useCallback(() => {
    clearTimer();
    setResendCountdown(RESEND_COOLDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  const dialCode = getDialCodeForCountry(dialCountry);
  const phoneE164 = useMemo(
    () => `+${dialCode}${localNumber.replace(/\D/g, '')}`,
    [dialCode, localNumber],
  );
  const formattedPhone = `(+${dialCode}) ${localNumber}`;
  const numberValid = isValidNationalNumber(localNumber, dialCountry);

  const handleDialCountryChange = useCallback((next: string) => {
    setDialCountry(next);
    setLocalNumber((current) => formatNationalNumber(current, next));
    setPhoneInvalid(false);
  }, []);

  const handleSendCode = useCallback(() => {
    if (!numberValid) {
      setPhoneInvalid(true);
      return;
    }
    setIsPending(true);
    const run = onSendCode
      ? Promise.resolve(onSendCode(phoneE164))
      : new Promise<void>((resolve) => setTimeout(resolve, 500));
    run
      .then(() => {
        setSubStep('code');
        setCode('');
        startResendTimer();
        toast.success(tVerify('codeSent', { phoneNumber: formattedPhone }));
      })
      .finally(() => setIsPending(false));
  }, [
    numberValid,
    phoneE164,
    onSendCode,
    startResendTimer,
    formattedPhone,
    tVerify,
  ]);

  const handleVerify = useCallback(
    (value: string) => {
      if (value.length !== OTP_LENGTH) return;
      setIsPending(true);
      // The mock accepts any 6-digit code; the main app injects the real
      // `checkPhoneVerification` mutation via `onVerifyCode`.
      const run = onVerifyCode
        ? Promise.resolve(onVerifyCode(value))
        : new Promise<void>((resolve) => setTimeout(resolve, 500));
      run
        .then(() => {
          clearTimer();
          // Persist the verified number so navigating back restores it without
          // a re-verify; only a *changed* number resets this on the next pass.
          onChange?.({ dialCountry, localNumber, phoneE164, verified: true });
          toast.success(tVerify('verified'));
          onContinue?.();
        })
        .catch(() => setCode(''))
        .finally(() => setIsPending(false));
    },
    [
      onVerifyCode,
      clearTimer,
      onChange,
      dialCountry,
      localNumber,
      phoneE164,
      tVerify,
      onContinue,
    ],
  );

  // Leaving the edit form without re-verifying discards the unsaved edit and
  // returns to the confirmation, keeping the previously verified number intact.
  const returnToVerified = useCallback(() => {
    if (!value) return;
    setDialCountry(value.dialCountry);
    setLocalNumber(value.localNumber);
    setPhoneInvalid(false);
    setSubStep('verified');
  }, [value]);

  const handleResend = useCallback(() => {
    if (resendCountdown > 0 || isPending) return;
    const run = onSendCode
      ? Promise.resolve(onSendCode(phoneE164))
      : new Promise<void>((resolve) => setTimeout(resolve, 300));
    run.then(() => {
      startResendTimer();
      toast.success(tVerify('codeSent', { phoneNumber: formattedPhone }));
    });
  }, [
    resendCountdown,
    isPending,
    onSendCode,
    phoneE164,
    startResendTimer,
    formattedPhone,
    tVerify,
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <OnboardingStepHeader
        className="mz-animate-step"
        title={
          subStep === 'verified' ? tVerify('verifiedTitle') : tVerify('title')
        }
        description={
          subStep === 'phone'
            ? tVerify('description')
            : subStep === 'verified'
              ? tVerify('verifiedDescription')
              : tVerify('codeSentTo', { phoneNumber: formattedPhone })
        }
      />

      {subStep === 'verified' ? (
        <div className="mz-animate-step space-y-4">
          <Card size="sm">
            <CardContent className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{formattedPhone}</p>
                <p className="text-muted-foreground text-sm">
                  {tVerify('verified')}
                </p>
              </div>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto shrink-0 p-0"
                onClick={() => setSubStep('phone')}
              >
                {tVerify('changeNumber')}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : subStep === 'phone' ? (
        <div className="mz-animate-step space-y-4">
          <Field data-invalid={phoneInvalid || undefined}>
            <FieldLabel htmlFor="verifyPhoneNumber">
              {t('fields.phoneNumber')}
            </FieldLabel>
            <div className="flex items-center gap-2">
              <Select
                value={dialCountry}
                onValueChange={handleDialCountryChange}
              >
                <SelectTrigger className="w-[130px] shrink-0">
                  <span>
                    {getEntryForCountry(dialCountry)?.flag} {dialCountry} +
                    {dialCode}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {PINNED_DIAL_CODES.map((entry) => (
                    <SelectItem
                      key={entry.code}
                      value={entry.code}
                      textValue={entry.name}
                    >
                      {entry.flag} {entry.name} (+{entry.dialCode})
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  {OTHER_DIAL_CODES.map((entry) => (
                    <SelectItem
                      key={entry.code}
                      value={entry.code}
                      textValue={entry.name}
                    >
                      {entry.flag} {entry.name} (+{entry.dialCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                ref={phoneInputRef}
                id="verifyPhoneNumber"
                name="verifyPhoneNumber"
                type="tel"
                inputMode="tel"
                autoFocus
                value={localNumber}
                onChange={(event) => {
                  const raw = event.target.value;
                  const caret = event.target.selectionStart ?? raw.length;
                  let digitsBeforeCaret = 0;
                  for (let i = 0; i < caret; i++) {
                    if (/\d/.test(raw[i]!)) digitsBeforeCaret++;
                  }
                  caretDigitsRef.current = digitsBeforeCaret;
                  setLocalNumber(formatNationalNumber(raw, dialCountry));
                  if (phoneInvalid) setPhoneInvalid(false);
                }}
                aria-invalid={phoneInvalid || undefined}
                autoComplete="tel-national"
                className="min-w-0 flex-1"
              />
            </div>
            {phoneInvalid && (
              <FieldError>{t('fields.phoneInvalid')}</FieldError>
            )}
          </Field>
          <Muted className="text-xs">{tVerify('smsNote')}</Muted>
        </div>
      ) : (
        <div className="mz-animate-step space-y-5">
          <Field>
            <FieldLabel htmlFor="otp-input">{tVerify('enterCode')}</FieldLabel>
            <InputOTP
              id="otp-input"
              maxLength={OTP_LENGTH}
              pattern={REGEXP_ONLY_DIGITS}
              autoFocus
              value={code}
              onChange={(value) => {
                setCode(value);
                if (value.length === OTP_LENGTH) handleVerify(value);
              }}
              disabled={isPending}
            >
              <InputOTPGroup>
                {Array.from({ length: OTP_LENGTH }, (_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </Field>

          <Muted className="text-sm">
            {resendCountdown > 0 ? (
              tVerify('resendIn', { seconds: resendCountdown })
            ) : (
              <>
                {tVerify('didntGetCode')}{' '}
                <button
                  type="button"
                  className="text-primary font-medium hover:underline"
                  onClick={handleResend}
                  disabled={isPending}
                >
                  {tVerify('resendCode')}
                </button>
              </>
            )}
          </Muted>
        </div>
      )}

      <OnboardingActions
        className="mt-auto"
        continueLabel={
          subStep === 'verified'
            ? t('actions.continue')
            : subStep === 'phone'
              ? tVerify('sendCode')
              : tVerify('verify')
        }
        continueType="button"
        onContinue={
          subStep === 'verified'
            ? onContinue
            : subStep === 'phone'
              ? handleSendCode
              : () => handleVerify(code)
        }
        continueDisabled={
          subStep === 'verified'
            ? false
            : subStep === 'phone'
              ? !numberValid
              : code.length !== OTP_LENGTH
        }
        isPending={isPending}
        backLabel={
          subStep === 'code' ? tVerify('changeNumber') : t('actions.back')
        }
        onBack={
          subStep === 'code'
            ? () => setSubStep('phone')
            : subStep === 'phone' && hasVerifiedNumber
              ? returnToVerified
              : onBack
        }
        progressCurrent={progressCurrent}
        progressTotal={progressTotal}
      />
    </div>
  );
}
