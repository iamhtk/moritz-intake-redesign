import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  DESIGN_FLAGS,
  buildDefaultFlagsState,
} from '@/components/design/feature-flags/design-flags-registry';

/**
 * The two keyboard surfaces have to be *on* to exist at all.
 *
 * Both shipped with `defaultValue: false`, which is not the same as being
 * behind a flag — it meant the command palette and Ask Nora were absent from
 * every page, at every viewport, for every role, until somebody found the
 * playground's flag screen and flipped two switches. The palette's whole
 * justification (task K6, §8.10) is that nobody discovers ⌘K on a screen that
 * never mentions it, so shipping its trigger off inverted the feature.
 *
 * Read off the registry rather than the file text, because the thing worth
 * pinning is the resolved default a browser actually gets.
 */
describe('the keyboard surfaces are on by default', () => {
  const defaults = buildDefaultFlagsState();

  it.each(['useCommandPalette', 'useAskNora'] as const)(
    '%s defaults to on',
    (key) => {
      expect(DESIGN_FLAGS.some((flag) => flag.key === key)).toBe(true);
      expect(defaults[key]).toBe(true);
    },
  );

  /*
   * `loadFromStorage` writes every known flag into `localStorage`, so a
   * browser that loaded the app while these were off has a stored `false`
   * that outranks the new default forever. The migration drops the keys; the
   * default then wins. Flipping `defaultValue` without this reaches only
   * people who have never opened the app.
   */
  it('drops the stale stored values so the new default reaches everyone', () => {
    const context = readFileSync(
      join(
        process.cwd(),
        'components/design/feature-flags/design-flags-context.tsx',
      ),
      'utf8',
    );
    expect(context).toContain(
      "id: 'command-palette-and-ask-default-on-2026-09'",
    );
    expect(context).toContain('delete state.useCommandPalette;');
    expect(context).toContain('delete state.useAskNora;');
  });
});
