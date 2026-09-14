import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every animation this app defines has a reduced-motion fallback, and the
 * fallback lands on the finished frame.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY A LINT AND NOT A REVIEW NOTE.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `animations.md` sets one rule with no exceptions — *every item needs a
 * `prefers-reduced-motion` fallback: a plain swap, no motion* — across a list
 * of eighty. A rule applied eighty times by hand is a rule that holds for the
 * first sixty, and the ones that get missed are the ones added last, in a
 * hurry, which is also when nobody re-reads the doc.
 *
 * So the rule is enforced structurally: define a `.mz-animate-*` utility
 * without a matching entry inside a `prefers-reduced-motion` block and this
 * fails, naming the utility.
 *
 * **The second assertion is the one that catches the subtle bug.** Turning an
 * animation off is not the same as skipping it. Every utility here uses
 * `both`, which parks the element on the *first* keyframe until the animation
 * runs — so a bare `animation: none` leaves a tick at `stroke-dashoffset: -26`
 * (invisible), a value at `opacity: 0` (invisible) and a fill at
 * `background-size: 0%` (unfilled). A client who asked for less motion would
 * get less content, which is a worse failure than the motion was.
 *
 * A correct fallback therefore restates the end state. This checks that each
 * one says something beyond `animation: none`, which is a proxy rather than a
 * proof — but it is the difference between "somebody thought about this" and
 * "somebody pattern-matched the line above".
 */

const CSS = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');

/** The bodies of every `@media (prefers-reduced-motion: reduce)` block. */
function reducedMotionBlocks(): string[] {
  const blocks: string[] = [];
  const opener = '@media (prefers-reduced-motion: reduce) {';
  let from = CSS.indexOf(opener);

  while (from !== -1) {
    /* Brace-count rather than a regex: these blocks contain nested rules. */
    let depth = 0;
    let index = from + opener.length - 1;
    for (; index < CSS.length; index += 1) {
      if (CSS[index] === '{') depth += 1;
      if (CSS[index] === '}') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    blocks.push(CSS.slice(from, index + 1));
    from = CSS.indexOf(opener, index);
  }

  return blocks;
}

/** Every `.mz-animate-*` class the stylesheet defines outside a media block. */
function definedUtilities(): string[] {
  const reduced = reducedMotionBlocks().join('\n');
  const all = [...CSS.matchAll(/\.(mz-animate-[a-z-]+)/g)].map((m) => m[1]!);
  const inReduced = new Set(
    [...reduced.matchAll(/\.(mz-animate-[a-z-]+)/g)].map((m) => m[1]!),
  );
  /* Defined = mentioned somewhere that is not only a reduced-motion block. */
  return [...new Set(all)].filter(
    (name) =>
      !inReduced.has(name) || CSS.split(reduced).join('').includes(`.${name}`),
  );
}

describe('the reduced-motion contract', () => {
  it('finds the utilities and the blocks', () => {
    expect(reducedMotionBlocks().length).toBeGreaterThan(0);
    expect(definedUtilities().length).toBeGreaterThan(8);
  });

  it('switches every animation utility off', () => {
    const reduced = reducedMotionBlocks().join('\n');
    const missing = definedUtilities().filter(
      (name) => !reduced.includes(`.${name}`),
    );
    expect(
      missing,
      `no prefers-reduced-motion fallback for: ${missing.join(', ')}`,
    ).toEqual([]);
  });

  /*
   * The intake's own motion layer, where `both` makes the distinction between
   * "off" and "finished" load-bearing. Scoped to these rather than to every
   * utility in the file because the older ones (`mz-animate-step`, the
   * marquee) animate from a *visible* first frame, where plain `none` is
   * already the finished state.
   */
  const PARKS_ON_AN_INVISIBLE_FRAME = [
    'mz-animate-confirm-fill',
    'mz-animate-confirm-tick',
    'mz-animate-arrive',
    'mz-animate-cascade',
    'mz-animate-fill-lr',
    'mz-animate-sweep',
  ];

  it.each(PARKS_ON_AN_INVISIBLE_FRAME)(
    '%s lands on its finished frame, not its first',
    (name) => {
      const reduced = reducedMotionBlocks().join('\n');
      const at = reduced.indexOf(`.${name}`);
      expect(at, `${name} has no fallback at all`).toBeGreaterThan(-1);

      /*
       * The rule this selector belongs to. Selectors are grouped, so walk
       * forward to the first `{` and take the declarations after it.
       */
      const body = reduced.slice(at, reduced.indexOf('}', at));
      const declarations = body
        .slice(body.indexOf('{') + 1)
        .split(';')
        .map((one) => one.trim())
        .filter(Boolean);

      expect(
        declarations.some((one) => !one.startsWith('animation')),
        `${name} only says "animation: none", which parks it on an invisible first frame`,
      ).toBe(true);
    },
  );

  /*
   * §6: nothing loops except the one ambient breath, and nothing runs over
   * 500ms except the send. `mz-animate-breathe` is the allowed loop; the
   * marquee and the waveform predate the intake and belong to the homepage
   * and the dictation control.
   */
  it('keeps looping animations to the ones §6 allows', () => {
    const infinite = [
      ...CSS.matchAll(/\.(mz-animate-[a-z-]+)\s*\{[^}]*infinite/g),
    ]
      .map((m) => m[1]!)
      .sort();
    expect(infinite).toEqual(
      [
        'mz-animate-breathe',
        'mz-animate-marquee',
        'mz-animate-waveform',
      ].sort(),
    );
  });
});
