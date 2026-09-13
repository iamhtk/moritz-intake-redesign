import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * L13, as something that fails the build: three radii and no more.
 *
 * The rulebook said "very few radii", which is the kind of instruction that is
 * agreed with and then not followed, because nothing ever fails. Legora's
 * product gives the actual three, and the useful discovery was that this app's
 * own foundations had already chosen them — they just were not being obeyed in
 * the intake:
 *
 *   - `rounded-2xl`      cards and panels        (`foundations/card.tsx`)
 *   - `rounded-[0.5rem]` buttons and fields      (`foundations/button.tsx`,
 *                                                 `input.tsx`, the composer)
 *   - `rounded-full`     chips, pills, avatars   (`foundations/chip.tsx`)
 *
 * The intake had five: a `rounded-xl` on the post-submit drop zone and three
 * `rounded-md` focus rings on small text controls, none of them a decision, all
 * of them the nearest Tailwind class to hand at the moment somebody needed a
 * corner. That is how a radius scale stops being a scale.
 *
 * `0.5rem` is a literal rather than `rounded-lg` on purpose, and the reason is
 * in `button.tsx`: this theme's own `rounded-lg` token is 10px, not the stock
 * 8px, so the class and the intent disagree. The literal is the one that
 * matches the foundations.
 */

const INTAKE_DIR = join(process.cwd(), 'components/design/intake-v2');

/**
 * The three, plus the side-scoped forms of them.
 *
 * `rounded-b-2xl` counts as the card radius: it is the same corner on two sides
 * of one card (the email preview's scroll container, whose top corners are
 * owned by the dialog above it).
 */
const ALLOWED = new Set([
  'rounded-2xl',
  'rounded-t-2xl',
  'rounded-b-2xl',
  'rounded-[0.5rem]',
  'rounded-full',
  // Inherit is not a fourth radius, it is a refusal to pick one: an overlay
  // that takes the exact corner of whatever it covers.
  'rounded-[inherit]',
  // Derived from the field radius, for a child sitting inside a 1px border.
  'rounded-t-[calc(0.5rem-1px)]',
  'rounded-b-[calc(0.5rem-1px)]',
]);

/** Strip comments: a radius named in prose is documentation, not a corner. */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

describe('the radii in the intake', () => {
  const found = new Map<string, string[]>();
  for (const name of readdirSync(INTAKE_DIR)) {
    if (!name.endsWith('.tsx') && !name.endsWith('.ts')) continue;
    const source = code(readFileSync(join(INTAKE_DIR, name), 'utf8'));
    /*
     * The side prefixes are listed rather than matched as "one or two letters",
     * which is what the first version did and it silently read `rounded-full`
     * as the side `fu` with no size — so the flow's most-used radius was
     * reported as a stray and the "still uses all three" check failed on it.
     * Two-letter corners come first, or `tl` matches as `t` and leaves an `l`
     * behind.
     */
    for (const match of source.matchAll(
      /\brounded(?:-(?:tl|tr|bl|br|ss|se|es|ee|t|b|l|r|s|e))?(?:-(?:none|sm|md|lg|xl|2xl|3xl|full))?(?:-\[[^\]]+\])?/g,
    )) {
      const token = match[0];
      found.set(token, [...(found.get(token) ?? []), name]);
    }
  }

  it('finds corners to check', () => {
    expect(found.size).toBeGreaterThan(2);
  });

  it('uses only the foundations three', () => {
    const strays = [...found.entries()]
      .filter(([token]) => !ALLOWED.has(token))
      .map(([token, files]) => `${token} in ${[...new Set(files)].join(', ')}`);
    expect(
      strays,
      'the three are rounded-2xl (cards), rounded-[0.5rem] (buttons and fields) and rounded-full (chips)',
    ).toEqual([]);
  });

  /*
   * The other half of "and no more". Without this, the test above passes
   * happily on a flow that has quietly stopped using two of the three — which
   * would mean the scale had been abandoned rather than obeyed.
   */
  it('still uses all three of them', () => {
    for (const token of ['rounded-2xl', 'rounded-[0.5rem]', 'rounded-full']) {
      expect(found.has(token), `${token} is no longer used anywhere`).toBe(
        true,
      );
    }
  });
});
