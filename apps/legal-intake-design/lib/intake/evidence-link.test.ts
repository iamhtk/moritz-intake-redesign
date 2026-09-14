import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEMO_FIELD_UPDATES } from './demo-brief';
import { locateQuote } from './verify-source';

/**
 * The citation, and whether it goes where it says it goes.
 *
 * Recording the evidence was already built end to end: `/api/extract` requires
 * the model to return a verbatim `sourceQuote` and a plain-words `sourceNote`,
 * the file name is resolved from *which document the quote actually verifies
 * against* rather than from what the model claimed, `locateQuote` places it in
 * the text, and the viewer paints `mz-pdf-highlight` over the words it finds.
 *
 * What was broken was one line — the click. The citation's handler read:
 *
 *   onClick={hasPassage ? togglePassage : onOpenSource}
 *
 * so on every row where the quote *had* been located — the good case — the
 * citation expanded three lines in place and never opened the document. The
 * viewer was reachable from it only when the passage had failed. These pin the
 * wiring in the direction it was wrong.
 */

const read = (relativePath: string) =>
  readFileSync(join(process.cwd(), relativePath), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

describe('the citation opens the document', () => {
  const row = read('components/design/intake-v2/brief-field-row.tsx');

  /* ⭐ The regression. The words are a link to a place, so they go there. */
  it('calls onOpenSource from the citation itself', () => {
    expect(row).toContain('onClick={onOpenSource}');
  });

  /*
   * And never again only as a fallback. The old form is spelled out so that
   * reintroducing it fails here rather than quietly costing the feature.
   */
  it('does not route the citation on whether a passage was located', () => {
    expect(row).not.toContain('hasPassage\n                    ? () =>');
    expect(row).not.toMatch(/hasPassage[\s\S]{0,80}:\s*onOpenSource/);
  });

  /*
   * The in-place preview survives, on its own control. It answers "is this
   * real" without leaving the brief, which is a different question from "what
   * else does the document say".
   */
  it('keeps the passage preview behind the chevron', () => {
    expect(row).toContain('onClick={() => setSourceOpen((open) => !open)}');
    expect(row).toContain('aria-expanded={sourceOpen}');
    expect(row).toContain('<ChevronDown');
  });

  /* Two controls, two jobs — and the disclosure owns `aria-expanded`. */
  it('no longer offers the same action twice in one row', () => {
    expect(row.match(/onClick=\{onOpenSource\}/g)).toHaveLength(1);
    expect(row).not.toContain('sourceOpenDocument');
  });

  /* A chevron over nothing is a control that does nothing. */
  it('shows the chevron only when there is a passage to reveal', () => {
    expect(row).toContain('{hasPassage ? (');
  });
});

describe('what the citation carries to the viewer', () => {
  const intake = read('components/design/intake-v2/intake-v2.tsx');

  /*
   * The quote is what the highlight is found by, so it has to travel. The
   * field key goes too, so the toolbar can list the row this document is
   * evidence for.
   */
  it('passes the quote and the field so the viewer can place it', () => {
    const opener = intake.slice(
      intake.indexOf('const openSource = useCallback('),
      intake.indexOf('const openDocumentNamed = useCallback('),
    );
    expect(opener).toContain('openDocumentByName(field.sourceNote');
    expect(opener).toContain('quote: field.sourceQuote');
    expect(opener).toContain('fieldKey: field.key');
  });

  /*
   * A quote that cannot be placed is a real state, not a bug: a value read off
   * a scan has its words in an image and not in the text layer. The document
   * opens anyway and says why, which beats sending the client nowhere.
   */
  it('explains a quote it could not place, rather than opening in silence', () => {
    expect(intake).toContain("t('documents.sourceNotFound'");
    expect(intake).toContain("t('documents.sourceUnavailable'");
  });
});

describe('the evidence the demo ships', () => {
  /*
   * The seeded row is the one a reviewer clicks, so its quote has to be
   * locatable. `demo-brief.test.ts` already checks the passage against the real
   * PDF; this checks the shape the citation needs: a note naming the file, and
   * a quote long enough for `findQuote` to match on.
   */
  const seeded = DEMO_FIELD_UPDATES.find((one) => one.sourceQuote != null);

  it('names the file in the note, so the lookup can find it', () => {
    expect(seeded).toBeDefined();
    expect(seeded!.sourceNote).toContain('.pdf');
  });

  it('carries a quote that locates inside its own passage', () => {
    const passage = seeded!.sourcePassage!;
    const whole = `${passage.before} ${passage.match} ${passage.after}`;
    expect(locateQuote(seeded!.sourceQuote!, whole)).not.toBeNull();
  });
});
