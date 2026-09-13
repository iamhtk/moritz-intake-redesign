import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import messages from '@/messages/en.json';
import { createBrief, type Brief } from './brief';
import { fieldsForMatter } from './matter-fields';
import { oneMoreThing } from './one-more-thing';

/**
 * The one ask, and — more importantly — the silence.
 *
 * The failure this guards against is not a missing block, it is a block that
 * appears when it should not. A confirmation screen that asks a client for
 * something they already gave is the intake refusing to take yes for an
 * answer, and the first version of this shipped exactly that bug: it counted
 * documents off a list the demo never wrote to, so a reviewer looking at a case
 * with the contract attached was told we did not have the contract.
 */
const translator = createTranslator({
  locale: 'en',
  messages: { intake: messages.intake },
  namespace: 'intake.sent.oneMore',
});

const t = translator as unknown as (key: string) => string;

function contractBrief(values: Record<string, string | null> = {}): Brief {
  const brief = createBrief('contract', fieldsForMatter('contract'));
  return {
    ...brief,
    fields: brief.fields.map((field) =>
      field.key in values
        ? { ...field, value: values[field.key] ?? null }
        : field,
    ),
  };
}

describe('the one thing that would help', () => {
  it('asks for the document when there is no document', () => {
    // The gap that changes what the firm can do rather than how well: a draft
    // written from a description of an agreement nobody has read.
    expect(oneMoreThing(contractBrief({ outcome: 'A short list' }), 0)).toBe(
      'document',
    );
  });

  it('asks for the outcome when the document is already in', () => {
    expect(oneMoreThing(contractBrief({ outcome: null }), 1)).toBe('outcome');
  });

  it('asks for nothing when the client gave us both', () => {
    // The common case, and the correct output is silence rather than praise.
    expect(oneMoreThing(contractBrief({ outcome: 'A short list' }), 1)).toBe(
      null,
    );
  });

  it('makes at most one ask, and the document outranks the outcome', () => {
    /*
     * Both gaps open at once is the state a client who typed two sentences and
     * attached nothing arrives in. Two asks stacked on a confirmation is a
     * form, which is the thing this flow stopped being — and of the two, the
     * document is the one that changes what gets drafted.
     */
    expect(oneMoreThing(contractBrief({ outcome: null }), 0)).toBe('document');
  });

  it('counts any document, however it arrived', () => {
    // More than one is still "we have the contract".
    expect(oneMoreThing(contractBrief({ outcome: 'Something' }), 3)).toBe(null);
  });

  it('asks for nothing on a matter with no outcome field', () => {
    /*
     * `outcome` is the contract flow's own optional field. A matter type
     * without one has no such gap, and inferring one would mean asking a client
     * for a field their own brief never had.
     */
    const brief = createBrief('employment', fieldsForMatter('employment'));
    const hasOutcome = brief.fields.some((field) => field.key === 'outcome');
    expect(oneMoreThing(brief, 1)).toBe(hasOutcome ? 'outcome' : null);
  });

  it('says why it is asking, in both cases', () => {
    /*
     * The reason is the whole difference between this and a form reopening. An
     * ask with no stated benefit to the client's own case is just another
     * field, so both branches have to carry one.
     */
    expect(t('document.title').length).toBeGreaterThan(0);
    expect(t('document.hint')).toContain('draft');
    expect(t('outcome.body')).toContain('quote');
    expect(t('outcome.button').length).toBeGreaterThan(0);
    expect(t('outcome.done')).toContain('lawyer');
  });

  it('never asks the client about money', () => {
    /*
     * The quote is the firm's job to write. A flow that asked "what were you
     * hoping to spend" the moment the case was sent would be pricing the client
     * rather than the work, and this screen is the one where that temptation
     * has the best excuse.
     */
    const copy = [
      t('document.title'),
      t('document.hint'),
      t('outcome.title'),
      t('outcome.body'),
      t('outcome.label'),
      t('outcome.placeholder'),
      t('outcome.button'),
    ]
      .join(' ')
      .toLowerCase();
    for (const word of ['budget', 'afford', 'spend', 'how much']) {
      expect(copy).not.toContain(word);
    }
  });
});
