'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@repo/ui/components/badge';
import { ArrowLeft, ArrowRight } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@/components/design/design-system/button';
import type { Locale } from '@/i18n/routing';
import { CustomerTypeForm } from '@/components/design/onboarding/customer-type-form';
import { DetailsForm } from '@/components/design/onboarding/details-form';
import { AttorneyProfileForm } from '@/components/design/onboarding/attorney-profile-form';
import { AttorneyJurisdictionsForm } from '@/components/design/onboarding/attorney-jurisdictions-form';
import { TeamInviteWelcome } from '@/components/design/onboarding/team-invite-welcome';
import { OnboardingStepHeader } from '@/components/design/onboarding/onboarding-step-header';
import { WaitlistCard } from '@/components/design/onboarding/waitlist-card';
import { CompleteCard } from '@/components/design/onboarding/complete-card';
import {
  PhoneVerifyStep,
  type PhoneVerificationValue,
} from '@/components/design/onboarding/phone-verify-step';
import {
  ClientOnboardingFlow,
  ClientStepView,
  FORM_STEP_CLASS,
  clientStepShowsHeaderLogo,
  clientStepToPanelVariant,
} from '@/components/design/onboarding/client-onboarding-flow';
import type { ClientStep } from '@/components/design/onboarding/client-flow';
import {
  useOnboardingDevChrome,
  useOnboardingHeaderLogo,
  useSetOnboardingPanelVariant,
} from '@/components/design/onboarding/onboarding-panel-context';
import type { StructuredAddress } from '@/lib/mocks/addresses';

interface OnboardingWalkthroughProps {
  userName: string;
  userEmail: string;
  companyName: string;
  userImage: string | null;
}

/**
 * Playground harness around the onboarding screens.
 *
 * In the production preview (dev chrome OFF — the default) it renders the
 * portable `ClientOnboardingFlow`, which is the unit a FE engineer lifts into
 * the main app (see PORTING.md). With dev chrome ON it linearly walks the FULL
 * screen catalogue — including the lawyer flow and the deprecated chooser /
 * review screens — so designers can review every screen via the Back/Next
 * buttons. Those extra screens are intentionally NOT part of the production
 * client flow.
 */
type StepId =
  | 'customer-type'
  | 'details-client-personal'
  | 'details-client-verify'
  | 'details-client-company'
  | 'details-client-address'
  | 'details-legal-personal'
  | 'details-legal-company'
  | 'details-legal-profile'
  | 'waitlist'
  | 'waitlist-contact'
  | 'complete'
  | 'inactive'
  | 'review'
  | 'invite-welcome'
  | 'invite-personal'
  | 'invite-verify'
  | 'invite-complete'
  | 'attorney-invite-welcome'
  | 'attorney-invite-personal'
  | 'attorney-invite-verify'
  | 'attorney-invite-profile'
  | 'attorney-invite-jurisdictions'
  | 'attorney-invite-complete'
  | 'welcome';

const STEP_ORDER: StepId[] = [
  'welcome',
  'details-client-personal',
  'details-client-verify',
  'details-client-company',
  'details-client-address',
  'waitlist',
  'waitlist-contact',
  'complete',
  'inactive',
  // Client Team Invite: a colleague joining an already-created company. Much
  // shorter than the website signup — no company/address steps, since those
  // were provided by the original client.
  'invite-welcome',
  'invite-personal',
  'invite-verify',
  'invite-complete',
  // Attorney Invite: a lawyer joining an already-created firm. Mirrors the
  // client team invite (welcome -> personal -> verify -> complete) with an extra
  // professional-profile step (LinkedIn, bio) and jurisdictions step before the
  // finish.
  'attorney-invite-welcome',
  'attorney-invite-personal',
  'attorney-invite-verify',
  'attorney-invite-profile',
  'attorney-invite-jurisdictions',
  'attorney-invite-complete',
  // Deprecated: the website signup now goes straight into the client flow, so
  // the lawyer/client account-type chooser is kept only for reference.
  'customer-type',
  // Deprecated: kept for reference after the attorney profile review outcome.
  'review',
  // Deprecated: standalone attorney detail screens, superseded by the attorney
  // invite flow above (personal + profile) — kept only for reference.
  'details-legal-personal',
  'details-legal-profile',
  // Deprecated: attorney company details are no longer collected in onboarding.
  'details-legal-company',
];

// Client step IDs map onto the portable ClientStep names so the dev-chrome walk
// reuses the same `ClientStepView` renderer as the production flow.
const STEP_ID_TO_CLIENT_STEP: Partial<Record<StepId, ClientStep>> = {
  welcome: 'welcome',
  'details-client-personal': 'personal',
  'details-client-verify': 'verify',
  'details-client-company': 'company',
  'details-client-address': 'address',
  waitlist: 'waitlist',
  'waitlist-contact': 'waitlistContact',
  complete: 'complete',
  inactive: 'inactive',
};

// Mock inviter for the invited team-member screen (in production this comes
// from the invitation record created by the client who sent it). Left null to
// preview the common case where the invite only carries the company name, so
// the screen uses its company-only copy + single company avatar. Set to a name
// (e.g. 'Sarah Chen') to preview the named variant.
const MOCK_INVITER_NAME: string | null = null;

// Real user-journey progress (distinct from the dev step chrome below). The
// client journey's progress is owned by `ClientOnboardingFlow`/`client-flow.ts`.
// Following that convention, the totals count the bookend invitation/welcome and
// complete screens too (they carry no dots), so the indicator never reads as
// "done" while a screen still follows.
const PROGRESS_TOTAL_CLIENT = 6;
// Client team invite: invitation(1), personal(2), verify(3), complete(4).
const PROGRESS_TOTAL_INVITE = 4;
// Attorney invite: invitation(1), personal(2), verify(3), profile(4),
// jurisdictions(5), complete(6).
const PROGRESS_TOTAL_ATTORNEY_INVITE = 6;
const PROGRESS_BY_STEP: Partial<Record<StepId, number>> = {
  'customer-type': 1,
  'details-client-personal': 2,
  'details-client-verify': 3,
  'details-client-company': 4,
  'details-client-address': 5,
  'invite-personal': 2,
  'invite-verify': 3,
  'attorney-invite-personal': 2,
  'attorney-invite-verify': 3,
  'attorney-invite-profile': 4,
  'attorney-invite-jurisdictions': 5,
};

// Steps belonging to the Client Team Invite flow (drives the progress total and
// the brand-panel tint).
const INVITE_STEPS: ReadonlySet<StepId> = new Set([
  'invite-welcome',
  'invite-personal',
  'invite-verify',
  'invite-complete',
]);

// Steps belonging to the Attorney Invite flow (drives the progress total and
// the brand-panel tint).
const ATTORNEY_INVITE_STEPS: ReadonlySet<StepId> = new Set([
  'attorney-invite-welcome',
  'attorney-invite-personal',
  'attorney-invite-verify',
  'attorney-invite-profile',
  'attorney-invite-jurisdictions',
  'attorney-invite-complete',
]);

const STEP_LABELS: Record<StepId, string> = {
  'customer-type': 'Deprecated - account type',
  'details-client-personal': 'Client - Personal details',
  'details-client-verify': 'Client - Verify phone',
  'details-client-company': 'Client - Company details',
  'details-client-address': 'Client - Address',
  'details-legal-personal': 'Deprecated - Attorney personal details',
  'details-legal-company': 'Deprecated - Attorney company details',
  'details-legal-profile': 'Deprecated - Attorney profile',
  waitlist: 'Client - Waitlist',
  'waitlist-contact': 'Client - Waitlist (book a call)',
  complete: 'Complete',
  inactive: 'Inactive account',
  review: 'Deprecated - enquiry sent',
  'invite-welcome': 'Client Team Invite - Invitation',
  'invite-personal': 'Client Team Invite - Personal details',
  'invite-verify': 'Client Team Invite - Verify phone',
  'invite-complete': 'Client Team Invite - Complete',
  'attorney-invite-welcome': 'Attorney Invite - Invitation',
  'attorney-invite-personal': 'Attorney Invite - Personal details',
  'attorney-invite-verify': 'Attorney Invite - Verify phone',
  'attorney-invite-profile': 'Attorney Invite - Profile',
  'attorney-invite-jurisdictions': 'Attorney Invite - Jurisdictions',
  'attorney-invite-complete': 'Attorney Invite - Complete',
  welcome: 'Website signup - Welcome',
};

/** Deprecated walkthrough screens — badge uses destructive (red) styling. */
const DEPRECATED_STEPS: ReadonlySet<StepId> = new Set([
  'customer-type',
  'review',
  'details-legal-personal',
  'details-legal-company',
  'details-legal-profile',
]);

// The multi-step detail forms share a persistent, bottom-anchored footer
// (`OnboardingActions`). On these steps we animate only the header + fields on
// navigation and leave the footer static, so the Continue button doesn't fade /
// slide as the user clicks through similar-looking steps. Every other screen
// (welcome, complete, waitlist, etc.) animates as a whole.
const DETAIL_FORM_STEPS: ReadonlySet<StepId> = new Set([
  'details-client-personal',
  'details-client-verify',
  'details-client-company',
  'details-client-address',
  'details-legal-personal',
  'details-legal-company',
  'details-legal-profile',
  'invite-personal',
  'invite-verify',
  'attorney-invite-personal',
  'attorney-invite-verify',
  'attorney-invite-profile',
  'attorney-invite-jurisdictions',
]);

export function OnboardingWalkthrough({
  userName,
  userEmail,
  companyName,
  userImage,
}: OnboardingWalkthroughProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations('onboarding');
  const tReg = useTranslations('registration');
  const tSteps = useTranslations('onboarding.registration.steps');
  const setPanelVariant = useSetOnboardingPanelVariant();
  const { visible: devChromeVisible } = useOnboardingDevChrome();
  const { setVisible: setHeaderLogoVisible } = useOnboardingHeaderLogo();

  // State below drives ONLY the dev-chrome linear walk. The production preview
  // is owned entirely by `ClientOnboardingFlow`.
  const [step, setStep] = useState<StepId>('welcome');
  const [selectedType, setSelectedType] = useState<
    'NON_LEGAL' | 'LEGAL' | null
  >(null);
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [address, setAddress] = useState<StructuredAddress | null>(null);
  const [phone, setPhone] = useState<PhoneVerificationValue | null>(null);

  useEffect(() => {
    if (step !== 'waitlist') {
      setWaitlistSubmitted(false);
    }
  }, [step]);

  const total = STEP_ORDER.length;
  const stepIndex = STEP_ORDER.indexOf(step);

  const goNextLinear = () =>
    setStep(STEP_ORDER[Math.min(stepIndex + 1, total - 1)] ?? step);
  const goBackLinear = () =>
    setStep(STEP_ORDER[Math.max(stepIndex - 1, 0)] ?? step);

  // In dev chrome, every screen's Continue/Back walks the linear order.
  const handleContinue = () => goNextLinear();
  const handleBack = () => goBackLinear();
  const handleCustomerTypeContinue = (type: 'NON_LEGAL' | 'LEGAL') => {
    setSelectedType(type);
    goNextLinear();
  };

  const progressCurrent = PROGRESS_BY_STEP[step];
  const progressTotal = INVITE_STEPS.has(step)
    ? PROGRESS_TOTAL_INVITE
    : ATTORNEY_INVITE_STEPS.has(step)
      ? PROGRESS_TOTAL_ATTORNEY_INVITE
      : PROGRESS_TOTAL_CLIENT;

  // Production preview: the portable flow reports its step, and we map that to
  // the brand-panel tint + header-logo visibility (the only playground chrome
  // the flow itself doesn't own).
  const handleClientStepChange = useCallback(
    (clientStep: ClientStep) => {
      setPanelVariant(clientStepToPanelVariant(clientStep));
      setHeaderLogoVisible(clientStepShowsHeaderLogo(clientStep));
    },
    [setPanelVariant, setHeaderLogoVisible],
  );

  // Dev-chrome panel/logo wiring (StepId based, including the lawyer steps).
  // Gated to dev chrome so it doesn't fight `handleClientStepChange` in the
  // production preview.
  useEffect(() => {
    if (!devChromeVisible) return;
    // Hide the header wordmark on the screens whose own hero carries the brand
    // (website welcome, the deprecated chooser, and the invite invitations).
    setHeaderLogoVisible(
      step !== 'welcome' &&
        step !== 'customer-type' &&
        step !== 'invite-welcome' &&
        step !== 'attorney-invite-welcome',
    );
  }, [step, devChromeVisible, setHeaderLogoVisible]);

  useEffect(() => {
    if (!devChromeVisible) return;
    if (step === 'customer-type') {
      setPanelVariant(
        selectedType === 'NON_LEGAL'
          ? 'client'
          : selectedType === 'LEGAL'
            ? 'legal'
            : 'neutral',
      );
      return;
    }
    setPanelVariant(
      step === 'waitlist' || step === 'waitlist-contact'
        ? 'waitlist'
        : step === 'details-client-personal' ||
            step === 'details-client-verify' ||
            step === 'details-client-company' ||
            step === 'details-client-address' ||
            step === 'complete' ||
            INVITE_STEPS.has(step)
          ? 'client'
          : step === 'details-legal-personal' ||
              step === 'details-legal-company' ||
              step === 'details-legal-profile' ||
              ATTORNEY_INVITE_STEPS.has(step)
            ? 'legal'
            : 'neutral',
    );
  }, [step, selectedType, devChromeVisible, setPanelVariant]);

  // Lawyer / deprecated detail steps reuse the same DetailsForm shell as the
  // client flow; the client steps are rendered by the shared `ClientStepView`.
  const renderLegalDetails = (section: 'personal' | 'company') => (
    <div className={FORM_STEP_CLASS}>
      <OnboardingStepHeader
        className="mz-animate-step"
        title={
          section === 'personal'
            ? tReg('sections.yourDetails')
            : tReg('sections.lawFirmDetails')
        }
        description={
          section === 'personal'
            ? tReg('sections.yourDetailsDescription')
            : tReg('sections.lawFirmDetailsDescription')
        }
      />
      <DetailsForm
        section={section}
        defaultName={userName}
        defaultPhoneNumber=""
        defaultCompanyName={companyName}
        defaultCountry={selectedCountry}
        customerType="LEGAL"
        userImage={userImage ?? undefined}
        locale={locale}
        companyCountry={selectedCountry}
        onCountryChange={setSelectedCountry}
        onContinue={handleContinue}
        onBack={stepIndex > 0 ? handleBack : undefined}
        progressCurrent={progressCurrent}
        progressTotal={progressTotal}
      />
    </div>
  );

  const renderStep = () => {
    const clientStep = STEP_ID_TO_CLIENT_STEP[step];
    if (clientStep) {
      return (
        <ClientStepView
          step={clientStep}
          userName={userName}
          userEmail={userEmail}
          companyName={companyName}
          userImage={userImage}
          selectedCountry={selectedCountry}
          onContinue={handleContinue}
          onBack={stepIndex > 0 ? handleBack : undefined}
          onCountryChange={setSelectedCountry}
          waitlistSubmitted={waitlistSubmitted}
          onWaitlistSubmittedChange={setWaitlistSubmitted}
          address={address}
          onAddressChange={setAddress}
          phone={phone}
          onPhoneChange={setPhone}
          progressCurrent={progressCurrent}
          progressTotal={progressTotal}
          dashboardPath="/client"
        />
      );
    }

    switch (step) {
      case 'customer-type':
        return (
          <div className={FORM_STEP_CLASS}>
            <OnboardingStepHeader
              title={t('customerType.title')}
              description={t('customerType.subtitle')}
            />
            <CustomerTypeForm
              onContinue={handleCustomerTypeContinue}
              onBack={stepIndex > 0 ? handleBack : undefined}
              selectedType={selectedType}
              onSelectType={(type) => {
                setSelectedType(type);
                setPanelVariant(type === 'NON_LEGAL' ? 'client' : 'legal');
              }}
              progressCurrent={progressCurrent}
              progressTotal={progressTotal}
            />
          </div>
        );
      case 'details-legal-personal':
        return renderLegalDetails('personal');
      case 'details-legal-company':
        return renderLegalDetails('company');
      case 'details-legal-profile':
        return (
          <div className={FORM_STEP_CLASS}>
            <OnboardingStepHeader
              className="mz-animate-step"
              title={tReg('sections.attorneyProfile')}
              description={tReg('sections.attorneyProfileDescription')}
            />
            <AttorneyProfileForm
              onContinue={handleContinue}
              onBack={stepIndex > 0 ? handleBack : undefined}
              progressCurrent={progressCurrent}
              progressTotal={progressTotal}
            />
          </div>
        );
      case 'review':
        return <WaitlistCard userName={userName} />;
      case 'invite-welcome':
        return (
          <TeamInviteWelcome
            inviterName={MOCK_INVITER_NAME}
            companyName={companyName}
            email={userEmail}
            onContinue={handleContinue}
          />
        );
      case 'invite-personal':
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
              onCountryChange={setSelectedCountry}
              onContinue={handleContinue}
              onBack={stepIndex > 0 ? handleBack : undefined}
              progressCurrent={progressCurrent}
              progressTotal={progressTotal}
            />
          </div>
        );
      case 'invite-verify':
        return (
          <div className={FORM_STEP_CLASS}>
            <PhoneVerifyStep
              defaultDialCountry={selectedCountry}
              onContinue={handleContinue}
              onBack={stepIndex > 0 ? handleBack : undefined}
              value={phone}
              onChange={setPhone}
              progressCurrent={progressCurrent}
              progressTotal={progressTotal}
            />
          </div>
        );
      case 'invite-complete':
        return <CompleteCard dashboardPath="/client" />;
      case 'attorney-invite-welcome':
        return (
          <TeamInviteWelcome
            namespace="onboarding.attorneyInvite"
            inviterName={MOCK_INVITER_NAME}
            companyName={companyName}
            email={userEmail}
            onContinue={handleContinue}
          />
        );
      case 'attorney-invite-personal':
        return (
          <div className={FORM_STEP_CLASS}>
            <OnboardingStepHeader
              className="mz-animate-step"
              title={tReg('sections.yourDetails')}
              description={tReg('sections.yourDetailsDescription')}
            />
            <DetailsForm
              section="personal"
              customerType="LEGAL"
              showPhone={false}
              defaultName={userName}
              defaultPhoneNumber=""
              defaultCompanyName={companyName}
              defaultCountry={selectedCountry}
              userImage={userImage ?? undefined}
              locale={locale}
              companyCountry={selectedCountry}
              onCountryChange={setSelectedCountry}
              onContinue={handleContinue}
              onBack={stepIndex > 0 ? handleBack : undefined}
              progressCurrent={progressCurrent}
              progressTotal={progressTotal}
            />
          </div>
        );
      case 'attorney-invite-verify':
        return (
          <div className={FORM_STEP_CLASS}>
            <PhoneVerifyStep
              defaultDialCountry={selectedCountry}
              onContinue={handleContinue}
              onBack={stepIndex > 0 ? handleBack : undefined}
              value={phone}
              onChange={setPhone}
              progressCurrent={progressCurrent}
              progressTotal={progressTotal}
            />
          </div>
        );
      case 'attorney-invite-profile':
        return (
          <div className={FORM_STEP_CLASS}>
            <OnboardingStepHeader
              className="mz-animate-step"
              title={tReg('sections.attorneyProfile')}
              description={tReg('sections.attorneyProfileDescription')}
            />
            <AttorneyProfileForm
              onContinue={handleContinue}
              onBack={stepIndex > 0 ? handleBack : undefined}
              progressCurrent={progressCurrent}
              progressTotal={progressTotal}
            />
          </div>
        );
      case 'attorney-invite-jurisdictions':
        return (
          <div className={FORM_STEP_CLASS}>
            <OnboardingStepHeader
              className="mz-animate-step"
              title={tReg('sections.attorneyExpertise')}
              description={tReg('sections.attorneyExpertiseDescription')}
            />
            <AttorneyJurisdictionsForm
              onContinue={handleContinue}
              onBack={stepIndex > 0 ? handleBack : undefined}
              progressCurrent={progressCurrent}
              progressTotal={progressTotal}
            />
          </div>
        );
      case 'attorney-invite-complete':
        return <CompleteCard dashboardPath="/legal" variant="attorney" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* Walkthrough chrome — playground-only; testers hide it via the preview
          toggle in the header to see the production experience. */}
      {devChromeVisible && (
        <div className="mb-6 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div className="flex items-center gap-3">
            <Badge
              variant={DEPRECATED_STEPS.has(step) ? 'destructive' : 'secondary'}
            >
              {STEP_LABELS[step]}
            </Badge>
            <span className="text-muted-foreground text-sm">
              {tSteps('progress', { current: stepIndex + 1, total })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={goBackLinear}
              disabled={stepIndex === 0}
              aria-label="Back"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={goNextLinear}
              disabled={stepIndex === total - 1}
              aria-label="Next"
            >
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {devChromeVisible ? (
        <div className="flex flex-1 flex-col">
          {/* Keyed by step so React remounts on navigation and replays the calm
              enter-only transition. Detail-form steps animate header + fields
              individually (so the shared footer stays put), so the whole-step
              animation is applied only to the other screens. */}
          <div
            key={step}
            className={cn(
              'flex flex-1 flex-col',
              !DETAIL_FORM_STEPS.has(step) && 'mz-animate-step',
            )}
          >
            {renderStep()}
          </div>
        </div>
      ) : (
        <ClientOnboardingFlow
          userName={userName}
          userEmail={userEmail}
          companyName={companyName}
          userImage={userImage}
          dashboardPath="/client"
          onStepChange={handleClientStepChange}
        />
      )}
    </div>
  );
}
