import { describe, expect, it } from 'vitest';
import { MATTER_TYPE_KEY } from '@/components/design/new-case/intake-types';
import {
  applyFieldUpdates,
  canSubmit,
  confirmField,
  createBrief,
  retargetBrief,
} from './brief';
import { fieldsForMatter } from './matter-fields';
import { matterOf } from './matter-of';
import { offlineTurn } from './offline-turn';

/**
 * Item 15: the brief has to carry the checklist for the matter it actually is.
 *
 * The failure was terminal rather than cosmetic — the required rows for a
 * contract were unanswerable in an employment conversation, so `canSubmit`
 * never became true and Review and send stayed disabled for good. So the tests
 * that matter here end at "can this client send their case", not at the shape
 * of the field array.
 */

/** The keys a matter's checklist requires, for readable assertions. */
function requiredKeys(matter: 'contract' | 'employment'): string[] {
  return fieldsForMatter(matter)
    .filter((def) => def.required)
    .map((def) => def.key);
}

describe('retargetBrief', () => {
  it('swaps the checklist when the matter changes', () => {
    const brief = createBrief('contract', fieldsForMatter('contract'));
    const moved = retargetBrief(
      brief,
      'employment',
      fieldsForMatter('employment'),
    );

    const keys = moved.fields.map((field) => field.key);
    expect(keys).toContain('whoInvolved');
    expect(keys).not.toContain('otherSide');
  });

  it('is a no-op when the matter already matches', () => {
    const brief = createBrief('contract', fieldsForMatter('contract'));

    // Identity, so neither React nor the storage effect sees a new brief on
    // every turn of an ordinary contract intake.
    expect(retargetBrief(brief, 'contract', fieldsForMatter('contract'))).toBe(
      brief,
    );
  });

  it('carries answered rows across', () => {
    const brief = confirmField(
      createBrief('contract', fieldsForMatter('contract')),
      MATTER_TYPE_KEY,
      'Employment',
    );
    const moved = retargetBrief(
      brief,
      'employment',
      fieldsForMatter('employment'),
    );

    const matterType = moved.fields.find(
      (field) => field.key === MATTER_TYPE_KEY,
    );
    expect(matterType?.value).toBe('Employment');
    expect(matterType?.confirmed).toBe(true);
  });

  it('takes required from the new matter, not the old one', () => {
    const brief = createBrief('contract', fieldsForMatter('contract'));
    const moved = retargetBrief(
      brief,
      'employment',
      fieldsForMatter('employment'),
    );

    for (const field of moved.fields) {
      const def = fieldsForMatter('employment').find(
        (candidate) => candidate.key === field.key,
      );
      if (def) expect(field.required).toBe(def.required);
    }
  });

  it('keeps an answer the new matter has no row for, and stops requiring it', () => {
    let brief = createBrief('contract', fieldsForMatter('contract'));
    brief = confirmField(brief, 'otherSide', 'Northwind Ltd');

    const moved = retargetBrief(
      brief,
      'employment',
      fieldsForMatter('employment'),
    );
    const orphan = moved.fields.find((field) => field.key === 'otherSide');

    // Not deleted: the client typed it. Not required: employment's checklist
    // does not govern it, and a required row nothing will ever ask about is
    // the exact deadlock item 15 describes.
    expect(orphan?.value).toBe('Northwind Ltd');
    expect(orphan?.required).toBe(false);
  });

  it('drops an empty row the new matter has no use for', () => {
    const brief = createBrief('contract', fieldsForMatter('contract'));
    const moved = retargetBrief(
      brief,
      'employment',
      fieldsForMatter('employment'),
    );

    expect(moved.fields.some((field) => field.key === 'outcome')).toBe(false);
  });

  it('records the matter on the brief, so matterId stops lying', () => {
    const brief = createBrief('contract', fieldsForMatter('contract'));
    expect(
      retargetBrief(brief, 'employment', fieldsForMatter('employment'))
        .matterId,
    ).toBe('employment');
  });
});

/**
 * The bug as a client would meet it, driven through the scripted interviewer
 * so there is no model in the loop and the walk is deterministic.
 */
describe('an employment intake that opens on the contract checklist', () => {
  /** Interview to completion, retargeting as the real hook does. */
  function interview(opening: string) {
    let brief = createBrief('contract', fieldsForMatter('contract'));

    for (let i = 0; i < 15; i += 1) {
      const turn = offlineTurn({
        brief,
        message: i === 0 ? opening : `answer ${i}`,
        mode: 'intake',
      });
      brief = applyFieldUpdates(brief, turn.fieldUpdates);

      const resolved = matterOf(brief);
      if (resolved)
        brief = retargetBrief(brief, resolved, fieldsForMatter(resolved));

      if (turn.nothingRequiredMissing && canSubmit(brief)) break;
    }

    return brief;
  }

  it('moves onto the employment checklist', () => {
    const brief = interview('I was made redundant last week');

    expect(brief.matterId).toBe('employment');
    expect(requiredKeys('employment')).toContain('whoInvolved');
    expect(brief.fields.some((field) => field.key === 'whoInvolved')).toBe(
      true,
    );
  });

  it('lets the client actually send the case', () => {
    // The assertion item 15 exists for. Before the fix this was false no
    // matter how much the client typed.
    expect(canSubmit(interview('I was made redundant last week'))).toBe(true);
  });

  it('still works for a matter that never changes', () => {
    expect(canSubmit(interview('please review this NDA'))).toBe(true);
  });
});
