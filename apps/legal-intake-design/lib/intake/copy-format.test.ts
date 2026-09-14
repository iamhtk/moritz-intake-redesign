import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import messages from '@/messages/en.json';

/**
 * Every string in the intake's copy actually formats.
 *
 * The keys are checked elsewhere (`copy-keys.test.ts`); this checks the other
 * half, which is that the message *renders*. next-intl messages are ICU, and
 * ICU is a small language with no type checking: a nested plural with one brace
 * out of place is a runtime error at the moment the sentence appears on screen,
 * and TypeScript, eslint and the build all pass straight over it.
 *
 * It became worth writing when multi-file upload turned nine one-line messages
 * into nine nested plurals, each with two branches and two interpolations. That
 * is a lot of braces to get right by eye, and the failure mode is a red error
 * box where a friendly rejection was supposed to be, at the exact moment the
 * client already knows something went wrong.
 *
 * Arguments are derived from the message itself rather than hand-listed, so a
 * new placeholder is covered the day it is added instead of the day someone
 * remembers to update a fixture.
 */

type Values = Record<string, string | number>;

/** Every `{name}` and `{name, plural, ...}` in a message. */
function argumentsOf(message: string): Values {
  const values: Values = {};
  for (const match of message.matchAll(/\{\s*(\w+)\s*(,\s*(\w+))?/g)) {
    const name = match[1]!;
    // A plural or select needs a number to choose a branch; everything else is
    // a string. Getting this wrong is itself a format error, which is the point.
    values[name] =
      match[3] === 'plural' || match[3] === 'selectordinal' ? 2 : 'x';
  }
  return values;
}

function flatten(
  value: unknown,
  path: string[] = [],
): { key: string; text: string }[] {
  if (typeof value === 'string') return [{ key: path.join('.'), text: value }];
  if (value === null || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, child]) => flatten(child, [...path, key]),
  );
}

const strings = flatten(messages.intake);

describe('the intake copy', () => {
  it('has copy to format', () => {
    expect(strings.length).toBeGreaterThan(60);
  });

  it.each(strings.map(({ key, text }) => [key, text] as const))(
    'intake.%s formats',
    (_key, text) => {
      const errors: unknown[] = [];
      const t = createTranslator({
        locale: 'en',
        messages: { intake: messages.intake },
        namespace: 'intake',
        onError: (error) => errors.push(error),
      });

      // `_key` is the dotted path under `intake`, which is what the translator
      // takes. Cast because the generated key type cannot be known here.
      const rendered = t(_key as never, argumentsOf(text) as never);

      expect(errors).toEqual([]);
      // next-intl falls back to returning the key when a message fails, so a
      // rendered value equal to its own key means it did not format.
      expect(rendered).not.toBe(_key);
      expect(String(rendered).length).toBeGreaterThan(0);
    },
  );

  /*
   * A plural whose branches are identical is a plural that does nothing, and
   * each one is a small trap: the next person to edit the copy has to change
   * the same sentence twice or introduce an inconsistency.
   */
  it('has no plural whose branches say the same thing', () => {
    const pointless = strings.filter(({ text }) => {
      const match = text.match(
        /\{\s*\w+\s*,\s*plural\s*,\s*one\s*\{([^{}]*)\}\s*other\s*\{([^{}]*)\}/,
      );
      return match !== null && match[1] === match[2];
    });
    expect(pointless.map((one) => one.key)).toEqual([]);
  });
});
