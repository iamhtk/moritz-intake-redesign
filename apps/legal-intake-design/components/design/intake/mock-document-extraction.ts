/**
 * Mock document "OCR + extraction" for the matter-intake playground.
 *
 * Deterministic, filename-driven, and delayed with a timer so the UI can show
 * a "Reading your document…" shimmer. Nothing is uploaded anywhere. Each matter
 * definition decides how to apply the extracted fields (see `applyExtraction`).
 */

import type { ExtractedFields } from './intake-types';

export type ExtractionResult =
  | { ok: true; fields: ExtractedFields }
  | { ok: false; reason: string };

const EXTRACTION_DELAY_MS = 2200;

const NON_CONTRACT_HINTS = [
  'meme',
  'screenshot',
  'photo',
  'img_',
  'selfie',
  'cat',
  'invoice',
];

const TYPE_HINTS: { type: string; keywords: string[] }[] = [
  { type: 'nda', keywords: ['nda', 'non-disclosure', 'confidential'] },
  {
    type: 'services',
    keywords: ['msa', 'services', 'sow', 'statement-of-work'],
  },
  { type: 'licensing', keywords: ['license', 'licence', 'ip'] },
  { type: 'lease', keywords: ['lease', 'rental', 'tenancy'] },
  { type: 'sales', keywords: ['sales', 'purchase', 'order'] },
  { type: 'partnership', keywords: ['partnership', 'jv', 'joint-venture'] },
];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function titleCase(input: string): string {
  return input
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

/**
 * Heuristic counterparty guess from a filename such as
 * `nda-acme-corp.pdf` -> "Acme Corp".
 */
function guessCounterparty(base: string): string | undefined {
  const cleaned = base
    .replace(
      /\b(nda|msa|contract|agreement|draft|final|signed|v\d+|mutual|one-way)\b/gi,
      '',
    )
    .replace(/[-_]+/g, ' ')
    .trim();
  if (cleaned.length < 2) return undefined;
  return titleCase(cleaned).slice(0, 48);
}

export async function extractFromFile(file: File): Promise<ExtractionResult> {
  await delay(EXTRACTION_DELAY_MS);

  const name = file.name.toLowerCase();
  const base = file.name.replace(/\.[^./]+$/, '');
  const isImage = file.type.startsWith('image/');
  const looksLikeDocument = /\.(pdf|docx?|txt)$/i.test(file.name);

  const hitsNonContract = NON_CONTRACT_HINTS.some((hint) =>
    name.includes(hint),
  );
  if (hitsNonContract || (isImage && !looksLikeDocument)) {
    return {
      ok: false,
      reason: 'Want to try another file or skip this step?',
    };
  }

  const suggestedType = TYPE_HINTS.find(({ keywords }) =>
    keywords.some((keyword) => name.includes(keyword)),
  )?.type;

  const fields: ExtractedFields = {
    counterparty: guessCounterparty(base),
    suggestedType,
  };

  return { ok: true, fields };
}
