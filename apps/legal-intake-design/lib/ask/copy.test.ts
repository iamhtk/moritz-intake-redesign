import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every key the Ask surfaces ask for, against the messages file.
 *
 * Written while renaming `ask.modeFirm` to `ask.modeCases`, because that rename
 * is the one class of change in this feature that **nothing else catches**.
 * `tsc` does not type `useTranslations` keys, the API route never touches copy,
 * and `next build` compiles the panel without resolving a single string — so a
 * missed key ships a tab whose label is the literal text `ask.modeFirm`, or a
 * thrown error, depending on which way next-intl is configured that day.
 *
 * Scraped from the source rather than listed by hand. A hand-written list is a
 * second copy of the same facts and goes stale the first time someone adds a
 * string, which is the failure it was supposed to prevent.
 */

const ASK_SOURCES = [
  'components/design/ask/ask-panel.tsx',
  'components/design/ask/ask-trigger.tsx',
];

/** `t('modeCases')` -> `modeCases`. Only literal keys; there are no dynamic ones. */
function keysUsedIn(relativePath: string): string[] {
  const source = readFileSync(join(process.cwd(), relativePath), 'utf8');
  return [...source.matchAll(/\bt\(\s*'([^']+)'/g)].map((match) => match[1]!);
}

const messages = JSON.parse(
  readFileSync(join(process.cwd(), 'messages/en.json'), 'utf8'),
) as Record<string, Record<string, unknown> | undefined>;

/*
 * Thrown at import rather than asserted in a test, so a missing `ask` block
 * fails once and loudly instead of making every case below fail for a reason
 * none of them is about.
 */
const askMessages = messages.ask;
if (!askMessages) throw new Error('messages/en.json has no `ask` block');

describe('the Ask panel’s copy', () => {
  it.each(ASK_SOURCES)('resolves every key %s asks for', (relativePath) => {
    const used = keysUsedIn(relativePath);
    // Guards against the regex silently matching nothing and passing.
    expect(used.length).toBeGreaterThan(0);

    const missing = used.filter((key) => {
      // `error.offline` and friends come back from `failureCopyKey`.
      const [head, ...rest] = key.split('.');
      let node: unknown = askMessages[head!];
      for (const segment of rest) {
        node = (node as Record<string, unknown> | undefined)?.[segment];
      }
      return node === undefined;
    });

    expect(missing).toEqual([]);
  });

  /*
   * The tab the whole rework was about. Its *label* was already right; what was
   * wrong was everything behind it, and the key name was the visible end of
   * that — "firm" is the admin app this was ported from, and a client is not
   * the firm.
   */
  it('names the grounded tab after the reader’s cases, not the firm', () => {
    expect(askMessages).toHaveProperty('modeCases', 'Your cases');
    expect(askMessages).not.toHaveProperty('modeFirm');
  });

  /* The client-facing promises the panel makes on its empty state. */
  it('tells a client what Nora will and will not do', () => {
    const emptyBody = askMessages.emptyBody as string;
    expect(emptyBody).toContain('cannot give you legal advice');
    expect(emptyBody).toContain('never changes anything');
  });

  /**
   * ⭐ Every string the panel picks *by mode* needs a counterpart, and the
   * counterpart has to actually differ.
   *
   * This is the bug class the pairs were added to fix: one `thinking` string
   * said "Nora is reading your cases" on a tab where the request carries no
   * grounding block at all, and one `emptyBody` promised she answers "from
   * your cases and nothing else" on the tab where she is told the opposite.
   * A pair that exists but holds the same sentence would reintroduce that
   * silently, so identity is asserted as a failure.
   */
  it.each([
    ['thinking', 'thinkingGeneral'],
    ['emptyBody', 'emptyBodyGeneral'],
    ['placeholder', 'placeholderGeneral'],
  ])('%s and %s both exist and say different things', (cases, general) => {
    expect(askMessages).toHaveProperty(cases);
    expect(askMessages).toHaveProperty(general);
    expect(askMessages[general]).not.toBe(askMessages[cases]);
  });

  it('never claims to read cases on the tab that reads none', () => {
    for (const key of [
      'thinkingGeneral',
      'emptyBodyGeneral',
      'modeGeneralHint',
    ]) {
      expect(askMessages[key] as string).not.toMatch(/reading your cases/i);
    }
    // And says so positively, rather than merely omitting the claim.
    expect(askMessages.modeGeneralHint as string).toMatch(
      /does not look at your cases/i,
    );
    expect(askMessages.modeGeneralHint as string).toMatch(/not advice/i);
  });

  /*
   * The explainer that replaced the conditional banner. It has to carry a real
   * count, and it needs the zero variant: "Answers from your 0 cases" is the
   * kind of sentence that makes a product feel unfinished.
   */
  it('explains the grounded tab with a real count, and handles zero', () => {
    expect(askMessages.modeCasesHint as string).toContain('{count, plural,');
    expect(askMessages).toHaveProperty('modeCasesHintEmpty');
    expect(askMessages.modeCasesHintEmpty as string).not.toContain('{count');
  });

  /* The banner this replaced is gone, not orphaned in the messages file. */
  it('no longer carries the general-mode disclaimer banner', () => {
    expect(askMessages).not.toHaveProperty('generalDisclaimer');
  });

  /*
   * `basis` is shown under an answer, so its n=1 branch is read as often as any
   * other string here. "Based on 1 of your cases" is the sort of thing a
   * plural-by-default template produces, and it reads like a machine.
   */
  it('phrases the provenance line as a person would at n=1', () => {
    expect(askMessages.basis as string).toContain('=1 {one of your cases}');
  });
});
