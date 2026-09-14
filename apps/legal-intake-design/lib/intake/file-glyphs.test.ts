import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { describeFile } from '@/components/design/new-case/file-utils';

/**
 * Every file the intake shows wears its own glyph (§1 #8).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A WIRING GAP, NOT A DESIGN ONE, WHICH IS WHY IT SURVIVED.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `describeFile` has always existed and seven surfaces already used it: the
 * case pages, the document viewer, the playbook panel, the old new-case flow.
 * Intake v2 hardcoded a single slate page icon in three places instead, so the
 * one thing a client is most likely to hand over — a contract, as a PDF —
 * arrived looking like a text file, and then changed colour when they followed
 * "Go to case" to the page that did call the helper.
 *
 * Nothing looked broken in any one component, which is the shape of defect a
 * test is worth more than a review for. The composer is the clearest case: it
 * had rendered `attachment.iconClassName` all along and its own type comments
 * the field as "a per-file-type token like `text-red-600`". The gap was in the
 * caller that built the attachments without one.
 */

const INTAKE_DIRS = [
  'components/design/intake-v2',
  'components/design/intake/chat',
];

function sources(): { file: string; code: string }[] {
  return INTAKE_DIRS.flatMap((dir) =>
    readdirSync(join(process.cwd(), dir))
      .filter((name) => name.endsWith('.tsx'))
      .map((name) => ({
        file: `${dir}/${name}`,
        code: readFileSync(join(process.cwd(), dir, name), 'utf8').replace(
          /\/\*[\s\S]*?\*\//g,
          '',
        ),
      })),
  );
}

describe('the file-type map', () => {
  /* The convention, and the reason red is not the brand's red. */
  it('is a family, not a colour', () => {
    expect(describeFile('contract.pdf').colorClass).toBe('text-red-600');
    expect(describeFile('notice.docx').colorClass).toBe('text-blue-600');
    expect(describeFile('costs.xlsx').colorClass).toBe('text-green-600');
    expect(describeFile('notes.txt').colorClass).toBe('text-muted-foreground');
  });

  /*
   * ⭐ Red is Adobe's here, not `destructive`.
   *
   * `colour-restraint.test.ts` caps `destructive` because it means one thing —
   * stop here — and a PDF icon is not a warning. Tokenising this would give
   * the brand's stop-colour a second meaning, which is the exact counting
   * failure that cap exists to catch, and would put the intake directory at
   * its limit so the next genuine error state failed the test.
   */
  it('stays off the brand’s warning colours', () => {
    for (const name of ['a.pdf', 'b.docx', 'c.xlsx', 'd.pptx']) {
      expect(describeFile(name).colorClass).not.toMatch(
        /-(destructive|warning|success)\b/,
      );
    }
  });
});

describe('what the intake draws for a file', () => {
  /*
   * No component picks its own. A hardcoded glyph is how the three sites
   * drifted from the rest of the app in the first place, and it is a one-line
   * change to do it again.
   */
  it('never hardcodes a file icon', () => {
    const offenders = sources()
      .filter(({ code }) => /<FileText\b/.test(code))
      .map(({ file }) => file);
    expect(
      offenders,
      `hardcoded file icons in: ${offenders.join(', ')}`,
    ).toEqual([]);
  });

  /* The three sites §1 #8 named, each reading the shared map. */
  it('reads the shared map at every site that shows a file', () => {
    const byFile = Object.fromEntries(
      sources().map(({ file, code }) => [file, code]),
    );
    for (const file of [
      'components/design/intake/chat/message-attachment.tsx',
      'components/design/intake-v2/post-submit-dropzone.tsx',
      'components/design/intake-v2/intake-v2.tsx',
    ]) {
      expect(byFile[file], file).toContain('describeFile(');
    }
  });

  /*
   * The composer's chips get theirs from the caller, because the composer
   * cannot see a filename until it is handed one. This is the half that was
   * missing while the component itself was correct.
   */
  it('hands the composer an icon with every attachment', () => {
    const intake = readFileSync(
      join(process.cwd(), 'components/design/intake-v2/intake-v2.tsx'),
      'utf8',
    ).replace(/\/\*[\s\S]*?\*\//g, '');
    expect(intake).toContain('icon: Icon');
    expect(intake).toContain('iconClassName: colorClass');
    // Both branches: the files being read and the ones merely staged.
    expect(intake).toMatch(/\)\s*\.map\(withGlyph\)/);
  });
});
