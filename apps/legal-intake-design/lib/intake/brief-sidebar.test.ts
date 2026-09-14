import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  applyFieldUpdates,
  confirmField,
  createBrief,
  restoreField,
  type FieldUpdate,
} from './brief';
import { fieldConfidence } from './confidence';

/**
 * The brief sidebar's three reworked readouts.
 *
 * All three are visual, and two of them rest on a data distinction that did not
 * exist before (`confirmedByClient`), which is the part worth testing properly.
 * The rest is asserted from source in the idiom this suite already uses for
 * component wiring — the app's vitest is the node environment over `lib/**`.
 */

const DEFS = [
  { key: 'situation', label: 'What you need', required: true },
  { key: 'otherSide', label: 'Other side', required: true },
];

const brief = () => createBrief('contract', DEFS);

const fromDocument = (key: string): FieldUpdate => ({
  key,
  value: 'Acme Holdings Ltd.',
  source: 'document',
  confidence: 6,
});

const fromClient = (key: string): FieldUpdate => ({
  key,
  value: 'Exiting an MSA early',
  source: 'client',
  confidence: 9,
});

describe('who confirmed a value', () => {
  /*
   * ⭐ The distinction the "You confirmed" readout needs, and the reason
   * `confirmed` alone could not carry it.
   *
   * A value the client typed is confirmed on arrival by `isAutoApprovable`
   * without anyone clicking anything. A value read from a document is confirmed
   * only when they press Accept. Both are `confirmed: true`, so the row could
   * not tell "we took your word for it" apart from "you checked this".
   */
  it('is not the client when their own words were auto-approved', () => {
    const b = applyFieldUpdates(brief(), [fromClient('situation')]);
    const field = b.fields.find((one) => one.key === 'situation')!;

    expect(field.confirmed).toBe(true);
    expect(field.confirmedByClient).toBe(false);
  });

  it('is the client once they accept a document value', () => {
    let b = applyFieldUpdates(brief(), [fromDocument('otherSide')]);
    expect(
      b.fields.find((one) => one.key === 'otherSide')!.confirmedByClient,
    ).toBe(false);

    b = confirmField(b, 'otherSide');
    expect(
      b.fields.find((one) => one.key === 'otherSide')!.confirmedByClient,
    ).toBe(true);
  });

  it('is the client when they edit and save', () => {
    let b = applyFieldUpdates(brief(), [fromDocument('otherSide')]);
    b = confirmField(b, 'otherSide', 'Acme Technologies Ltd.');
    const field = b.fields.find((one) => one.key === 'otherSide')!;
    expect(field.value).toBe('Acme Technologies Ltd.');
    expect(field.confirmedByClient).toBe(true);
  });

  /*
   * The model cannot land a new value on a row the client has agreed with —
   * `applyFieldUpdates` returns the field untouched — so the flag cannot go
   * stale that way. Asserted because it is the reason the clear inside
   * `applyFieldUpdates` is an invariant rather than a live branch.
   */
  it('survives, because a confirmed row is never overwritten', () => {
    let b = applyFieldUpdates(brief(), [fromDocument('otherSide')]);
    b = confirmField(b, 'otherSide');
    b = applyFieldUpdates(b, [
      { ...fromDocument('otherSide'), value: 'Someone else entirely' },
    ]);

    const field = b.fields.find((one) => one.key === 'otherSide')!;
    expect(field.value).toBe('Acme Holdings Ltd.');
    expect(field.confirmedByClient).toBe(true);
  });

  /* Undo is the way back, and it restores the pre-confirmation snapshot. */
  it('is gone again after an undo', () => {
    const before = applyFieldUpdates(brief(), [fromDocument('otherSide')]);
    const snapshot = before.fields.find((one) => one.key === 'otherSide')!;
    const after = confirmField(before, 'otherSide');
    expect(
      after.fields.find((one) => one.key === 'otherSide')!.confirmedByClient,
    ).toBe(true);

    const undone = restoreField(after, snapshot);
    expect(
      undone.fields.find((one) => one.key === 'otherSide')!.confirmedByClient,
    ).toBe(false);
  });

  /*
   * The pinned reading is untouched underneath. `confidence.ts` is emphatic
   * that agreeing with a value does not make the model more confident about it,
   * and the 100% the row shows is a different statement — a person stands
   * behind this — not a recomputed score.
   */
  it('leaves the model’s own reading on the field', () => {
    let b = applyFieldUpdates(brief(), [fromDocument('otherSide')]);
    const before = fieldConfidence(
      b.fields.find((one) => one.key === 'otherSide')!,
    );

    b = confirmField(b, 'otherSide');
    const after = fieldConfidence(
      b.fields.find((one) => one.key === 'otherSide')!,
    );

    expect(before).not.toBeNull();
    expect(after).toEqual(before);
    expect(after!.score).toBeLessThan(100);
  });
});

describe('the sidebar, read as source', () => {
  const read = (relativePath: string) =>
    readFileSync(join(process.cwd(), relativePath), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');

  const row = read('components/design/intake-v2/brief-field-row.tsx');
  const value = read('components/design/intake-v2/brief-value.tsx');
  const column = read('components/design/intake-v2/brief-column.tsx');

  /* 1. The traffic light, and the tick that matches it. */
  it('reads the three confidence levels as green, amber, red', () => {
    expect(row).toContain("high: 'text-success'");
    expect(row).toContain("medium: 'text-warning-strong'");
    expect(row).toContain("low: 'text-destructive'");
  });

  it('ticks a confirmed row in green', () => {
    expect(row).toContain('bg-success text-background');
  });

  it('shows the client’s own confirmation at 100%, in green', () => {
    expect(row).toContain('field.confirmedByClient ?');
    expect(row).toContain("t('confidence.userConfirmed')");
    expect(row).toContain('100%');
  });

  it('greens only the verb on the receipt, not the whole pill', () => {
    expect(row).toContain('text-success flex items-center gap-1 font-medium');
    // Who and when stay muted: they are the record around the fact.
    expect(row).toContain('<span className="text-muted-foreground">');
  });

  /*
   * 2. The float. `overflow-hidden` on the wrapper establishes a block
   * formatting context, so a float placed *outside* it would push the wrapper
   * clear instead of being wrapped around — which is the layout this replaced.
   */
  it('floats the row controls inside the clipping wrapper', () => {
    expect(value).toContain('float-right');
    expect(value).toContain('relative overflow-hidden');
    expect(value.indexOf('relative overflow-hidden')).toBeLessThan(
      value.indexOf('float-right'),
    );
    // Not `line-clamp`: it switches the box to -webkit-box, whose behaviour
    // with an intruding float is not something to rely on.
    expect(value).not.toContain('line-clamp');
  });

  it('fades a clipped value and offers a toggle both ways', () => {
    expect(value).toContain('bg-gradient-to-t');
    expect(value).toContain("t('readMore')");
    expect(value).toContain("t('showLess')");
    // Measured, so a short value gets no toggle.
    expect(value).toContain('scrollHeight');
  });

  /*
   * The editing state keeps its flex row — an input and two buttons on one
   * line, with no multi-line text to wrap — so the check is that the *value*
   * branch hands its controls to `BriefValue` rather than rendering a sibling.
   */
  it('hands the controls to BriefValue instead of a flex sibling', () => {
    expect(row).toContain('<BriefValue');
    expect(row).toContain('controls: receipt ?');
    expect(row).not.toContain(
      'text-foreground min-w-0 flex-1 whitespace-pre-line text-sm',
    );
  });

  /*
   * The footer's bottom edge, which is a claim about the *other* pane.
   *
   * Both panes carry `py-8`, so their content boxes end together — but the left
   * one is not the composer: the `beneathComposer` row (the Talk to a person
   * exit, ~20px) sits under it. So the composer's box ends 52px above the
   * pane's bottom, and the Send button has to be padded to match or it sits
   * visibly lower than the thing it should be level with.
   *
   * Pinned because the number is a measurement of something in a different
   * file, which is exactly the kind of constant that rots silently.
   */
  it('pads the sticky footer to the composer’s bottom edge', () => {
    expect(column).toContain('pb-13');
    expect(column).not.toContain('pb-9');
    // Still longer than the 32px it hangs into, or the bottom edge stops being
    // opaque and rows show through underneath it.
    expect(column).toContain('-bottom-8');
  });

  /* 3. The percentage. */
  it('shows the progress as a percentage', () => {
    expect(column).toContain("t('percentDone'");
    expect(column).toContain('progress.percent');
    expect(column).not.toContain('progress.confirmed} / {progress.total');
  });

  it('reports the percentage to assistive tech too', () => {
    expect(column).toContain('aria-valuenow={progress.percent}');
    expect(column).toContain('aria-valuemax={100}');
  });

  /*
   * 4. The footer sentence, at the floor. `leading-[1.5]` travels with the
   * size: small type fails from tight leading before it fails from size, and
   * three wrapped lines at 10.5px/1.25 read as a block rather than sentences.
   */
  it('sets the send explanation at its smallest readable size', () => {
    const intake = read('components/design/intake-v2/intake-v2.tsx');
    expect(intake).toContain(
      'text-muted-foreground text-[10.5px] leading-[1.5]',
    );
  });

  /*
   * 5. The stepper is no longer in the sidebar at all.
   *
   * It used to sit in this footer, above the send sentence, and the spacing
   * between its position line and its marker row was the thing this case
   * checked. Both are gone: the four steps are the left rail now
   * (`journey-rail.tsx`), which is fixed to the window rather than living in
   * a column that scrolls, and it carries no position line because it carries
   * no numbers. What is worth pinning here is that the footer did not quietly
   * grow a replacement.
   */
  it('has no stepper in the footer any more', () => {
    const intake = read('components/design/intake-v2/intake-v2.tsx');
    const footer = intake.slice(
      intake.indexOf('const briefFooter = ('),
      intake.indexOf('const briefPanel = ('),
    );
    expect(footer).not.toContain('<BriefStepper');
    expect(footer).not.toContain('<JourneyRail');
    expect(footer).toContain('FOOTER_SENTENCE[phase]');
  });
});
