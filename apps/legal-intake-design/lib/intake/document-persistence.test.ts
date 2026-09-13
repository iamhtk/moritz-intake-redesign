import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Two defects, both of them about *when* a document exists.
 *
 * The first: the library was session state, so a reload mid-intake took every
 * document with it. The panel collapsed, the brief's citations apologised, and
 * a chip in the transcript reported that a file attached a minute earlier "is
 * not open in this browser any more". The flow tells the client their work is
 * saved; this was the one part of it that was not.
 *
 * The second: the handle that opens the panel was on the edge of the opening
 * screen, offered the instant a file was picked — before anything had read it,
 * on a screen whose job is the sentence the client has not written yet.
 *
 * Both fixes are wiring: a store that is read on mount and written as documents
 * arrive, and a flag that keeps the surface off the first screen. Wiring is
 * what type-checks and builds and ships broken, so these read it as source, the
 * same way `evidence-link.test.ts` and `handoff.test.ts` do. This suite is the
 * node environment over `lib/**`; the subjects are a hook and a component.
 */

const read = (relativePath: string) =>
  readFileSync(join(process.cwd(), relativePath), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

const workspace = read(
  'components/design/documents/viewer/use-document-workspace.ts',
);
const intake = read('components/design/intake-v2/intake-v2.tsx');
const store = read('lib/intake/document-store.ts');
const session = read('lib/intake/session-storage.ts');

describe('documents survive a reload', () => {
  /* ⭐ The regression. The bytes are read back, or none of the rest matters. */
  it('reads the saved library back when the workspace mounts', () => {
    expect(workspace).toContain('loadDocuments');
    expect(workspace).toContain('new File([one.bytes]');
  });

  /* And written, or there is nothing to read back. */
  it('writes the bytes as documents arrive', () => {
    expect(workspace).toContain('saveDocuments');
    expect(workspace).toContain('bytes: one.file');
  });

  /*
   * Restored documents must not be written straight back out. The blobs run to
   * megabytes and the library changes on every tab click.
   */
  it('does not rewrite what it just restored', () => {
    expect(workspace).toContain('savedRef');
    expect(workspace).toContain('!savedRef.current.has(one.id)');
  });

  /*
   * The panel comes back open if it was open. This is the part the client
   * actually reported: the sidebar disappearing, not the bytes.
   */
  it('restores the arrangement, not just the library', () => {
    expect(workspace).toContain('DOCUMENT_PANEL_STORAGE_KEY');
    expect(workspace).toContain('parseArrangement');
  });

  /* A reload is not a reason to take over the screen with an overlay. */
  it('comes back as the docked column rather than maximised', () => {
    expect(workspace).toMatch(
      /arrangement\?\.open === true[\s\S]{0,120}'docked'/,
    );
  });

  /* Only file documents. The confirmation email's body is a rendered node. */
  it('leaves reader documents out of storage', () => {
    expect(workspace).toContain('.filter(isFileDocument)');
  });
});

describe('and do not outlive the case they belong to', () => {
  /* Deleting a draft and sending a case both mean the bytes go. */
  it('clears the bytes with the rest of the session', () => {
    expect(session).toContain('forgetAllDocuments()');
    expect(session).toContain('removeItem(DOCUMENT_PANEL_STORAGE_KEY)');
  });

  /*
   * The orphan case, which is the one `clearIntakeSession` cannot reach: a tab
   * closed between a document arriving and the case being sent or deleted.
   * Without this, a brand new intake would open with a stranger's contract on
   * the handle.
   */
  it('refuses to restore documents into a session that is not there', () => {
    expect(workspace).toContain('hasSessionToRestore');
    expect(workspace).toMatch(
      /if \(!hasSessionToRestore\(\)\)[\s\S]{0,200}forgetAllDocuments\(\)/,
    );
  });

  /* A second case in the same tab does not inherit the first one's files. */
  it('empties the library on a restart', () => {
    expect(workspace).toContain('const reset = useCallback(');
    expect(intake).toContain('resetDocuments()');
  });

  /* Storage that cannot be opened is a session without memory, not a crash. */
  it('never throws out of the store', () => {
    expect(store).toContain('resolve(null)');
    expect(store).not.toContain('reject(');
  });
});

describe('the panel is not offered on the opening screen', () => {
  /* ⭐ The second regression, named once so both uses read from one place. */
  it('gates the surface on the phase', () => {
    expect(intake).toContain("const documentsReachable = phase !== 'start'");
    expect(intake).toContain(
      'const documentSurface = !documentsReachable ? null : (',
    );
  });

  /* The gutter held open for the handle goes with the handle. */
  it('does not reserve room for a handle it is not drawing', () => {
    expect(intake).toMatch(
      /const documentTabShowing =\s*documentsReachable &&/,
    );
  });

  /*
   * And the panel is shut while it is unreachable, so it cannot spring open by
   * itself the moment the client sends their first message.
   */
  it('closes the panel rather than hiding an open one', () => {
    expect(intake).toMatch(
      /!documentsReachable && documents\.mode !== 'closed'\) closeDocuments\(\)/,
    );
  });

  /* The opening screen no longer renders it at all. */
  it('leaves the surface out of the start screen', () => {
    const start = intake.slice(
      intake.indexOf("if (phase === 'start') {"),
      intake.indexOf('const docked ='),
    );
    expect(start).not.toContain('{documentSurface}');
    // Still rendered by the layout that comes after it.
    expect(intake).toContain('{documentSurface}');
  });
});
