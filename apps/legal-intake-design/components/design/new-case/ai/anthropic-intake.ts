/**
 * Server-only Anthropic proxy logic for the AI-powered case intake.
 *
 * Called exclusively from the `/api/ai-intake` route handler, so the shared
 * `ANTHROPIC_API_KEY` stays server-side and never reaches the browser. Every
 * function returns `null` on any failure (missing key, non-200, bad JSON) so the
 * caller falls back to the deterministic script — same ethos as the older
 * `openai-intake-helpers.ts`.
 *
 * Uses plain `fetch` against the Messages API (no SDK dependency).
 */

import {
  DOCUMENTS_KEY,
  MATTER_TYPE_KEY,
  RECAP_KEY,
  type AnswersMap,
  type IntakeQuestion,
  type MatterId,
} from '../intake-types';
import { MATTER_CHIPS, MATTER_FLOWS, URGENCY_QUESTION } from '../matters';
import { orderedQuestions } from '../script';
import type {
  AiRecapRequest,
  AiRecapResult,
  AiTurnRequest,
  AiTurnResult,
} from './types';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
// Current model IDs (July 2026). Overridable via env for the playground.
const TURN_MODEL = process.env.ANTHROPIC_TURN_MODEL ?? 'claude-haiku-4-5';
const RECAP_MODEL = process.env.ANTHROPIC_RECAP_MODEL ?? 'claude-sonnet-5';

function isMatterId(value: string): value is MatterId {
  return value in MATTER_FLOWS;
}

type AnthropicContentBlock = { type: string; text?: string };
type AnthropicResponse = { content?: AnthropicContentBlock[] };

/**
 * Single-shot Messages call. Returns the concatenated text blocks, or `null` on
 * any failure. No sampling params are sent (Sonnet 5 rejects them); thinking is
 * disabled on request to keep latency low and the output text-only.
 */
async function callAnthropic(
  system: string,
  user: string,
  opts: { model: string; maxTokens: number; disableThinking?: boolean },
): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const body: Record<string, unknown> = {
    model: opts.model,
    max_tokens: opts.maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  };
  if (opts.disableThinking) body.thinking = { type: 'disabled' };

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    });
  } catch {
    return null;
  }
  if (!response.ok) return null;

  let data: AnthropicResponse;
  try {
    data = (await response.json()) as AnthropicResponse;
  } catch {
    return null;
  }
  const blocks = data.content;
  if (!Array.isArray(blocks)) return null;
  const text = blocks
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('')
    .trim();
  return text.length > 0 ? text : null;
}

/** Parse the first `{...}` object out of a model reply, tolerating fences. */
function parseJsonObject(raw: string): Record<string, unknown> | null {
  const cleaned = raw
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const jsonText =
    start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  try {
    const parsed = JSON.parse(jsonText) as unknown;
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

type SchemaField = {
  key: string;
  label: string;
  kind: IntakeQuestion['kind'];
  optional: boolean;
  options?: { value: string; label: string }[];
};

/** Fields the model may pre-fill: the matter's own questions plus urgency. */
function extractionSchema(matterId: MatterId): SchemaField[] {
  const questions = [...MATTER_FLOWS[matterId].questions, URGENCY_QUESTION];
  return questions.map((q) => ({
    key: q.key,
    label: q.reviewLabel,
    kind: q.kind,
    optional: Boolean(q.optional),
    options: q.chips?.map((c) => ({ value: c.value, label: c.label })),
  }));
}

function awaitedQuestion(
  matterId: MatterId | null,
  key: string,
): IntakeQuestion | null {
  return (
    orderedQuestions(matterId ?? undefined, {}).find((q) => q.key === key) ??
    null
  );
}

/** Keep only schema keys with valid values; drop the just-answered key. */
function sanitizeExtracted(
  obj: Record<string, unknown>,
  schema: SchemaField[],
  awaitedKey: string,
): AnswersMap {
  const byKey = new Map(schema.map((f) => [f.key, f] as const));
  const out: AnswersMap = {};
  for (const [key, value] of Object.entries(obj)) {
    if (
      key === awaitedKey ||
      key === MATTER_TYPE_KEY ||
      key === DOCUMENTS_KEY ||
      key === RECAP_KEY
    ) {
      continue;
    }
    const field = byKey.get(key);
    if (!field || typeof value !== 'string') continue;
    const v = value.trim();
    if (!v) continue;
    if (field.options) {
      if (field.options.some((o) => o.value === v)) out[key] = v;
    } else {
      out[key] = v.slice(0, 600);
    }
  }
  return out;
}

/** Augment one intake turn: classify, extract, acknowledge, or answer asides. */
export async function runTurn(
  req: AiTurnRequest,
): Promise<AiTurnResult | null> {
  const isMatterType = req.awaitedKey === MATTER_TYPE_KEY;
  const awaited = awaitedQuestion(req.matterId, req.awaitedKey);
  const schema = req.matterId ? extractionSchema(req.matterId) : [];

  const matterList = MATTER_CHIPS.map((c) => `- ${c.value}: ${c.label}`).join(
    '\n',
  );
  const schemaLines = schema.map((f) => {
    const allowed = f.options
      ? ` (allowed: ${f.options.map((o) => o.value).join(' | ')})`
      : ' (free text)';
    return `- ${f.key}: ${f.label}${allowed}${f.optional ? ' [optional]' : ''}`;
  });

  const system = [
    'You assist a legal-intake chat where a non-lawyer client answers questions to open a legal case. You augment a deterministic script; keep your role minimal and precise.',
    'Return ONLY a minified JSON object. No prose, no code fences. All keys are optional: matterId, extracted, acknowledgement, offScript.',
    isMatterType
      ? `The client is choosing a matter type. Set "matterId" to the best id from:\n${matterList}\nUse "none" if genuinely unclear.`
      : `The awaited question is "${awaited?.reviewLabel ?? req.awaitedKey}"${
          awaited?.kind ? ` (kind: ${awaited.kind})` : ''
        }.`,
    schemaLines.length
      ? `You may pre-fill later fields you are confident about into "extracted" (an object of key -> value). Use allowed values verbatim for constrained fields; copy the client's own wording for free text; omit anything uncertain. Fields:\n${schemaLines.join(
          '\n',
        )}`
      : '',
    'If the client message is a QUESTION or aside rather than an answer to the awaited question, put a concise, friendly reply (max 60 words) in offScript.answer and omit matterId/extracted/acknowledgement.',
    'Otherwise set "acknowledgement" to ONE short, warm sentence (max 22 words) reflecting what they said. No follow-up question, no next steps, no restating the next question.',
    'Return {} if nothing applies.',
  ]
    .filter(Boolean)
    .join('\n\n');

  const transcript = req.transcript
    .slice(-6)
    .map((t) => `${t.role === 'user' ? 'Client' : 'Moritz'}: ${t.content}`)
    .join('\n');
  const answersText = Object.entries(req.answers)
    .filter(([, v]) => v)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');
  const user = [
    transcript ? `Recent conversation:\n${transcript}` : '',
    answersText ? `Answers so far:\n${answersText}` : '',
    `Client just said: "${req.userMessage}"`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const raw = await callAnthropic(system, user, {
    model: TURN_MODEL,
    maxTokens: 400,
  });
  if (!raw) return null;
  const parsed = parseJsonObject(raw);
  if (!parsed) return null;

  const result: AiTurnResult = {};

  const off = parsed.offScript;
  if (off && typeof off === 'object' && 'answer' in off) {
    const ans = (off as { answer?: unknown }).answer;
    if (typeof ans === 'string' && ans.trim()) {
      result.offScript = { answer: ans.trim().slice(0, 600) };
      return result;
    }
  }

  if (isMatterType) {
    const raw2 =
      typeof parsed.matterId === 'string'
        ? parsed.matterId.trim().toLowerCase()
        : '';
    result.matterId = isMatterId(raw2) ? raw2 : null;
  }

  if (parsed.extracted && typeof parsed.extracted === 'object') {
    const cleaned = sanitizeExtracted(
      parsed.extracted as Record<string, unknown>,
      schema,
      req.awaitedKey,
    );
    if (Object.keys(cleaned).length > 0) result.extracted = cleaned;
  }

  if (typeof parsed.acknowledgement === 'string') {
    const ack = parsed.acknowledgement.trim().replace(/\s+/g, ' ');
    if (ack) result.acknowledgement = ack.slice(0, 240);
  }

  return result;
}

/** Suggest a case title + lawyer-ready description from the captured answers. */
export async function runRecap(
  req: AiRecapRequest,
): Promise<AiRecapResult | null> {
  if (!req.matterId) return null;
  const flow = MATTER_FLOWS[req.matterId];
  const schema = extractionSchema(req.matterId);
  const answersText = schema
    .map((f) => {
      const v = req.answers[f.key];
      if (!v) return null;
      const label = f.options?.find((o) => o.value === v)?.label ?? v;
      return `- ${f.label}: ${label}`;
    })
    .filter(Boolean)
    .join('\n');

  // Free-text fields (not chip-constrained) that the client actually answered —
  // these are the long answers we ask Claude to tighten into one-liners.
  const summaryFields = schema.filter(
    (f) => f.kind !== 'chips' && Boolean(req.answers[f.key]?.trim()),
  );
  const summaryKeys = new Set(summaryFields.map((f) => f.key));
  const summaryLines = summaryFields.map((f) => `- ${f.key}: ${f.label}`);

  const system = [
    'You write a short case record for a legal-intake tool.',
    'Return ONLY a minified JSON object with keys "title", "description" and "summaries". No prose, no code fences.',
    'title: a concise case name, 2-5 words, shaped like "{Party} {Matter}" (e.g. "Acme Contract"). No surrounding quotes, no trailing punctuation.',
    'description: a neutral, professional 2-3 sentence brief summarising the matter for the assigned lawyer.',
    summaryLines.length
      ? `summaries: an object mapping each of these free-text field keys to a neutral, concise one-line paraphrase (max 20 words) of the client's answer. Paraphrase in your own words — do not copy their wording verbatim. Omit any key you cannot summarise. Fields:\n${summaryLines.join(
          '\n',
        )}`
      : 'summaries: an empty object {}.',
  ].join('\n');
  const user = `Matter type: ${flow.label}\n${answersText || '(no further details provided)'}`;

  const raw = await callAnthropic(system, user, {
    model: RECAP_MODEL,
    maxTokens: 400,
    disableThinking: true,
  });
  if (!raw) return null;
  const parsed = parseJsonObject(raw);
  if (!parsed) return null;

  const result: AiRecapResult = {};
  if (typeof parsed.title === 'string') {
    const t = parsed.title
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/^["']|["']$/g, '')
      .replace(/[.]+$/, '');
    if (t) result.title = t.slice(0, 80);
  }
  if (typeof parsed.description === 'string') {
    const d = parsed.description.trim();
    if (d) result.description = d.slice(0, 800);
  }
  if (parsed.summaries && typeof parsed.summaries === 'object') {
    const summaries: Record<string, string> = {};
    for (const [key, value] of Object.entries(
      parsed.summaries as Record<string, unknown>,
    )) {
      if (!summaryKeys.has(key) || typeof value !== 'string') continue;
      const s = value.trim().replace(/\s+/g, ' ');
      if (s) summaries[key] = s.slice(0, 200);
    }
    if (Object.keys(summaries).length > 0) result.summaries = summaries;
  }
  return Object.keys(result).length > 0 ? result : null;
}
