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
  ADDITIONAL_TEAM_LAWYERS,
  ONBOARDING_LAWYERS,
  type OnboardingLawyer,
} from '../onboarding/onboarding-lawyers';
import { type MatterId } from './intake-types';

export type { OnboardingLawyer };

/**
 * `null` rather than a stand-in when an id does not exist.
 *
 * This used to fall back to `ONBOARDING_LAWYERS[0]`, and two of the ids it was
 * asked for were never in that list: there is no Amara and no Mei-Lin persona,
 * only the five in `onboarding-lawyers.ts`. So every matter type resolved to the
 * same first entry and the "matter-relevant lead" was the founding COO on a
 * contract review, an employment matter and a procurement matter alike. A
 * silent fallback is what let that sit there looking like it worked, which is
 * the argument for not having one: a typo here is now a `null` at the point of
 * definition, where `LEAD_BY_AREA` makes it obvious, rather than a plausible
 * wrong face at the point of use.
 *
 * Found while wiring the intake's single face (T21, Decision 21), where a lead
 * that ignores the matter is the whole value of the feature.
 */
const byId = (id: string): OnboardingLawyer | null =>
  ONBOARDING_LAWYERS.find((l) => l.id === id) ?? null;

/**
 * The same lookup, for callers holding an id rather than a matter.
 *
 * The handoff card on a case is the one that needs this: the turn recorded
 * *who* it was put in front of, and the matter that resolved them is not on the
 * case thread to resolve again. Same `null` discipline as `byId` — a stale id
 * shows no face rather than the wrong one.
 */
export const lawyerById = byId;

/**
 * The practice areas the intake actually routes on (item 13).
 *
 * Deliberately coarser than the roster's job titles. "Venture & M&A",
 * "Corporate & M&A" and "M&A & Private Equity" are three different business
 * cards and one answer to "who should read a share purchase agreement", and a
 * router keyed on title strings would have to be edited every time somebody's
 * title changed.
 */
export type PracticeArea =
  | 'commercial'
  | 'corporate'
  | 'employment'
  | 'technology'
  | 'general';

/**
 * Every Moritz persona, tagged by what they actually do (item 13).
 *
 * The tag lives here rather than on `OnboardingLawyer` in
 * `onboarding-lawyers.ts` on purpose. That roster is shared with the onboarding
 * brand panel and the homepage team row, neither of which routes on practice
 * area, and widening a shared type for one consumer's benefit is how the next
 * person ends up with a required field they have to fill in with a guess. This
 * is the intake's opinion about the roster, so it sits in the intake's layer.
 *
 * Keyed by id, which means a persona added to the roster without a tag falls
 * through to the default rather than breaking the build. That is the right
 * failure: an untagged lawyer is not a matter-relevant lawyer.
 */
const PRACTICE_AREA_BY_ID: Readonly<Record<string, PracticeArea>> = {
  'onboarding-lawyer-aelita': 'commercial', // Commercial & Franchise
  'onboarding-lawyer-pamir': 'commercial', // Commercial & AI
  'onboarding-lawyer-maxim': 'corporate', // Venture & M&A
  'onboarding-lawyer-mike': 'corporate', // Corporate & M&A
  'onboarding-lawyer-enes': 'corporate', // M&A & Private Equity
  'onboarding-lawyer-eric': 'corporate', // Venture Capital
  'onboarding-lawyer-aaron': 'corporate', // Emerging Companies & VC
  'onboarding-lawyer-kyle': 'technology', // Technology Lawyer
  'onboarding-lawyer-catarina': 'technology', // Technology & Privacy
  'onboarding-lawyer-daniel': 'general', // Founding Head of Legal & COO
  'intake-lawyer-priya': 'employment',
};

export function practiceAreaOf(lawyer: OnboardingLawyer): PracticeArea {
  return PRACTICE_AREA_BY_ID[lawyer.id] ?? 'general';
}

/**
 * The employment lead, and the one persona the shared roster does not have.
 *
 * Every other lead on this list is a real headshot from
 * `/public/onboarding-lawyers`. This one has no photograph, and that is a
 * deliberate choice rather than an oversight: all fifteen images in that folder
 * are already cast, ten as Moritz lawyers and five as clients and client
 * colleagues, so the only way to put a face on an employment lawyer was to use
 * one that already belongs to somebody on the other side of a matter. A client
 * who recognises their own colleague's face as the firm's employment partner
 * has learned something true about how much of this is real, and it is not
 * worth an avatar. `Avatar` falls back to initials, which is what it is for.
 *
 * She is taken from `MOCK_LEGAL_USER` (Priya Shah, partner at Moritz), so she
 * is at least the same person the rest of the mock data already knows about
 * rather than an invention local to this file.
 */
const PRIYA: OnboardingLawyer = {
  id: 'intake-lawyer-priya',
  name: 'Priya Shah',
  title: 'Employment & Litigation',
  initials: 'PS',
  // Empty on purpose. See above; callers render the fallback instead.
  imageUrl: '',
  tagline: 'Partner, employment and contested exits.',
  education: 'London School of Economics, LL.M.',
};

/** Shown before the matter type is known, and for matters nobody specialises in. */
const DEFAULT_LEAD = byId('onboarding-lawyer-daniel');

const LEAD_BY_AREA: Readonly<Record<PracticeArea, OnboardingLawyer | null>> = {
  commercial: byId('onboarding-lawyer-aelita'),
  corporate: byId('onboarding-lawyer-maxim'),
  employment: PRIYA,
  technology: byId('onboarding-lawyer-catarina'),
  general: DEFAULT_LEAD,
};

/** Which kind of lawyer a matter type wants. */
export function areaForMatter(matterId: MatterId | undefined): PracticeArea {
  switch (matterId) {
    case 'contract':
    case 'procurement':
      return 'commercial';
    case 'corporate':
    case 'ma':
      return 'corporate';
    case 'employment':
      return 'employment';
    // `other` is honestly general. A matter nobody has classified yet is not
    // secretly a commercial matter because commercial is the commonest.
    case 'other':
    default:
      return 'general';
  }
}

/**
 * Which practice sentence a matter gets, and why this is not `areaForMatter`.
 *
 * The sentence used to be keyed on the practice area, which kept it honest
 * about the *lawyer* and made it lie about the *matter*. Four matter types
 * collapse into two areas, and the sentence ends "like this one", so it claims
 * the sub-type matches when all it knows is the area: a tender response was
 * told the lead mostly handles "supplier and franchise terms like this one",
 * and a share purchase was told "share sales and investments". Keyed on the
 * matter, each sentence can name what this actually is.
 *
 * A `Record<MatterId, ...>` rather than a switch, so a matter type added to
 * `intake-types.ts` fails the build here instead of silently falling through to
 * the no-speciality sentence.
 *
 * **The invariant this has to keep.** The sentence and the face are now two
 * lookups where they used to be one, so they can disagree, and a sentence
 * claiming a speciality the lead does not have is worse than a vague one.
 * Every key here must sit inside the area `areaForMatter` sends the same matter
 * to; `lawyer-lead.test.ts` asserts exactly that, and is the reason this table
 * lives beside `areaForMatter` rather than in the component.
 *
 * `other` shares the `general` sentence with an unknown matter, because they
 * are the same situation: nobody has classified this, so nothing is claimed.
 */
const PRACTICE_COPY_KEY: Readonly<Record<MatterId, string>> = {
  contract: 'contract',
  procurement: 'procurement',
  corporate: 'corporate',
  ma: 'ma',
  employment: 'employment',
  other: 'general',
};

/** The `intake.human.practice.*` key for a matter, defaulting to no claim. */
export function practiceCopyKeyForMatter(
  matterId: MatterId | undefined,
): string {
  return matterId ? PRACTICE_COPY_KEY[matterId] : 'general';
}

/**
 * The persona who leads for a given matter (item 13).
 *
 * Never `null` now, which is the change. It used to return nothing for
 * employment and for an unknown matter, and the showcase quietly fell back to
 * roster order, which put the founding COO's face on a dismissal anyway. So the
 * fallback is now explicit and named: an unclassified matter gets the default
 * lead, and the sentence beside him says what he does rather than implying he
 * specialises in whatever this turns out to be.
 */
export function leadForMatter(
  matterId: MatterId | undefined,
): OnboardingLawyer | null {
  return LEAD_BY_AREA[areaForMatter(matterId)] ?? DEFAULT_LEAD;
}

/**
 * Matter-relevant showcase shown to standard accounts while a quote pends:
 * every onboarding persona, ordered so a fitting face leads the rotation.
 *
 * A lead with no headshot does not lead. This is a rotating three-up of
 * photographs, as the header of this file says, and the employment lead has no
 * photograph by design. Prepending her put a monogram in the first cell beside
 * two photographed colleagues, so the one persona whose missing picture is a
 * deliberate choice was also the one shown where it read most like a broken
 * image. She keeps the intake's lawyer note, which is built to carry a monogram
 * at full weight; the showcase keeps faces.
 *
 * `ONBOARDING_LAWYERS` never contained her, so this is a reordering rather than
 * a removal: nobody drops out of the rotation who was ever in it.
 */
export function showcaseForMatter(
  matterId: MatterId | undefined,
): OnboardingLawyer[] {
  const lead = leadForMatter(matterId);
  if (!lead?.imageUrl) return [...ONBOARDING_LAWYERS];
  return [lead, ...ONBOARDING_LAWYERS.filter((l) => l.id !== lead.id)];
}

/**
 * Every real person, for the intake note to rotate through while nobody knows
 * what the matter is yet (see `intake-lawyer-note.tsx`).
 *
 * All eleven: the five onboarding personas, the five additional team members
 * the homepage already rotates, and the employment lead. She is included here
 * where `showcaseForMatter` leaves her out, and the difference is the surface
 * rather than the person: that one is a three-up of photographs and her missing
 * headshot would read as a broken image beside two colleagues, where the note
 * shows one person at a time and is built to carry her monogram at full weight.
 *
 * Daniel leads, so the first frame is the same curated face the note showed
 * before it rotated at all, and so a client who looks away and back has not
 * missed a different opening.
 */
export const INTAKE_NOTE_ROSTER: readonly OnboardingLawyer[] = [
  DEFAULT_LEAD,
  ...ONBOARDING_LAWYERS.filter((one) => one.id !== DEFAULT_LEAD?.id),
  ...ADDITIONAL_TEAM_LAWYERS,
  PRIYA,
].filter((one): one is OnboardingLawyer => one !== null);

/**
 * The client's dedicated pod for enterprise accounts — the same faces every
 * time, led by their primary contact (Daniel).
 */
export const ENTERPRISE_POD: readonly OnboardingLawyer[] = [
  byId('onboarding-lawyer-daniel'),
  byId('onboarding-lawyer-aelita'),
  byId('onboarding-lawyer-catarina'),
].filter((lawyer): lawyer is OnboardingLawyer => lawyer !== null);
