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
        confidence: 'sure',
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
            confidence: 'sure',
          },
          {
            key: 'situation',
            value: 'Review',
            source: 'document',
            confidence: 'sure',
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

  it('shows the value, its origin and its confidence', () => {
    const brief = applyFieldUpdates(createBrief('contract', DEFS), [
      {
        key: 'otherSide',
        value: 'Acme Holdings Ltd',
        source: 'inferred',
        confidence: 'unsure',
      },
    ]);
    expect(renderBriefState(brief)).toContain(
      'otherSide (Other side): Acme Holdings Ltd [from inferred, unsure]',
    );
  });

  it('tells the model plainly not to touch a confirmed field', () => {
    const brief = confirmField(
      applyFieldUpdates(createBrief('contract', DEFS), [
        {
          key: 'otherSide',
          value: 'Acme',
          source: 'client',
          confidence: 'sure',
        },
      ]),
      'otherSide',
    );
    expect(renderBriefState(brief)).toContain(
      'CONFIRMED BY CLIENT, do not change',
    );
  });
});
