/**
 * How much a value can be trusted.
 *
 * Four signals go in, one 0-100 number comes out. Three of the four are owned
 * by code and one is the model's own rating, and the division of labour between
 * them is the whole design:
 *
 *   who said it        the client's own words outrank anything worked out
 *   was it verified    a document quote that was found in the document
 *   was it locatable   the quote placed back in its surrounding sentences
 *   the model's rating 1 to 10, how sure it is of this particular value
 *
 * **Provenance picks the band; the rating only moves the value inside it.** A
 * model rating its own guess a 10 cannot make that guess outscore a verified
 * quote, because the guess is scored inside the inferred band and the quote is
 * scored inside the document band, and the bands do not overlap. This is the
 * point of asking for a rating at all: a self-reported number is worth
 * something as a *relative* signal — this value is shakier than that one, from
 * a model looking at both — and worth nothing as an absolute claim to be
 * trusted on its own. Models are badly calibrated at "how likely am I to be
 * right"; they are considerably better at "which of these did I have to work
 * harder for". Banding takes the second and throws away the first.
 *
 * Two things the score is deliberately not.
 *
 * It is not the confirm gate. Whether a value needs a human eye is decided by
 * where it came from (`isAutoApprovable`), not by how it scored. A document
 * quote that verified cleanly still gets read by the client before it reaches a
 * lawyer, and no threshold can substitute for that. A 10 out of 10 does not
 * open the gate, and that is why the model can be asked for one safely.
 *
 * It is not live. The score is computed once, when the value arrives, and
 * pinned to the field (`BriefField.confidenceScore`). Accepting a value is not
 * the model becoming more confident about it, and an edit is a human override
 * rather than a 100% reading — so neither touches the number. What the client
 * did is carried by the tick and the receipt, which is a different fact about
 * the field and is shown separately.
 */

import type { BriefField, FieldSource } from './brief';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * The model's own 1 to 10 reading of a value it is proposing.
 *
 * An integer, and a narrow one: ten stops is enough to rank a brief's worth of
 * values against each other, and few enough that each stop can be given a
 * described meaning in the prompt. A 0-100 scale would read as precision the
 * model does not have, and every prompt anchor between 60 and 70 would be
 * invented.
 */
export type ConfidenceRating = number;

export const RATING_MIN = 1;
export const RATING_MAX = 10;

/**
 * `[1, 2, ... 10]`, for the two JSON schemas that have to spell the scale out.
 *
 * Structured outputs do not support numerical constraints — `minimum` and
 * `maximum` are stripped before the schema is compiled — so a range in a
 * schema would be a rule the grammar never enforced. An enum is enforced, and
 * deriving it here means the scale is stated once rather than in the intake
 * schema, the extraction schema and the prompt separately.
 */
export const RATING_SCALE: readonly number[] = Array.from(
  { length: RATING_MAX - RATING_MIN + 1 },
  (_, index) => RATING_MIN + index,
);

export type ConfidenceReading = {
  level: ConfidenceLevel;
  /** 0 to 100. Banded by provenance, positioned by the model's rating. */
  score: number;
};

/** The medium/low boundary. A reading, not a gate: nothing branches on it. */
export const LOW_CONFIDENCE_CEILING = 55;
/** The medium/high boundary. */
export const HIGH_CONFIDENCE_FLOOR = 80;

/**
 * A rating as it can actually be used: an integer from 1 to 10.
 *
 * Clamped rather than rejected. The rating is a dial, not a fact — an 11 is a
 * model saying "as sure as it gets", and dropping a real value over the way its
 * dial was reported would trade a field for a number. Anything that is not a
 * number at all is a different problem and is caught before this, in
 * `isValidUpdate`, where the whole update is dropped.
 *
 * `NaN` is the one number with no place on the scale: it is not high or low,
 * it is unordered, so it reads as no rating given and takes the floor. The
 * infinities do have a direction and are clamped along with everything else.
 */
export function clampRating(value: number): ConfidenceRating {
  if (Number.isNaN(value)) return RATING_MIN;
  return Math.min(RATING_MAX, Math.max(RATING_MIN, Math.round(value)));
}

/**
 * Everything the score is computed from, named.
 *
 * An object rather than positional arguments because the list grew past the
 * point where `scoreFor('document', 7, true, false)` could be read at the call
 * site, and because the next signal added should not silently shift the
 * meaning of an existing argument.
 */
export type ConfidenceSignals = {
  /** The *settled* source, after the quote check in `applyFieldUpdates`. */
  source: FieldSource | null;
  /** The model's own 1 to 10. Clamped here, so a raw value is fine. */
  rating: number;
  /** The quote was found, character for character, in an attached document. */
  hasVerifiedQuote: boolean;
  /** That quote was also placed back in its surrounding sentences (L3). */
  hasLocatedPassage: boolean;
};

/**
 * A band of scores a value can land in, given where it came from.
 *
 * `floor` is what a rating of 1 scores and `step` is what each further point of
 * rating is worth, so the top of a band is `floor + step * 9`. The numbers are
 * chosen so the bands do not overlap and so every score is a whole number:
 *
 *   inferred   20 25 30 35 40 45 50 55 60 65
 *   document   70 73 76 79 82 85 88 91 94 97
 *   client     100
 *
 * The five point gap between the best guess (65) and the worst verified quote
 * (70) is deliberate. It is the thing the whole module is for: no amount of
 * model self-belief promotes an inference past a value that was checked against
 * a real document.
 *
 * The inferred band is the wider of the two (a step of 5 against 3) because it
 * is the band where the rating carries the most information. A verified quote
 * is already most of the way to being trustworthy whatever the model thinks of
 * it; an inference is only as good as the reading behind it, so the model's
 * view of that reading is nearly all there is to go on.
 */
type Band = { floor: number; step: number };

const DOCUMENT_BAND: Band = { floor: 70, step: 3 };
const INFERRED_BAND: Band = { floor: 20, step: 5 };

/** What the client typed. There is nothing above it and nothing to rate. */
const CLIENT_SCORE = 100;

/**
 * A verified quote that could also be shown in context is worth slightly more
 * than one that could not.
 *
 * Small, and bounded so it can never lift a document value to or past the
 * client's 100. It is here because it is a real difference in what the client
 * can check: a quote alone proves the words exist somewhere in the file, while
 * a located passage lets them see the sentence either side and catch a clause
 * that was quoted accurately out of a paragraph saying the opposite. That is
 * worth a nudge, and only a nudge — it is evidence about the *checkability* of
 * the value, not about the value.
 */
const LOCATED_PASSAGE_BONUS = 2;

function positionIn(band: Band, rating: ConfidenceRating): number {
  return band.floor + band.step * (rating - RATING_MIN);
}

export function scoreFor(signals: ConfidenceSignals): number {
  const rating = clampRating(signals.rating);

  // The client typed it. There is nothing to second-guess, and a model's
  // rating of the client's own sentence is not a thing worth listening to.
  if (signals.source === 'client') return CLIENT_SCORE;

  // Read from a document, and the quote was found in that document.
  if (signals.source === 'document' && signals.hasVerifiedQuote) {
    const base = positionIn(DOCUMENT_BAND, rating);
    return signals.hasLocatedPassage ? base + LOCATED_PASSAGE_BONUS : base;
  }

  // Worked out from the conversation, or a document claim that failed its
  // quote check and was downgraded on the way in.
  return positionIn(INFERRED_BAND, rating);
}

export function levelFor(score: number): ConfidenceLevel {
  if (score >= HIGH_CONFIDENCE_FLOOR) return 'high';
  if (score >= LOW_CONFIDENCE_CEILING) return 'medium';
  return 'low';
}

/**
 * The reading as it was when the value arrived.
 *
 * Read off the field rather than recomputed, which is the whole point: the
 * client editing a value must not turn the model's 35% into a 100%, and
 * agreeing with one must not turn it into anything either. `null` for a field
 * with no value, and for anything stored before the score was pinned.
 */
export function fieldConfidence(field: BriefField): ConfidenceReading | null {
  if (field.value === null) return null;
  const score = field.confidenceScore ?? null;
  if (score === null) return null;
  return { level: levelFor(score), score };
}

/**
 * Whether this value can be accepted without asking. Provenance decides.
 *
 *   client    the client's own words, near-verbatim. Nothing to agree with:
 *             they said it, and asking them to confirm their own sentence is
 *             the busywork this design exists to remove.
 *   document  read out of a file. Always asked about, whatever it scored. A
 *             verified quote proves the words are in the document; it says
 *             nothing about whether they mean what the model took them to
 *             mean, and that difference is the client's to judge.
 *   inferred  the model reworded, tidied or read between the lines. Always
 *             asked about, for the same reason.
 *
 * No score threshold, and specifically no rating threshold. A number the model
 * chose for itself cannot stand in for the client's agreement — and now that
 * the model is asked for a 1 to 10, the temptation to let a 10 through
 * unasked is exactly the door this function keeps shut. The gate has one
 * input, and it is not a number.
 *
 * Note what this is not: the model is still unable to assert that anything is
 * confirmed. Code decides, from the provenance code recorded.
 */
export function isAutoApprovable(source: FieldSource | null): boolean {
  return source === 'client';
}
