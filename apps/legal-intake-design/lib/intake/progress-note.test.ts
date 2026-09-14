import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import messages from '@/messages/en.json';
import { progressNoteFor } from './progress-note';

/**
 * The sentence that says the work got smaller, and the claim it is not allowed
 * to make.
 *
 * The bug these were written for was found by using the app rather than by
 * reading it: a turn that filled the last required field while asking about the
 * optional one produced "which is all of them. Nothing left to ask" underneath
 * a reply ending in a question. Nothing in the type system objects to that, and
 * nothing in the counting was wrong — the note was simply more confident than
 * the turn it was attached to.
 */
const translator = createTranslator({
  locale: 'en',
  messages: { intake: messages.intake },
  namespace: 'intake',
});

const t = translator as unknown as (
  key: string,
  values?: Record<string, unknown>,
) => string;

function render(note: NonNullable<ReturnType<typeof progressNoteFor>>): string {
  return t(note.copyKey, {
    count: note.filled,
    total: note.total,
    remaining: note.remaining,
  });
}

describe('the progress note', () => {
  it('says nothing about a turn that closed one gap', () => {
    /*
     * The threshold. Moritz has already named the value in his own reply, and
     * a count after it is the moment a person taking notes turns into a
     * progress bar with a voice.
     */
    expect(
      progressNoteFor({ filled: 1, total: 4, remaining: 3, asking: true }),
    ).toBe(null);
    expect(
      progressNoteFor({ filled: 0, total: 4, remaining: 4, asking: false }),
    ).toBe(null);
  });

  it('counts what is left when something is left', () => {
    const note = progressNoteFor({
      filled: 2,
      total: 4,
      remaining: 2,
      asking: true,
    });
    expect(note?.copyKey).toBe('brief.workLeft');
    expect(render(note!)).toContain('2 questions left');
  });

  it('promises nothing is left to ask only when nothing is', () => {
    const done = progressNoteFor({
      filled: 4,
      total: 4,
      remaining: 0,
      asking: false,
    });
    expect(done?.copyKey).toBe('brief.workDone');
    expect(render(done!)).toContain('Nothing left to ask');
  });

  it('does not promise that while the reply is asking something', () => {
    // The defect, as a test. Same counts, same complete required set, and a
    // turn that ended on a question.
    const asking = progressNoteFor({
      filled: 4,
      total: 4,
      remaining: 0,
      asking: true,
    });
    expect(asking?.copyKey).toBe('brief.workDoneAsking');
    const sentence = render(asking!);
    expect(sentence).not.toContain('Nothing left to ask');
    // And it says the useful thing instead: the question on screen is skippable.
    expect(sentence).toContain('optional');
  });

  it('states the same arithmetic either way', () => {
    /*
     * The two endings differ in what they claim, not in what they count. A
     * variant that also changed the numbers would mean a client who answers
     * the optional question sees the count move for no reason.
     */
    const shape = { filled: 3, total: 3, remaining: 0 };
    const quiet = progressNoteFor({ ...shape, asking: false })!;
    const asking = progressNoteFor({ ...shape, asking: true })!;
    expect(asking.filled).toBe(quiet.filled);
    expect(asking.total).toBe(quiet.total);
    expect(render(asking)).toContain('3 more of the 3');
    expect(render(quiet)).toContain('3 more of the 3');
  });

  it('never claims more gaps closed than the brief has fields', () => {
    // A guard on the arithmetic rather than the wording: `filled` comes from
    // comparing two briefs, so it cannot exceed the required count, and a
    // sentence saying "5 more of the 4 things I needed" would be nonsense the
    // type system is happy with.
    const note = progressNoteFor({
      filled: 4,
      total: 4,
      remaining: 0,
      asking: false,
    })!;
    expect(note.filled).toBeLessThanOrEqual(note.total);
  });
});
