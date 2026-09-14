import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chipsForMatter } from './matter-fields';
import { INTAKE_SYSTEM_PROMPT } from './system-prompt';
import {
  INTAKE_TURN_SCHEMA,
  MAX_OPTION_LENGTH,
  MAX_TURN_OPTIONS,
  parseIntakeTurn,
  parseOptions,
  parseWaitingTurn,
} from './turn-schema';

/**
 * One-tap answers the model writes for the question it just asked.
 *
 * The defect this answers was visible in one screenshot: *"is IBM the only
 * other party involved, or is there someone else, like a recruiter or hiring
 * manager, you'd want named as well?"* — a question with exactly two sensible
 * answers, and nothing under it to tap. The chip system could only ever offer
 * the answers a *field* was designed with (`chipsByField`), so a question the
 * designer had not anticipated got either the wrong preset row or nothing.
 *
 * Options are labels and nothing else, which is the property worth testing:
 * clicking one sends that text as an ordinary client message, so nothing here
 * can reach the brief except by the same path as typing.
 */

describe('parseOptions', () => {
  it('keeps a clean list in the model’s order', () => {
    expect(parseOptions(['Just IBM', 'There is also a recruiter'])).toEqual([
      'Just IBM',
      'There is also a recruiter',
    ]);
  });

  it('trims, and drops blanks and non-strings', () => {
    expect(parseOptions(['  Yes  ', '', '   ', 7, null, 'No'])).toEqual([
      'Yes',
      'No',
    ]);
  });

  /* Two buttons that do the same thing, and the client reads both to find out. */
  it('de-duplicates case-insensitively', () => {
    expect(parseOptions(['Yes', 'yes', 'YES', 'No'])).toEqual(['Yes', 'No']);
  });

  it('caps the row, so it stays a nudge rather than a menu', () => {
    const many = Array.from({ length: 12 }, (_, i) => `Option ${i}`);
    expect(parseOptions(many)).toHaveLength(MAX_TURN_OPTIONS);
  });

  /*
   * Dropped rather than truncated: an option cut mid-word is a choice the
   * client cannot read, and the reply above it is still answerable by typing.
   */
  it('drops an option that is a sentence rather than a button', () => {
    const long = 'x'.repeat(MAX_OPTION_LENGTH + 1);
    expect(parseOptions(['Short', long])).toEqual([]);
    expect(parseOptions(['Short', long, 'Also short'])).toEqual([
      'Short',
      'Also short',
    ]);
  });

  /*
   * ⭐ One option is not a choice. It is a suggestion the client has to accept
   * or type around, and it implies the answer.
   */
  it('drops a single-option row entirely', () => {
    expect(parseOptions(['Just IBM'])).toEqual([]);
  });

  it('is empty for anything that is not a list', () => {
    for (const value of [undefined, null, 'Yes', 3, {}]) {
      expect(parseOptions(value)).toEqual([]);
    }
  });
});

describe('the turn carries them', () => {
  const turn = (extra: Record<string, unknown>) =>
    parseIntakeTurn({
      reply: 'Is IBM the only other party?',
      fieldUpdates: [],
      askingAbout: 'otherSide',
      nothingRequiredMissing: false,
      observation: '',
      ...extra,
    });

  it('parses them off the model response', () => {
    expect(
      turn({ options: ['Just IBM', 'Someone else too'] })?.options,
    ).toEqual(['Just IBM', 'Someone else too']);
  });

  /* A turn with no options is the normal turn, not a broken one. */
  it('defaults to none rather than failing the turn', () => {
    expect(turn({})?.options).toEqual([]);
    expect(turn({ options: 'Yes' })?.options).toEqual([]);
    expect(turn({ options: ['only one'] })?.options).toEqual([]);
  });

  it('is a required property of the schema, as an array of plain strings', () => {
    expect(INTAKE_TURN_SCHEMA.required).toContain('options');
    expect(INTAKE_TURN_SCHEMA.properties.options).toEqual({
      type: 'array',
      items: { type: 'string' },
    });
  });

  /* A sealed brief has nothing to offer a one-tap answer to. */
  it('is empty on a waiting turn', () => {
    expect(
      parseWaitingTurn({ reply: 'Somebody is reading it now.' })?.options,
    ).toEqual([]);
  });
});

describe('the prompt', () => {
  it('tells the model what options are and when to leave them empty', () => {
    expect(INTAKE_SYSTEM_PROMPT).toContain('ONE-TAP ANSWERS');
    expect(INTAKE_SYSTEM_PROMPT).toContain('WHEN TO OFFER THEM');
    expect(INTAKE_SYSTEM_PROMPT).toContain('Never fewer than two');
  });

  /*
   * ⭐ "Something else" is conditional, and the condition is in the prompt
   * rather than left to taste. On a yes-or-no question it invites the client to
   * believe there is a third answer being withheld.
   */
  it('makes "Something else" conditional, with both branches named', () => {
    expect(INTAKE_SYSTEM_PROMPT).toContain('"SOMETHING ELSE", AND WHEN NOT TO');
    expect(INTAKE_SYSTEM_PROMPT).toContain(
      'Leave it off when the list is exhaustive',
    );
    expect(INTAKE_SYSTEM_PROMPT).toContain('Off: a yes-or-no question');
  });

  /*
   * ⭐ The model could not offer the preset answers because it could not see
   * them. The catalogue prints the labels now, so a question about urgency can
   * carry the product's own agreed wording instead of the model's paraphrase.
   */
  it('shows the model each field’s ready-made answers', () => {
    expect(INTAKE_SYSTEM_PROMPT).toContain('ready-made answers:');

    const urgency = chipsForMatter('contract')['urgency'];
    expect(urgency, 'urgency should ship preset chips').toBeDefined();
    for (const chip of urgency!) {
      expect(INTAKE_SYSTEM_PROMPT).toContain(chip.label);
    }
  });

  /* Reordering is encouraged; rewording is not, because the labels are agreed. */
  it('lets the model reorder the presets but not reword them', () => {
    expect(INTAKE_SYSTEM_PROMPT).toContain('You may reorder them');
    expect(INTAKE_SYSTEM_PROMPT).toContain('Do not reword them');
  });

  /*
   * The ready-made line is built from labels and joined, nothing more.
   *
   * Asserted as the exact rendered string rather than as "the values are
   * absent", which is not a true property and was the first thing I got wrong
   * here: several chip values are ordinary words the prompt uses anyway
   * ("contract"), and the matter ids are printed on purpose. What is worth
   * pinning is the shape of the line the model reads.
   */
  it('renders the ready-made answers as labels joined by a pipe', () => {
    const urgency = chipsForMatter('contract')['urgency']!;
    const expected = urgency.map((chip) => chip.label).join(' | ');
    expect(INTAKE_SYSTEM_PROMPT).toContain(`ready-made answers: ${expected}`);
  });

  /* A field with no presets gets no line, rather than an empty one. */
  it('says nothing about fields that have no ready-made answers', () => {
    const chips = chipsForMatter('contract');
    expect(
      chips['situation'],
      'situation should have no presets',
    ).toBeUndefined();
    expect(INTAKE_SYSTEM_PROMPT).not.toContain('ready-made answers: \n');
  });
});

describe('the chat column renders them', () => {
  const source = readFileSync(
    join(process.cwd(), 'components/design/intake-v2/chat-column.tsx'),
    'utf8',
  )
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  /* Model options win; presets remain the fallback for the fields that have them. */
  it('prefers the model’s options over the preset lookup', () => {
    expect(source).toContain('ownOptions ??');
    expect(source).toContain('chipsByField[message.chipsFor]');
  });

  it('derives each option’s value from its own label', () => {
    expect(source).toContain('value: label');
  });

  /*
   * A turn carrying options is asking a question, so the "only the newest
   * unanswered row stays live" rule has to see it — otherwise two questions are
   * live at once.
   */
  it('counts an options row when deciding which question is live', () => {
    const live = source.slice(
      source.indexOf('const liveChipsId'),
      source.indexOf('return ('),
    );
    expect(live).toContain('message.options');
  });
});
