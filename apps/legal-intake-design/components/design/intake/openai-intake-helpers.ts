/**
 * Optional client-side OpenAI helpers for the matter-intake playground.
 *
 * If the user pastes an API key into Playground settings (stored in
 * localStorage under `playground:openai-api-key`), these helpers call OpenAI
 * directly from the browser to produce smarter copy. The key never leaves the
 * browser and is never sent to a Moritz server.
 *
 * EVERY helper falls back to a static, deterministic result when no key is
 * configured or the request fails, so the flow always works offline.
 */

import type {
  AnswerKey,
  IntakeAnswers,
  MatterIntakeDefinition,
  OpenAiParseHints,
  QuestionDef,
} from './intake-types';

function optionValues(
  questions: Record<string, QuestionDef>,
  key: AnswerKey,
): string[] {
  return questions[key]?.options?.map((o) => o.value) ?? [];
}

export const OPENAI_API_KEY_STORAGE = 'playground:openai-api-key';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

export function getOpenAiKey(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = window.localStorage.getItem(OPENAI_API_KEY_STORAGE);
    return key && key.trim().length > 0 ? key.trim() : null;
  } catch {
    return null;
  }
}

export function isOpenAiEnabled(): boolean {
  return getOpenAiKey() !== null;
}

async function chat(
  system: string,
  user: string,
  maxTokens = 200,
): Promise<string | null> {
  const key = getOpenAiKey();
  if (!key) return null;
  try {
    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    return content && content.length > 0 ? content : null;
  } catch {
    return null;
  }
}

/**
 * Classify which matter type a free-text description belongs to using OpenAI.
 * Returns one of the provided ids, or `null` when no key is configured, the
 * request fails, or the answer isn't a known id — callers then fall back to the
 * deterministic keyword classifier.
 */
export async function classifyMatterWithOpenAi(
  text: string,
  ids: readonly string[],
): Promise<string | null> {
  if (!getOpenAiKey()) return null;
  const system = [
    'You route a legal matter to the right intake flow.',
    `Pick the single best matter type for the description from: ${ids.join(', ')}.`,
    'Reply with ONLY the matter id — no prose, no punctuation.',
    'If genuinely unclear or it fits none, reply exactly: none.',
  ].join('\n');
  const raw = await chat(system, text, 8);
  if (!raw) return null;
  const answer = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z/]/g, '');
  return ids.find((id) => id === answer) ?? null;
}

/**
 * Extract structured intake fields from a free-text description using OpenAI.
 * Returns `null` when no key is configured, the request fails, or nothing
 * usable comes back — callers then fall back to the deterministic heuristic.
 */
export async function parseSituationWithOpenAi(
  text: string,
  questions: Record<string, QuestionDef>,
  hints: OpenAiParseHints,
): Promise<IntakeAnswers | null> {
  if (!getOpenAiKey()) return null;
  const enumLines = hints.enumKeys.map(
    (key) => `- ${key}: ${optionValues(questions, key).join(' | ')}`,
  );
  const system = [
    "You extract structured fields from a non-lawyer's description of a legal matter.",
    'Return ONLY a minified JSON object — no prose, no code fences.',
    'Only include a key when you are confident; omit anything unclear.',
    'Allowed values:',
    ...enumLines,
    `Free-text keys (short strings, copy the client's wording): ${hints.freeTextKeys.join(', ')}.`,
  ].join('\n');

  const raw = await chat(system, text, 300);
  if (!raw) return null;
  return sanitizeParsedAnswers(raw, questions, hints);
}

function sanitizeParsedAnswers(
  raw: string,
  questions: Record<string, QuestionDef>,
  hints: OpenAiParseHints,
): IntakeAnswers | null {
  const jsonText = raw
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonText) as Record<string, unknown>;
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;

  const result: IntakeAnswers = {};
  for (const key of hints.enumKeys) {
    const value = parsed[key];
    if (
      typeof value === 'string' &&
      optionValues(questions, key).includes(value)
    ) {
      result[key] = value;
    }
  }
  for (const key of hints.freeTextKeys) {
    const value = parsed[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      result[key] = value.trim().slice(0, 600);
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

type GuidedDealParts = {
  whoDoesWhat: string;
  whoPaysWhom: string;
  whenIsItDone: string;
};

/**
 * Turn the three guided-deal answers into a single plain-English sentence.
 * Falls back to a simple template join when OpenAI is unavailable.
 */
export async function composeDealSummary(
  parts: GuidedDealParts,
): Promise<string> {
  const fallback = staticDealSummary(parts);
  const ai = await chat(
    'You help a non-lawyer describe a contract in one warm, plain-English sentence. No legalese. Max 40 words. Return only the sentence.',
    `Who does what: ${parts.whoDoesWhat}\nWho pays whom: ${parts.whoPaysWhom}\nWhen is it done: ${parts.whenIsItDone}`,
    80,
  );
  return ai ?? fallback;
}

function staticDealSummary(parts: GuidedDealParts): string {
  const pieces = [
    parts.whoDoesWhat.trim(),
    parts.whoPaysWhom.trim(),
    parts.whenIsItDone.trim(),
  ].filter((piece) => piece.length > 0);
  if (pieces.length === 0) return '';
  return pieces.join('. ').replace(/\.\.$/, '.') + (pieces.length ? '.' : '');
}

/**
 * Produce a short, lawyer-ready summary paragraph from the structured answers.
 * Falls back to the matter definition's deterministic template summary.
 */
export async function composeReviewSummary(
  definition: MatterIntakeDefinition,
  answers: IntakeAnswers,
): Promise<string> {
  const fallback = definition.staticSummary(answers);
  const ai = await chat(
    'You are a legal intake assistant. Write a concise 2-3 sentence brief summarising a client legal matter for the assigned lawyer. Neutral, professional. Return only the summary.',
    answersToPrompt(definition.questions, answers),
    200,
  );
  return ai ?? fallback;
}

function answersToPrompt(
  questions: Record<string, QuestionDef>,
  answers: IntakeAnswers,
): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(answers)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    const label = questions[key]?.reviewLabel ?? key;
    const rendered = Array.isArray(value)
      ? value.map((item) => String(item)).join(', ')
      : String(value);
    if (rendered.trim().length === 0) continue;
    lines.push(`${label}: ${rendered}`);
  }
  return lines.join('\n');
}
