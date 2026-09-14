import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The transcript follows the reply, and keeps following it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS FILE EXISTS AT ALL.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This has now been fixed twice. The first time, `chat-message.tsx` gave up
 * `scrollAnchor` on the user turn so a streaming reply would follow the live
 * edge instead of pinning the question to the top; that fix carried a
 * thirty-line comment explaining itself and not one assertion, so it was one
 * plausible edit away from coming back, and it came back.
 *
 * The property is also invisible to every other kind of test here. Nothing
 * throws, nothing fails to render, the types are satisfied, and the only
 * symptom is a client on a phone having to scroll down after every message
 * they send. Measured on a 390px viewport before the second fix: by the fifth
 * turn the newest reply sat 714px below the fold.
 *
 * So the wiring is asserted from source, in the idiom this suite already uses
 * for the same class of failure (`sent-reload.test.ts` for a module nothing
 * called, `document-persistence.test.ts` for a control nothing mounted). It is
 * a coarse test and it is the right shape: it fails when somebody removes a
 * piece, which is exactly how this broke.
 */

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

/** Comments explain the wiring; they are not the wiring. */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

const COLUMN = read('components/design/intake-v2/chat-column.tsx');
const MESSAGE = read('components/design/intake/chat/chat-message.tsx');
const HOOK = read('components/design/intake-v2/use-stick-to-bottom.ts');

describe('a new turn is not pinned to the top', () => {
  /*
   * The first fix, and the one that regressed. `scrollAnchor` puts the
   * scroller into `anchored-to-message` mode, which it never leaves on its
   * own, so the reply grows downward off the bottom and nothing moves.
   */
  it('no chat turn asks the scroller to anchor it', () => {
    expect(code(MESSAGE)).not.toContain('scrollAnchor');
  });

  it('still says why, so the next person does not put it back', () => {
    // The comment is not the fix, but a bare absence is not reviewable.
    expect(MESSAGE).toContain('scrollAnchor');
    expect(MESSAGE).toContain('follow the live edge');
  });
});

describe('the transcript keeps following while a reply arrives', () => {
  it('asks the scroller to follow in the first place', () => {
    expect(code(COLUMN)).toContain('MessageScrollerProvider autoScroll');
  });

  it('mounts the watchdog that repairs the follow', () => {
    expect(code(COLUMN)).toContain('<StickToBottom');
    expect(code(COLUMN)).toContain('useStickToBottom');
  });

  it('gives the watchdog the viewport it has to watch', () => {
    expect(code(COLUMN)).toContain('viewportRef={viewportRef}');
    expect(code(COLUMN)).toContain('ref={viewportRef}');
  });

  /*
   * Sending is the clearest statement of intent in the flow, and the count is
   * what carries it: a client who scrolled up to check something and then
   * asked a question wants the answer, not the place they were reading.
   */
  it('re-arms when the client sends something', () => {
    expect(code(COLUMN)).toContain('sendCount');
    expect(code(HOOK)).toContain('sendCount');
  });

  /*
   * Size, not state. Every way the transcript grows has to count: a streamed
   * chunk, a turn appearing, the rail unfolding, a row of one-tap answers, the
   * document aside. Watching named state means forgetting the next one.
   */
  it('follows the transcript by its size, not by a list of reasons', () => {
    expect(code(HOOK)).toContain('ResizeObserver');
    expect(code(HOOK)).toContain('message-scroller-content');
  });

  /*
   * The phone half. An on-screen keyboard does not change the transcript at
   * all, it shortens the window, so the last thing the client typed goes under
   * the keyboard unless the viewport itself is watched too.
   */
  it('watches the window as well, for the keyboard opening', () => {
    expect(code(HOOK)).toContain('observer.observe(viewport)');
  });

  it('uses the scroller rather than setting scrollTop behind its back', () => {
    // `scrollToEnd` also restores the scroller's own follow mode, so the
    // package is repaired rather than fought. A raw assignment would leave it
    // in `free-scrolling` and the two would disagree on every frame.
    expect(code(HOOK)).toContain('scrollToEnd(');
    expect(code(HOOK)).not.toMatch(/scrollTop\s*=/);
  });
});

describe('and a client reading back is left alone', () => {
  /*
   * The half that makes the other half safe. A reply arriving must never
   * interrupt somebody reading, and the only thing that may release the hold
   * is the client moving the view themselves.
   */
  it('releases the hold on a gesture, not on a scroll', () => {
    const source = code(HOOK);
    for (const gesture of ['wheel', 'touchmove', 'keydown']) {
      expect(source, `no listener for ${gesture}`).toContain(`'${gesture}'`);
    }
    // The gesture arms the decision; the scroll it causes makes it. Reading
    // the position on every scroll would treat the watchdog's own scrolling as
    // the client looking away, which is the bug in the scroller this fixes.
    expect(source).toContain('gestured');
  });

  it('takes the hold back when they return to the bottom', () => {
    expect(code(HOOK)).toContain('atBottom()');
  });
});
