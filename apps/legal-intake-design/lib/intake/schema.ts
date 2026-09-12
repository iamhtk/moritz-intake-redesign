/**
 * What the model returns when it reads an uploaded document.
 *
 * It reports the value and where it read it, a human-readable note and the
 * exact words. It does NOT report a source type or a confidence: those are
 * decided by the server after checking the quote against the real document
 * text (see `verify-source.ts`). Leaving them out of the schema means the model
 * cannot assert provenance it has not earned.
 */

export type ExtractedField = {
  key: string;
  value: string;
  /** Human readable, e.g. "Notice period clause, page 3". */
  sourceNote: string;
  /** The exact words the value was read from. Checked before it is believed. */
  sourceQuote: string;
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
        },
        required: ['key', 'value', 'sourceNote', 'sourceQuote'],
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
    } = candidate as Record<string, unknown>;
    if (typeof key !== 'string' || key.trim() === '') continue;
    if (typeof fieldValue !== 'string' || fieldValue.trim() === '') continue;
    parsed.push({
      key,
      value: fieldValue,
      sourceNote: typeof sourceNote === 'string' ? sourceNote : '',
      sourceQuote: typeof sourceQuote === 'string' ? sourceQuote : '',
    });
  }

  return { matterType, fields: parsed };
}
