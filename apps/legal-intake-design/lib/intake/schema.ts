/**
 * What the model returns when it reads an uploaded document.
 *
 * It reports the value, where it read it, a human-readable note, the exact
 * words, and a 1 to 10 rating of how sure it is that the quote actually says
 * the value.
 *
 * It does NOT report a source type. That is decided by the server after
 * checking the quote against the real document text (see `verify-source.ts`),
 * and leaving it out of the schema means the model cannot assert provenance it
 * has not earned.
 *
 * The rating is a different kind of thing and is safe to ask for. It does not
 * choose the band the value is scored in — the verified-or-not check does that,
 * server-side — it only positions the value inside that band, so a confident
 * misreading of a real clause still scores below a client's own words and still
 * has to be confirmed. See `confidence.ts`. Before this existed every document
 * value scored identically, which meant a quote the model had to squint at and
 * one it read straight off the page reached the client looking the same.
 */

import {
  clampRating,
  RATING_MIN,
  RATING_SCALE,
  type ConfidenceRating,
} from './confidence';

export type ExtractedField = {
  key: string;
  value: string;
  /** Human readable, e.g. "Notice period clause, page 3". */
  sourceNote: string;
  /** The exact words the value was read from. Checked before it is believed. */
  sourceQuote: string;
  /** 1 to 10: how sure the model is the quote says this value. */
  confidence: ConfidenceRating;
};

export type Extraction = {
  matterType: string;
  fields: ExtractedField[];
};

export const INTAKE_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    matterType: { type: 'string' },
    fields: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          value: { type: 'string' },
          sourceNote: { type: 'string' },
          sourceQuote: { type: 'string' },
          // An enum, not a range: structured outputs strip `minimum` and
          // `maximum`. See `RATING_SCALE`.
          confidence: { type: 'integer', enum: RATING_SCALE },
        },
        required: ['key', 'value', 'sourceNote', 'sourceQuote', 'confidence'],
        additionalProperties: false,
      },
    },
  },
  required: ['matterType', 'fields'],
  additionalProperties: false,
} as const;

export function parseExtraction(value: unknown): Extraction | null {
  if (typeof value !== 'object' || value === null) return null;
  const { matterType, fields } = value as Record<string, unknown>;
  if (typeof matterType !== 'string' || !Array.isArray(fields)) return null;

  const parsed: ExtractedField[] = [];
  for (const candidate of fields) {
    if (typeof candidate !== 'object' || candidate === null) continue;
    const {
      key,
      value: fieldValue,
      sourceNote,
      sourceQuote,
      confidence,
    } = candidate as Record<string, unknown>;
    if (typeof key !== 'string' || key.trim() === '') continue;
    if (typeof fieldValue !== 'string' || fieldValue.trim() === '') continue;
    parsed.push({
      key,
      value: fieldValue,
      sourceNote: typeof sourceNote === 'string' ? sourceNote : '',
      sourceQuote: typeof sourceQuote === 'string' ? sourceQuote : '',
      /*
       * A missing rating is the bottom of the scale, not a dropped field.
       *
       * Unlike a conversational turn, an extraction has already earned its
       * place by the time this runs: the quote is about to be checked against
       * the real document, and that check is the load-bearing one. Throwing
       * away a value whose quote verifies because the model forgot a number
       * would lose a fact the client can see for themselves in the file. The
       * floor is the honest default — it reads as "no reason to be confident"
       * rather than as an average invented on the model's behalf.
       */
      confidence:
        typeof confidence === 'number' ? clampRating(confidence) : RATING_MIN,
    });
  }

  return { matterType, fields: parsed };
}
