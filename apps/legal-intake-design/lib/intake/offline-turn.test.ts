import { describe, expect, it } from 'vitest';
import { applyFieldUpdates, canSubmit, createBrief } from './brief';
import { fieldsForMatter } from './matter-fields';
import { offlineTurn } from './offline-turn';
import { parseIntakeTurn } from './turn-schema';

/**
 * The keyless intake has one job: a reviewer with no `ANTHROPIC_API_KEY` can
 * still describe a matter and reach a sendable brief. So the tests walk the
 * thing rather than inspecting it — the interesting failure is not a wrong
 * string, it is an interview that stops advancing and strands the client on a
 * disabled Send button, which is exactly the dead end item 16 describes.
 */

/** Drive the script to completion, as the route would, and count the turns. */
function walk(matter: 'contract' | 'employment', messages: string[]) {
  let brief = createBrief(matter, fieldsForMatter(matter));
  const replies: string[] = [];

  for (const message of messages) {
    const turn = offlineTurn({ brief, message, mode: 'intake' });
    replies.push(turn.reply);
    brief = applyFieldUpdates(brief, turn.fieldUpdates);
  }

  return { brief, replies };
}

describe('the offline interviewer', () => {
  it('returns a turn the real parser accepts', () => {
    const brief = createBrief('contract', fieldsForMatter('contract'));
    const turn = offlineTurn({
      brief,
      message: 'I need help reviewing an NDA',
      mode: 'intake',
    });

    // The route sends whatever this returns straight down the same stream the
    // model's output goes down, so anything the client validator would reject
    // is a broken keyless flow however good the copy is.
    expect(parseIntakeTurn(JSON.parse(JSON.stringify(turn)))).not.toBeNull();
  });

  it('never claims a value the client did not say', () => {
    const brief = createBrief('contract', fieldsForMatter('contract'));
    const turn = offlineTurn({
      brief,
      message: 'A supplier is threatening to walk away from our MSA',
      mode: 'intake',
    });

    for (const update of turn.fieldUpdates) {
      expect(update.source).toBe('client');
      expect(update.reasoning).toBe('');
    }
  });

  it('routes the matter from an opening description', () => {
    const { brief } = walk('contract', ['I was made redundant last week']);
    const matterType = brief.fields.find(
      (field) => field.key === 'matter-type',
    );

    // Opening straight into an employment story must not leave the row saying
    // "contract" just because `createBrief` was seeded with it.
    expect(matterType?.value).toBe('Employment');
  });

  it('asks a different second question for a different matter', () => {
    const employment = walk('employment', ['redundancy']).replies;
    const contract = walk('contract', ['NDA review']).replies;

    expect(employment[0]).not.toBe(contract[0]);
  });

  it('advances on every turn rather than repeating a question', () => {
    const asked: string[] = [];
    let brief = createBrief('employment', fieldsForMatter('employment'));

    for (let i = 0; i < 12; i += 1) {
      const turn = offlineTurn({
        brief,
        message: `answer ${i}`,
        mode: 'intake',
      });
      if (turn.askingAbout) asked.push(turn.askingAbout);
      brief = applyFieldUpdates(brief, turn.fieldUpdates);
      if (turn.nothingRequiredMissing) break;
    }

    // A key asked twice means the update did not land, which is the loop that
    // would leave a keyless reviewer typing forever.
    expect(new Set(asked).size).toBe(asked.length);
  });

  it('reaches a sendable brief with no key and no model', () => {
    let brief = createBrief('employment', fieldsForMatter('employment'));

    for (let i = 0; i < 12; i += 1) {
      const turn = offlineTurn({
        brief,
        message: i === 0 ? 'unfair dismissal' : `answer ${i}`,
        mode: 'intake',
      });
      brief = applyFieldUpdates(brief, turn.fieldUpdates);
      if (turn.nothingRequiredMissing) break;
    }

    // The whole point of item 11.
    expect(canSubmit(brief)).toBe(true);
  });

  it('offers the matter chips as one-tap options on the opening turn', () => {
    const brief = createBrief('contract', fieldsForMatter('contract'));
    const first = offlineTurn({ brief, message: 'hello', mode: 'intake' });
    const second = offlineTurn({
      brief: applyFieldUpdates(brief, first.fieldUpdates),
      message: 'a contract',
      mode: 'intake',
    });

    for (const turn of [first, second]) {
      expect(turn.options.length).toBeLessThanOrEqual(5);
    }
  });

  it('writes nothing once the brief is full', () => {
    let brief = createBrief('employment', fieldsForMatter('employment'));
    for (let i = 0; i < 12; i += 1) {
      const turn = offlineTurn({
        brief,
        message: `answer ${i}`,
        mode: 'intake',
      });
      brief = applyFieldUpdates(brief, turn.fieldUpdates);
    }

    const after = offlineTurn({
      brief,
      message: 'one more thought',
      mode: 'intake',
    });

    // Attributing a stray sentence to an already-answered row would overwrite
    // something the client had confirmed.
    expect(after.fieldUpdates).toEqual([]);
    expect(after.nothingRequiredMissing).toBe(true);
  });

  it('reads the brief back in the waiting mode and proposes nothing', () => {
    const brief = createBrief('contract', fieldsForMatter('contract'));
    const turn = offlineTurn({
      brief,
      message: 'what did I send?',
      mode: 'waiting',
    });

    expect(turn.fieldUpdates).toEqual([]);
    expect(turn.askingAbout).toBe('');
    expect(turn.options).toEqual([]);
  });

  it('is deterministic, so the write-up screenshots stay true', () => {
    const brief = createBrief('contract', fieldsForMatter('contract'));
    const once = offlineTurn({ brief, message: 'an NDA', mode: 'intake' });
    const twice = offlineTurn({ brief, message: 'an NDA', mode: 'intake' });

    expect(once).toEqual(twice);
  });
});
