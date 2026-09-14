import { describe, expect, it } from 'vitest';
import { applyFieldUpdates, createBrief, type Brief } from './brief';
import { endsOnQuestion, repairTurn } from './dead-end';
import { fieldsForMatter } from './matter-fields';
import type { IntakeTurn } from './turn-schema';

/**
 * The dead-end guard.
 *
 * The bug it closes is the one failure in this flow that looks like success, so
 * it has no error state to assert against and nothing on screen goes red. What
 * is being tested is one invariant: while the client still has a required row
 * to answer, the turn they are shown asks them something.
 *
 * Briefs are built from the real contract checklist rather than from a pair of
 * invented field defs, because half of what the repair does is look up the
 * authored question for a row, and a made-up key has no authored question.
 */

const contract = (): Brief =>
  createBrief('contract', fieldsForMatter('contract'));

/** A filled brief, minus whichever rows the caller wants left empty. */
function filled(...leaveEmpty: string[]): Brief {
  const brief = contract();
  return applyFieldUpdates(
    brief,
    brief.fields
      .filter((field) => !leaveEmpty.includes(field.key))
      .map((field) => ({
        key: field.key,
        value:
          field.key === 'matter-type'
            ? 'Contract'
            : 'Something the client said',
        source: 'client' as const,
        confidence: 9,
      })),
  );
}

const turn = (over: Partial<IntakeTurn> = {}): IntakeTurn => ({
  reply: 'Got it, I have put Cross River Bank down as the other side.',
  fieldUpdates: [],
  askingAbout: '',
  nothingRequiredMissing: false,
  options: [],
  observation: '',
  ...over,
});

describe('endsOnQuestion', () => {
  it('is true for a reply that asks anything at all', () => {
    expect(endsOnQuestion('Got it. How soon do you need this?')).toBe(true);
    // Mid-reply counts. The client has something to answer either way.
    expect(endsOnQuestion('Is that the whole story? I have noted it.')).toBe(
      true,
    );
  });

  it('is false for the acknowledgement that ended the conversation', () => {
    expect(
      endsOnQuestion(
        'Got it, I have put Cross River Bank down as the other side.',
      ),
    ).toBe(false);
  });
});

describe('a turn that asked nothing, with a required row still empty', () => {
  const brief = filled('urgency');

  it('gets the authored question for the next gap appended', () => {
    const { turn: fixed, changed } = repairTurn(turn(), brief);

    expect(fixed.reply).toContain('down as the other side.');
    expect(endsOnQuestion(fixed.reply)).toBe(true);
    expect(fixed.askingAbout).toBe('urgency');
    expect(changed).toContain('urgency');
  });

  it("brings that row's ready-made answers with it", () => {
    const { turn: fixed } = repairTurn(turn(), brief);

    // The four authored urgency chips, not something composed here.
    expect(fixed.options).toEqual([
      'Today',
      'This week',
      'This month',
      'Just exploring',
    ]);
  });

  it('keeps the options the model wrote, where it wrote a usable row', () => {
    const mine = ['Within a fortnight', 'No particular deadline'];
    const { turn: fixed } = repairTurn(turn({ options: mine }), brief);

    expect(fixed.options).toEqual(mine);
  });

  it('asks about the row the model named, over the first gap in brief order', () => {
    /*
     * This is the shape the bug actually had on screen: the panel said "asking
     * now" against the optional outcome row while the reply asked nothing. The
     * model had chosen a row and then not written the question, so the repair
     * writes the question it chose rather than overruling it.
     */
    const partial = filled('urgency', 'outcome');
    const { turn: fixed } = repairTurn(
      turn({ askingAbout: 'outcome' }),
      partial,
    );

    expect(fixed.askingAbout).toBe('outcome');
    expect(fixed.reply).toContain('good outcome');
  });

  it("measures the gap after this turn's own updates, not before", () => {
    /*
     * The turn that fills the last required row must not have a question about
     * that row appended to a reply which has just answered it.
     */
    const { turn: fixed } = repairTurn(
      turn({
        fieldUpdates: [
          {
            key: 'urgency',
            value: 'This week',
            source: 'client',
            confidence: 9,
            reasoning: '',
          },
        ],
      }),
      brief,
    );

    expect(fixed.reply).toBe(turn().reply);
    expect(fixed.nothingRequiredMissing).toBe(true);
  });
});

describe('a turn that asked nothing, with nothing required left', () => {
  it('is left alone, because the client can send', () => {
    const { turn: fixed, changed } = repairTurn(turn(), filled('outcome'));

    expect(fixed.reply).toBe(turn().reply);
    expect(changed).toBeNull();
  });

  it('does not leave an optional row marked as being asked about', () => {
    const { turn: fixed } = repairTurn(
      turn({ askingAbout: 'outcome' }),
      filled('outcome'),
    );

    expect(fixed.askingAbout).toBe('');
  });
});

describe('a turn that did ask something', () => {
  const asked = turn({
    reply: 'Got it, that is the other side. How soon do you need this?',
    askingAbout: 'urgency',
  });

  it('is passed through untouched', () => {
    const { turn: fixed, changed } = repairTurn(asked, filled('urgency'));

    expect(fixed.reply).toBe(asked.reply);
    expect(fixed.askingAbout).toBe('urgency');
    expect(changed).toBeNull();
  });
});

describe('askingAbout, sanitised', () => {
  it('drops a key no row in the brief has', () => {
    const { turn: fixed } = repairTurn(
      turn({ reply: 'What happened next?', askingAbout: 'whoInvolved' }),
      filled('urgency'),
    );

    expect(fixed.askingAbout).toBe('');
  });

  it('drops a row that already has a value', () => {
    const { turn: fixed, changed } = repairTurn(
      turn({ reply: 'And what happened next?', askingAbout: 'otherSide' }),
      filled('urgency'),
    );

    expect(fixed.askingAbout).toBe('');
    expect(changed).toBe('askingAbout');
  });

  it('drops a row this very turn filled in', () => {
    /*
     * The model narrating a value and claiming to be asking about it in the
     * same breath. The row is empty in the brief that arrived, so only the
     * post-update view catches this.
     */
    const { turn: fixed } = repairTurn(
      turn({
        reply: 'I have put this week down. Anything else I should know?',
        askingAbout: 'urgency',
        fieldUpdates: [
          {
            key: 'urgency',
            value: 'This week',
            source: 'client',
            confidence: 9,
            reasoning: '',
          },
        ],
      }),
      filled('urgency'),
    );

    expect(fixed.askingAbout).toBe('');
  });
});

describe('nothingRequiredMissing', () => {
  it('is answered from the brief, not from the model', () => {
    const { turn: fixed } = repairTurn(
      turn({
        reply: 'How soon do you need this?',
        nothingRequiredMissing: true,
      }),
      filled('urgency'),
    );

    expect(fixed.nothingRequiredMissing).toBe(false);
  });
});
