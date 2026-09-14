import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The confidence ramp is coloured, and every step of it is readable.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS TEST EXISTS RATHER THAN A NOTE IN A COMMENT.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This ramp has now been removed once. It went green / amber / red -> grey in
 * the accessibility pass, on a correct measurement (the brand status swatches
 * are 2.66:1, 2.05:1 and 3.57:1 as text on white, against AA's 4.5:1) and an
 * over-broad remedy: the column stopped being coloured rather than starting to
 * be readable. The reading is an ordered three-step scale and the ordering was
 * the whole point of it.
 *
 * Both halves of that history are failure modes, and each is the other's fix,
 * so both are asserted here:
 *
 * 1. **The ramp is coloured.** A future tidy that flattens it back to
 *    `muted-foreground` fails.
 * 2. **Every step clears AA.** A future tidy that reaches for the raw brand
 *    swatch because it is brighter also fails.
 *
 * The contrast is *recomputed from `globals.css`*, not copied from it. The
 * numbers in that file's comment are a claim; this is the check. The oklab
 * implementation below verifies itself against `--warning-strong`, whose
 * resolved value (#c0703d) that file has documented since long before this
 * test, so a bug in the maths shows up as a failure here rather than as a
 * confidently wrong pass.
 */

const CSS = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
const ROW = readFileSync(
  join(process.cwd(), 'components/design/intake-v2/brief-field-row.tsx'),
  'utf8',
);

/* ── sRGB <-> oklab, enough of it to resolve a `color-mix(in oklab, …)`. ── */

function toLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function toSrgb(channel: number): number {
  const v =
    channel <= 0.0031308
      ? 12.92 * channel
      : 1.055 * channel ** (1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
}

type Oklab = [number, number, number];

function hexToOklab(hex: string): Oklab {
  const clean = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) =>
    toLinear(parseInt(clean.slice(i, i + 2), 16)),
  ) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToHex([L, A, B]: Oklab): string {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return `#${rgb.map((c) => toSrgb(c).toString(16).padStart(2, '0')).join('')}`;
}

/** `color-mix(in oklab, a pct%, b)`. Both operands opaque, so a plain lerp. */
function mix(a: Oklab, b: Oklab, pct: number): Oklab {
  const f = pct / 100;
  return [
    a[0] * f + b[0] * (1 - f),
    a[1] * f + b[1] * (1 - f),
    a[2] * f + b[2] * (1 - f),
  ];
}

const BLACK: Oklab = [0, 0, 0];

function luminance(hex: string): number {
  const clean = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) =>
    toLinear(parseInt(clean.slice(i, i + 2), 16)),
  ) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(one: string, two: string): number {
  const [hi, lo] = [luminance(one), luminance(two)].sort((a, b) => b - a) as [
    number,
    number,
  ];
  return (hi + 0.05) / (lo + 0.05);
}

/** Pull a `--token: #hex;` straight out of the stylesheet. */
function swatch(name: string): string {
  const found = new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, 'i').exec(CSS);
  expect(found, `${name} is not a hex swatch in globals.css`).toBeTruthy();
  return found![1]!;
}

/** The percentage `--token` mixes its base with black by. */
function darkenedBy(name: string): number {
  const found = new RegExp(`${name}:[^;]*?(\\d+)%,\\s*\\n?\\s*black`, 's').exec(
    CSS,
  );
  expect(found, `${name} is not a mix toward black`).toBeTruthy();
  return Number(found![1]);
}

const GREEN = swatch('--mz-green');
const YELLOW = swatch('--mz-yellow');
const RED = swatch('--mz-red');

/** The amber steps go through the yellow/red blend, never straight to black. */
const AMBER_BASE = mix(hexToOklab(YELLOW), hexToOklab(RED), 60);

describe('the oklab maths this file relies on', () => {
  /*
   * `--warning-strong` has had its resolved value written next to it in
   * `globals.css` since before this test existed, and it uses exactly the
   * nested-mix shape the ink tokens use. If the implementation above is
   * wrong, it is wrong here first.
   */
  it('reproduces the value globals.css documents for --warning-strong', () => {
    const resolved = oklabToHex(
      mix(AMBER_BASE, BLACK, darkenedBy('--warning-strong')),
    );
    expect(resolved).toBe('#c0703d');
    expect(CSS).toContain('#c0703d');
  });
});

describe('the status ramp at text weight', () => {
  const ink = () => ({
    'success-ink': oklabToHex(
      mix(hexToOklab(GREEN), BLACK, darkenedBy('--success-ink')),
    ),
    'warning-ink': oklabToHex(
      mix(AMBER_BASE, BLACK, darkenedBy('--warning-ink')),
    ),
    'destructive-ink': oklabToHex(
      mix(hexToOklab(RED), BLACK, darkenedBy('--destructive-ink')),
    ),
  });

  /*
   * White is the brief panel and gold is the one tinted surface in the flow.
   * A token that only survives one background is a trap for whoever reuses it.
   */
  it.each(['#ffffff', '#fbf6ed'])('clears AA on %s', (surface) => {
    for (const [name, hex] of Object.entries(ink())) {
      expect(
        contrast(hex, surface),
        `${name} (${hex}) on ${surface}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  /*
   * Darkened, not recoloured. Mixing a yellow toward black in oklab loses
   * chroma as fast as lightness and lands on a brown, which on a three-step
   * ramp reads as a missing middle; the amber therefore goes through the
   * yellow/red blend first. This checks the three still read as three.
   *
   * Measured across oklab's a/b plane rather than by contrast ratio. All
   * three steps are deliberately near the same lightness — that is what makes
   * them equally readable — so a luminance comparison says they are identical
   * and says nothing about the only axis that separates them. Distance on the
   * chroma plane is the one that answers "are these different colours".
   *
   * The corollary is the reason the words below are not optional: at equal
   * lightness, a client who cannot separate the hues sees three identical
   * greys. The colour is the second channel and never the only one.
   */
  it('keeps the three steps distinguishable from each other', () => {
    const labs = Object.entries(ink()).map(
      ([name, hex]) => [name, hex, hexToOklab(hex)] as const,
    );
    expect(new Set(labs.map(([, hex]) => hex)).size).toBe(3);
    for (const [oneName, oneHex, one] of labs) {
      for (const [twoName, twoHex, two] of labs) {
        if (oneName === twoName) continue;
        const apart = Math.hypot(one[1] - two[1], one[2] - two[2]);
        expect(
          apart,
          `${oneName} (${oneHex}) and ${twoName} (${twoHex}) are the same hue`,
        ).toBeGreaterThan(0.04);
      }
    }
  });

  it('adds no new hex to the palette', () => {
    for (const token of [
      '--success-ink',
      '--warning-ink',
      '--destructive-ink',
    ]) {
      const line = new RegExp(`${token}:([^;]*);`, 's').exec(CSS)?.[1] ?? '';
      expect(line, token).toContain('var(--mz-');
      expect(line, token).not.toMatch(/#[0-9a-f]{3,8}/i);
    }
  });
});

describe('the brief panel’s confidence reading', () => {
  it('is a traffic light, not a column of grey', () => {
    const ramp = /const LEVEL_STYLE[^}]*}/s.exec(ROW)?.[0] ?? '';
    expect(ramp).toContain('text-success-ink');
    expect(ramp).toContain('text-warning-ink');
    expect(ramp).toContain('text-destructive-ink');
    expect(ramp).not.toContain('text-muted-foreground');
  });

  /*
   * The colour is a second channel on a complete first one. "High", "Medium"
   * and "Check this" are still spelled out beside the percentage, so nothing
   * in this column is carried by hue alone.
   */
  it('still says the reading in words', () => {
    expect(ROW).toContain('t(`confidence.${reading.level}`)');
  });
});
