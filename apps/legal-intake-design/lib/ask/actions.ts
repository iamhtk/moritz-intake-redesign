/**
 * Turning an answer into buttons, without trusting the answer (task N7).
 *
 * §8.6 calls this the single best idea in the feature, and the reason is one
 * step in the middle of it: a reference the model produced is **looked up in
 * the payload** before it becomes a control. That one step is what makes a
 * hallucinated citation produce *no button* rather than a broken one.
 *
 * The failure it prevents is specific and nasty. A model that invents
 * `M-2026-9999` in a sentence has told a small lie, and a reader who notices
 * the number is unfamiliar can discount it. A model that invents `M-2026-9999`
 * and gets a **button** out of it has been endorsed by the interface: the
 * product has just vouched for the reference by making it clickable, and the
 * reader learns the answer is wrong only by pressing it and landing nowhere.
 *
 * The same lookup also enforces the boundary a second time. `findInScopeCase`
 * searches the *scope*, not the mocks, so a model that somehow named a real
 * case belonging to another company also gets no button. That is the more
 * dangerous case of the two, because the reference exists and would resolve
 * against an unscoped lookup.
 *
 * Two further rules from §8.6 are structural here rather than advisory:
 *
 * - **No second path.** Every action is a `href` at a screen that already
 *   exists. Nothing here mutates anything, and there is deliberately no shape
 *   in which it could — an action is a destination, not a command.
 * - **Nothing acts alone.** These are proposals. A person clicks them.
 */

import { findInScopeCase, type AskScope } from './scope';
import { homePathByCompanyType } from '@/components/navigation/sidebar-nav-items';

/**
 * A proposed destination under an answer.
 *
 * `href` rather than a callback, so the type itself cannot express "do a thing
 * to this case". The worst a bad action can be is a link to a page the reader
 * was allowed to open anyway.
 */
export type AskAction = {
  /** Stable key, and the de-duplication key. */
  id: string;
  /** What the button says. A case number, or a person's name. */
  label: string;
  /** Where it goes. */
  href: string;
};

/**
 * Case references look like `M-2026-0126`.
 *
 * Matched case-insensitively because a model will occasionally write `m-2026-`
 * in the middle of a sentence, and a reference that is right apart from its
 * capitalisation is still a reference the reader meant to be offered.
 */
const CASE_REFERENCE = /\bM-\d{4}-\d{4}\b/gi;

/**
 * At most three. From the source, and right for a reason worth keeping: the
 * fourth button is where a proposal row stops reading as "here is the thing you
 * asked about" and starts reading as a menu the reader has to assess.
 */
const MAX_ACTIONS = 3;

/**
 * The actions an answer has earned.
 *
 * Order is deliberate: case references first, in the order the answer mentions
 * them, then people. A reader scanning an answer reads top to bottom, and the
 * first thing named is the thing they asked about.
 *
 * @param text the settled answer. Never call this on a partial stream — a
 *   half-written `M-2026-01` is a different reference from `M-2026-0126`, and
 *   buttons appearing and vanishing mid-sentence is its own kind of noise.
 */
export function extractAskActions(text: string, scope: AskScope): AskAction[] {
  const actions: AskAction[] = [];
  const seen = new Set<string>();
  const homePath = homePathByCompanyType[scope.role];

  for (const match of text.matchAll(CASE_REFERENCE)) {
    if (actions.length >= MAX_ACTIONS) break;
    const reference = match[0].toUpperCase();
    if (seen.has(reference)) continue;

    /*
     * ⭐ The lookup that is the whole point. A reference the scope does not
     * hold — invented, or real but not this reader's — yields nothing, and the
     * number stays as plain text in the sentence where the model wrote it.
     */
    const legalCase = findInScopeCase(scope, reference);
    if (!legalCase) continue;

    seen.add(reference);
    actions.push({
      id: `case:${legalCase.id}`,
      label: legalCase.caseNumber,
      href: `${homePath}/cases/${legalCase.id}`,
    });
  }

  /*
   * People, for the internal roles that have a directory. Longest name first,
   * so "Anders Holm" is matched before a hypothetical "Anders" and the more
   * specific person wins — the same ordering trick the source uses, and it
   * matters as soon as two people share a first name.
   */
  const lower = text.toLowerCase();
  const people = [...scope.people].sort(
    (a, b) => b.name.length - a.name.length,
  );
  for (const person of people) {
    if (actions.length >= MAX_ACTIONS) break;
    if (seen.has(person.id)) continue;
    if (!lower.includes(person.name.toLowerCase())) continue;

    seen.add(person.id);
    actions.push({
      id: `person:${person.id}`,
      label: person.name,
      href: `${homePath}/users/${person.id}`,
    });
  }

  return actions.slice(0, MAX_ACTIONS);
}

/**
 * How many in-scope cases an answer actually leaned on (§8.6 rule 3).
 *
 * Feeds the "Read 2 cases" line under an answer. Counts *distinct, resolved*
 * references, so a model repeating one number three times is one case and an
 * invented number is none — the line has to be a claim the reader can check,
 * or it is decoration that looks like provenance.
 */
export function countCitedCases(text: string, scope: AskScope): number {
  const cited = new Set<string>();
  for (const match of text.matchAll(CASE_REFERENCE)) {
    const legalCase = findInScopeCase(scope, match[0].toUpperCase());
    if (legalCase) cited.add(legalCase.id);
  }
  return cited.size;
}
