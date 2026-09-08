/**
 * Free-text "describe your situation" parsing for the matter-intake flows.
 *
 * The generic `parseSituation` runner prefers the optional client-side OpenAI
 * extractor when a key is configured, then falls back to the matter
 * definition's deterministic keyword heuristic so the chat works offline.
 *
 * The shared detectors below are reused by the per-matter parse modules.
 *
 * Nothing here touches a Moritz backend.
 */

import type {
  AnswerKey,
  IntakeAnswers,
  MatterIntakeDefinition,
  ParsedSituation,
} from './intake-types';
import { parseSituationWithOpenAi } from './openai-intake-helpers';

export function keysOf(answers: IntakeAnswers): AnswerKey[] {
  return Object.keys(answers).filter((key) => {
    const value = answers[key];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return value !== undefined && value !== null;
  });
}

/** Map the first matching pattern to its tagged value. */
export function detectFirst<T>(
  text: string,
  patterns: { value: T; re: RegExp }[],
): T | undefined {
  return patterns.find(({ re }) => re.test(text))?.value;
}

/** Coarse money-band detector reused by deal-value style questions. */
export function detectValueBand(text: string): string | undefined {
  const match = text.match(/\$\s?([\d][\d,.]*)\s*(k|m|mm|thousand|million)?/i);
  if (!match) return undefined;
  const raw = Number(match[1]?.replace(/,/g, ''));
  if (!Number.isFinite(raw)) return undefined;
  const unit = match[2]?.toLowerCase();
  let amount = raw;
  if (unit === 'k' || unit === 'thousand') amount = raw * 1_000;
  else if (unit === 'm' || unit === 'mm' || unit === 'million') {
    amount = raw * 1_000_000;
  }
  if (amount < 10_000) return 'under_10k';
  if (amount < 100_000) return '10k_100k';
  if (amount < 1_000_000) return '100k_1m';
  return 'over_1m';
}

/** Best-effort counterparty/name extraction from "with/from/against X". */
export function detectCounterparty(originalText: string): string | undefined {
  const match = originalText.match(
    /\b(?:with|from|against)\s+([A-Z][\w&.-]*(?:\s+[A-Z][\w&.-]*){0,3})/,
  );
  const name = match?.[1]?.trim();
  if (!name || name.length < 2) return undefined;
  return name.slice(0, 48);
}

export const NARRATIVE_CAP = 600;

/**
 * Parse a situation for a matter, preferring OpenAI when a key is set and
 * falling back to the definition's deterministic heuristic otherwise (or on
 * any failure).
 */
export async function parseSituation(
  text: string,
  definition: MatterIntakeDefinition,
): Promise<ParsedSituation> {
  const ai = await parseSituationWithOpenAi(
    text,
    definition.questions,
    definition.openAiHints,
  );
  if (ai && keysOf(ai).length > 0) {
    return { answers: ai, keys: keysOf(ai) };
  }
  return definition.parse(text);
}
