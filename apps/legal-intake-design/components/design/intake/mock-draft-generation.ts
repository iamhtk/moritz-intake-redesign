/**
 * Mock status sequence shown after the user submits.
 *
 * The generating screen steps through these messages on a timer to portray
 * the "reviewing your details… preparing your quote…" experience without any
 * backend call. Moritz never drafts the document itself — it reviews the
 * matter, prepares a quote, and assigns a lawyer.
 */

export type GenerationStage = {
  label: string;
  durationMs: number;
};

export const GENERATION_STAGES: readonly GenerationStage[] = [
  { label: 'Reviewing your details…', durationMs: 9000 },
  { label: 'Checking your documents…', durationMs: 9000 },
  { label: 'Preparing your quote…', durationMs: 9000 },
  { label: 'Wrapping up your quote…', durationMs: 6000 },
];

export const TOTAL_GENERATION_MS = GENERATION_STAGES.reduce(
  (total, stage) => total + stage.durationMs,
  0,
);
