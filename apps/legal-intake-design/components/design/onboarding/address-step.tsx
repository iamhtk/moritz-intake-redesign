'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AddressField } from '@/components/design/onboarding/address-field';
import { OnboardingActions } from '@/components/design/onboarding/onboarding-actions';
import { OnboardingStepHeader } from '@/components/design/onboarding/onboarding-step-header';
import type { StructuredAddress } from '@/lib/mocks/addresses';

interface AddressStepProps {
  /** Country selected on the company step — drives the address experience. */
  country: string;
  value: StructuredAddress | null;
  onChange: (value: StructuredAddress | null) => void;
  onContinue?: () => void;
  onBack?: () => void;
  progressCurrent?: number;
  progressTotal?: number;
  /**
   * Main-app seam: persist the address (e.g. `registration.updateCompany` with
   * address fields). The playground defaults to a simulated delay.
   */
  onSubmit?: () => void | Promise<void>;
}

function isComplete(address: StructuredAddress | null): boolean {
  return Boolean(
    address?.line1?.trim() &&
      address?.city?.trim() &&
      address?.postalCode?.trim(),
  );
}

/**
 * Company-address onboarding step: a header + the country-aware `AddressField`
 * + the shared footer. This is the client's company address (it follows the
 * company step and reuses its country), collected so Moritz can post the
 * engagement letter — so the required postal fields (line 1, city, postcode)
 * are validated before advancing.
 */
export function AddressStep({
  country,
  value,
  onChange,
  onContinue,
  onBack,
  progressCurrent,
  progressTotal,
  onSubmit,
}: AddressStepProps) {
  const t = useTranslations('onboarding.address');
  const tReg = useTranslations('registration');
  const [showErrors, setShowErrors] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleContinue = useCallback(() => {
    if (!isComplete(value)) {
      setShowErrors(true);
      return;
    }
    setIsPending(true);
    const run = onSubmit
      ? Promise.resolve(onSubmit())
      : new Promise<void>((resolve) => setTimeout(resolve, 500));
    run.then(() => onContinue?.()).finally(() => setIsPending(false));
  }, [value, onSubmit, onContinue]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <OnboardingStepHeader
        className="mz-animate-step"
        title={t('title')}
        description={t('description')}
      />

      <div className="mz-animate-step">
        <AddressField
          country={country}
          value={value}
          onChange={(next) => {
            onChange(next);
            if (showErrors) setShowErrors(false);
          }}
          showErrors={showErrors}
        />
      </div>

      <OnboardingActions
        className="mt-auto"
        continueLabel={tReg('actions.continue')}
        continueType="button"
        onContinue={handleContinue}
        isPending={isPending}
        backLabel={tReg('actions.back')}
        onBack={onBack}
        progressCurrent={progressCurrent}
        progressTotal={progressTotal}
      />
    </div>
  );
}
