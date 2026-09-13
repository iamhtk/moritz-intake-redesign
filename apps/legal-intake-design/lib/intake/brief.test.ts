import { describe, expect, it } from 'vitest';
import { MATTER_IDS } from '@/components/design/new-case/intake-types';
import { fieldsForMatter } from './matter-fields';
import {
  applyFieldUpdates,
  blockingFields,
  canSubmit,
  sendThresholdPercent,
  confirmAll,
  confirmField,
  createBrief,
  fieldState,
  isComplete,
  missingRequiredKeys,
  newlyFilledRequired,
  requiredCount,
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
    confidence: 5,
    sourceNote: 'Parties clause, page 1',
    sourceQuote: 'ACME HOLDINGS LTD, a company incorporated in England',
    ...over,
  };
}

/** Worked out by the model rather than said by the client. Always asked about. */
function shakyUpdate(over: Partial<FieldUpdate> = {}): FieldUpdate {
  return update({
    source: 'inferred',
    confidence: 5,
    sourceNote: null,
    sourceQuote: null,
    ...over,
  });
}

/** The one thing that goes in without being asked about: the client's words. */
function clientUpdate(over: Partial<FieldUpdate> = {}): FieldUpdate {
  return update({
    source: 'client',
    confidence: 10,
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
  it('starts every field empty, unconfirmed and unrated', () => {
    const b = brief();
    expect(b.fields).toHaveLength(3);
    for (const f of b.fields) {
      expect(f.value).toBeNull();
      expect(f.source).toBeNull();
      expect(f.confirmed).toBe(false);
      // Not a placeholder rating: there is no value here for the model to
      // have rated, and a number would be one it never gave.
      expect(f.confidence).toBeNull();
      expect(f.confidenceScore).toBeNull();
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

  it('stops on everything it was not simply told', () => {
    const b = applyFieldUpdates(brief(), [
      update({ key: 'situation', value: 'Review a logistics MSA' }),
      shakyUpdate(),
    ]);
    expect(isComplete(b)).toBe(true);
    // Read from a document, and worked out from the conversation. Both are the
    // model's account of the matter, so both are shown to the client first.
    expect(field(b, 'situation').confirmed).toBe(false);
    expect(field(b, 'otherSide').confirmed).toBe(false);
    expect(canSubmit(b)).toBe(false);
  });
});

describe('provenance decides what needs checking', () => {
  it("lets the client's own words straight in", () => {
    const b = applyFieldUpdates(brief(), [clientUpdate()]);
    expect(field(b, 'otherSide').confirmed).toBe(true);
  });

  it('always asks about a document, however well the quote checked out', () => {
    const b = applyFieldUpdates(brief(), [update({ confidence: 10 })]);
    const f = field(b, 'otherSide');

    // Verified, rated as high as the scale goes, and still not in: see
    // `isAutoApprovable`.
    expect(f.sourceQuote).not.toBeNull();
    expect(f.confidenceScore).toBe(97);
    expect(f.confirmed).toBe(false);
  });

  it('always asks about a rewording, even a confident one', () => {
    const b = applyFieldUpdates(brief(), [shakyUpdate({ confidence: 10 })]);
    const f = field(b, 'otherSide');

    // The top of the inferred band, which still sits below the bottom of the
    // document band. The client said something and the model changed it, and
    // no self-rating gets that past them.
    expect(f.confidenceScore).toBe(65);
    expect(f.confirmed).toBe(false);
  });
});

describe('the pinned score', () => {
  it('is set once, from the provenance and the rating it arrived with', () => {
    const b = applyFieldUpdates(brief(), [shakyUpdate()]);
    expect(field(b, 'otherSide').confidenceScore).toBe(40);
  });

  it('survives the client agreeing with the value', () => {
    let b = applyFieldUpdates(brief(), [shakyUpdate()]);
    b = confirmField(b, 'otherSide');
    expect(field(b, 'otherSide').confidenceScore).toBe(40);
  });

  it('survives the client overruling the value', () => {
    let b = applyFieldUpdates(brief(), [shakyUpdate()]);
    b = confirmField(b, 'otherSide', 'Acme Corp');
    const f = field(b, 'otherSide');

    // An edit is a human override, not a 100% reading.
    expect(f.source).toBe('client');
    expect(f.confirmed).toBe(true);
    expect(f.confidenceScore).toBe(40);
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
      update({ confidence: null as never }),
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
  it('asks about everything the client did not say themselves', () => {
    let b = applyFieldUpdates(brief(), [
      update({ key: 'situation', value: 'Review a logistics MSA' }),
      shakyUpdate(),
    ]);
    expect(isComplete(b)).toBe(true);
    expect(canSubmit(b)).toBe(false);

    expect(unconfirmedFields(b).map((f) => f.key)).toEqual([
      'situation',
      'otherSide',
    ]);

    b = confirmField(b, 'situation');
    expect(canSubmit(b)).toBe(false);
    b = confirmField(b, 'otherSide');
    expect(canSubmit(b)).toBe(true);
  });

  it('opens straight away when the client said all of it', () => {
    const b = applyFieldUpdates(brief(), [
      clientUpdate({ key: 'situation', value: 'Review a logistics MSA' }),
      clientUpdate(),
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
    expect(field(b, 'situation').confirmed).toBe(true);
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
    // Verification decides whether a source can be shown, never whether the
    // client has to confirm it. It still needs a tap.
    expect(f.confirmed).toBe(false);
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
    // The rating is left exactly as it arrived. Overwriting it here would put
    // a number on the row that the model never said, on the one row where the
    // client has just disagreed with it.
    expect(f.confidence).toBe(5);
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
    // Worked out by the model, so it reads as unsure and asks to be seen.
    expect(fieldState(field(b, 'situation'))).toBe('unsure');
    // Backed by a quote that checked out, so it can say where it came from —
    // and, being a document, it is still waiting to be agreed with.
    expect(fieldState(field(b, 'otherSide'))).toBe('from-document');
    expect(field(b, 'otherSide').sourceQuote).not.toBeNull();

    b = confirmField(b, 'situation');
    expect(fieldState(field(b, 'situation'))).toBe('confirmed');
  });
});

describe('progress', () => {
  /*
   * The denominator is every row, always. It used to exclude an empty optional
   * field, which made the total move underneath the client — "1 of 2" became
   * "1 of 3" the moment they answered the optional row, which reads as going
   * backwards — and made each step worth a different share depending on what
   * happened to be on screen.
   */
  it('counts every row, so one step is always worth the same', () => {
    let b = brief();
    expect(progress(b)).toMatchObject({ confirmed: 0, filled: 0, total: 3 });

    b = applyFieldUpdates(b, [
      clientUpdate({ key: 'situation', value: 'Review a logistics MSA' }),
      shakyUpdate(),
    ]);
    // What the client said counts immediately; what the model worked out waits
    // for them to agree with it.
    expect(progress(b)).toMatchObject({ confirmed: 1, filled: 2, total: 3 });

    b = confirmField(b, 'otherSide');
    expect(progress(b)).toMatchObject({ confirmed: 2, filled: 2, total: 3 });
  });

  it('keeps the total fixed when an optional field is filled', () => {
    const empty = progress(brief());
    const filled = progress(
      applyFieldUpdates(brief(), [
        clientUpdate({ key: 'outcome', value: 'A clean exit' }),
      ]),
    );
    expect(filled.total).toBe(empty.total);
    expect(filled.confirmed).toBe(1);
  });

  it('reports a whole-number percentage', () => {
    expect(progress(brief()).percent).toBe(0);

    const b = applyFieldUpdates(brief(), [
      clientUpdate({ key: 'situation', value: 'Review a logistics MSA' }),
    ]);
    // 1 of 3 rounds rather than trailing 33.333 down the panel.
    expect(progress(b).percent).toBe(33);
  });
});

/**
 * The send threshold, in the units the client reads it in.
 *
 * `SEND_THRESHOLD_PERCENT` is a *label* for the gate and `canSubmit` is the
 * gate, and these pin the relationship rather than assuming it. The
 * implication runs one way only, and the test that matters is the one that says
 * so: a brief that can be submitted is always at or above the threshold, and a
 * brief at the threshold is *not* necessarily submittable.
 */
describe('the send threshold', () => {
  /** Every required field agreed to, the optional one left alone. */
  function requiredComplete(): Brief {
    let b = applyFieldUpdates(brief(), [
      clientUpdate({ key: 'situation', value: 'Review a logistics MSA' }),
      clientUpdate({ key: 'otherSide', value: 'Acme Holdings' }),
    ]);
    b = confirmField(b, 'situation');
    b = confirmField(b, 'otherSide');
    return b;
  }

  it('opens Send at the threshold, with the optional row skipped', () => {
    const b = requiredComplete();
    expect(canSubmit(b)).toBe(true);
    expect(progress(b).percent).toBeGreaterThanOrEqual(sendThresholdPercent(b));
  });

  it('keeps Send shut below it', () => {
    const b = applyFieldUpdates(brief(), [
      clientUpdate({ key: 'situation', value: 'Review a logistics MSA' }),
    ]);
    expect(canSubmit(b)).toBe(false);
    expect(progress(b).percent).toBeLessThan(sendThresholdPercent(b));
  });

  /*
   * ⭐ The 80% the product actually shows.
   *
   * Every matter's brief is five rows with four required, so the threshold is
   * 80 for all of them. Asserted against the real field lists rather than
   * written into the source as a literal, so a matter that gains or loses a row
   * fails here instead of leaving a stale number in a comment.
   */
  it('is 80% for every matter the flow can route to', () => {
    for (const matterId of MATTER_IDS) {
      const real = createBrief(matterId, fieldsForMatter(matterId));
      expect(real.fields).toHaveLength(5);
      expect(sendThresholdPercent(real)).toBe(80);
    }
  });

  /*
   * ⭐ Why the button must not branch on the percentage.
   *
   * Confirming the *optional* row instead of a required one reaches the same
   * number with the case still incomplete. On the three-field fixture that is
   * 2 of 3; on the real five-row brief it is 4 of 5, i.e. exactly 80%. A gate
   * reading the percentage would open here, with a required field empty.
   */
  it('is not sufficient on its own, which is why canSubmit decides', () => {
    let b = applyFieldUpdates(brief(), [
      clientUpdate({ key: 'situation', value: 'Review a logistics MSA' }),
      clientUpdate({ key: 'outcome', value: 'A clean exit' }),
    ]);
    b = confirmField(b, 'situation');
    b = confirmField(b, 'outcome');

    expect(progress(b).percent).toBeGreaterThanOrEqual(sendThresholdPercent(b));
    // A required field is still empty, so the gate stays shut.
    expect(canSubmit(b)).toBe(false);
  });
});

describe('review helpers', () => {
  it('lists what the review step must walk through', () => {
    const b = applyFieldUpdates(brief(), [
      shakyUpdate({ key: 'situation', value: 'Review a logistics MSA' }),
      update(),
    ]);
    // Both: one worked out, one read from a document.
    expect(unconfirmedFields(b).map((f) => f.key)).toEqual([
      'situation',
      'otherSide',
    ]);
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

describe('blockingFields', () => {
  /*
   * The gate only cares about required fields, so the line explaining why Send
   * is off has to count the same thing `canSubmit` does. Counting every
   * unconfirmed field would tell a client they have work left that would not
   * change the button.
   */
  it('ignores an optional field the client has not agreed with', () => {
    const b = applyFieldUpdates(brief(), [
      {
        key: 'situation',
        value: 'Exiting an MSA',
        source: 'client',
        confidence: 10,
      },
      {
        key: 'otherSide',
        value: 'Acme',
        source: 'client',
        confidence: 10,
      },
      {
        key: 'outcome',
        value: 'A clean exit',
        source: 'document',
        confidence: 5,
      },
    ]);
    const confirmed = confirmField(confirmField(b, 'situation'), 'otherSide');

    expect(unconfirmedFields(confirmed).map((f) => f.key)).toEqual(['outcome']);
    expect(blockingFields(confirmed)).toEqual([]);
    expect(canSubmit(confirmed)).toBe(true);
  });

  it('counts a required field that is filled but unconfirmed', () => {
    const b = applyFieldUpdates(brief(), [
      {
        key: 'situation',
        value: 'Exiting an MSA',
        source: 'document',
        confidence: 5,
      },
    ]);
    expect(blockingFields(b).map((f) => f.key)).toEqual([
      'situation',
      'otherSide',
    ]);
  });

  it('counts a required field nothing has filled', () => {
    expect(blockingFields(brief()).map((f) => f.key)).toEqual([
      'situation',
      'otherSide',
    ]);
  });
});

/**
 * The firing rule for "the work got smaller" (item 9).
 *
 * Every case here is a way the naive version of this count lies to the client.
 * The line is only earned when the number of things still being asked of them
 * actually dropped by two or more, and the gap between that and "how many
 * values did the model send" is where all of these live.
 */
describe('newlyFilledRequired', () => {
  it('counts required fields that went from empty to answered', () => {
    const before = brief();
    const after = applyFieldUpdates(before, [
      clientUpdate({ key: 'situation', value: 'They withdrew the offer' }),
      clientUpdate({ key: 'otherSide', value: 'IBM' }),
    ]);
    expect(newlyFilledRequired(before, after)).toBe(2);
  });

  it('does not count a value re-proposed over a field that already had one', () => {
    const before = applyFieldUpdates(brief(), [
      clientUpdate({ key: 'otherSide', value: 'IBM' }),
    ]);
    const after = applyFieldUpdates(before, [
      clientUpdate({ key: 'otherSide', value: 'IBM UK Ltd' }),
    ]);
    // The value changed, but nothing was unblocked, so no work got smaller.
    expect(newlyFilledRequired(before, after)).toBe(0);
  });

  it('does not count optional fields', () => {
    const before = brief();
    const after = applyFieldUpdates(before, [
      clientUpdate({ key: 'situation', value: 'They withdrew the offer' }),
      clientUpdate({ key: 'outcome', value: 'Know where I stand' }),
    ]);
    // One required field, one optional. The line must not claim two.
    expect(newlyFilledRequired(before, after)).toBe(1);
  });

  it('is zero for a turn that only asked a question', () => {
    const before = brief();
    expect(newlyFilledRequired(before, applyFieldUpdates(before, []))).toBe(0);
  });

  /*
   * The case that decides where the count is taken. A client confirming a value
   * on the panel mid-turn changes the brief, and measuring the turn against the
   * brief as it is afterwards would credit the model with their work.
   */
  it('ignores a confirmation the client made themselves', () => {
    const before = applyFieldUpdates(brief(), [
      update({ key: 'otherSide', value: 'IBM' }),
    ]);
    const after = confirmField(before, 'otherSide');
    expect(newlyFilledRequired(before, after)).toBe(0);
  });
});

describe('requiredCount', () => {
  it('is the denominator the client sees, optional fields excluded', () => {
    expect(requiredCount(brief())).toBe(2);
  });

  it('does not move as fields fill', () => {
    const filled = applyFieldUpdates(brief(), [
      clientUpdate({ key: 'situation', value: 'They withdrew the offer' }),
    ]);
    expect(requiredCount(filled)).toBe(requiredCount(brief()));
  });
});

/**
 * L4: a reason belongs to an inferred value and to nothing else.
 *
 * The rule is enforced in `applyFieldUpdates` rather than asked for in the
 * prompt, because it is a rule about what the client is shown and the prompt is
 * a place where rules get followed most of the time. These are the four cases
 * that define it, and the last two are the ones a prompt would get wrong.
 */
describe('the reasoning on a value', () => {
  function reasoned(over: Partial<FieldUpdate> = {}): FieldUpdate {
    return update({
      source: 'inferred',
      sourceNote: null,
      sourceQuote: null,
      reasoning: 'You said the notice came from their HR team.',
      ...over,
    });
  }

  it('is kept on an inferred value', () => {
    const next = applyFieldUpdates(brief(), [reasoned()]);
    const field = next.fields.find((one) => one.key === 'otherSide');
    expect(field?.source).toBe('inferred');
    expect(field?.reasoning).toBe(
      'You said the notice came from their HR team.',
    );
  });

  /*
   * The client is the author of their own sentence, so a reason here would be
   * the model explaining their words back to them.
   */
  it('is discarded on a client value', () => {
    const next = applyFieldUpdates(brief(), [reasoned({ source: 'client' })]);
    expect(next.fields.find((one) => one.key === 'otherSide')?.reasoning).toBe(
      null,
    );
  });

  /*
   * A verified document value already carries the clause it was read from and
   * the exact words. A paraphrase beside them is the weakest of the three
   * claims being given the same room as the strongest.
   */
  it('is discarded on a verified document value', () => {
    const next = applyFieldUpdates(brief(), [
      update({ reasoning: 'It looked like the other side.' }),
    ]);
    const field = next.fields.find((one) => one.key === 'otherSide');
    expect(field?.source).toBe('document');
    expect(field?.reasoning).toBe(null);
  });

  /*
   * The case that makes the rule worth having in code. A document read whose
   * quote could not be verified is demoted to `inferred`, which means that row
   * has just lost its evidence — so the model's account of it is the most the
   * client has left to go on, and it must survive the demotion.
   */
  it('survives a document value being demoted for want of a quote', () => {
    const next = applyFieldUpdates(brief(), [
      update({
        sourceQuote: null,
        reasoning: 'The agreement names them on the first page.',
      }),
    ]);
    const field = next.fields.find((one) => one.key === 'otherSide');
    expect(field?.source).toBe('inferred');
    expect(field?.sourceNote).toBe(null);
    expect(field?.reasoning).toBe(
      'The agreement names them on the first page.',
    );
  });

  it('starts as null on a field nothing has filled', () => {
    expect(brief().fields.every((field) => field.reasoning === null)).toBe(
      true,
    );
  });

  /*
   * An Accept and an Edit part company here, and the difference is the point.
   * Agreeing with an inferred value does not make it something the client said,
   * so a lawyer reading the brief later still wants to know it was worked out.
   * Replacing it does: the sentence would then explain a value that is no
   * longer on the row.
   */
  it('survives an Accept and is dropped by an Edit', () => {
    const filled = applyFieldUpdates(brief(), [reasoned()]);
    expect(
      confirmField(filled, 'otherSide').fields.find(
        (one) => one.key === 'otherSide',
      )?.reasoning,
    ).toBe('You said the notice came from their HR team.');
    expect(
      confirmField(filled, 'otherSide', 'Acme Holdings (UK) Ltd').fields.find(
        (one) => one.key === 'otherSide',
      )?.reasoning,
    ).toBe(null);
  });
});

/**
 * L3: a passage is context for a quote, and goes wherever the quote goes.
 *
 * The failure being guarded is a row that shows three sentences of a contract
 * under a value the brief is no longer claiming to have read from there. That
 * looks more like evidence than no context at all, which makes it worse than
 * the gap it would be filling.
 */
describe('the source passage on a value', () => {
  const PASSAGE = {
    before: 'SERVICES',
    match: '1.1 The Supplier shall provide warehousing.',
    after: '1.2 The Supplier shall perform with reasonable care.',
  };

  it('is kept alongside a verified quote', () => {
    const next = applyFieldUpdates(brief(), [
      update({ sourcePassage: PASSAGE }),
    ]);
    const field = next.fields.find((one) => one.key === 'otherSide');
    expect(field?.source).toBe('document');
    expect(field?.sourcePassage).toEqual(PASSAGE);
  });

  /*
   * The important one. A document read whose quote could not be verified is
   * demoted to `inferred` and loses its quote — so the passage has to go with
   * it, or the row shows a contract extract supporting a claim the brief has
   * just withdrawn.
   */
  it('goes when the quote fails verification', () => {
    const next = applyFieldUpdates(brief(), [
      update({ sourceQuote: null, sourcePassage: PASSAGE }),
    ]);
    const field = next.fields.find((one) => one.key === 'otherSide');
    expect(field?.source).toBe('inferred');
    expect(field?.sourcePassage).toBe(null);
  });

  it('is never attached to a value the client said themselves', () => {
    const next = applyFieldUpdates(brief(), [
      update({ source: 'client', sourceQuote: null, sourcePassage: PASSAGE }),
    ]);
    expect(
      next.fields.find((one) => one.key === 'otherSide')?.sourcePassage,
    ).toBe(null);
  });

  it('starts as null on a field nothing has filled', () => {
    expect(brief().fields.every((field) => field.sourcePassage === null)).toBe(
      true,
    );
  });

  /*
   * Same split as the quote and the reasoning: an Accept keeps the provenance,
   * an Edit takes ownership of the value and so the old context stops being
   * about what is on the row.
   */
  it('survives an Accept and is dropped by an Edit', () => {
    const filled = applyFieldUpdates(brief(), [
      update({ sourcePassage: PASSAGE }),
    ]);
    expect(
      confirmField(filled, 'otherSide').fields.find(
        (one) => one.key === 'otherSide',
      )?.sourcePassage,
    ).toEqual(PASSAGE);
    expect(
      confirmField(filled, 'otherSide', 'Acme Holdings (UK) Ltd').fields.find(
        (one) => one.key === 'otherSide',
      )?.sourcePassage,
    ).toBe(null);
  });
});
