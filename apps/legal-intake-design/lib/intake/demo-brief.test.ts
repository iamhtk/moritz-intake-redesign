import { describe, expect, it } from 'vitest';
import {
  applyFieldUpdates,
  confirmField,
  createBrief,
  fieldState,
  progress,
} from './brief';
import { DEMO_CONFIRMED_KEY, DEMO_FIELD_UPDATES } from './demo-brief';
import { fieldsForMatter } from './matter-fields';

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

  it('shows the range: accepted, needs a look, and not yet asked', () => {
    // Typed by the client, and confirmed on arrival.
    expect(stateOf('matter-type')).toBe('confirmed');
    // Read from the document with a quote that checked out, so accepted.
    expect(stateOf('situation')).toBe('confirmed');
    // Worked out and unsure: the one field that asks for a human eye.
    expect(stateOf('otherSide')).toBe('unsure');
    expect(stateOf('urgency')).toBe('missing');
  });

  it('keeps the document field showing its source and quote', () => {
    const field = seeded.fields.find((f) => f.key === 'situation');
    expect(field?.sourceNote).toBe('Services clause 1.1, page 1');
    expect(field?.sourceQuote).toContain('warehousing, pick-and-pack');
  });

  it('leaves exactly one thing for the client to deal with', () => {
    // Three of four required fields are filled; two were good enough to accept
    // on arrival. The bar sits at 2/4 and one field is asking to be looked at.
    expect(progress(seeded)).toEqual({ confirmed: 2, filled: 3, total: 4 });
  });
});
