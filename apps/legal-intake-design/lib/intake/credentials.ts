/**
 * The credentials the app actually holds, said plainly (V6, V8).
 *
 * The video plan asks for two things here: years of experience beside a
 * lawyer's name, and a credential rendered as a boring table row rather than a
 * boast. The second is built as asked. The first is **not**, and the reason is
 * the same one that cut the invented price from the flow: these are eleven real
 * people with real headshots, and this repo holds no year of call for any of
 * them. "Senior Counsel · 11 yrs exp." would be three words of fiction
 * attached to a named human being, which is a worse thing to ship than a
 * fabricated number about ourselves.
 *
 * What the roster does hold is `education`, on every one of the eleven, already
 * shown in the onboarding panel and on the homepage team row. That is a real
 * credential, it is the same *kind* of claim V8 wanted beside the name, and it
 * needs no invention. So V8's slot is filled with the credential we have rather
 * than the one the plan guessed we had.
 *
 * Pure string work over the roster. No React, no data of its own: if a school
 * name is wrong here it is wrong in `onboarding-lawyers.ts`, which is where a
 * correction belongs.
 */

import type { OnboardingLawyer } from '@/components/design/new-case/lawyers';
import { capNames } from './name-list';

/**
 * Suffixes that name the *kind* of institution rather than which one.
 *
 * Order matters and is the whole subtlety. "School of Law" has to go before any
 * rule that touches "School", or "London School of Economics" loses its middle
 * and becomes "London" — a different institution, in a row whose entire
 * purpose is to be checkable.
 */
const SUFFIXES: readonly (readonly [RegExp, string])[] = [
  [/\s+Global School of Law$/i, ''],
  [/\s+School of Law$/i, ''],
  [/\s+Law School$/i, ''],
  [/^University of\s+/i, ''],
  [/\s+University$/i, ''],
];

/**
 * The institution's name, out of a full education line.
 *
 * "Harvard Law School, J.D." is "Harvard". "London School of Economics,
 * LL.M." is "London School of Economics", because there is no shorter form of
 * it that is still the same place.
 *
 * Returns `''` for anything it cannot read, and callers drop those rather than
 * printing a guess.
 */
export function schoolOf(education: string): string {
  const beforeQualification = education.split(',')[0]?.trim() ?? '';
  if (beforeQualification === '') return '';
  let name = beforeQualification;
  for (const [pattern, replacement] of SUFFIXES) {
    name = name.replace(pattern, replacement);
  }
  return name.trim();
}

/**
 * How many schools to name before admitting the rest as a count (L10).
 *
 * Three, because the row has to fit on one line on a phone and because a list
 * of eleven institutions is a brag rather than a credential. The overflow is
 * stated rather than truncated — see `name-list.ts`, which owns that rule for
 * every list in the flow.
 */
const NAMED_LIMIT = 3;

/**
 * The distinct schools behind a set of lawyers, in roster order.
 *
 * Deduplicated, because two Harvard J.D.s on the bench is one fact about where
 * the bench trained and printing it twice reads as padding.
 */
export function schoolsOf(lawyers: readonly OnboardingLawyer[]): {
  named: string[];
  more: number;
} {
  const seen: string[] = [];
  for (const lawyer of lawyers) {
    const school = schoolOf(lawyer.education);
    if (school !== '' && !seen.includes(school)) seen.push(school);
  }
  return capNames(seen, NAMED_LIMIT);
}
