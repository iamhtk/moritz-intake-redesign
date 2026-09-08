'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@repo/ui/lib/utils';
import type { Locale } from '@/i18n/routing';
import { ClientWelcome } from '@/components/design/onboarding/client-welcome';
import { DetailsForm } from '@/components/design/onboarding/details-form';
import { OnboardingStepHeader } from '@/components/design/onboarding/onboarding-step-header';
import {
  PhoneVerifyStep,
  type PhoneVerificationValue,
} from '@/components/design/onboarding/phone-verify-step';
import { AddressStep } from '@/components/design/onboarding/address-step';
import { WaitlistForm } from '@/components/design/onboarding/waitlist-form';
import { InactiveUserCard } from '@/components/design/onboarding/inactive-user-card';
import { WaitlistContactCard } from '@/components/design/onboarding/waitlist-contact-card';
import { CompleteCard } from '@/components/design/onboarding/complete-card';
import type { StructuredAddress } from '@/lib/mocks/addresses';
import {
  type ClientStep,
  CLIENT_PROGRESS_BY_STEP,
  CLIENT_PROGRESS_TOTAL,
  clientBranchBack,
  clientBranchNext,
  clientStepShowsHeaderLogo,
  clientStepToPanelVariant,
  isClientDetailStep,
} from '@/components/design/onboarding/client-flow';
import type { OnboardingPanelVariant } from '@/components/design/onboarding/onboarding-panel-context';

/**
 * Shared layout for header + form steps — a modest top offset so content
 * doesn't hug the header chrome. Fills the available height as a flex column so
 * the forms (which anchor their actions with `mt-auto`) keep the Continue
 * button pinned to the bottom. Welcome/complete screens manage their own
 * vertical rhythm via `h-full` centering.
 */
export const FORM_STEP_CLASS = 'flex flex-1 flex-col gap-8 pt-6 lg:pt-10';

function getCountryName(countryCode: string, locale: string): string {
  if (typeof Intl.DisplayNames === 'undefined') {
    return countryCode;
  }
  try {
    return (
      new Intl.DisplayNames([locale], { type: 'region' }).of(countryCode) ??
      countryCode
    );
  } catch {
    return countryCode;
  }
}

/**
 * The data + handlers a single client screen needs. The playground passes mock
 * data and simulated submits; the main app passes real user data, server-driven
 * navigation, and tRPC mutations via the injectable `onSubmit*` seams (see
 * PORTING.md).
 */
export interface ClientStepViewProps {
  step: ClientStep;
  userName: string;
  userEmail: string;
  companyName: string;
  userImage: string | null;
  selectedCountry: string;
  onContinue: () => void;
  onBack?: () => void;
  onCountryChange?: (countryCode: string) => void;
  waitlistSubmitted: boolean;
  onWaitlistSubmittedChange: (submitted: boolean) => void;
  /** Address collected on the `address` step (for the engagement letter). */
  address: StructuredAddress | null;
  onAddressChange: (address: StructuredAddress | null) => void;
  /** Verified phone from the `verify` step, retained across navigation. */
  phone: PhoneVerificationValue | null;
  onPhoneChange: (value: PhoneVerificationValue) => void;
  progressCurrent?: number;
  progressTotal?: number;
  dashboardPath: string;
  /** Injected real mutation for the personal/company steps (default: mock). */
  onSubmitDetails?: () => void | Promise<void>;
  /** Injected real mutation for joining the waitlist (default: mock). */
  onJoinWaitlist?: () => void | Promise<void>;
  /** Injected real mutation to persist the address (default: mock). */
  onSubmitAddress?: () => void | Promise<void>;
  /** Injected real mutation to send the OTP (default: mock). */
  onSendVerificationCode?: (phoneE164: string) => void | Promise<void>;
  /** Injected real mutation to check the OTP (default: mock). */
  onCheckVerificationCode?: (code: string) => void | Promise<void>;
}

/**
 * Single source of truth for how each client onboarding screen renders. A plain
 * presentational component (no flow state, no playground chrome) so it can be
 * reused by both the production flow below and the playground dev-chrome
 * harness, and lifted into the main app unchanged.
 */
export function ClientStepView({
  step,
  userName,
  userEmail,
  companyName,
  userImage,
  selectedCountry,
  onContinue,
  onBack,
  onCountryChange,
  waitlistSubmitted,
  onWaitlistSubmittedChange,
  address,
  onAddressChange,
  phone,
  onPhoneChange,
  progressCurrent,
  progressTotal,
  dashboardPath,
  onSubmitDetails,
  onJoinWaitlist,
  onSubmitAddress,
  onSendVerificationCode,
  onCheckVerificationCode,
}: ClientStepViewProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations('onboarding');
  const tReg = useTranslations('registration');

  switch (step) {
    case 'welcome':
      return <ClientWelcome email={userEmail} onContinue={onContinue} />;
    case 'personal':
      return (
        <div className={FORM_STEP_CLASS}>
          <OnboardingStepHeader
            className="mz-animate-step"
            title={tReg('sections.yourDetails')}
            description={tReg('sections.yourDetailsDescription')}
          />
          <DetailsForm
            section="personal"
            customerType="NON_LEGAL"
            showPhone={false}
            defaultName={userName}
            defaultPhoneNumber=""
            defaultCompanyName={companyName}
            defaultCountry={selectedCountry}
            userImage={userImage ?? undefined}
            locale={locale}
            companyCountry={selectedCountry}
            onCountryChange={onCountryChange}
            onContinue={onContinue}
            onBack={onBack}
            onSubmit={onSubmitDetails}
            progressCurrent={progressCurrent}
            progressTotal={progressTotal}
          />
        </div>
      );
    case 'verify':
      return (
        <div className={FORM_STEP_CLASS}>
          <PhoneVerifyStep
            defaultDialCountry={selectedCountry}
            onContinue={onContinue}
            onBack={onBack}
            value={phone}
            onChange={onPhoneChange}
            onSendCode={onSendVerificationCode}
            onVerifyCode={onCheckVerificationCode}
            progressCurrent={progressCurrent}
            progressTotal={progressTotal}
          />
        </div>
      );
    case 'address':
      return (
        <div className={FORM_STEP_CLASS}>
          <AddressStep
            country={selectedCountry}
            value={address}
            onChange={onAddressChange}
            onContinue={onContinue}
            onBack={onBack}
            onSubmit={onSubmitAddress}
            progressCurrent={progressCurrent}
            progressTotal={progressTotal}
          />
        </div>
      );
    case 'company':
      return (
        <div className={FORM_STEP_CLASS}>
          <OnboardingStepHeader
            className="mz-animate-step"
            title={tReg('sections.companyDetails')}
            description={tReg('sections.companyDetailsDescription')}
          />
          <DetailsForm
            section="company"
            customerType="NON_LEGAL"
            defaultName={userName}
            defaultPhoneNumber=""
            defaultCompanyName={companyName}
            defaultCountry={selectedCountry}
            userImage={userImage ?? undefined}
            locale={locale}
            companyCountry={selectedCountry}
            onCountryChange={onCountryChange}
            onContinue={onContinue}
            onBack={onBack}
            onSubmit={onSubmitDetails}
            progressCurrent={progressCurrent}
            progressTotal={progressTotal}
          />
        </div>
      );
    case 'complete':
      return <CompleteCard dashboardPath={dashboardPath} />;
    case 'waitlist':
      return (
        <div
          className={
            waitlistSubmitted
              ? 'flex flex-1 flex-col items-center justify-center gap-6 pt-6 text-center lg:pt-10'
              : FORM_STEP_CLASS
          }
        >
          {!waitlistSubmitted ? (
            <OnboardingStepHeader
              title={t('waitlist.title')}
              description={t('waitlist.description')}
            />
          ) : null}
          <WaitlistForm
            userEmail={userEmail}
            companyName={companyName}
            countryCode={selectedCountry}
            countryName={getCountryName(selectedCountry, locale)}
            onSubmittedChange={onWaitlistSubmittedChange}
            onJoin={onJoinWaitlist}
          />
        </div>
      );
    case 'waitlistContact':
      return <WaitlistContactCard />;
    case 'inactive':
      return <InactiveUserCard />;
    default:
      return null;
  }
}

export interface ClientOnboardingFlowProps {
  userName: string;
  userEmail: string;
  companyName: string;
  userImage: string | null;
  /** Where the completion CTA points (main app: `/client`). */
  dashboardPath?: string;
  /** First screen to show. Defaults to the welcome screen. */
  initialStep?: ClientStep;
  /**
   * Notified whenever the active step changes (including on mount). The
   * playground harness maps this to the brand-panel tint + header-logo
   * visibility; the main app can ignore it or use it for analytics.
   */
  onStepChange?: (step: ClientStep) => void;
  /** Real mutation for the personal/company steps (default: simulated). */
  onSubmitDetails?: () => void | Promise<void>;
  /** Real mutation for joining the waitlist (default: simulated). */
  onJoinWaitlist?: () => void | Promise<void>;
  /** Real mutation to persist the address (default: simulated). */
  onSubmitAddress?: () => void | Promise<void>;
  /** Real mutation to send the phone OTP (default: simulated). */
  onSendVerificationCode?: (phoneE164: string) => void | Promise<void>;
  /** Real mutation to check the phone OTP (default: simulated). */
  onCheckVerificationCode?: (code: string) => void | Promise<void>;
}

/**
 * Portable client (website signup) onboarding flow:
 *   welcome -> personal -> company -> complete | waitlist  (+ inactive).
 *
 * Self-contained and decoupled from playground-only chrome (no dev chrome, no
 * panel context): it owns its own step state and reports changes via
 * `onStepChange`. To lift into the main app, replace the local `step` state with
 * the server-driven `getOnboardingStep`, and pass real mutations via the
 * `onSubmit*` props (see PORTING.md).
 */
export function ClientOnboardingFlow({
  userName,
  userEmail,
  companyName,
  userImage,
  dashboardPath = '/client',
  initialStep = 'welcome',
  onStepChange,
  onSubmitDetails,
  onJoinWaitlist,
  onSubmitAddress,
  onSendVerificationCode,
  onCheckVerificationCode,
}: ClientOnboardingFlowProps) {
  const [step, setStep] = useState<ClientStep>(initialStep);
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [address, setAddress] = useState<StructuredAddress | null>(null);
  const [phone, setPhone] = useState<PhoneVerificationValue | null>(null);

  // Reset the waitlist success state whenever we leave the waitlist screen.
  useEffect(() => {
    if (step !== 'waitlist') {
      setWaitlistSubmitted(false);
    }
  }, [step]);

  // Report the active step so the harness can tint the panel / toggle the logo.
  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  const handleContinue = () => setStep(clientBranchNext(step, selectedCountry));
  const handleBack = () => setStep(clientBranchBack(step));

  const progressCurrent = CLIENT_PROGRESS_BY_STEP[step];
  // Both detail steps can go back (personal -> welcome, company -> personal).
  const showBack = isClientDetailStep(step);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex flex-1 flex-col">
        {/* Keyed by step so React remounts on navigation and replays the calm
            enter-only transition. Detail steps animate header + fields
            individually (so the shared footer stays put), so the whole-step
            animation only applies to the other screens. */}
        <div
          key={step}
          className={cn(
            'flex flex-1 flex-col',
            !isClientDetailStep(step) && 'mz-animate-step',
          )}
        >
          <ClientStepView
            step={step}
            userName={userName}
            userEmail={userEmail}
            companyName={companyName}
            userImage={userImage}
            selectedCountry={selectedCountry}
            onContinue={handleContinue}
            onBack={showBack ? handleBack : undefined}
            onCountryChange={setSelectedCountry}
            waitlistSubmitted={waitlistSubmitted}
            onWaitlistSubmittedChange={setWaitlistSubmitted}
            address={address}
            onAddressChange={setAddress}
            phone={phone}
            onPhoneChange={setPhone}
            progressCurrent={progressCurrent}
            progressTotal={CLIENT_PROGRESS_TOTAL}
            dashboardPath={dashboardPath}
            onSubmitDetails={onSubmitDetails}
            onJoinWaitlist={onJoinWaitlist}
            onSubmitAddress={onSubmitAddress}
            onSendVerificationCode={onSendVerificationCode}
            onCheckVerificationCode={onCheckVerificationCode}
          />
        </div>
      </div>
    </div>
  );
}

/** Re-exported for the harness so panel/logo mapping stays in one place. */
export { clientStepToPanelVariant, clientStepShowsHeaderLogo };
export type { OnboardingPanelVariant };
