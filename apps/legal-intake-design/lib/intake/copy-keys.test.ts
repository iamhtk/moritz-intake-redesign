import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import messages from '@/messages/en.json';

/**
 * Every `t('...')` in the intake resolves to real copy.
 *
 * A missing key is the one defect in this flow that types cannot see and the
 * build will not fail on: `useTranslations` is typed by namespace, not by key,
 * so a typo renders the key itself on screen. `intake.sent.addMoreTitle`
 * printed verbatim on the confirmation is the sort of thing that survives to a
 * screenshot, and Wave 5 added copy to seven surfaces at once.
 *
 * Cheaper than a component test and catches the thing a component test would
 * have been written for. It reads the source rather than rendering it, so it
 * needs no DOM and no provider.
 */

/*
 * Every folder whose copy comes out of `en.json`.
 *
 * `intake-v2` is the redesign; `intake/chat` holds the composer, which is
 * shared with the old path and is mostly hardcoded English, but now carries the
 * voice copy in `en.json` and so has keys worth checking.
 *
 * `command-palette` and `ask` were added with Part 8. They are listed here
 * because this guard is the *only* check that can see a typo in a key:
 * `useTranslations` is typed by namespace and not by key, so `ask.emptyTitle`
 * misspelt renders verbatim on screen and the build stays green. A new copy
 * surface that is not in this list is a surface with no guard at all, which is
 * the state the two new folders would have shipped in by default.
 */
const COPY_DIRS = [
  join(process.cwd(), 'components/design/intake-v2'),
  join(process.cwd(), 'components/design/intake/chat'),
  join(process.cwd(), 'components/design/command-palette'),
  join(process.cwd(), 'components/design/ask'),
];

/** Pull the argument text out of every `t(...)` call in a source file. */
function translateCalls(source: string): string[] {
  // One level of nested parentheses is enough for `t('k', { n: f(x) })`.
  const pattern = /\bt\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g;
  return [...source.matchAll(pattern)].map((match) => match[1] ?? '');
}

/**
 * The keys a call could pass. More than one where the key is chosen inline,
 * which the phase-dependent copy does: `t(sent ? 'a' : 'b')`.
 */
function keysIn(argument: string): string[] {
  // Only the first argument holds the key; the rest is the values object, whose
  // strings are data rather than keys.
  const firstArgument = argument.split(/,(?![^{]*})/)[0] ?? '';

  /*
   * For a ternary, only the branches are keys. The condition routinely compares
   * against a phase name that happens to look like one (`phase === 'sent'`), and
   * counting it would report `intake.sent` as missing copy forever.
   */
  const branches = firstArgument.includes('?')
    ? firstArgument.slice(firstArgument.indexOf('?') + 1)
    : firstArgument;

  return [...branches.matchAll(/'([^']+)'/g)].map((match) => match[1]!);
}

function namespacesIn(source: string): string[] {
  return [...source.matchAll(/useTranslations\('([^']+)'\)/g)].map(
    (match) => match[1]!,
  );
}

function lookup(path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        typeof node === 'object' && node !== null
          ? (node as Record<string, unknown>)[part]
          : undefined,
      messages,
    );
}

const files = COPY_DIRS.flatMap((dir) =>
  readdirSync(dir)
    .filter((name) => name.endsWith('.tsx'))
    .map((name) => join(dir, name)),
);

describe('the intake copy', () => {
  it('has files to check', () => {
    expect(files.length).toBeGreaterThan(12);
  });

  /*
   * Guards the guard. `readdirSync` on a missing folder throws, which would be
   * loud, but a folder that exists and has been *renamed* out from under this
   * list fails quietly by simply contributing nothing — and the surface it
   * covered silently loses its only key check. Naming each directory keeps that
   * from happening without a test going red.
   */
  it.each(COPY_DIRS)('%s contributes at least one file', (dir) => {
    expect(files.some((file) => file.startsWith(dir))).toBe(true);
  });

  it.each(files)('%s resolves every key it asks for', (path) => {
    const source = readFileSync(path, 'utf8');
    const namespaces = namespacesIn(source);
    if (namespaces.length === 0) return;

    const missing: string[] = [];
    for (const argument of translateCalls(source)) {
      for (const key of keysIn(argument)) {
        // A component with two namespaces is rare, and resolving under either
        // is enough: this is looking for keys that exist nowhere.
        const found = namespaces.some(
          (namespace) => typeof lookup(`${namespace}.${key}`) === 'string',
        );
        if (!found) missing.push(`${namespaces.join('|')}.${key}`);
      }
    }

    expect(missing).toEqual([]);
  });
});
