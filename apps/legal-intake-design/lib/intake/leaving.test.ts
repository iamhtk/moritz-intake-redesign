import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Pressing Home always asks, and what it asks is true of the state it is in.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE BUG WAS THE INCONSISTENCY, NOT THE MISSING DIALOG.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `hasActiveIntake` goes false at submission, which is correct about the
 * draft — there is nothing left to save — and was wrong about the click. Home
 * opened a dialog mid-intake and did nothing at all afterwards, with nothing
 * on screen explaining the difference, so the shell's one navigation control
 * behaved unpredictably at exactly the moment a client is least certain their
 * case went anywhere.
 *
 * The fix is not "always show the same dialog". "Save as draft or delete?" is
 * the wrong question for a case the firm already has, and a **Delete case**
 * button on the screen that has just said *Case sent* would undo the single
 * reassurance that screen exists to give. Two states, two questions, and a
 * prompt either way.
 *
 * Three things are asserted, because each has its own way of regressing:
 * the sent branch existing, the sent branch not offering to delete, and the
 * empty start screen staying silent.
 */

const INTAKE = readFileSync(
  join(process.cwd(), 'components/design/intake-v2/intake-v2.tsx'),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '');

const DIALOG = readFileSync(
  join(process.cwd(), 'components/design/new-case/leave-intake-dialog.tsx'),
  'utf8',
);

describe('leaving the intake', () => {
  it('prompts on a sent case as well as an unfinished one', () => {
    expect(INTAKE).toContain('hasSentCase');
    expect(INTAKE).toContain("reason: 'sent'");
  });

  /*
   * The empty start screen is the third state and stays silent: no messages,
   * no values, nothing to save and nothing to lose, so a dialog there is a
   * confirmation step with no decision in it.
   */
  it('still says nothing when there is nothing to lose', () => {
    expect(INTAKE).toContain('return false;');
    expect(INTAKE).toContain('if (hasActiveIntake) {');
  });

  /*
   * A reload is an accident and keeps the receipt; confirming Home is intent
   * and drops it. Without the second half the client meets a confirmation
   * they have finished with the next time they open the intake.
   */
  it('drops the sealed receipt when the client confirms they are leaving', () => {
    const handler =
      /const onLeaveSent = useCallback\([\s\S]*?\}, \[[^\]]*\]\);/.exec(
        INTAKE,
      )?.[0];
    expect(handler, 'onLeaveSent not found').toBeTruthy();
    expect(handler).toContain('clearSentSession()');
  });

  /*
   * And the browser-level guard stays keyed to the draft only, which is what
   * keeps a plain reload silent and the receipt intact.
   */
  it('does not put a beforeunload warning on a sent case', () => {
    expect(INTAKE).toContain('useUnsavedChangesGuard(hasActiveIntake)');
  });
});

describe('the sent dialog tells the truth', () => {
  const sentBranch = DIALOG.slice(
    DIALOG.indexOf("if (reason === 'sent')"),
    DIALOG.indexOf('const title ='),
  );

  it('exists', () => {
    expect(sentBranch.length).toBeGreaterThan(100);
  });

  it('never offers to delete a case the firm already has', () => {
    expect(sentBranch).not.toContain('Delete case');
    expect(sentBranch).not.toContain('onDiscard');
    expect(sentBranch).not.toContain('destructive');
  });

  it('names the case and says where it lives', () => {
    expect(sentBranch).toContain('reference');
    expect(sentBranch).toContain('Your cases');
  });

  it('offers a way to stay', () => {
    expect(sentBranch).toContain('AlertCancel');
    expect(sentBranch).toContain('Stay');
  });
});
