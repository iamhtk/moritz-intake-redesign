/**
 * Which kind of matter this brief actually is (item 13).
 *
 * `brief.matterId` looks like the answer and is not. It is set once by
 * `createBrief('contract', ...)` and never written again, so every brief in the
 * flow claims to be a contract matter for its whole life. What the client
 * actually said lives in the `matter-type` *field*, as text, because that is
 * where the model puts it and where the client can correct it.
 *
 * So the face beside the composer was pinned to the commercial lawyer no matter
 * what anyone typed. That is the bug item 13 describes as "not fixed", and
 * fixing it is a read of the brief rather than a change to the schema: the id
 * stays where it is, and this resolves the honest answer from the field.
 *
 * Matching is deliberately tolerant, because the string is not a controlled
 * value. A client tapping a chip sends the label ("Employment", "M&A",
 * "Something else"); the model, told the catalog as `employment: Employment`,
 * returns sometimes the id and sometimes a sentence ("Employment dispute, offer
 * withdrawn"). All three have to land on the same lawyer, and anything that
 * does not match has to land on the default rather than on a guess.
 */

import { MATTER_FLOWS } from '@/components/design/new-case/matters';
import {
  MATTER_TYPE_KEY,
  type MatterId,
} from '@/components/design/new-case/intake-types';
import type { Brief } from './brief';

/**
 * Words that identify a matter, beyond its id and its label.
 *
 * Only words a client would actually write, and only words long enough to mean
 * something. This is not a synonym dictionary and must not grow into one:
 * every entry is a claim that a matter type can be recognised from one word,
 * and a wrong claim puts the wrong lawyer's name beside somebody's redundancy.
 *
 * Note what is absent. The matter ids themselves are matched exactly, never as
 * substrings, because `ma` is a substring of "management", "formal" and
 * "email", and a loose contains-the-id rule sent half the briefs in the flow to
 * the M&A lawyer.
 *
 * The same trap caught the keywords themselves, one layer down. `nda` sits
 * inside "redu*nda*nt", so "I was made redundant last week" — a sentence with
 * no contract in it anywhere — matched the contract list and routed an unfair
 * dismissal to the commercial lawyer, with the contract checklist to fill in
 * and no employment row in sight. Hence `startsAtWord`: entries match at a
 * word boundary, never mid-word. They are still allowed to run *past* the end
 * of a word, because several of them are stems — "offer withdraw" has to catch
 * "offer withdrawn", and `redundan` has to catch both inflections a client
 * might reach for.
 */
const KEYWORDS: Readonly<Record<MatterId, readonly string[]>> = {
  employment: [
    'employment',
    'employee',
    'dismissal',
    'termination',
    'redundan',
    'offer revocation',
    'offer withdraw',
    'severance',
    'discrimination',
    'harassment',
  ],
  ma: [
    'm&a',
    'merger',
    'acquisition',
    'acquire',
    'share purchase',
    'due diligence',
  ],
  procurement: ['procurement', 'supplier', 'vendor', 'tender', 'rfp'],
  corporate: [
    'corporate',
    'shareholder',
    'incorporation',
    'financing',
    'fundraise',
  ],
  contract: [
    'contract',
    'agreement',
    'nda',
    'msa',
    'terms of service',
    'licence',
    'license',
  ],
  other: [],
};

/**
 * Checked in this order, and the order is the point.
 *
 * The narrower types come first. "Employment agreement" contains "agreement"
 * and is not a contract review, and "share purchase agreement" is an M&A
 * matter; a contract-first pass would swallow both. So the types whose keywords
 * are specific are asked before the type whose keywords are generic.
 */
const MATCH_ORDER: readonly MatterId[] = [
  'employment',
  'ma',
  'procurement',
  'corporate',
  'contract',
];

const MATTER_IDS = Object.keys(MATTER_FLOWS) as MatterId[];

/**
 * Does `haystack` contain `needle` starting at a word boundary?
 *
 * Anchored at the front only. See the note on `KEYWORDS` for the sentence that
 * made this necessary, and for why the back is deliberately left open.
 */
function startsAtWord(haystack: string, needle: string): boolean {
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) return false;
    // A word character immediately before the match means we landed inside a
    // longer word, which is the whole failure mode being excluded.
    if (at === 0 || !/[a-z0-9]/.test(haystack[at - 1] ?? '')) return true;
    from = at + 1;
  }
}

/**
 * The matter type the brief's own `matter-type` field describes, or `undefined`
 * when it is empty or says nothing recognisable.
 *
 * `undefined` rather than a default, so the caller decides what an unknown
 * matter means. For the lawyer note that is the default lead; somewhere else it
 * might be nothing at all.
 */
export function matterOf(brief: Brief): MatterId | undefined {
  const raw = brief.fields.find(
    (field) => field.key === MATTER_TYPE_KEY,
  )?.value;
  return raw ? matterOfText(raw) : undefined;
}

/**
 * The same question asked of any sentence, rather than of a brief.
 *
 * Split out because the offline interviewer (`offline-turn.ts`) has to route a
 * matter before a `matter-type` field exists to read: the client's opening
 * description is all it has. Sharing the table rather than copying it is the
 * whole point — two keyword lists would drift, and the drift would show up as
 * the keyless path routing "redundancy" somewhere the model-backed path does
 * not.
 *
 * `undefined` for anything unrecognised, exactly as `matterOf` returns it, so
 * neither caller can mistake a failed match for a confident `other`.
 */
export function matterOfText(value: string): MatterId | undefined {
  const raw = value.toLowerCase().trim();
  if (!raw) return undefined;

  // An exact id or label first, which is what a chip sends, so a one-word
  // answer can never be caught by another type's keyword list.
  for (const id of MATTER_IDS) {
    if (raw === id || raw === MATTER_FLOWS[id].label.toLowerCase()) return id;
  }
  for (const id of MATCH_ORDER) {
    if (KEYWORDS[id].some((word) => startsAtWord(raw, word))) return id;
  }
  return undefined;
}
