/**
 * JSON Schema for constrained intake extraction via Anthropic `output_config`.
 * Every object sets `additionalProperties: false` as required by the API.
 */

export type IntakeFieldStatus = 'found' | 'missing' | 'unclear';

export type IntakeExtractionField = {
  key: string;
  value: string;
  source: string;
  status: IntakeFieldStatus;
};

export type IntakeExtraction = {
  matterType: string;
  fields: IntakeExtractionField[];
};

export const INTAKE_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    matterType: {
      type: 'string',
    },
    fields: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          value: { type: 'string' },
          source: { type: 'string' },
          status: {
            type: 'string',
            enum: ['found', 'missing', 'unclear'],
          },
        },
        required: ['key', 'value', 'source', 'status'],
        additionalProperties: false,
      },
    },
  },
  required: ['matterType', 'fields'],
  additionalProperties: false,
} as const;
