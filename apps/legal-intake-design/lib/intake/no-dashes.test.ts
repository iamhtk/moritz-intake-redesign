import { describe, expect, it } from 'vitest';
import messages from '@/messages/en.json';
import { stripDashes } from './text';

/**
 * The dash rule, enforced over the copy as well as over the model (D).
 *
 * `stripDashes` already cleans every string a model returns, and the rule is in
 * all three prompts. What neither of those covers is a dash typed into the
 * intake's own copy by hand, which is how the first version of the sent state
 * shipped an em dash in `sent.disagreement` and an en dash in three turnaround
 * estimates. A prompt rule cannot catch that and a type cannot either.
 *
 * Scoped to the `intake` subtree on purpose. Moritz's existing product uses em
 * dashes throughout and this is a deliberate departure inside the new intake,
 * not a repo-wide style fix, so asserting over the whole file would fail on
 * copy this rule was never meant to touch.
 */
const DASHES = /[—–―]|--/;

function flatten(
  value: unknown,
  path = 'intake',
): { path: string; text: string }[] {
  if (typeof value === 'string') return [{ path, text: value }];
  if (value === null || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, child]) => flatten(child, `${path}.${key}`),
  );
}

describe('the intake copy', () => {
  const strings = flatten(messages.intake);

  it('has copy to check', () => {
    expect(strings.length).toBeGreaterThan(40);
  });

  it('contains no em dash, en dash or double hyphen', () => {
    const offenders = strings
      .filter((entry) => DASHES.test(entry.text))
      .map((entry) => `${entry.path}: ${entry.text}`);
    expect(offenders).toEqual([]);
  });
});

describe('stripDashes over the estimates the confirmation shows', () => {
  // Belt and braces: if someone reintroduces a range with a dash, the cleaner
  // would turn it into something ugly rather than wrong, so the copy has to be
  // written without one in the first place.
  it('would mangle a dashed range, which is why they are written with "to"', () => {
    expect(stripDashes('2–4 hours')).toBe('2, 4 hours');
  });
});
