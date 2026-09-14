import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A sent case survives a reload, and the wiring that makes it survive stays
 * wired.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS IS A GUARD AGAINST A FILE GOING QUIET, NOT AGAINST A LOGIC ERROR.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `sent-session.ts` was written to fix two named bugs, documented at length
 * in its own header: reload a second after sending and the confirmation was
 * gone, and navigate away during the send wait and the case was never
 * recorded at all. It has a dedicated storage key, a twelve-hour expiry, a
 * shape guard and its own unit tests.
 *
 * None of that made it work, because nothing ever called it. Its only
 * importer was its own test file, so every test passed, the types were
 * satisfied, lint was clean, and the bug it was written for was live the
 * whole time. `replace()` on `useBrief` — the restore half — was unused for
 * the same reason and described as an "escape hatch for the demo seed".
 *
 * A unit test of `writeSentSession` cannot catch that: the function works.
 * What has to be asserted is the *call*, at the one site where forgetting it
 * is silent. So this reads `intake-v2.tsx` and checks the four points of
 * contact. It is a coarse test and it is the right shape for the failure.
 */

const INTAKE = readFileSync(
  join(process.cwd(), 'components/design/intake-v2/intake-v2.tsx'),
  'utf8',
);

/** Comments explain the wiring; they are not the wiring. */
const CODE = INTAKE.replace(/\/\*[\s\S]*?\*\//g, '').replace(
  /^\s*\/\/.*$/gm,
  '',
);

describe('the sent case survives a reload', () => {
  it('seals the brief at the moment the draft is cleared', () => {
    expect(CODE).toContain('writeSentSession(');
    /*
     * Order, not just presence. The sealed copy has to be written while the
     * brief is still in hand; writing it after the restart path has run
     * would seal an empty one.
     */
    expect(CODE.indexOf('clearIntakeSession()')).toBeLessThan(
      CODE.indexOf('writeSentSession('),
    );
  });

  it('reads it back on load', () => {
    expect(CODE).toContain('readSentSession()');
    expect(CODE).toContain("setStage('sent')");
  });

  it('restores the whole brief rather than rebuilding it', () => {
    expect(CODE).toContain('replace(sent.brief)');
  });

  it('drops it when the client starts another case', () => {
    expect(CODE).toContain('clearSentSession()');
  });

  /*
   * The callback closes over the brief it seals, and the seal happens inside
   * a timer that fires ~1800ms after the click. Narrowing the dependency to
   * a couple of the brief's properties — which is what it used to be, back
   * when only the title and description were read — would let a client
   * confirm the last row, press Send in the same render, and have the
   * previous brief sealed instead.
   */
  it('depends on the whole brief it seals, not two fields of it', () => {
    const deps = /\}, \[brief[^\]]*\]\);/.exec(CODE)?.[0] ?? '';
    expect(deps, 'submitCase dependency array not found').toBeTruthy();
    expect(deps).not.toContain('brief.title');
    expect(deps).not.toContain('brief.description');
  });
});

describe('sent-session is not orphaned again', () => {
  it('has an importer that is not its own test', () => {
    expect(INTAKE).toContain("from '@/lib/intake/sent-session'");
  });
});
