import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import messages from '@/messages/en.json';

/**
 * The confirmation fits a viewport, and the things it folds are the things
 * the client does not need.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT WENT WRONG, AND WHY A TEST RATHER THAN A LOOK.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Every block on this screen was justified on its own and the screen was
 * 2265px tall in an 828px column. The failure was never any one block, it was
 * that nothing owned the total — so the fix is a shape rather than a deletion,
 * and a shape is the kind of thing that erodes one well-argued block at a
 * time. Read as source, because what is being asserted is the order and the
 * default state of a composition, and rendering it would need a provider, a
 * brief fixture and a document panel to assert something plainly visible in
 * the file.
 *
 * "Same content, one viewport" is the rule. Nothing here checks that a block
 * was removed; every case checks that a block is either open or one click
 * from open.
 */

const CONFIRMATION = readFileSync(
  join(process.cwd(), 'components/design/intake-v2/sent-confirmation.tsx'),
  'utf8',
);

/** Comments name the blocks they explain, so they cannot be read as order. */
const code = CONFIRMATION.replace(/\/\*[\s\S]*?\*\//g, '').replace(
  /^\s*\/\/.*$/gm,
  '',
);

const at = (needle: string): number => {
  const index = code.indexOf(needle);
  expect(index, `${needle} is not on the confirmation`).toBeGreaterThan(-1);
  return index;
};

const t = createTranslator({
  locale: 'en',
  messages: { intake: messages.intake },
  namespace: 'intake',
}) as unknown as (key: string, values?: Record<string, unknown>) => string;

describe('what the confirmation opens with', () => {
  /*
   * §3's five open blocks, in order: receipt, permission to leave, the
   * lawyers, somewhere to add a document, and the way out. The order is the
   * argument — "did that work" is answered first, "who are you" second, and
   * the offers last, because an offer made before the client has been told
   * they are free to go is a condition.
   */
  it('runs receipt, permission, faces, dropzone, way out', () => {
    const order = [
      at('<DescriptionList>'),
      at("t('canClose')"),
      at('<LawyerShowcase'),
      at('<PostSubmitDropzone'),
      at("t('startAnother')"),
    ];
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  /*
   * ⭐ The email was a centred control two blocks below the reference it
   * quotes. It is a property of the case in exactly the way Reference and
   * Status are, so it is the fifth row of the same list — which is both the
   * right place for it and about 60px of a screen that had none to spare.
   */
  it('carries the email as the fifth receipt row', () => {
    expect(at("t('copySentTo')")).toBeGreaterThan(at("t('reviewer')"));
    expect(at('<ConfirmationEmailTrigger')).toBeLessThan(
      at('</DescriptionList>'),
    );
    // One copy. It used to be the row *and* the block underneath.
    expect(code.match(/<ConfirmationEmailTrigger/g)).toHaveLength(1);
  });

  /*
   * The timing half of `turnaroundNote` was the Estimated response row said
   * again in a paragraph. The commercial half was not said anywhere else on
   * the screen, so it moved rather than going with the sentence around it.
   */
  it('keeps the charge promise after dropping the sentence it lived in', () => {
    expect(code).not.toContain("t('turnaroundNote')");
    expect(code).toContain("t('nothingCharged')");
    expect(t('sent.nothingCharged')).toContain('until you accept');
  });
});

describe('what the confirmation folds', () => {
  /*
   * The recap paragraph keeps its first line. A disclosure over nothing at
   * all is a worse trade than the height it saves, because the client cannot
   * tell whether it is worth opening.
   */
  it('folds the recap to its first line, not to nothing', () => {
    expect(code).toContain('line-clamp-1');
    expect(code).toContain('{brief.description}');
    expect(code).toContain('aria-expanded={summaryOpen}');
  });

  /*
   * ⭐ The brief itself, behind one row. There is no useful first line of a
   * field list — half a row is a document that looks broken — so this one is
   * a real `Collapsible` rather than a clamp.
   */
  it('folds the brief behind one row, which says how many fields', () => {
    const column = readFileSync(
      join(process.cwd(), 'components/design/intake-v2/brief-column.tsx'),
      'utf8',
    );
    expect(column).toContain('<CollapsibleTrigger');
    expect(column).toContain(
      "t('foldedFields', { count: brief.fields.length })",
    );
    expect(t('brief.foldedFields', { count: 6 })).toBe('Your brief · 6 fields');
    expect(t('brief.foldedFields', { count: 1 })).toBe('Your brief · 1 field');
  });

  /*
   * ⭐ Folded only where the brief has stopped being the thing on the screen,
   * which is one phase later than where it stops being editable.
   *
   * `foldFields={submitted}` folded it through `sending` too, and `sending`
   * is the one phase where the brief is the *only* thing in this column: the
   * confirmation does not exist yet and the sending steps are four lines in
   * the footer. It left an empty panel with a "Show" link in it, at the exact
   * moment the client is watching for a sign that anything is happening.
   */
  it('does not fold during the wait, only once there is a confirmation', () => {
    const intake = readFileSync(
      join(process.cwd(), 'components/design/intake-v2/intake-v2.tsx'),
      'utf8',
    ).replace(/\/\*[\s\S]*?\*\//g, '');
    expect(intake).toContain('foldFields={hasConfirmation(phase)}');
    expect(intake).not.toContain('foldFields={submitted}');
  });

  /*
   * The signature folds with the document it signs. A file note signed at
   * the bottom of a page that is not there is a mark under nothing.
   */
  it('folds the signature with the fields', () => {
    const column = readFileSync(
      join(process.cwd(), 'components/design/intake-v2/brief-column.tsx'),
      'utf8',
    ).replace(/\/\*[\s\S]*?\*\//g, '');
    const content = column.slice(
      column.indexOf('<CollapsibleContent>'),
      column.indexOf('</CollapsibleContent>'),
    );
    expect(content).toContain('{fieldRows}');
    expect(content).toContain('{signature}');
  });
});

describe('opening a fold does not resize what is beside it', () => {
  /*
   * ⭐ The brief panel is a scroll container, and the folds are the two
   * things most likely to push it past its own height. When they did, the
   * scrollbar appeared, took 8px of width, and the quote card above visibly
   * shrank from the right — a disclosure resizing its neighbour, which reads
   * as a layout bug even though it is a browser doing exactly as asked.
   *
   * `mz-scrollbar-on-scroll` already claimed to have solved this: its comment
   * says "the gutter is reserved at all times, so the thumb arriving never
   * reflows the content beside it". Hiding the thumb is not reserving the
   * track, and nothing reserved the track. This pins the line that does.
   */
  it('reserves the scrollbar gutter on the panel that folds', () => {
    const intake = readFileSync(
      join(process.cwd(), 'components/design/intake-v2/intake-v2.tsx'),
      'utf8',
    );
    expect(intake).toContain('mz-scrollbar-on-scroll');

    const css = readFileSync(
      join(process.cwd(), '../../packages/ui/src/styles/globals.css'),
      'utf8',
    );
    const utility = css.slice(
      css.indexOf('.mz-scrollbar-on-scroll {'),
      css.indexOf('.mz-scrollbar-on-scroll[data-scrolling]'),
    );
    expect(utility).toContain('scrollbar-gutter: stable;');
  });
});

describe('the disclosure labels resolve', () => {
  it('has copy for every control the folds add', () => {
    for (const key of [
      'sent.summaryShow',
      'sent.summaryHide',
      'sent.copySentTo',
      'sent.nothingCharged',
      'brief.foldedShow',
      'brief.foldedHide',
      'email.read',
    ]) {
      expect(t(key).length, key).toBeGreaterThan(0);
    }
  });
});
