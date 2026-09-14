import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Colour in the intake stays countable.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS TEST CHANGED DIRECTION. GREEN IS NO LONGER CAPPED AT ONE.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * It used to assert green appeared exactly once, on the progress bar. The
 * defect behind that rule was real: green had arrived four separate times, each
 * defensible on its own — the confirmed mark, the High reading, the Accepted
 * receipt, the all-confirmed notice — and four *different meanings* on one
 * colour is a counting failure, the same shape `waits.ts` fixed for labels.
 *
 * The rule drawn from it was "use green once", and that was the wrong
 * generalisation. The problem was never the number of places; it was that the
 * places disagreed about what the colour meant. Green now has exactly one
 * meaning in this flow — **settled, and good** — and the four surfaces that
 * carry it are four views of that one fact: the tick on a confirmed row, the
 * High reading, the client's own confirmation, and the word "Accepted". The
 * confidence ramp is a traffic light again (green / amber / red), which is the
 * ordered three-step scale people already know how to read.
 *
 * So all three colours are capped rather than counted. A cap still catches the
 * thing worth catching — colour spreading into decoration — without pretending
 * that one use is the only disciplined number.
 *
 * `notes/check-colours.sh` answers a different question: whether a colour is on
 * the palette at all. This one is about how much of it there is.
 */

const INTAKE_DIR = join(process.cwd(), 'components/design/intake-v2');

/**
 * Class names for the flow's three earned colours.
 *
 * Prefix-anchored so `bg-success` and `text-success-foreground` both count, and
 * the raw token names are included because a `[color:var(--mz-green)]` escape
 * hatch would otherwise walk straight past this.
 */
const PATTERNS: Readonly<Record<string, RegExp>> = {
  green:
    /\b(?:bg|text|border|ring|fill|stroke|from|to|via)-success\b|--mz-green\b/g,
  warning:
    /\b(?:bg|text|border|ring|fill|stroke|from|to|via)-warning\b|--mz-yellow\b/g,
  destructive:
    /\b(?:bg|text|border|ring|fill|stroke|from|to|via)-destructive\b|--mz-red\b/g,
};

/**
 * Strip block comments and line comments before counting.
 *
 * Without this the count is dominated by the comments *explaining* the
 * restraint, which is a funny way to fail a test about restraint. A colour named
 * in prose is documentation.
 */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

function usages(pattern: RegExp): { file: string; line: number }[] {
  const found: { file: string; line: number }[] = [];
  for (const name of readdirSync(INTAKE_DIR)) {
    if (!name.endsWith('.tsx') && !name.endsWith('.ts')) continue;
    const lines = code(readFileSync(join(INTAKE_DIR, name), 'utf8')).split(
      '\n',
    );
    lines.forEach((line, index) => {
      if (new RegExp(pattern.source).test(line)) {
        found.push({ file: name, line: index + 1 });
      }
    });
  }
  return found;
}

describe('colour restraint in the intake', () => {
  it('has files to check', () => {
    expect(readdirSync(INTAKE_DIR).length).toBeGreaterThan(12);
  });

  /*
   * All three capped, none counted. Each means one thing and each can
   * legitimately mean it in more than one place: green is settled-and-good,
   * amber is worth-a-look, red is stop-here. The failure message names every
   * site, because the useful thing to know is *where* the drift happened.
   */
  it.each([
    ['green', 12],
    ['warning', 8],
    ['destructive', 5],
  ])('keeps %s to a handful, never decoration', (name, cap) => {
    const found = usages(PATTERNS[name]!);
    expect(
      found.length,
      `${name} is used ${found.length} times: ${found
        .map((one) => `${one.file}:${one.line}`)
        .join(', ')}`,
    ).toBeLessThanOrEqual(cap);
  });

  /*
   * The half of the old rule worth keeping: green means one thing, *settled
   * and good*, and only the surfaces where settled can be true are allowed to
   * say it — the progress bar, the rows' ticks and readings, and the finished
   * steps on the journey rail. A green anywhere else in the flow is a new
   * meaning, which is the failure the original test was really about.
   *
   * `brief-stepper.tsx` was on this list and is gone: it and `case-progress`
   * were one stepper drawn twice, and `journey-rail.tsx` is the single
   * replacement. The rail is also the strictest use of the three — a bare
   * tick, no filled disc, no rail tint — because it sits in the margin for the
   * whole flow and four green badges down the side of a law firm's intake is
   * exactly the SaaS-dashboard failure the rail is written against.
   */
  it('keeps green where settled means something', () => {
    const files = [...new Set(usages(PATTERNS.green!).map((one) => one.file))];
    expect(files.sort()).toEqual(
      [
        'brief-column.tsx',
        'brief-field-row.tsx',
        'journey-rail.tsx',
        // The same rail laid out horizontally for narrow screens, so the same
        // tick for the same reason. Two files rather than one because the
        // layouts are genuinely different shapes, not because the meaning is.
        'journey-bar.tsx',
        // The same progress bar as `brief-column.tsx`, moved up into the
        // phone's collapsible header so it survives the brief being closed.
        // One meaning, two places it has to be drawn — the panel is hidden
        // below `lg` and the header is hidden above it, so only ever one of
        // them is on screen.
        'brief-summary-bar.tsx',
      ].sort(),
    );
  });
});
