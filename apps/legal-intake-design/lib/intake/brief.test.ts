import { describe, expect, it } from 'vitest';
import {
  applyFieldUpdates,
  canSubmit,
  confirmAll,
  confirmField,
  createBrief,
  fieldState,
  isComplete,
  missingRequiredKeys,
  documentDisagreements,
  progress,
  unconfirmedFields,
  type Brief,
  type FieldUpdate,
} from './brief';

const DEFS = [
  { key: 'situation', label: 'What you need', required: true },
  { key: 'otherSide', label: 'Other side', required: true },
  { key: 'outcome', label: 'Desired outcome', required: false },
];

function brief(): Brief {
  return createBrief('contract', DEFS);
}

function update(over: Partial<FieldUpdate> = {}): FieldUpdate {
  return {
    key: 'otherSide',
    value: 'Acme Holdings Ltd',
    source: 'document',
    confidence: 'unsure',
    sourceNote: 'Parties clause, page 1',
    sourceQuote: 'ACME HOLDINGS LTD, a company incorporated in England',
    ...over,
  };
}

/** Inferred and unsure: low confidence, so it is NOT accepted on arrival. */
function shakyUpdate(over: Partial<FieldUpdate> = {}): FieldUpdate {
  return update({
    source: 'inferred',
    confidence: 'unsure',
    sourceNote: null,
    sourceQuote: null,
    ...over,
  });
}

function field(b: Brief, key: string) {
  const found = b.fields.find((f) => f.key === key);
  if (!found) throw new Error(`no field ${key}`);
  return found;
}

describe('createBrief', () => {
  it('starts every field empty, unconfirmed and unsure', () => {
    const b = brief();
    expect(b.fields).toHaveLength(3);
    for (const f of b.fields) {
      expect(f.value).toBeNull();
      expect(f.source).toBeNull();
      expect(f.confirmed).toBe(false);
      expect(f.confidence).toBe('unsure');
    }
    expect(b.title).toBeNull();
  });
});

describe('invariant 1, the model can never set confirmed', () => {
  it('ignores a confirmed flag smuggled into a shaky update', () => {
    const b = applyFieldUpdates(brief(), [
      { ...shakyUpdate(), confirmed: true } as unknown,
    ]);
    expect(field(b, 'otherSide').value).toBe('Acme Holdings Ltd');
    // Acceptance is computed from the signals, never read off the payload.
    expect(field(b, 'otherSide').confirmed).toBe(false);
  });

  it('still stops on a value it worked out and was unsure about', () => {
    const b = applyFieldUpdates(brief(), [
      update({ key: 'situation', value: 'Review a logistics MSA' }),
      shakyUpdate(),
    ]);
    expect(isComplete(b)).toBe(true);
    // The document-backed field went through; the guess did not.
    expect(field(b, 'situation').confirmed).toBe(true);
    expect(field(b, 'otherSide').confirmed).toBe(false);
    expect(canSubmit(b)).toBe(false);
  });
});

describe('invariant 2, a confirmed field is never overwritten', () => {
  it('drops a model update aimed at a confirmed field', () => {
    let b = applyFieldUpdates(brief(), [update()]);
    b = confirmField(b, 'otherSide', 'Acme Holdings (UK) Ltd');
    b = applyFieldUpdates(b, [update({ value: 'Acme Corp' })]);

    expect(field(b, 'otherSide').value).toBe('Acme Holdings (UK) Ltd');
    expect(field(b, 'otherSide').source).toBe('client');
    expect(field(b, 'otherSide').confirmed).toBe(true);
  });

  it('still applies updates to other fields in the same response', () => {
    let b = confirmField(applyFieldUpdates(brief(), [update()]), 'otherSide');
    b = applyFieldUpdates(b, [
      update({ value: 'Acme Corp' }),
      update({
        key: 'situation',
        value: 'Review a logistics MSA',
        source: 'client',
        sourceQuote: null,
        sourceNote: null,
      }),
    ]);

    expect(field(b, 'otherSide').value).toBe('Acme Holdings Ltd');
    expect(field(b, 'situation').value).toBe('Review a logistics MSA');
  });
});

describe('invariant 3, updates are validated before they touch the brief', () => {
  it('drops unknown keys, empty values and bad enums', () => {
    const b = applyFieldUpdates(brief(), [
      update({ key: 'lawyerFee' }),
      update({ key: 'situation', value: ' ' }),
      update({ source: 'guessed' as never }),
      update({ confidence: 'very sure' as never }),
      null,
      'nonsense',
      { key: 'otherSide' },
    ]);

    expect(b.fields.every((f) => f.value === null)).toBe(true);
    expect(b).toEqual(brief());
  });

  it('accepts a well-formed update', () => {
    const b = applyFieldUpdates(brief(), [update()]);
    expect(field(b, 'otherSide').value).toBe('Acme Holdings Ltd');
    expect(field(b, 'otherSide').source).toBe('document');
  });
});

describe('invariant 4, the confirm gate', () => {
  it('accepts what it can and asks only about the rest', () => {
    let b = applyFieldUpdates(brief(), [
      update({ key: 'situation', value: 'Review a logistics MSA' }),
      shakyUpdate(),
    ]);
    expect(isComplete(b)).toBe(true);
    expect(canSubmit(b)).toBe(false);

    // One field to deal with, not four.
    expect(unconfirmedFields(b).map((f) => f.key)).toEqual(['otherSide']);

    b = confirmField(b, 'otherSide');
    expect(canSubmit(b)).toBe(true);
  });

  it('opens straight away when nothing was shaky', () => {
    const b = applyFieldUpdates(brief(), [
      update({ key: 'situation', value: 'Review a logistics MSA' }),
      update(),
    ]);
    expect(canSubmit(b)).toBe(true);
    expect(unconfirmedFields(b)).toEqual([]);
  });

  it('does not require optional fields', () => {
    let b = applyFieldUpdates(brief(), [
      update({ key: 'situation', value: 'Review a logistics MSA' }),
      update(),
    ]);
    b = confirmAll(b);
    expect(field(b, 'outcome').value).toBeNull();
    expect(canSubmit(b)).toBe(true);
  });

  it('cannot be opened by confirming an empty field', () => {
    const b = confirmField(brief(), 'situation');
    expect(field(b, 'situation').confirmed).toBe(false);
    expect(canSubmit(b)).toBe(false);
  });
});

describe('invariant 5, an unbacked document source is not a document source', () => {
  it('downgrades a document field that arrives without a quote', () => {
    const b = applyFieldUpdates(brief(), [
      update({ sourceQuote: null, sourceNote: 'Parties clause, page 1' }),
    ]);
    const f = field(b, 'otherSide');

    expect(f.value).toBe('Acme Holdings Ltd');
    expect(f.source).toBe('inferred');
    expect(f.sourceNote).toBeNull();
    expect(f.sourceQuote).toBeNull();
    expect(fieldState(f)).toBe('unsure');
  });

  it('keeps the source when the quote survived verification', () => {
    const b = applyFieldUpdates(brief(), [update()]);
    const f = field(b, 'otherSide');
    expect(f.source).toBe('document');
    expect(f.sourceNote).toBe('Parties clause, page 1');
    // Backed by a checked quote, so it is good enough to accept.
    expect(f.confirmed).toBe(true);
  });
});

describe('confirmField', () => {
  it('an edit takes ownership and clears the old provenance', () => {
    let b = applyFieldUpdates(brief(), [update()]);
    b = confirmField(b, 'otherSide', 'Acme Holdings (UK) Ltd');
    const f = field(b, 'otherSide');

    expect(f.source).toBe('client');
    expect(f.sourceNote).toBeNull();
    expect(f.sourceQuote).toBeNull();
    expect(f.confidence).toBe('sure');
  });

  it('a "looks right" tap keeps the provenance it agreed with', () => {
    let b = applyFieldUpdates(brief(), [update()]);
    b = confirmField(b, 'otherSide');
    const f = field(b, 'otherSide');

    expect(f.source).toBe('document');
    expect(f.sourceNote).toBe('Parties clause, page 1');
    expect(f.confirmed).toBe(true);
  });
});

describe('fieldState', () => {
  it('covers the four display states', () => {
    let b = brief();
    expect(fieldState(field(b, 'situation'))).toBe('missing');

    b = applyFieldUpdates(b, [
      shakyUpdate({ key: 'situation', value: 'Review a logistics MSA' }),
      update(),
    ]);
    // Too shaky to accept, so it still reads as unsure and asks to be seen.
    expect(fieldState(field(b, 'situation'))).toBe('unsure');
    // Accepted on arrival, so it reads as confirmed while keeping its source.
    expect(fieldState(field(b, 'otherSide'))).toBe('confirmed');
    expect(field(b, 'otherSide').sourceQuote).not.toBeNull();

    b = confirmField(b, 'situation');
    expect(fieldState(field(b, 'situation'))).toBe('confirmed');
  });
});

describe('progress', () => {
  it('counts confirmed required fields, not turns or values', () => {
    let b = brief();
    expect(progress(b)).toEqual({ confirmed: 0, filled: 0, total: 2 });

    b = applyFieldUpdates(b, [
      update({ key: 'situation', value: 'Review a logistics MSA' }),
      shakyUpdate(),
    ]);
    // The document-backed one counts immediately; the guess does not.
    expect(progress(b)).toEqual({ confirmed: 1, filled: 2, total: 2 });

    b = confirmField(b, 'otherSide');
    expect(progress(b)).toEqual({ confirmed: 2, filled: 2, total: 2 });
  });

  it('leaves an empty optional field out of the count', () => {
    // Otherwise the bar could never reach full on a case that is ready to send.
    expect(progress(brief())).toEqual({ confirmed: 0, filled: 0, total: 2 });
  });

  it('counts an optional field once it has something in it', () => {
    // The panel shows the row, so the total has to agree with what is on
    // screen. A filled optional field is real content.
    const b = applyFieldUpdates(brief(), [
      update({ key: 'outcome', value: 'A clean exit' }),
    ]);
    expect(progress(b)).toEqual({ confirmed: 1, filled: 1, total: 3 });
  });
});

describe('review helpers', () => {
  it('lists what the review step must walk through', () => {
    const b = applyFieldUpdates(brief(), [
      shakyUpdate({ key: 'situation', value: 'Review a logistics MSA' }),
      update(),
    ]);
    // Only the shaky one. This is the difference between one tap and six.
    expect(unconfirmedFields(b).map((f) => f.key)).toEqual(['situation']);
    expect(missingRequiredKeys(b)).toEqual([]);
  });

  it('tells the model what is still missing', () => {
    expect(missingRequiredKeys(brief())).toEqual(['situation', 'otherSide']);
  });
});

describe('remembering what the document said', () => {
  it('records the disagreement when a client corrects a document value', () => {
    let b = applyFieldUpdates(brief(), [update()]);
    b = confirmField(b, 'otherSide', 'Acme Holdings (UK) Ltd');
    const f = field(b, 'otherSide');

    // The brief no longer claims the document as the source...
    expect(f.source).toBe('client');
    expect(f.sourceNote).toBeNull();
    // ...but it has not forgotten what the document actually said.
    expect(f.supersededValue).toBe('Acme Holdings Ltd');
    expect(f.supersededSource).toBe('document');
    expect(f.supersededNote).toBe('Parties clause, page 1');
  });

  it('reports the disagreement for the lawyer-facing output', () => {
    let b = applyFieldUpdates(brief(), [update()]);
    b = confirmField(b, 'otherSide', 'Acme Holdings (UK) Ltd');

    expect(documentDisagreements(b)).toEqual([
      {
        label: 'Other side',
        clientValue: 'Acme Holdings (UK) Ltd',
        documentValue: 'Acme Holdings Ltd',
        where: 'Parties clause, page 1',
      },
    ]);
  });

  it('does not treat a second thought as a disagreement with the document', () => {
    let b = applyFieldUpdates(brief(), [update()]);
    b = confirmField(b, 'otherSide', 'Acme Holdings (UK) Ltd');
    b = confirmField(b, 'otherSide', 'Acme Holdings UK Limited');

    // Still the document's value, not the client's first attempt.
    expect(field(b, 'otherSide').supersededValue).toBe('Acme Holdings Ltd');
    expect(documentDisagreements(b)).toHaveLength(1);
  });

  it('records nothing when the client simply agrees', () => {
    let b = applyFieldUpdates(brief(), [update()]);
    b = confirmField(b, 'otherSide');

    expect(field(b, 'otherSide').supersededValue).toBeNull();
    expect(documentDisagreements(b)).toEqual([]);
  });

  it('records nothing when the client fills an empty field', () => {
    const b = confirmField(brief(), 'otherSide', 'Acme Holdings Ltd');
    expect(field(b, 'otherSide').supersededValue).toBeNull();
  });
});

describe('immutability', () => {
  it('never mutates the brief it was given', () => {
    const original = brief();
    const snapshot = JSON.stringify(original);

    applyFieldUpdates(original, [update()]);
    confirmField(original, 'otherSide', 'Acme');
    confirmAll(original);

    expect(JSON.stringify(original)).toBe(snapshot);
  });
});
