import { describe, expect, it } from 'vitest';
import messages from '@/messages/en.json';
import {
  createBrief,
  markDocumentsSuggested,
  noteObservation,
  type Brief,
} from './brief';
import { fieldsForMatter } from './matter-fields';
import { parseIntakeTurn, renderBriefState } from './turn-schema';

function brief(): Brief {
  return createBrief('contract', fieldsForMatter('contract'));
}

const NOTED =
  'The letter gives visa sponsorship as the reason, and you mentioned you told them at the first interview, so I have noted that for the lawyer.';

/**
 * Item 6. The rule that matters is "at most one in an entire intake", and it
 * cannot live in the prompt: a stateless turn call has no way to know what it
 * said nine turns ago, and a model asked for at most one across a long
 * conversation will eventually offer a second. So the limit is enforced here,
 * and these are the ways it could leak.
 */
describe('noteObservation', () => {
  it('records the first observation', () => {
    expect(noteObservation(brief(), NOTED).observation).toBe(NOTED);
  });

  it('starts with none, which is the expected outcome for most intakes', () => {
    expect(brief().observation).toBeNull();
  });

  // The whole rule, in one assertion.
  it('refuses a second one, however good it is', () => {
    const once = noteObservation(brief(), NOTED);
    const twice = noteObservation(once, 'A different contradiction entirely.');
    expect(twice.observation).toBe(NOTED);
    // Returned unchanged, so a caller cannot tell it apart from a no-op.
    expect(twice).toBe(once);
  });

  it('treats a blank or whitespace observation as nothing said', () => {
    expect(noteObservation(brief(), '').observation).toBeNull();
    expect(noteObservation(brief(), '   \n ').observation).toBeNull();
  });

  // A blank second turn must not spend the slot, or the one real observation
  // later in the conversation would be dropped.
  it('does not spend the slot on a blank', () => {
    const after = noteObservation(brief(), '  ');
    expect(noteObservation(after, NOTED).observation).toBe(NOTED);
  });

  it('trims what it stores', () => {
    expect(noteObservation(brief(), `  ${NOTED}  `).observation).toBe(NOTED);
  });

  it('never clears an observation once made', () => {
    const once = noteObservation(brief(), NOTED);
    expect(noteObservation(once, '').observation).toBe(NOTED);
  });
});

describe('the turn schema carries the observation', () => {
  const base = {
    reply: 'Got it.',
    fieldUpdates: [],
    askingAbout: '',
    nothingRequiredMissing: false,
  };

  it('parses one when the model sends it', () => {
    expect(parseIntakeTurn({ ...base, observation: NOTED })?.observation).toBe(
      NOTED,
    );
  });

  // The normal case: the field is present and empty on almost every turn.
  it('reads an empty string as no observation', () => {
    expect(parseIntakeTurn({ ...base, observation: '' })?.observation).toBe('');
  });

  it('defaults to none when the field is missing or the wrong type', () => {
    expect(parseIntakeTurn(base)?.observation).toBe('');
    expect(parseIntakeTurn({ ...base, observation: 42 })?.observation).toBe('');
  });

  it('trims, so whitespace never reads as an observation', () => {
    expect(parseIntakeTurn({ ...base, observation: '  ' })?.observation).toBe(
      '',
    );
  });
});

/**
 * The model is told every turn whether the slot is spent. Without this it keeps
 * generating observations that the app then throws away, which costs tokens and
 * makes the transcript window the only thing standing between a client and a
 * second one.
 */
describe('renderBriefState tells the model about the slot', () => {
  it('says none has been made on a fresh brief', () => {
    const rendered = renderBriefState(brief());
    expect(rendered).toContain('OBSERVATION: none made yet');
  });

  it('quotes the one already made, and says not to make another', () => {
    const rendered = renderBriefState(noteObservation(brief(), NOTED));
    expect(rendered).toContain('do not make another');
    expect(rendered).toContain(NOTED);
    expect(rendered).not.toContain('none made yet');
  });
});

/**
 * Item 7. Once per intake, and the flag is on the brief rather than in
 * component state so that coming back to a saved case does not ask the same
 * client for the same two documents again.
 */
describe('markDocumentsSuggested', () => {
  it('is unspent on a new brief', () => {
    expect(brief().documentsSuggested).toBe(false);
  });

  it('spends once and stays spent', () => {
    const once = markDocumentsSuggested(brief());
    expect(once.documentsSuggested).toBe(true);
    expect(markDocumentsSuggested(once)).toBe(once);
  });

  it('survives a round trip through storage, which is why it lives here', () => {
    const stored = JSON.parse(
      JSON.stringify(markDocumentsSuggested(brief())),
    ) as Brief;
    expect(stored.documentsSuggested).toBe(true);
  });
});

/**
 * Every matter type has a suggestion, because the fallback is only meant to
 * cover an unrecognised matter, not a missing translation.
 */
describe('the document suggestions', () => {
  const suggestions = messages.intake.upload.alsoUseful as Record<
    string,
    string
  >;

  it('covers every matter type the flow can resolve', () => {
    for (const matter of [
      'contract',
      'employment',
      'procurement',
      'corporate',
      'ma',
      'other',
    ]) {
      expect(suggestions[matter], matter).toBeTruthy();
    }
  });

  it('names two documents and does not rush anybody', () => {
    for (const [matter, text] of Object.entries(suggestions)) {
      // "and" is what joins the two documents in every one of them.
      expect(text, matter).toContain(' and ');
      expect(text, matter).toContain('No rush');
      // The point of the sentence is that it is optional.
      expect(text, matter).toContain('after you send this');
    }
  });
});
