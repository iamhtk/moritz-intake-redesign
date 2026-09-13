import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { extractText, getDocumentProxy } from 'unpdf';
import {
  applyFieldUpdates,
  canSubmit,
  confirmAll,
  confirmField,
  createBrief,
  documentDisagreements,
  fieldState,
  progress,
  unconfirmedFields,
} from './brief';
import { demoSeed, DEMO_CONFIRMED_KEY, DEMO_FIELD_UPDATES } from './demo-brief';
import { fieldsForMatter } from './matter-fields';
import { locateQuote, verifySourceQuote } from './verify-source';

describe('the ?demo=1 seed', () => {
  const seeded = confirmField(
    applyFieldUpdates(
      createBrief('contract', fieldsForMatter('contract')),
      DEMO_FIELD_UPDATES,
    ),
    DEMO_CONFIRMED_KEY,
  );

  const stateOf = (key: string) => {
    const field = seeded.fields.find((f) => f.key === key);
    if (!field) throw new Error(`no field ${key}`);
    return fieldState(field);
  };

  it('shows the range: in, read from a document, worked out, not yet asked', () => {
    // Said by the client, so it went in on arrival.
    expect(stateOf('matter-type')).toBe('confirmed');
    // Read from the document with a quote that checked out, so it can show its
    // source — and, being a document, it still asks to be agreed with.
    expect(stateOf('situation')).toBe('from-document');
    // Worked out from the conversation, so it asks too.
    expect(stateOf('otherSide')).toBe('unsure');
    expect(stateOf('urgency')).toBe('missing');
  });

  it('keeps the document field showing its source and quote', () => {
    const field = seeded.fields.find((f) => f.key === 'situation');
    /*
     * The file name leads the note, the way `/api/extract` writes one: the
     * viewer opens a document by finding its name inside the note, so a demo
     * seed without it would show a source the client cannot follow.
     */
    expect(field?.sourceNote).toBe(
      'northwind-acme-msa.pdf, Services clause 1.1, page 1',
    );
    expect(field?.sourceQuote).toContain('warehousing, pick-and-pack');
  });

  it("leaves the model's own account of the matter to be checked", () => {
    /*
     * Three of the five rows are filled, and only the one the client said
     * themselves is confirmed. The bar sits at 20% — one row of five — with the
     * document extraction and the inference both waiting on them.
     *
     * `total` is every row now, including the optional one the seed leaves
     * empty, so a step is always worth the same 20%.
     */
    expect(progress(seeded)).toEqual({
      confirmed: 1,
      filled: 3,
      total: 5,
      percent: 20,
    });
    expect(unconfirmedFields(seeded).map((field) => field.key)).toEqual([
      'situation',
      'otherSide',
    ]);
  });
});

/**
 * The two phases Wave 5 built on are several minutes and four live model calls
 * from the opening screen, so they get their own seeds. These assert the seed
 * produces the state each phase is *about*, because a demo that lands on review
 * with a blocked send gate, or on sent with no disagreement to show, would
 * demonstrate the opposite of what was built.
 */
describe('demoSeed', () => {
  const complete = (param: 'review' | 'sent') => {
    const seed = demoSeed(param)!;
    let current = applyFieldUpdates(
      createBrief('contract', fieldsForMatter('contract')),
      seed.updates,
    );
    for (const key of seed.confirmKeys) current = confirmField(current, key);
    for (const one of seed.corrections) {
      current = confirmField(current, one.key, one.value);
    }
    if (seed.confirmAll) current = confirmAll(current);
    return { seed, brief: current };
  };

  it('seeds nothing without the parameter', () => {
    expect(demoSeed(null)).toBeNull();
  });

  it('keeps ?demo=1 on the opening behaviour', () => {
    const seed = demoSeed('1')!;
    expect(seed.stage).toBe('intake');
    expect(seed.updates).toBe(DEMO_FIELD_UPDATES);
    expect(seed.confirmKeys).toEqual([DEMO_CONFIRMED_KEY]);
    expect(seed.confirmAll).toBe(false);
  });

  // An old link or a typo has to land somewhere useful rather than on nothing.
  it('falls back to the four field states for anything unrecognised', () => {
    expect(demoSeed('')?.stage).toBe('intake');
    expect(demoSeed('yes')?.stage).toBe('intake');
  });

  it.each(['review', 'sent'] as const)(
    'lands ?demo=%s on that phase with a sendable brief',
    (param) => {
      const { seed, brief } = complete(param);
      expect(seed.stage).toBe(param);
      expect(canSubmit(brief)).toBe(true);
      expect(unconfirmedFields(brief)).toEqual([]);
    },
  );

  it('fills every field, including the optional one', () => {
    const { brief } = complete('sent');
    expect(brief.fields.every((field) => field.value !== null)).toBe(true);
    expect(progress(brief).confirmed).toBe(progress(brief).total);
  });

  it('names the case, so the confirmation is not on its fallback', () => {
    const seed = demoSeed('sent')!;
    expect(seed.recap?.title).toContain('Acme');
    expect(seed.recap?.description).not.toBe('');
  });

  /*
   * The correction is the point of seeding one. It is the two-party confusion
   * recorded against T13a, and confirming over the document value is what
   * leaves a superseded value behind for the "Worth knowing" block to report.
   */
  it('leaves a document disagreement for the confirmation to report', () => {
    const { brief } = complete('sent');
    const disagreements = documentDisagreements(brief);
    expect(disagreements).toHaveLength(1);
    expect(disagreements[0]?.documentValue).toContain('Northwind');

    const otherSide = brief.fields.find((field) => field.key === 'otherSide');
    expect(otherSide?.value).toContain('Acme');
    expect(otherSide?.source).toBe('client');
  });
});

/**
 * L3: the demo's seeded passage is the real document, not a likeness of it.
 *
 * The demo never uploads a file, so the passage under its one document value
 * has to be written into `demo-brief.ts` by hand. That makes it the single
 * place in the whole flow where a "source" could be invented — on the feature
 * whose entire claim is that sources are not. This re-runs `locateQuote`
 * against `public/demo/northwind-acme-msa.pdf` and fails if the seed has
 * drifted from what the real contract actually says.
 *
 * It will also fail if the extraction or the boundary rule changes what the
 * passage looks like, which is the right outcome: a demo showing the old shape
 * of a feature is a demo showing something that no longer happens.
 */
describe('the demo source passage', () => {
  it('matches what the real contract produces', async () => {
    const bytes = new Uint8Array(
      readFileSync('public/demo/northwind-acme-msa.pdf'),
    );
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });

    const seeded = DEMO_FIELD_UPDATES.find(
      (update) => update.sourcePassage != null,
    );
    expect(seeded, 'no demo field carries a passage any more').toBeDefined();

    const real = locateQuote(seeded!.sourceQuote!, text);
    expect(real).toEqual(seeded!.sourcePassage);
  });

  /*
   * The quote has to be in the document too. Asserted separately so a failure
   * says which of the two drifted: the quote the row shows, or the passage
   * behind it.
   */
  it('quotes the real contract', async () => {
    const bytes = new Uint8Array(
      readFileSync('public/demo/northwind-acme-msa.pdf'),
    );
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    const seeded = DEMO_FIELD_UPDATES.find(
      (update) => update.sourcePassage != null,
    );
    expect(verifySourceQuote(seeded!.sourceQuote!, text)).toBe(true);
  });
});
