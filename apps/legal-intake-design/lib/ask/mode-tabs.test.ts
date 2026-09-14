import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The mode switcher's contract, asserted from source.
 *
 * Read as text rather than rendered, for the reason `vitest.config.ts` states
 * in its own comment: this project's suite is the node environment over
 * `lib/**`, and component tests live in `packages/ui`. Standing up jsdom and
 * a `NextIntlClientProvider` here to assert six attributes would be a worse
 * trade than the same discipline `stream-client.test.ts` already applies to
 * `app/api/ask/route.ts`.
 *
 * What is being guarded is a regression with a known shape. The control used to
 * be `@repo/ui`'s `SegmentedControl` with `className="w-full"`, which stretched
 * the grey trough across the sheet while the two pills went on hugging their
 * text — about 175px of dead grey in a `sm:max-w-md` panel. Going back to that
 * component, or dropping the equal-halves layout, is the easy accident, and
 * none of `tsc`, ESLint or the build would notice.
 */

const PANEL = readFileSync(
  join(process.cwd(), 'components/design/ask/ask-panel.tsx'),
  'utf8',
);

/* Comments stripped, or the doc comment explaining the old bug counts as the
 * bug — the same reason `stream-client.test.ts` strips them. */
const source = PANEL.replace(/\/\*[\s\S]*?\*\//g, '').replace(
  /^\s*\/\/.*$/gm,
  '',
);

describe('the mode switcher fills its container', () => {
  it('lays the two tabs out as equal halves', () => {
    expect(source).toContain('grid grid-cols-2');
  });

  /*
   * The specific regression. `inline-flex` children with no `flex-1` are what
   * hugged their text; `w-full` on the container is what made the gap visible.
   */
  it('no longer uses the shared SegmentedControl', () => {
    expect(source).not.toContain('SegmentedControl');
    expect(source).not.toContain('segmented-control');
  });
});

describe('the tabs are a real tablist', () => {
  it('gives the tablist an accessible name', () => {
    expect(source).toContain('role="tablist"');
    expect(source).toContain("aria-label={t('modeLabel')}");
  });

  /*
   * The gap that made the old `role="tab"` a decoration: the tabs named no
   * panel, and the transcript was not one. Both ends are wired now.
   */
  it('points the tabs at a panel that exists', () => {
    expect(source).toContain('aria-controls={panelId}');
    expect(source).toContain('role="tabpanel"');
    expect(source).toContain('id={panelId}');
    expect(source).toContain('aria-labelledby={tabId(mode)}');
  });

  /* A tablist is one tab stop whose options are reached with the arrows. */
  it('uses a roving tabindex and handles the arrow keys', () => {
    expect(source).toContain('tabIndex={active ? 0 : -1}');
    expect(source).toContain("event.key !== 'ArrowLeft'");
    expect(source).toContain("event.key !== 'ArrowRight'");
  });

  it('drops the sr-only label the old control needed', () => {
    expect(source).not.toContain(
      '<p className="sr-only">{t(\'modeLabel\')}</p>',
    );
  });
});

describe('the explainer replaced the conditional banner', () => {
  it('is always rendered, on whichever tab is active', () => {
    expect(source).toContain("t('modeGeneralHint')");
    expect(source).toContain("t('modeCasesHint'");
    expect(source).toContain("t('modeCasesHintEmpty')");
  });

  it('describes the selected tab to a screen reader', () => {
    expect(source).toContain('aria-describedby={active ? hintId : undefined}');
  });

  /*
   * The banner only ever appeared on the general tab, which made the grounded
   * tab the silent one: the tab where Nora *is* reading your file said nothing,
   * and the tab where she is not got a grey warning.
   */
  it('no longer renders the old general-only banner', () => {
    expect(source).not.toContain('generalDisclaimer');
  });
});

/**
 * Every string the panel picks by mode. The pairs exist because a single string
 * was being shown on both tabs while being true of only one.
 */
describe('the panel speaks differently on each tab', () => {
  it.each([
    ["t('thinking')", "t('thinkingGeneral')"],
    ["t('emptyBody')", "t('emptyBodyGeneral')"],
    ["t('placeholder')", "t('placeholderGeneral')"],
  ])('chooses between %s and %s', (cases, general) => {
    expect(source).toContain(cases);
    expect(source).toContain(general);
  });

  /*
   * The pending line lives in `AskTurnView`, which had no idea which tab it was
   * in and so said "Nora is reading your cases" over a request that carries no
   * grounding block at all. It takes the mode now.
   */
  it('passes the mode down to the turn that renders the pending line', () => {
    expect(source).toContain('mode: AskMode;');
    expect(source).toContain('mode={mode}');
  });
});
