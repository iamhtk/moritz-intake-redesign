/**
 * The turn contract: what one conversational exchange returns.
 *
 * Two deliberate constraints, both of which exist to keep the model inside the
 * lane the brief invariants define (see `brief.ts`):
 *
 * - `reply` is the FIRST property. Constrained decoding emits properties in
 * schema order, so the visible text arrives at the front of the stream and
 * can be rendered before the object closes.
 * - `source` cannot be `document` here. Only `/api/extract` may claim a
 * document source, and only after verifying the quote against the extracted
 * text. A conversational turn has no document in front of it, so the schema
 * removes the option rather than trusting the prompt to discourage it.
 */

import type { Brief } from './brief';
import { fieldState } from './brief';

/** Sources a conversational turn is allowed to claim. Note: no `document`. */
export type TurnFieldSource = 'client' | 'inferred';

export type TurnFieldUpdate = {
  key: string;
  value: string;
  source: TurnFieldSource;
  confidence: 'sure' | 'unsure';
};

export type IntakeTurn = {
  /** What the client sees. Streams first. */
  reply: string;
  /** Proposed changes. Every one arrives unconfirmed. */
  fieldUpdates: TurnFieldUpdate[];
  /** Field key the reply is asking about, or `''` for none. */
  askingAbout: string;
  /** The model's view of completeness. Advisory, `canSubmit` decides. */
  nothingRequiredMissing: boolean;
};

/**
 * `askingAbout` is a plain string with `''` meaning "not asking", rather than a
 * nullable type: the repo's API rules call for keeping optional fields to a
 * minimum because each one grows the compiled grammar.
 */
export const INTAKE_TURN_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    fieldUpdates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          value: { type: 'string' },
          source: { type: 'string', enum: ['client', 'inferred'] },
          confidence: { type: 'string', enum: ['sure', 'unsure'] },
        },
        required: ['key', 'value', 'source', 'confidence'],
        additionalProperties: false,
      },
    },
    askingAbout: { type: 'string' },
    nothingRequiredMissing: { type: 'boolean' },
  },
  required: ['reply', 'fieldUpdates', 'askingAbout', 'nothingRequiredMissing'],
  additionalProperties: false,
} as const;

const TURN_SOURCES: ReadonlySet<string> = new Set(['client', 'inferred']);
const TURN_CONFIDENCES: ReadonlySet<string> = new Set(['sure', 'unsure']);

function parseUpdate(value: unknown): TurnFieldUpdate | null {
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  const { key, value: fieldValue, source, confidence } = record;
  if (typeof key !== 'string' || key.trim() === '') return null;
  if (typeof fieldValue !== 'string' || fieldValue.trim() === '') return null;
  if (typeof source !== 'string' || !TURN_SOURCES.has(source)) return null;
  if (typeof confidence !== 'string' || !TURN_CONFIDENCES.has(confidence)) {
    return null;
  }
  return {
    key,
    value: fieldValue,
    source: source as TurnFieldSource,
    confidence: confidence as 'sure' | 'unsure',
  };
}

/**
 * Validate a parsed model response. Malformed updates are dropped individually
 * rather than failing the whole turn, losing one field update is recoverable,
 * losing the reply strands the client mid-conversation.
 */
export function parseIntakeTurn(value: unknown): IntakeTurn | null {
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;

  const { reply, fieldUpdates, askingAbout, nothingRequiredMissing } = record;
  if (typeof reply !== 'string' || reply.trim() === '') return null;

  const updates: TurnFieldUpdate[] = [];
  if (Array.isArray(fieldUpdates)) {
    for (const candidate of fieldUpdates) {
      const parsed = parseUpdate(candidate);
      if (parsed) updates.push(parsed);
    }
  }

  return {
    reply,
    fieldUpdates: updates,
    askingAbout: typeof askingAbout === 'string' ? askingAbout : '',
    nothingRequiredMissing: nothingRequiredMissing === true,
  };
}

/**
 * Pull the `reply` string out of a partially streamed JSON object, so the
 * client can render text before the response closes.
 *
 * Returns `null` until enough of the string has arrived to be worth showing.
 * Handles escape sequences so a quote inside the reply does not truncate it.
 */
export function extractPartialReply(buffer: string): string | null {
  const start = buffer.indexOf('"reply"');
  if (start === -1) return null;

  const openQuote = buffer.indexOf('"', buffer.indexOf(':', start) + 1);
  if (openQuote === -1) return null;

  let out = '';
  for (let i = openQuote + 1; i < buffer.length; i += 1) {
    const char = buffer[i];
    if (char === '\\') {
      const next = buffer[i + 1];
      if (next === undefined) break; // escape split across chunks
      if (next === 'n') out += '\n';
      else if (next === 't') out += '\t';
      else if (next === 'u') {
        const code = buffer.slice(i + 2, i + 6);
        if (code.length < 4) break;
        out += String.fromCharCode(parseInt(code, 16));
        i += 4;
      } else out += next;
      i += 1;
      continue;
    }
    if (char === '"') return out; // closed, this is the whole reply
    out += char;
  }

  return out.length > 0 ? out : null;
}

/**
 * The brief as the model sees it each turn: the durable memory of the session.
 *
 * Sent in the user message rather than the system block, so the cached system
 * prefix stays byte-identical for the whole session.
 */
export function renderBriefState(brief: Brief): string {
  const lines = brief.fields.map((field) => {
    const state = fieldState(field);
    if (state === 'missing') {
      return `- ${field.key} (${field.label})${field.required ? '' : ' [optional]'}: MISSING`;
    }
    const locked = field.confirmed
      ? ', CONFIRMED BY CLIENT, do not change'
      : '';
    const origin = field.source === null ? 'unknown' : field.source;
    return `- ${field.key} (${field.label}): ${field.value} [from ${origin}, ${field.confidence}]${locked}`;
  });

  return `CURRENT BRIEF (matter: ${brief.matterId})\n${lines.join('\n')}`;
}
