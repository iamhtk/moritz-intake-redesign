import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import messages from '@/messages/en.json';
import {
  isActionable,
  needsDetail,
  NO_QUOTE_REASONS,
  QUOTE_RESPONSES,
  scopeChoices,
  TOO_HIGH_REASONS,
} from './quote';

const translator = createTranslator({
  locale: 'en',
  messages: { intake: messages.intake },
  namespace: 'intake',
});
const t = translator as unknown as (
  key: string,
  values?: Record<string, unknown>,
) => string;

describe('the paths off a quote (G3)', () => {
  it('offers approve plus the three their product does not', () => {
    expect(QUOTE_RESPONSES).toEqual([
      'approve',
      'question',
      'too-high',
      'part-only',
    ]);
  });

  /*
   * Approving is the one path where the click says everything. A form in front
   * of it would be charging the client for agreeing, which is the opposite of
   * what the extra paths are for.
   */
  it('asks for nothing extra before approving', () => {
    expect(needsDetail('approve')).toBe(false);
  });

  it('asks for something before every path that a person has to read', () => {
    for (const response of ['question', 'too-high', 'part-only'] as const) {
      expect(needsDetail(response)).toBe(true);
    }
  });
});

describe('why the price is a problem', () => {
  it('separates the three a lawyer can act on from the one they cannot', () => {
    const actionable = TOO_HIGH_REASONS.filter(isActionable);
    expect(actionable).toEqual(['over-budget', 'unexpected', 'compared']);
    expect(TOO_HIGH_REASONS.filter((one) => !isActionable(one))).toEqual([
      'thinking',
    ]);
  });

  /*
   * "I want to think about it" is in the list *because* it is unactionable.
   * Without it, a client who wants a day to decide has to pick one of the three
   * that misrepresents them, and a misrepresented objection is worse for the
   * lawyer than an honest silence.
   */
  it('keeps the unactionable option available anyway', () => {
    expect(TOO_HIGH_REASONS).toContain('thinking');
  });
});

describe('asking for part of the work', () => {
  const FIELDS = [
    {
      key: 'situation',
      label: 'What you need',
      value: 'Exit the MSA',
      required: true,
    },
    { key: 'otherSide', label: 'Other side', value: 'Acme', required: true },
    { key: 'urgency', label: 'Urgency', value: null, required: true },
    {
      key: 'outcome',
      label: 'Desired outcome',
      value: 'A short list',
      required: false,
    },
  ];

  /*
   * Built from the brief, which is the whole reason this path is possible at
   * all: the intake has already itemised the matter, so a client asking for
   * less can point at the parts that exist rather than describe a scope from
   * scratch.
   */
  it('offers the filled required parts of the brief', () => {
    expect(scopeChoices(FIELDS)).toEqual([
      { key: 'situation', label: 'What you need' },
      { key: 'otherSide', label: 'Other side' },
    ]);
  });

  it('never offers an empty field as a piece of work', () => {
    expect(scopeChoices(FIELDS).map((one) => one.key)).not.toContain('urgency');
  });

  it('never offers an optional field the client did not have to fill', () => {
    expect(scopeChoices(FIELDS).map((one) => one.key)).not.toContain('outcome');
  });

  it('offers nothing for an empty brief', () => {
    expect(scopeChoices([])).toEqual([]);
  });
});

/**
 * Every path and every reason has its own sentence, and none of them shares one.
 *
 * The same rule `waits.test.ts` enforces for loading states, for the same
 * reason: the value of offering four ways to say no is entirely in the four
 * being different, and the way that breaks is somebody adding a fifth and
 * reaching for the wording of the fourth.
 */
describe('the copy behind the paths', () => {
  const KEYS = [
    ...QUOTE_RESPONSES.map((one) => `quote.response.${one}`),
    ...TOO_HIGH_REASONS.map((one) => `quote.tooHigh.${one}`),
    ...NO_QUOTE_REASONS.map((one) => `quote.noQuote.${one}.title`),
    ...NO_QUOTE_REASONS.map((one) => `quote.noQuote.${one}.body`),
    ...NO_QUOTE_REASONS.map((one) => `quote.noQuote.${one}.instead`),
  ];

  it.each(KEYS)('%s resolves', (key) => {
    const text = t(key);
    expect(text).not.toBe(key);
    expect(text.trim().length).toBeGreaterThan(0);
  });

  it('gives every path its own words', () => {
    const texts = KEYS.map((key) => t(key));
    expect(new Set(texts).size).toBe(KEYS.length);
  });

  /*
   * G2's rule as a test: a reason the firm cannot quote must always say what is
   * possible instead. A client who has just written a brief and is told only
   * "no" has been given an error screen, which is the one ending this whole
   * redesign exists to avoid.
   */
  it('never says no without saying what is possible instead', () => {
    for (const reason of NO_QUOTE_REASONS) {
      const instead = t(`quote.noQuote.${reason}.instead`);
      expect(
        instead.trim().length,
        `${reason} has no way forward`,
      ).toBeGreaterThan(20);
    }
  });
});
