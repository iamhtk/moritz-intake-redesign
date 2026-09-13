import { describe, expect, it } from 'vitest';
import { applyFieldUpdates, confirmField, createBrief } from './brief';
import {
  extractPartialReply,
  INTAKE_TURN_SCHEMA,
  parseIntakeTurn,
  renderBriefState,
} from './turn-schema';

const DEFS = [
  { key: 'situation', label: 'What you need', required: true },
  { key: 'otherSide', label: 'Other side', required: true },
  { key: 'outcome', label: 'Desired outcome', required: false },
];

function turn(over: Record<string, unknown> = {}) {
  return {
    reply: 'Got it, I have put Acme Holdings down as the other side.',
    fieldUpdates: [
      {
        key: 'otherSide',
        value: 'Acme Holdings Ltd',
        source: 'client',
        confidence: 9,
      },
    ],
    askingAbout: 'situation',
    nothingRequiredMissing: false,
    ...over,
  };
}

describe('INTAKE_TURN_SCHEMA', () => {
  it('puts reply first so it streams before the field updates', () => {
    expect(Object.keys(INTAKE_TURN_SCHEMA.properties)[0]).toBe('reply');
  });

  it('constrains the rating with an enum, since ranges are not supported', () => {
    // `minimum`/`maximum` are stripped from a structured-output schema before
    // it is compiled, so a range here would let a 47 through the grammar.
    const confidence =
      INTAKE_TURN_SCHEMA.properties.fieldUpdates.items.properties.confidence;
    expect(confidence.type).toBe('integer');
    expect(confidence.enum).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('does not let a conversational turn claim a document source', () => {
    const source =
      INTAKE_TURN_SCHEMA.properties.fieldUpdates.items.properties.source;
    expect(source.enum).toEqual(['client', 'inferred']);
    expect(source.enum).not.toContain('document');
  });

  it('closes every object, as the API requires', () => {
    expect(INTAKE_TURN_SCHEMA.additionalProperties).toBe(false);
    expect(
      INTAKE_TURN_SCHEMA.properties.fieldUpdates.items.additionalProperties,
    ).toBe(false);
  });
});

describe('parseIntakeTurn', () => {
  it('accepts a well-formed turn', () => {
    const parsed = parseIntakeTurn(turn());
    expect(parsed?.fieldUpdates).toHaveLength(1);
    expect(parsed?.askingAbout).toBe('situation');
    expect(parsed?.nothingRequiredMissing).toBe(false);
  });

  it('rejects a turn with no reply, the client would be left with nothing', () => {
    expect(parseIntakeTurn(turn({ reply: '' }))).toBeNull();
    expect(parseIntakeTurn(turn({ reply: 42 }))).toBeNull();
    expect(parseIntakeTurn(null)).toBeNull();
  });

  it('drops bad updates one by one but keeps the reply and the good ones', () => {
    const parsed = parseIntakeTurn(
      turn({
        fieldUpdates: [
          {
            key: 'otherSide',
            value: 'Acme',
            source: 'client',
            confidence: 9,
          },
          {
            key: 'situation',
            value: 'Review',
            source: 'document',
            confidence: 9,
          },
          { key: '', value: 'x', source: 'client', confidence: 'sure' },
          'nonsense',
        ],
      }),
    );

    expect(parsed?.reply).toContain('Acme Holdings');
    expect(parsed?.fieldUpdates.map((u) => u.key)).toEqual(['otherSide']);
  });

  it('treats a missing askingAbout as not asking', () => {
    const parsed = parseIntakeTurn(turn({ askingAbout: undefined }));
    expect(parsed?.askingAbout).toBe('');
  });

  it('only treats an explicit true as complete', () => {
    expect(
      parseIntakeTurn(turn({ nothingRequiredMissing: 'yes' }))
        ?.nothingRequiredMissing,
    ).toBe(false);
    expect(
      parseIntakeTurn(turn({ nothingRequiredMissing: true }))
        ?.nothingRequiredMissing,
    ).toBe(true);
  });
});

describe('extractPartialReply', () => {
  it('returns nothing before the reply key arrives', () => {
    expect(extractPartialReply('{')).toBeNull();
    expect(extractPartialReply('{"rep')).toBeNull();
  });

  it('returns the text so far mid-stream', () => {
    expect(extractPartialReply('{"reply":"Got it, I have put Acme')).toBe(
      'Got it, I have put Acme',
    );
  });

  it('returns the whole reply once the string closes', () => {
    expect(extractPartialReply('{"reply":"All done.","fieldUpdates":[]}')).toBe(
      'All done.',
    );
  });

  it('does not truncate on an escaped quote inside the reply', () => {
    expect(
      extractPartialReply('{"reply":"You said \\"Acme\\", is that right?"'),
    ).toBe('You said "Acme", is that right?');
  });

  it('handles escapes and unicode split across chunks without crashing', () => {
    expect(extractPartialReply('{"reply":"line one\\nline two')).toBe(
      'line one\nline two',
    );
    expect(extractPartialReply('{"reply":"trailing\\')).toBe('trailing');
    // A complete \\uXXXX escape decodes.
    expect(extractPartialReply('{"reply":"caf\\u00e9')).toBe('café');
    // One split mid-escape stops cleanly rather than emitting garbage.
    expect(extractPartialReply('{"reply":"partial \\u00')).toBe('partial ');
  });
});

describe('renderBriefState', () => {
  it('marks missing fields and flags optional ones', () => {
    const rendered = renderBriefState(createBrief('contract', DEFS));
    expect(rendered).toContain('situation (What you need): MISSING');
    expect(rendered).toContain('outcome (Desired outcome) [optional]: MISSING');
  });

  it('shows the value, its origin and its rating', () => {
    const brief = applyFieldUpdates(createBrief('contract', DEFS), [
      {
        key: 'otherSide',
        value: 'Acme Holdings Ltd',
        source: 'inferred',
        confidence: 3,
      },
    ]);
    expect(renderBriefState(brief)).toContain(
      'otherSide (Other side): Acme Holdings Ltd [from inferred, confidence 3/10]',
    );
  });

  it('shows a rating it never got as unrated rather than as a number', () => {
    const brief = createBrief('contract', DEFS);
    const legacy = {
      ...brief,
      fields: brief.fields.map((f) =>
        f.key === 'otherSide'
          ? { ...f, value: 'Acme Holdings Ltd', source: 'client' as const }
          : f,
      ),
    };
    expect(renderBriefState(legacy)).toContain('[from client, unrated]');
  });

  it('tells the model plainly not to touch a confirmed field', () => {
    const brief = confirmField(
      applyFieldUpdates(createBrief('contract', DEFS), [
        {
          key: 'otherSide',
          value: 'Acme',
          source: 'client',
          confidence: 9,
        },
      ]),
      'otherSide',
    );
    const rendered = renderBriefState(brief);
    expect(rendered).toContain('CONFIRMED BY CLIENT, do not change');
    /*
     * And no rating beside it. The number on a confirmed row is the one the
     * model gave before the client settled the value, so showing it invites
     * the model to reopen a line on the strength of its own earlier doubt.
     */
    expect(rendered).not.toContain('confidence 10/10');
  });
});

/**
 * L4: the reason arrives, and a missing one never costs a field.
 *
 * The second of those is the one worth a test. A reason is the only property on
 * an update whose absence leaves the value entirely usable, so dropping the
 * whole update over it would trade a field the client can check for a sentence
 * they can read.
 */
describe('the reasoning on a turn update', () => {
  function turn(update: Record<string, unknown>) {
    return parseIntakeTurn({
      reply: 'Got it.',
      fieldUpdates: [update],
      askingAbout: '',
      nothingRequiredMissing: false,
      observation: '',
    });
  }

  const base = {
    key: 'otherSide',
    value: 'Acme Holdings Ltd',
    source: 'inferred',
    confidence: 3,
  };

  it('comes through trimmed', () => {
    expect(
      turn({ ...base, reasoning: '  You said their HR team wrote to you.  ' })
        ?.fieldUpdates[0]?.reasoning,
    ).toBe('You said their HR team wrote to you.');
  });

  it.each([
    ['missing', {}],
    ['null', { reasoning: null }],
    ['a number', { reasoning: 7 }],
    ['an object', { reasoning: { why: 'because' } }],
  ])('keeps the update when the reason is %s', (_name, over) => {
    const parsed = turn({ ...base, ...over });
    expect(parsed?.fieldUpdates).toHaveLength(1);
    expect(parsed?.fieldUpdates[0]?.value).toBe('Acme Holdings Ltd');
    expect(parsed?.fieldUpdates[0]?.reasoning).toBe('');
  });

  /*
   * The schema has to ask for it, or constrained decoding will never emit it
   * and the property would be dead weight in the type. Asserted against the
   * shipped schema object rather than a copy of it.
   */
  it('is required by the schema the model is given', () => {
    const item = INTAKE_TURN_SCHEMA.properties.fieldUpdates.items;
    expect(item.properties).toHaveProperty('reasoning');
    expect(item.required).toContain('reasoning');
  });
});
