import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import messages from '@/messages/en.json';
import { INTAKE_PHASES } from '@/lib/intake/phase';
import {
  TOUR_SCREENS,
  TOUR_STOP_COUNT,
  allStops,
  href,
  nextScreen,
  screenById,
  selectorFor,
  stopOffset,
} from './registry';

/**
 * The registry is a contract with the source, and this is where it is held.
 *
 * A tour target is a `data-tour` attribute somebody could delete while
 * tidying a component, and nothing at runtime would object: driver skips a
 * missing element, so the stop would simply not appear and the reviewer
 * would see a tour that jumps. So every target named here has to be findable
 * in the source, every stop has to have copy, and every screen's phase has to
 * be one the intake can actually be in.
 */

const ROOT = process.cwd();
const SOURCE_DIRS = ['components', 'app'];

function* files(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else if (/\.(tsx|ts)$/.test(name) && !name.endsWith('.test.ts')) yield path;
  }
}

const SOURCE = SOURCE_DIRS.flatMap((dir) =>
  [...files(join(ROOT, dir))].map((path) => readFileSync(path, 'utf8')),
).join('\n');

/**
 * Whether a `data-tour` value is produced somewhere in the source.
 *
 * Three shapes are accepted: a literal attribute, a literal passed as a
 * `tourTarget` prop, and a template whose static prefix matches (the rail's
 * `journey-step-${step}` and the quote card's `quote-${response}`). A prefix
 * match is allowed only when the target has a `-` in it, so `composer` cannot
 * be satisfied by `composer-tools`.
 */
function targetInSource(target: string): boolean {
  if (SOURCE.includes(`data-tour="${target}"`)) return true;
  if (SOURCE.includes(`tourTarget="${target}"`)) return true;
  if (SOURCE.includes(`'${target}'`)) return true;
  // A template with a static prefix: try every prefix the dashes allow.
  for (let i = target.indexOf('-'); i !== -1; i = target.indexOf('-', i + 1)) {
    const prefix = target.slice(0, i + 1);
    if (SOURCE.includes(`data-tour={\`${prefix}\${`)) return true;
  }
  return false;
}

describe('the tour registry', () => {
  it('names only targets that exist in the source', () => {
    const missing = allStops()
      .flatMap((stop) => [
        stop.target,
        stop.action?.kind === 'click' ? stop.action.target : null,
        ...(stop.before ?? []).map((a) =>
          a.kind === 'click' ? a.target : null,
        ),
      ])
      .filter((t): t is string => t !== null)
      .filter((t) => !targetInSource(t));
    expect(missing).toEqual([]);
  });

  it('has copy for every stop', () => {
    const copy = (messages as { tour: { stop: Record<string, unknown> } }).tour
      .stop;
    for (const stop of allStops()) {
      expect(copy, `tour.stop.${stop.id}`).toHaveProperty(stop.id);
      const entry = copy[stop.id] as { title?: string; body?: string };
      expect(entry.title, `${stop.id}.title`).toBeTruthy();
      expect(entry.body, `${stop.id}.body`).toBeTruthy();
    }
  });

  it('has no copy for stops that do not exist', () => {
    const copy = (messages as { tour: { stop: Record<string, unknown> } }).tour
      .stop;
    const ids = new Set(allStops().map((s) => s.id));
    expect(Object.keys(copy).filter((k) => !ids.has(k))).toEqual([]);
  });

  it('claims only phases the intake can be in', () => {
    for (const screen of TOUR_SCREENS) {
      expect(INTAKE_PHASES as readonly string[]).toContain(screen.phase);
    }
  });

  it('has unique stop ids and unique screen ids', () => {
    const ids = allStops().map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const screens = TOUR_SCREENS.map((s) => s.id);
    expect(new Set(screens).size).toBe(screens.length);
  });

  it('navigates only to screens it defines', () => {
    for (const stop of allStops()) {
      if (stop.action?.kind === 'navigate') {
        expect(screenById(stop.action.to)).toBeDefined();
      }
    }
  });

  it('chains the screens in registry order', () => {
    for (let i = 0; i < TOUR_SCREENS.length - 1; i++) {
      expect(nextScreen(TOUR_SCREENS[i]!.id)?.id).toBe(TOUR_SCREENS[i + 1]!.id);
    }
    expect(nextScreen(TOUR_SCREENS.at(-1)!.id)).toBeUndefined();
  });

  it('offsets add up to the stop count', () => {
    const last = TOUR_SCREENS.at(-1)!;
    expect(stopOffset(last.id) + last.stops.length).toBe(TOUR_STOP_COUNT);
  });

  it('puts the tour parameter on every screen address', () => {
    for (const screen of TOUR_SCREENS) {
      expect(href(screen)).toContain('tour=');
      if (screen.demo !== null)
        expect(href(screen)).toContain(`demo=${screen.demo}`);
    }
  });

  it('selects by attribute, never by class', () => {
    expect(selectorFor('composer')).toBe('[data-tour="composer"]');
  });

  it('asks the continue question with no target', () => {
    const ask = allStops().find((s) => s.id === 'continueToCase');
    expect(ask?.target).toBeNull();
    expect(ask?.action?.kind).toBe('navigate');
  });
});

describe('the driver theme', () => {
  // Comments describe what the library ships and may quote its colours;
  // only the rules count.
  const css = readFileSync(
    join(ROOT, 'lib/tour/driver-theme.css'),
    'utf8',
  ).replace(/\/\*[\s\S]*?\*\//g, '');

  it('uses no colour that is not a token', () => {
    // No hex, no rgb(), no named Tailwind hue: every colour is a var().
    expect(css.match(/#[0-9a-f]{3,8}\b/gi) ?? []).toEqual([]);
    expect(css.match(/\brgba?\(/g) ?? []).toEqual([]);
  });

  it('does not import the library stylesheet', () => {
    expect(css).not.toMatch(/@import/);
  });
});
