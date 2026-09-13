import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  applyFieldUpdates,
  confirmField,
  createBrief,
  type FieldUpdate,
} from './brief';
import { HIGH_CONFIDENCE_FLOOR } from './confidence';

/**
 * A second document may improve a row. It may not quietly make it worse.
 *
 * `applyFieldUpdates` was last-write-wins for anything unconfirmed, which is
 * right for the common case and wrong for the one that bites. Every upload is
 * read for *every* field, so a row already carrying a verified quote could be
 * offered a vague inference from the new file — and the vague one won, silently,
 * taking the source link with it. Uploading more evidence made the brief worse.
 *
 * The rule now compares the same `confidenceScore` the client is shown.
 */

const DEFS = [
  { key: 'situation', label: 'What you need', required: true },
  { key: 'otherSide', label: 'Other side', required: true },
];

const brief = () => createBrief('contract', DEFS);

/** A verified document read: quote present, so it scores in the document band. */
const strong = (value: string): FieldUpdate => ({
  key: 'otherSide',
  value,
  source: 'document',
  confidence: 9,
  sourceNote: 'parties clause, page 1',
  sourceQuote: 'between Northwind Ltd. and Acme Holdings Ltd.',
});

/** An inference. No quote, so it scores in the inferred band whatever its rating. */
const weak = (value: string, rating = 4): FieldUpdate => ({
  key: 'otherSide',
  value,
  source: 'inferred',
  confidence: rating,
  reasoning: 'mentioned in passing',
});

const otherSide = (b: ReturnType<typeof brief>) =>
  b.fields.find((field) => field.key === 'otherSide')!;

describe('a better read amends the row', () => {
  /* ⭐ The case the feature is for: more evidence, better value. */
  it('replaces a weak inference with a verified quote', () => {
    let b = applyFieldUpdates(brief(), [weak('Acme')]);
    const before = otherSide(b);
    expect(before.source).toBe('inferred');
    expect(before.sourceQuote).toBeNull();

    b = applyFieldUpdates(b, [strong('Acme Holdings Ltd.')]);
    const after = otherSide(b);

    expect(after.value).toBe('Acme Holdings Ltd.');
    expect(after.source).toBe('document');
    expect(after.sourceQuote).not.toBeNull();
    expect(after.confidenceScore!).toBeGreaterThan(before.confidenceScore!);
    expect(after.confidenceScore!).toBeGreaterThanOrEqual(
      HIGH_CONFIDENCE_FLOOR,
    );
  });

  it('accepts a better-rated read from the same kind of source', () => {
    let b = applyFieldUpdates(brief(), [weak('Acme', 2)]);
    const before = otherSide(b).confidenceScore!;
    b = applyFieldUpdates(b, [weak('Acme Holdings', 8)]);
    expect(otherSide(b).confidenceScore!).toBeGreaterThan(before);
    expect(otherSide(b).value).toBe('Acme Holdings');
  });

  /*
   * Ties apply. A re-read of the same clause is not a regression, and refusing
   * equal scores would freeze a row against a correction from an equally good
   * source.
   */
  it('applies an equally good read', () => {
    let b = applyFieldUpdates(brief(), [strong('Acme Holdings Ltd.')]);
    b = applyFieldUpdates(b, [strong('Acme Holdings Limited')]);
    expect(otherSide(b).value).toBe('Acme Holdings Limited');
  });
});

describe('a worse read leaves the row alone', () => {
  /* ⭐ The regression. This is what last-write-wins did. */
  it('keeps a verified quote when a vague inference arrives', () => {
    let b = applyFieldUpdates(brief(), [strong('Acme Holdings Ltd.')]);
    const before = otherSide(b);

    b = applyFieldUpdates(b, [weak('someone at Acme')]);
    const after = otherSide(b);

    expect(after.value).toBe('Acme Holdings Ltd.');
    expect(after.source).toBe('document');
    // The source link survives, which is the part the client loses otherwise.
    expect(after.sourceQuote).toBe(before.sourceQuote);
    expect(after.confidenceScore).toBe(before.confidenceScore);
  });

  it('keeps the better of two inferences', () => {
    let b = applyFieldUpdates(brief(), [weak('Acme Holdings', 9)]);
    const before = otherSide(b).confidenceScore!;
    b = applyFieldUpdates(b, [weak('Acme-ish', 1)]);

    expect(otherSide(b).value).toBe('Acme Holdings');
    expect(otherSide(b).confidenceScore).toBe(before);
  });
});

describe('what the rule does not apply to', () => {
  /*
   * The client's own words outrank every reading of a document — that is what
   * `CLIENT_SCORE` means — and a client correcting a row is not competing with
   * the model for accuracy.
   */
  it('lets the client overwrite a verified quote with their own words', () => {
    let b = applyFieldUpdates(brief(), [strong('Acme Holdings Ltd.')]);
    b = applyFieldUpdates(b, [
      {
        key: 'otherSide',
        value: 'Acme Technologies, not Holdings',
        source: 'client',
        confidence: 5,
      },
    ]);

    const field = otherSide(b);
    expect(field.value).toBe('Acme Technologies, not Holdings');
    expect(field.source).toBe('client');
  });

  /* An empty row takes whatever it is given, however thin. */
  it('fills an empty row with even the weakest read', () => {
    const b = applyFieldUpdates(brief(), [weak('Acme', 1)]);
    expect(otherSide(b).value).toBe('Acme');
  });

  /* Confirmed rows were already untouchable, and still are. */
  it('does not reopen a row the client has agreed with', () => {
    let b = applyFieldUpdates(brief(), [weak('Acme', 1)]);
    b = confirmField(b, 'otherSide');
    b = applyFieldUpdates(b, [strong('Acme Holdings Ltd.')]);

    expect(otherSide(b).value).toBe('Acme');
    expect(otherSide(b).confirmedByClient).toBe(true);
  });
});

describe('the extraction prompt', () => {
  const source = readFileSync(
    join(process.cwd(), 'app/api/extract/route.ts'),
    'utf8',
  );

  /*
   * ⭐ The prompt used to say "Leave out anything you would be guessing at",
   * which reads as "withhold unless confident" and is why thin-but-real reads
   * never reached the brief. The line to hold is between thin evidence and no
   * evidence, not between confident and unsure.
   */
  it('asks for the thin reads too, rated honestly', () => {
    expect(source).toContain(
      'FILL IN EVERYTHING THE DOCUMENTS TOUCH, INCLUDING THE THIN ONES',
    );
    expect(source).toContain('Rate it a 2 and move on');
    expect(source).toContain(
      'Leave a field out only when the documents do not touch it at all',
    );
  });

  it('no longer tells the model to withhold what it is unsure of', () => {
    expect(source).not.toContain(
      'Leave out\nanything you would be guessing at',
    );
  });

  /*
   * And says why filling the thin ones is safe: the quote check, not the
   * model's restraint, is what keeps a guess out.
   */
  it('names the quote check as the guard', () => {
    expect(source).toContain('The quote check is the guard here');
  });
});
