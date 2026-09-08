/**
 * Derives a case title, a short description, and a rough turnaround estimate
 * from the matter type and the recorded answers.
 *
 * The title follows a "{party} {Matter}" shape (e.g. "Apple Contract") so the
 * client never has to name the case themselves — the party is read from the
 * matter's own "who's on the other side" question. `deriveCaseTitle` layers a
 * "… 2", "… 3" suffix on top when a base title is already taken.
 */

import { MATTER_FLOWS } from './matters';
import { URGENCY_KEY, type AnswersMap, type MatterId } from './intake-types';

/**
 * The answer key that names the party/subject for each matter, used to build
 * the "{party} {Matter}" title. `other` has no clean counterparty, so it falls
 * back to the matter label alone.
 */
const PARTY_KEY_BY_MATTER: Record<MatterId, string | null> = {
  contract: 'otherSide',
  employment: 'whoInvolved',
  procurement: 'vendor',
  corporate: 'entity',
  ma: 'counterparty',
  other: null,
};

/** Trim, collapse whitespace, and cap a free-text party name for a title. */
function cleanParty(value: string | undefined): string | null {
  const trimmed = value?.trim().replace(/\s+/g, ' ');
  if (!trimmed) return null;
  return trimmed.length > 48 ? `${trimmed.slice(0, 48).trimEnd()}…` : trimmed;
}

/**
 * Base case title: "{party} {Matter}" when we know the other side (e.g.
 * "Apple Contract"), otherwise just the matter label. Also used for the live
 * chat header, so it reads naturally before the party is known.
 */
export function deriveTitle(
  matterId: MatterId | undefined,
  answers: AnswersMap,
): string {
  if (!matterId) return 'New case';
  const flow = MATTER_FLOWS[matterId];
  const partyKey = PARTY_KEY_BY_MATTER[matterId];
  const party = partyKey ? cleanParty(answers[partyKey]) : null;
  if (matterId === 'other') return party ? `${party} matter` : 'New matter';
  return party ? `${party} ${flow.label}` : flow.label;
}

/**
 * Final case title at submission: the base title, de-duplicated against titles
 * already created so a second "Google Contract" becomes "Google Contract 2".
 */
export function deriveCaseTitle(
  matterId: MatterId | undefined,
  answers: AnswersMap,
  existingTitles: readonly string[] = [],
): string {
  const base = deriveTitle(matterId, answers);
  const taken = new Set(existingTitles.map((t) => t.trim().toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;
  let n = 2;
  while (taken.has(`${base} ${n}`.toLowerCase())) n += 1;
  return `${base} ${n}`;
}

export function deriveDescription(
  matterId: MatterId | undefined,
  answers: AnswersMap,
): string {
  if (!matterId) return '';
  const flow = MATTER_FLOWS[matterId];
  const situation = answers.situation?.trim();
  if (situation && situation !== '') return situation;
  return flow.label;
}

/** Lowercase timeline phrase for the synopsis, keyed off the urgency chip. */
const URGENCY_PHRASE: Record<string, string> = {
  today: 'needed today',
  this_week: 'needed this week',
  this_month: 'needed this month',
  exploring: 'no fixed timeline yet',
};

/**
 * A single-sentence synopsis for the recap card: "{Matter} matter with {party},
 * {timeline}." Any clause whose answer is missing is dropped, and the sentence
 * always ends with a period.
 */
export function deriveSynopsis(
  matterId: MatterId | undefined,
  answers: AnswersMap,
): string {
  if (!matterId) return '';
  const flow = MATTER_FLOWS[matterId];
  const partyKey = PARTY_KEY_BY_MATTER[matterId];
  const party = partyKey ? cleanParty(answers[partyKey]) : null;

  const lead = matterId === 'other' ? 'Legal matter' : `${flow.label} matter`;
  let sentence = party ? `${lead} with ${party}` : lead;

  const urgency = URGENCY_PHRASE[answers[URGENCY_KEY] ?? ''];
  if (urgency) sentence = `${sentence}, ${urgency}`;

  return `${sentence}.`;
}

/**
 * Rough turnaround estimate shown on the post-submit confirmation, keyed off
 * how time-sensitive the client said the matter is.
 */
export function estimateTurnaround(answers: AnswersMap): string {
  switch (answers[URGENCY_KEY]) {
    case 'today':
      return '2\u20134 hours';
    case 'this_week':
      return '12\u201324 hours';
    case 'this_month':
    case 'exploring':
      return '1\u20132 business days';
    default:
      return '12\u201324 hours';
  }
}
