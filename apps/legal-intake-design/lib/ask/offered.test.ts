import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { askOffered } from './availability';
import { isIntakeRoute } from '@/lib/intake/route-match';
import type { Role } from '@/lib/types';

/**
 * The test that exists because Ask Nora disappeared twice.
 *
 * Both times the feature worked and the API answered; what failed was that
 * `TopNav` and `DashboardOverlays` each carried their own copy of "is Ask on?"
 * and the copies drifted. First the trigger was offered where the panel was
 * not (a dead button and a dead ⌘J on `/client/new`), then the route term was
 * added to both and Nora vanished from that screen instead.
 *
 * So these assertions are less about the boolean than about its shape: one
 * predicate, no pathname, and both surfaces reaching it through the same hook.
 */

const ROLES: Role[] = [
  'NON_LEGAL',
  'LEGAL',
  'INTERNAL_ADMIN',
  'INTERNAL_ASSISTANT',
];

describe('askOffered', () => {
  it('is on for a client with the flag on', () => {
    expect(askOffered('NON_LEGAL', true)).toBe(true);
  });

  it('is off for every role Ask does not answer for', () => {
    for (const role of ROLES.filter((r) => r !== 'NON_LEGAL')) {
      expect(askOffered(role, true)).toBe(false);
    }
  });

  it('is off when the flag is explicitly off', () => {
    for (const role of ROLES) {
      expect(askOffered(role, false)).toBe(false);
    }
  });
});

describe('Ask is offered on every route, the intake included', () => {
  /*
   * `askOffered` takes no pathname at all, which is the real guarantee — there
   * is no argument a caller could pass to switch Ask off for a screen. The
   * rows below are the paths that actually hid it, kept as named cases so that
   * reintroducing a route term means deleting a test that says why not to.
   */
  const INTAKE_PATHS = ['/client/new', '/client/new/review', '/en/client/new'];
  const OTHER_PATHS = ['/client/cases', '/client/newsletter', '/'];

  it.each(INTAKE_PATHS)('is on for a client at %s (the intake)', (pathname) => {
    expect(isIntakeRoute(pathname)).toBe(true);
    expect(askOffered('NON_LEGAL', true)).toBe(true);
  });

  it.each(OTHER_PATHS)('is on for a client at %s', (pathname) => {
    expect(isIntakeRoute(pathname)).toBe(false);
    expect(askOffered('NON_LEGAL', true)).toBe(true);
  });

  it('answers identically on and off the intake route', () => {
    const answers = [...INTAKE_PATHS, ...OTHER_PATHS].map(() =>
      askOffered('NON_LEGAL', true),
    );
    expect(new Set(answers).size).toBe(1);
  });
});

/**
 * The structural half: the trigger and the panel must not be able to disagree.
 *
 * Asserted from source, because mounting the shell means mounting the whole
 * dashboard and the claim here is textual anyway — neither surface may build
 * its own answer, and neither may qualify the shared one.
 */
describe('the trigger and the panel cannot drift apart again', () => {
  const read = (relativePath: string) =>
    readFileSync(join(process.cwd(), relativePath), 'utf8');

  const SURFACES = [
    'components/design/top-nav/top-nav.tsx',
    'components/navigation/dashboard-shell.tsx',
  ];

  it.each(SURFACES)('%s reads the shared hook and nothing else', (path) => {
    const source = read(path);
    expect(source).toContain('useAskAvailable');
    // Reimplementing the rule is what caused both regressions.
    expect(source).not.toContain('isAskAvailableFor');
    expect(source).not.toContain('askOffered(');
  });

  /*
   * Whitespace-stripped exact matches, and they earn the brittleness.
   *
   * A looser check on the hook call is not enough: both surfaces store the
   * result in an `askAvailable` local first, so a regex hunting for
   * `useAskAvailable(...) &&` sails straight past the thing that actually
   * broke, which was a qualifier added at the *render* site
   * (`askAvailable && !onIntakeRoute ? <AskTrigger /> : null`). Verified by
   * reintroducing exactly that and watching the looser assertion pass.
   *
   * So: the local is assigned from the hook and nothing else, and each
   * surface is rendered on the bare local. Prettier keeps the formatting
   * stable, and a failure here is a one-line read of what changed.
   */
  const squash = (source: string) => source.replace(/\s+/g, '');

  it.each(SURFACES)('%s assigns the local straight from the hook', (path) => {
    expect(squash(read(path))).toMatch(
      /constaskAvailable=useAskAvailable\([A-Za-z.]+\);/,
    );
  });

  it('the ⌘J trigger is gated on the bare boolean', () => {
    const source = squash(read('components/design/top-nav/top-nav.tsx'));
    expect(source).toContain('{askAvailable?<AskTrigger/>:null}');
  });

  it('the panel and the palette row are gated on the bare boolean', () => {
    const source = squash(read('components/navigation/dashboard-shell.tsx'));
    expect(source).toContain('{askAvailable?<AskPanel');
    expect(source).toContain('onAskNora={askAvailable?openAsk:undefined}');
  });

  it('the hook is the only client-side reader of the rule', () => {
    const hook = read('components/design/ask/use-ask-available.ts');
    expect(hook).toContain('askOffered');
    expect(hook).toContain('useAskNora');
  });

  /*
   * An absent flag must not read as a flag someone switched off. The provider
   * merges registry defaults, so the key is normally present — but Ask going
   * missing on a technicality is the exact failure this file is about.
   */
  it('treats a missing flag as on', () => {
    const hook = read('components/design/ask/use-ask-available.ts');
    expect(hook).toContain('!== false');
  });
});
