/**
 * Matter-type classification for the unified intake chat.
 *
 * The user lands in a single chat and describes their need in their own words;
 * we route that to one of the five matter flows. `classifyMatterAsync` prefers
 * the optional client-side OpenAI classifier (when a key is configured) and
 * falls back to the deterministic keyword scorer below — mirroring the
 * OpenAI-first / offline-safe pattern in `parse-situation.ts`.
 *
 * A confident, unambiguous match routes straight in; a tie or no match returns
 * `null` so the chat can show the matter-type quick-pick cards instead.
 */

import type { MatterId } from './matter-registry';
import { classifyMatterWithOpenAi } from './openai-intake-helpers';

export const MATTER_IDS = [
  'contract',
  'employment',
  'procurement',
  'corporate',
  'ma',
] as const satisfies readonly MatterId[];

/** Keyword signals per matter. Score = number of distinct patterns matched. */
const MATTER_KEYWORDS: Record<MatterId, RegExp[]> = {
  contract: [
    /\b(contract|agreement|nda|non-?disclosure|terms? (?:of service|and conditions)|msa|sow|statement of work|sign(?:ing)?|redline|clause|licen[sc]e|lease)\b/,
    /\b(review|negotiat|draft)\b.*\b(contract|agreement|nda|deal)\b/,
  ],
  employment: [
    /\b(hir(?:e|ing)|employ(?:ee|ment)|offer letter|onboard|terminat|fir(?:e|ing)|lay ?off|sever(?:ance)?|resign|equity grant|stock option|rsu|iso|nso|vesting|handbook|hr policy|contractor|intern|non-?compete)\b/,
    /\b(staff|team member|new hire|headcount)\b/,
  ],
  procurement: [
    /\b(vendor|supplier|procure(?:ment)?|rfp|rfq|tender|purchase order|\bpo\b|sourcing|saas|subscription|renewal)\b/,
    /\b(buy(?:ing)?|purchas)\b.*\b(software|hardware|services|goods|supplies|tool)\b/,
  ],
  corporate: [
    /\b(incorporat|form (?:a|an|my) (?:company|entity|llc|corp)|llc|c-?corp|s-?corp|entity|by-?laws|cap table|option pool|governance|board|shareholder|financing|fundrais|raise|safe|convertible note|seed round|series [a-d])\b/,
  ],
  ma: [
    /\b(acquir|acquisition|merge(?:r)?|buy(?:ing)? (?:a|the) (?:company|business)|sell (?:my|the) (?:company|business)|sell-?side|buy-?side|due diligence|letter of intent|\bloi\b|term sheet|invest(?:ment)? in)\b/,
  ],
};

/**
 * Deterministic, offline keyword classifier. Returns the single best matter
 * when it has at least one hit and strictly outscores every other matter;
 * returns `null` on no hits or a tie (ambiguous — the chat shows the cards).
 */
export function classifyMatter(text: string): MatterId | null {
  const lower = text.toLowerCase();
  let best: MatterId | null = null;
  let bestScore = 0;
  let tied = false;

  for (const id of MATTER_IDS) {
    const score = MATTER_KEYWORDS[id].reduce(
      (total, pattern) => total + (pattern.test(lower) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      best = id;
      bestScore = score;
      tied = false;
    } else if (score === bestScore && score > 0) {
      tied = true;
    }
  }

  if (bestScore === 0 || tied) return null;
  return best;
}

/**
 * Classify a description, preferring OpenAI when a key is configured and
 * falling back to the deterministic keyword classifier otherwise (or on any
 * failure / unknown answer).
 */
export async function classifyMatterAsync(
  text: string,
): Promise<MatterId | null> {
  const ai = await classifyMatterWithOpenAi(text, MATTER_IDS);
  if (ai && (MATTER_IDS as readonly string[]).includes(ai)) {
    return ai as MatterId;
  }
  return classifyMatter(text);
}
