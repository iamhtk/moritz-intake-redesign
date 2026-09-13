import { describe, expect, it } from 'vitest';
import {
  applyFieldUpdates,
  confirmField,
  createBrief,
  type FieldUpdate,
} from './brief';
import {
  clampRating,
  fieldConfidence,
  isAutoApprovable,
  levelFor,
  RATING_MAX,
  RATING_MIN,
  RATING_SCALE,
  scoreFor,
} from './confidence';

const DEFS = [{ key: 'otherSide', label: 'Other side', required: true }];

const QUOTE = 'ACME HOLDINGS LTD, a company incorporated in England';

const PASSAGE = {
  before: 'THE PARTIES',
  match: QUOTE,
  after: 'and NORTHWIND LOGISTICS LIMITED.',
};

function briefWith(update: Partial<FieldUpdate>) {
  return applyFieldUpdates(createBrief('contract', DEFS), [
    {
      key: 'otherSide',
      value: 'Acme Holdings Ltd',
      source: 'document',
      confidence: 5,
      sourceNote: 'Parties clause, page 1',
      sourceQuote: QUOTE,
      ...update,
    },
  ]);
}

const readingFor = (update: Partial<FieldUpdate>) =>
  fieldConfidence(briefWith(update).fields[0]!);

/** A verified document quote, with nothing else going on. */
const verified = (rating: number) =>
  scoreFor({
    source: 'document',
    rating,
    hasVerifiedQuote: true,
    hasLocatedPassage: false,
  });

/** Worked out from the conversation. */
const inferred = (rating: number) =>
  scoreFor({
    source: 'inferred',
    rating,
    hasVerifiedQuote: false,
    hasLocatedPassage: false,
  });

describe('the rating positions a value, provenance places the band', () => {
  it('trusts the client above everything, whatever the model rated it', () => {
    for (const rating of RATING_SCALE) {
      expect(
        scoreFor({
          source: 'client',
          rating,
          hasVerifiedQuote: false,
          hasLocatedPassage: false,
        }),
      ).toBe(100);
    }
  });

  it('reads a higher rating as a higher score, inside each band', () => {
    for (const rating of RATING_SCALE.slice(1)) {
      expect(verified(rating)).toBeGreaterThan(verified(rating - 1));
      expect(inferred(rating)).toBeGreaterThan(inferred(rating - 1));
    }
  });

  it('never lets a confident guess outrank an unconfident verified quote', () => {
    // The whole point of banding. A model that rates its own inference 10 out
    // of 10 still lands below a document quote it barely trusts, because the
    // rating moves a value within its band and cannot change which band it is
    // scored in.
    expect(inferred(RATING_MAX)).toBeLessThan(verified(RATING_MIN));
  });

  it('never lets a document quote reach the client, however rated', () => {
    expect(verified(RATING_MAX)).toBeLessThan(100);
    expect(
      scoreFor({
        source: 'document',
        rating: RATING_MAX,
        hasVerifiedQuote: true,
        hasLocatedPassage: true,
      }),
    ).toBeLessThan(100);
  });

  it('treats an unbacked document claim as a guess at the same rating', () => {
    for (const rating of RATING_SCALE) {
      expect(
        scoreFor({
          source: 'document',
          rating,
          hasVerifiedQuote: false,
          hasLocatedPassage: false,
        }),
      ).toBe(inferred(rating));
    }
  });

  it('pays a small bounded premium for a quote it can show in context', () => {
    const located = scoreFor({
      source: 'document',
      rating: 5,
      hasVerifiedQuote: true,
      hasLocatedPassage: true,
    });
    expect(located).toBeGreaterThan(verified(5));
    // A nudge, not a band of its own: it must not lift a mid-rated quote past
    // a well-rated one.
    expect(located).toBeLessThan(verified(RATING_MAX));
  });

  it('gives the passage nothing to add where there is no verified quote', () => {
    expect(
      scoreFor({
        source: 'inferred',
        rating: 5,
        hasVerifiedQuote: false,
        hasLocatedPassage: true,
      }),
    ).toBe(inferred(5));
  });

  it('maps scores to levels at the documented boundaries', () => {
    expect(levelFor(80)).toBe('high');
    expect(levelFor(79)).toBe('medium');
    expect(levelFor(55)).toBe('medium');
    expect(levelFor(54)).toBe('low');
  });

  it('spreads the ten ratings across more than one level in each band', () => {
    // The reason for the whole change: a scale that collapsed to one label
    // would be ten numbers with three meanings between them.
    const levels = (score: (rating: number) => number) =>
      new Set(RATING_SCALE.map((rating) => levelFor(score(rating))));
    expect(levels(verified)).toEqual(new Set(['medium', 'high']));
    expect(levels(inferred)).toEqual(new Set(['low', 'medium']));
  });
});

describe('a rating that is out of range', () => {
  it('is clamped to the scale rather than thrown away', () => {
    expect(clampRating(0)).toBe(RATING_MIN);
    expect(clampRating(-4)).toBe(RATING_MIN);
    expect(clampRating(11)).toBe(RATING_MAX);
    expect(clampRating(1000)).toBe(RATING_MAX);
  });

  it('is rounded to a whole stop', () => {
    expect(clampRating(7.4)).toBe(7);
    expect(clampRating(7.6)).toBe(8);
  });

  it('falls to the floor when it is not a number at all', () => {
    expect(clampRating(Number.NaN)).toBe(RATING_MIN);
    expect(clampRating(Number.POSITIVE_INFINITY)).toBe(RATING_MAX);
  });

  it('scores the same as the stop it was clamped to', () => {
    expect(verified(99)).toBe(verified(RATING_MAX));
    expect(inferred(0)).toBe(inferred(RATING_MIN));
  });

  it('is stored clamped, so the row and its score agree', () => {
    const field = briefWith({ confidence: 42 }).fields[0]!;
    expect(field.confidence).toBe(RATING_MAX);
    expect(field.confidenceScore).toBe(verified(RATING_MAX));
  });
});

describe('what gets accepted without asking', () => {
  it('accepts the client, because they are the author of it', () => {
    expect(isAutoApprovable('client')).toBe(true);
  });

  it('always asks about a document, however well it scored', () => {
    // A verified quote proves the words are in the file. Whether they mean what
    // the model took them to mean is the client's call, not a score's.
    expect(isAutoApprovable('document')).toBe(false);
    expect(briefWith({ confidence: RATING_MAX }).fields[0]!.confirmed).toBe(
      false,
    );
  });

  it('always asks about anything the model reworded', () => {
    expect(isAutoApprovable('inferred')).toBe(false);
  });

  it('does not consult the score or the rating at all', () => {
    // The gate has one input. If a number could reopen it, the model would
    // hold the pen on what reaches a lawyer unread — which is exactly the
    // risk that asking it for a 1 to 10 introduces, and exactly why nothing
    // downstream of the rating is allowed to branch on it.
    expect(isAutoApprovable(null)).toBe(false);
    const sure = briefWith({
      source: 'inferred',
      confidence: RATING_MAX,
      sourceQuote: null,
      sourceNote: null,
    }).fields[0]!;
    expect(sure.confirmed).toBe(false);
  });
});

describe('fieldConfidence', () => {
  it('has nothing to report for an empty field', () => {
    expect(
      fieldConfidence(createBrief('contract', DEFS).fields[0]!),
    ).toBeNull();
  });

  it('reads high for a value the client typed', () => {
    const reading = readingFor({
      source: 'client',
      confidence: 2,
      sourceQuote: null,
    });
    // Even at a rating of 2: the client is the author, so there is nothing for
    // the model to be unsure about.
    expect(reading).toEqual({ level: 'high', score: 100 });
  });

  it('reads high for a verified quote it is sure about', () => {
    expect(readingFor({ confidence: 9 })?.level).toBe('high');
  });

  it('reads medium for a verified quote it had to work at', () => {
    expect(readingFor({ confidence: 2 })?.level).toBe('medium');
  });

  it('reads low for an unsure guess', () => {
    const reading = readingFor({
      source: 'inferred',
      confidence: 3,
      sourceQuote: null,
      sourceNote: null,
    });
    expect(reading?.level).toBe('low');
  });

  it('reads the located passage through to the score', () => {
    const withPassage = readingFor({ confidence: 5, sourcePassage: PASSAGE });
    expect(withPassage?.score).toBeGreaterThan(
      readingFor({ confidence: 5 })!.score,
    );
  });
});

describe('the score is pinned on arrival', () => {
  const shaky = {
    source: 'inferred' as const,
    confidence: 3,
    sourceQuote: null,
    sourceNote: null,
  };

  const SHAKY_SCORE = inferred(3);

  it('does not move when the client agrees with the value', () => {
    const b = briefWith(shaky);
    expect(fieldConfidence(b.fields[0]!)).toEqual({
      level: 'low',
      score: SHAKY_SCORE,
    });

    const agreed = confirmField(b, 'otherSide');
    // Accepting is not the model becoming more confident about anything.
    expect(fieldConfidence(agreed.fields[0]!)).toEqual({
      level: 'low',
      score: SHAKY_SCORE,
    });
    // And the rating it arrived with is left alone for the same reason: a 10
    // written here would be a number the model never said, on the one row
    // where its reading has just been overruled.
    expect(agreed.fields[0]!.confidence).toBe(3);
  });

  it('does not move when the client overrules the value', () => {
    const edited = confirmField(briefWith(shaky), 'otherSide', 'Acme Corp');
    const f = edited.fields[0]!;

    // The source is now the client, which under a derived reading would have
    // recomputed this row to a 100% the model never earned.
    expect(f.source).toBe('client');
    expect(f.confidence).toBe(3);
    expect(fieldConfidence(f)).toEqual({ level: 'low', score: SHAKY_SCORE });
  });

  it('is recomputed only when a new value arrives', () => {
    const refilled = applyFieldUpdates(briefWith(shaky), [
      {
        key: 'otherSide',
        value: 'Acme Holdings Ltd',
        source: 'document',
        confidence: 9,
        sourceNote: 'Parties clause, page 1',
        sourceQuote: QUOTE,
      },
    ]);
    expect(fieldConfidence(refilled.fields[0]!)).toEqual({
      level: 'high',
      score: verified(9),
    });
  });

  it('has nothing to report for a field stored before the score was pinned', () => {
    const legacy = { ...briefWith(shaky).fields[0]!, confidenceScore: null };
    expect(fieldConfidence(legacy)).toBeNull();
  });
});
