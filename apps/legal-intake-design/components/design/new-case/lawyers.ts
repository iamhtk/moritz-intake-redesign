/**
 * Selects the lawyers surfaced on the post-submit confirmation. Reuses the
 * curated onboarding personas (real headshots, tagline, education) so the
 * confirmation matches the social-proof treatment used in onboarding and on the
 * client homepage — rather than the initials-only intake shortlist cards.
 *
 * - Standard accounts see a matter-relevant showcase ("lawyers who could take
 *   this on") — no one is assigned until a quote is approved.
 * - Enterprise accounts see the same dedicated pod every time, notified
 *   directly.
 */

import {
  ONBOARDING_LAWYERS,
  type OnboardingLawyer,
} from '../onboarding/onboarding-lawyers';
import { type MatterId } from './intake-types';

export type { OnboardingLawyer };

const byId = (id: string): OnboardingLawyer =>
  ONBOARDING_LAWYERS.find((l) => l.id === id) ?? ONBOARDING_LAWYERS[0]!;

const AMARA = byId('onboarding-lawyer-amara'); // Commercial Counsel
const DANIEL = byId('onboarding-lawyer-daniel'); // Corporate & M&A
const MEI_LIN = byId('onboarding-lawyer-mei'); // Employment & People

/** The persona most relevant to lead the showcase for a given matter. */
function leadForMatter(
  matterId: MatterId | undefined,
): OnboardingLawyer | null {
  switch (matterId) {
    case 'contract':
    case 'procurement':
      return AMARA;
    case 'corporate':
    case 'ma':
      return DANIEL;
    case 'employment':
      return MEI_LIN;
    default:
      return null;
  }
}

/**
 * Matter-relevant showcase shown to standard accounts while a quote pends:
 * every onboarding persona, ordered so a fitting face leads the rotation.
 */
export function showcaseForMatter(
  matterId: MatterId | undefined,
): OnboardingLawyer[] {
  const lead = leadForMatter(matterId);
  if (!lead) return [...ONBOARDING_LAWYERS];
  return [lead, ...ONBOARDING_LAWYERS.filter((l) => l.id !== lead.id)];
}

/**
 * The client's dedicated pod for enterprise accounts — the same faces every
 * time, led by their primary contact (Daniel).
 */
export const ENTERPRISE_POD: readonly OnboardingLawyer[] = [
  DANIEL,
  AMARA,
  MEI_LIN,
];
