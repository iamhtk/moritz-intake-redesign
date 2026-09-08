import type { OnboardingPanelVariant } from '@/components/design/onboarding/onboarding-panel-context';

/**
 * Pure, framework-agnostic definition of the client (website signup) onboarding
 * flow. Kept free of React so it can be unit tested and, more importantly,
 * lifted into the main app where the step is server-driven (see PORTING.md).
 *
 * Production client journey:
 *   welcome -> personal -> verify -> company -> address -> complete  (supported country)
 *                                            \-> waitlist            (unsupported country)
 *   inactive is a terminal state reachable when the account is disabled.
 *
 * `verify` confirms the mobile number via an OTP (needed to reach the client),
 * and `address` collects the postal address used for the engagement letter.
 */
export type ClientStep =
  | 'welcome'
  | 'personal'
  | 'verify'
  | 'company'
  | 'address'
  | 'complete'
  | 'waitlist'
  | 'waitlistContact'
  | 'inactive';

/**
 * Linear order of the input steps that carry a progress indicator. Terminal
 * screens (complete, waitlist, inactive) are intentionally excluded — they have
 * no footer/progress.
 */
export const CLIENT_STEP_ORDER: ClientStep[] = [
  'welcome',
  'personal',
  'verify',
  'company',
  'address',
];

/**
 * Countries auto-approved for clients in production (seeded
 * `non_legal_auto_approve` countries). Clients elsewhere land on the waitlist.
 */
export const SUPPORTED_CLIENT_COUNTRIES = ['US', 'NO', 'GB', 'AU'];

/**
 * The client journey is six screens — welcome, personal, verify, company,
 * address, and the final confirmation — so the dots count to 6. Dots only
 * render where there's a footer (personal/verify/company/address), so welcome
 * and the confirmation are counted but don't display the indicator.
 */
export const CLIENT_PROGRESS_TOTAL = 6;
export const CLIENT_PROGRESS_BY_STEP: Partial<Record<ClientStep, number>> = {
  personal: 2,
  verify: 3,
  company: 4,
  address: 5,
};

/**
 * Steps that render the shared, bottom-anchored form footer. On these the
 * header + fields animate on navigation while the footer stays put, so the
 * Continue button doesn't slide between similar-looking steps.
 */
export const CLIENT_DETAIL_STEPS: ReadonlySet<ClientStep> = new Set<ClientStep>(
  ['personal', 'verify', 'company', 'address'],
);

export function isClientDetailStep(step: ClientStep): boolean {
  return CLIENT_DETAIL_STEPS.has(step);
}

export function isCountrySupported(countryCode: string): boolean {
  return SUPPORTED_CLIENT_COUNTRIES.includes(countryCode);
}

/** Forward transition for the client production flow. */
export function clientBranchNext(
  step: ClientStep,
  selectedCountry: string,
): ClientStep {
  switch (step) {
    case 'welcome':
      return 'personal';
    case 'personal':
      return 'verify';
    case 'verify':
      return 'company';
    case 'company':
      // Unsupported countries skip the address step and land on the waitlist;
      // supported countries collect the engagement-letter address next.
      return isCountrySupported(selectedCountry) ? 'address' : 'waitlist';
    case 'address':
      return 'complete';
    default:
      // Terminal screens have no forward transition.
      return step;
  }
}

/** Back transition for the client production flow. */
export function clientBranchBack(step: ClientStep): ClientStep {
  switch (step) {
    case 'personal':
      return 'welcome';
    case 'verify':
      return 'personal';
    case 'company':
      return 'verify';
    case 'address':
      return 'company';
    default:
      return step;
  }
}

/** Brand-panel tint for a given client step (drives OnboardingBrandPanel). */
export function clientStepToPanelVariant(
  step: ClientStep,
): OnboardingPanelVariant {
  switch (step) {
    case 'waitlist':
    case 'waitlistContact':
      return 'waitlist';
    // The welcome screen is the neutral front door — it stays grey so the panel
    // doesn't auto-crossfade to gold before the user has started. The client
    // (gold) tint kicks in once they enter the detail steps.
    case 'welcome':
    case 'inactive':
      return 'neutral';
    default:
      // personal, verify, company, address, complete all carry the client tint.
      return 'client';
  }
}

/**
 * The header wordmark is redundant on the welcome screen (its "Welcome to
 * Moritz" heading already brands the screen), so it only appears once the user
 * is into the detail steps.
 */
export function clientStepShowsHeaderLogo(step: ClientStep): boolean {
  return step !== 'welcome';
}
