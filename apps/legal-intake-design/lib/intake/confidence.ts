/**
 * How much a value can be trusted, and therefore whether it needs a human eye.
 *
 * Derived from signals the code already owns, never asked of the model. Models
 * are badly calibrated at rating their own certainty, and a self-reported "92%"
 * would be a number with nothing behind it. These three inputs are real:
 *
 *   who said it        the client's own words outrank anything worked out
 *   was it verified    a document quote that was found in the document
 *   the model's flag   its own sure/unsure call, useful but only as a tiebreak
 *
 * The score exists so the client knows where to look. Anything low is the only
 * thing we stop and ask about; everything else is accepted on arrival, and can
 * still be edited at any time.
 */

import type { BriefField } from './brief';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type ConfidenceReading = {
  level: ConfidenceLevel;
  /** 0 to 100. Coarse by nature: it comes from three signals, not a model. */
  score: number;
};

/** Below this, we stop and ask. At or above it, the value is accepted. */
export const LOW_CONFIDENCE_CEILING = 55;

export function scoreFor(
  source: BriefField['source'],
  confidence: BriefField['confidence'],
  hasVerifiedQuote: boolean,
): number {
  // The client typed it. There is nothing to second-guess.
  if (source === 'client') return 100;

  // Read from a document, and the quote was found in that document.
  if (source === 'document' && hasVerifiedQuote) {
    return confidence === 'sure' ? 95 : 78;
  }

  // Worked out from the conversation, or a document claim that failed its
  // quote check and was downgraded on the way in.
  return confidence === 'sure' ? 65 : 35;
}

export function levelFor(score: number): ConfidenceLevel {
  if (score >= 80) return 'high';
  if (score >= LOW_CONFIDENCE_CEILING) return 'medium';
  return 'low';
}

/** `null` for a field with no value: there is nothing yet to be confident about. */
export function fieldConfidence(field: BriefField): ConfidenceReading | null {
  if (field.value === null) return null;
  const score = scoreFor(
    field.source,
    field.confidence,
    field.sourceQuote !== null,
  );
  return { level: levelFor(score), score };
}

/**
 * Whether this value can be accepted without asking.
 *
 * This is the whole auto-approve rule. Note what it is not: the model is still
 * unable to assert that anything is confirmed. Code decides, from signals code
 * computed, and the client can overrule any of it by editing.
 */
export function isAutoApprovable(
  source: BriefField['source'],
  confidence: BriefField['confidence'],
  hasVerifiedQuote: boolean,
): boolean {
  return levelFor(scoreFor(source, confidence, hasVerifiedQuote)) !== 'low';
}
