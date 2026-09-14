import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import messages from '@/messages/en.json';
import { INTAKE_WAITS } from './waits';
import { isFailureKind, failureCopyKey, type FailureKind } from './failure';

/**
 * Item E, as something that fails the build: every wait says what it is, and no
 * two waits say the same thing.
 *
 * The rule is "no shared spinner, no reused label", and the way it gets broken
 * is not by writing a bad label. It is by adding a sixth call and reaching for
 * the label the fifth one already had, which reads as correct in the diff and
 * is invisible on screen until you sit through both waits in a row. Comparing
 * the rendered sentences catches exactly that.
 *
 * Rendered rather than compared raw, because `chat.waitDocuments` is a plural
 * and two keys could differ as ICU source while producing the same sentence.
 */
const translator = createTranslator({
  locale: 'en',
  messages: { intake: messages.intake },
  namespace: 'intake',
});

/*
 * The translator is typed by the generated key union, and these keys are held
 * in data rather than written as literals, which is the whole point: a wait
 * that is not in `INTAKE_WAITS` is a wait nobody listed. Widened once, here,
 * rather than casting at each call.
 */
const t = translator as unknown as (
  key: string,
  values?: Record<string, unknown>,
) => string;

/** `count` is only read by the document wait; the rest ignore it. */
function render(copyKey: string): string {
  return t(copyKey, { count: 1 });
}

describe('the waits', () => {
  it('are all six of the calls that make the client wait', () => {
    expect(INTAKE_WAITS.map((wait) => wait.id)).toEqual([
      'first-turn',
      'later-turn',
      'read-documents',
      /*
       * The post-submission turn, added with the concierge mode (item 27). It
       * is a distinct wait rather than a reuse of `later-turn`: on a sealed
       * case there is no brief to check anything against, so "checking that
       * against the rest of your case" would describe work that is not
       * happening.
       */
      'waiting-turn',
      'recap',
      'sending',
    ]);
  });

  it.each(INTAKE_WAITS.map((wait) => [wait.id, wait.copyKey] as const))(
    '%s has copy',
    (_id, copyKey) => {
      const text = render(copyKey);
      expect(text).not.toBe(copyKey);
      expect(text.trim().length).toBeGreaterThan(0);
    },
  );

  it('never reuse a sentence between two of them', () => {
    const byText = new Map<string, string[]>();
    for (const wait of INTAKE_WAITS) {
      const text = render(wait.copyKey);
      byText.set(text, [...(byText.get(text) ?? []), wait.id]);
    }
    const shared = [...byText.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([text, ids]) => `${ids.join(' and ')} both say "${text}"`);
    expect(shared).toEqual([]);
  });

  it('say what is happening rather than that something is', () => {
    // The specific thing being replaced. A label that could sit over any of
    // the five is the defect, not a style preference.
    const vague = ['thinking', 'loading', 'please wait', 'working'];
    const offenders = INTAKE_WAITS.filter((wait) =>
      vague.some((word) => render(wait.copyKey).toLowerCase().includes(word)),
    ).map((wait) => wait.id);
    expect(offenders).toEqual([]);
  });
});

/**
 * T32: every failure kind has its own sentence, and none of them leaks.
 *
 * `copy-keys.test.ts` cannot see these. It reads quoted strings out of `t(...)`
 * calls, and the failure sentence is looked up as `t(failureCopyKey(kind))`, so
 * the key exists only at runtime. A missing one renders its own key into the
 * chat at the exact moment the client already knows something has gone wrong.
 */
const KINDS: readonly FailureKind[] = [
  'offline',
  'unauthorized',
  'busy',
  'refused',
  'truncated',
  'unreadable',
  'unknown',
];

describe('the failure copy', () => {
  it.each(KINDS)('%s has a sentence', (kind) => {
    const text = render(failureCopyKey(kind));
    expect(text).not.toBe(failureCopyKey(kind));
    expect(text.trim().length).toBeGreaterThan(0);
  });

  it('gives each kind a different sentence', () => {
    const texts = KINDS.map((kind) => render(failureCopyKey(kind)));
    expect(new Set(texts).size).toBe(KINDS.length);
  });

  /*
   * The actual regression. These routes used to hand `err.message` back and the
   * chat rendered it, so a deployment with no key told a client about `apiKey`
   * and `authToken`, and a rate limit told them about a token bucket. None of
   * the provider's vocabulary belongs in front of a client, and the sentences
   * are the only place it could come back.
   */
  it('names nothing from the provider or the stack', () => {
    const forbidden = [
      'api',
      'anthropic',
      'claude',
      'token',
      'json',
      'schema',
      'http',
      '500',
      '429',
      'null',
      'undefined',
    ];
    const offenders: string[] = [];
    for (const kind of KINDS) {
      const text = render(failureCopyKey(kind)).toLowerCase();
      for (const word of forbidden) {
        if (text.includes(word)) offenders.push(`${kind}: "${word}"`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('rejects a kind it has no copy for', () => {
    // The guard the stream reader leans on: an unrecognised kind must become
    // `unknown` rather than being passed through to `t()` as a key.
    expect(isFailureKind('quotaExceeded')).toBe(false);
    expect(isFailureKind('busy')).toBe(true);
  });
});
