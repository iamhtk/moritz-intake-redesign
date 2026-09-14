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

/**
 * The other half of the rule: not how much colour, but whether it is ours.
 *
 * `notes/check-colours.sh` has asked this question for a while and nothing
 * ran it. A shell script that has to be remembered is a rule that holds until
 * the first hurried afternoon, which is how `text-green-600` — Tailwind's
 * `#16a34a`, a different green from the brand's `#5eae8b`, three times over —
 * ended up on the progress bar and the stepper of a flow whose whole argument
 * is restraint. So the script's rules move into the suite, where `pnpm verify`
 * runs them whether anybody remembers or not.
 *
 * Wider than the count above on purpose. `INTAKE_DIR` alone was the blind spot
 * the script itself had to fix: the composer, the message rows, the drop zone
 * and the trust strip are on screen for the entire flow and live in three
 * other directories.
 *
 * **The file-type exception is deliberate and is the only one.** `describeFile`
 * returns `text-red-600` for a PDF, `text-blue-600` for Word, `text-green-600`
 * for Excel. Those are not brand decisions, they are the file's own identity —
 * the icons every one of these clients already recognises from their desktop,
 * and the brief's own worked example of a colour that is allowed to be off
 * palette because it is carrying information the palette cannot. Scoped to the
 * one file that owns the map, so a stray `text-blue-600` anywhere else still
 * fails.
 */
const PALETTE_DIRS = [
  'components/design/intake-v2',
  'components/design/intake/chat',
  'components/design/new-case',
  'components/shared',
  'components/design/tour',
];

/** The file-type colour map, and nothing else. */
const FILE_TYPE_COLOURS = 'components/design/new-case/file-utils.ts';

/**
 * The email preview, which cannot use a class or a custom property at all.
 *
 * Gmail strips `<style>` and does not resolve `var()`, so every colour in a
 * rendered email is an inline literal by necessity. Same carve-out, same file,
 * same reason as `check-colours.sh`'s.
 */
const INLINE_EMAIL = 'components/design/intake-v2/confirmation-email.tsx';

function paletteFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, name.name);
      if (name.isDirectory()) walk(path);
      else if (/\.tsx?$/.test(name.name)) out.push(path);
    }
  };
  for (const dir of PALETTE_DIRS) walk(join(process.cwd(), dir));
  return out;
}

function offences(pattern: RegExp, skip: string[] = []): string[] {
  const root = process.cwd();
  const found: string[] = [];
  for (const path of paletteFiles()) {
    const relative = path.slice(root.length + 1);
    if (skip.some((one) => relative.endsWith(one))) continue;
    code(readFileSync(path, 'utf8'))
      .split('\n')
      .forEach((line, index) => {
        for (const match of line.matchAll(pattern)) {
          found.push(`${relative}:${index + 1}  ${match[0]}`);
        }
      });
  }
  return found;
}

const HUES =
  'red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|gray|grey|zinc|slate|neutral|stone';
const PREFIXES =
  'bg|text|border|ring|from|to|via|fill|stroke|shadow|outline|decoration|accent|caret|divide|placeholder';

describe('every colour in the intake is a Moritz colour', () => {
  it('has files to check', () => {
    expect(paletteFiles().length).toBeGreaterThan(20);
  });

  it('uses no stock Tailwind colour classes', () => {
    const found = offences(
      new RegExp(`\\b(?:${PREFIXES})-(?:${HUES})-[0-9]{2,3}\\b`, 'g'),
      [FILE_TYPE_COLOURS],
    );
    expect(found).toEqual([]);
  });

  it('uses no hex literals', () => {
    const found = offences(/#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b/g, [
      INLINE_EMAIL,
    ]);
    expect(found).toEqual([]);
  });

  it('uses no raw rgb() or hsl()', () => {
    const found = offences(/\b(?:rgba?|hsla?)\([0-9]/g, [INLINE_EMAIL]);
    expect(found).toEqual([]);
  });

  /*
   * The exception has to still be an exception. If `describeFile` ever stops
   * returning these, the skip above is dead weight pretending to be a policy —
   * and worse, it is a hole nobody is watching.
   */
  it('still needs the file-type exception it grants', () => {
    const source = readFileSync(join(process.cwd(), FILE_TYPE_COLOURS), 'utf8');
    expect(source).toContain('text-red-600');
    expect(source).toContain('text-blue-600');
    expect(source).toContain('text-green-600');
  });

  /* And the scan has to be able to fail. */
  it('would catch a stock colour if one came back', () => {
    const pattern = new RegExp(
      `\\b(?:${PREFIXES})-(?:${HUES})-[0-9]{2,3}\\b`,
      'g',
    );
    expect('className="text-green-600"'.match(pattern)).toEqual([
      'text-green-600',
    ]);
    expect('className="bg-slate-50"'.match(pattern)).toEqual(['bg-slate-50']);
    expect('className="bg-success"'.match(pattern)).toBeNull();
  });
});
