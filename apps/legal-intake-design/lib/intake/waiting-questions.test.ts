import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import messages from '@/messages/en.json';
import { WAITING_QUESTIONS, remainingQuestions } from './waiting-questions';
import { WAITING_SYSTEM_PROMPT } from './waiting-prompt';

/**
 * The three questions the confirmation puts in the client's mouth.
 *
 * Putting words in someone's mouth carries one obligation: the answer has to
 * exist. A suggested question that the prompt is required to refuse would be
 * the product baiting somebody into being told no, on the screen where they
 * have just paid us the compliment of sending us their problem.
 */
const translator = createTranslator({
  locale: 'en',
  messages: { intake: messages.intake },
  namespace: 'intake.sent.ask',
});

const t = translator as unknown as (key: string) => string;

describe('the waiting questions', () => {
  it('are three, and about the case rather than about the firm', () => {
    expect(WAITING_QUESTIONS.map((question) => question.id)).toEqual([
      'timing',
      'covers',
      'document',
    ]);
  });

  it('reads as something the client would actually type', () => {
    // The chip label and the message sent are the same string, because the
    // transcript is read by a lawyer and a row that said "Timing" while the
    // thread recorded a fuller question would put words in the client's mouth
    // they can see they did not choose.
    for (const question of WAITING_QUESTIONS) {
      const text = t(`question.${question.id}`);
      expect(text.length).toBeGreaterThan(0);
      expect(text.endsWith('?')).toBe(true);
    }
    expect(t('label').length).toBeGreaterThan(0);
  });

  it('asks nothing twice', () => {
    const texts = WAITING_QUESTIONS.map((question) =>
      t(`question.${question.id}`),
    );
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('offers no question the prompt has to refuse', () => {
    /*
     * The two hard refusals are the price and the merits. A suggested question
     * touching either would be a trap, so this reads the offered text rather
     * than trusting the three ids to stay what they are.
     */
    const forbidden = [
      'how much',
      'cost',
      'price',
      'fee',
      'do i have a case',
      'should i',
      'am i right',
      'who is my lawyer',
    ];
    for (const question of WAITING_QUESTIONS) {
      const text = t(`question.${question.id}`).toLowerCase();
      for (const phrase of forbidden) expect(text).not.toContain(phrase);
    }
  });

  it('asks only things the closed fact list can answer', () => {
    // Kept honest against the prompt itself: each question maps to a fact that
    // is actually in there. See the matching test in `waiting-prompt.test.ts`.
    expect(WAITING_SYSTEM_PROMPT).toContain('within 24 hours');
    expect(WAITING_SYSTEM_PROMPT).toContain('Nothing is charged until');
    expect(WAITING_SYSTEM_PROMPT).toContain('A document dropped anywhere');
  });
});

describe('what is still worth offering', () => {
  it('offers all three before anything is asked', () => {
    expect(remainingQuestions([])).toHaveLength(3);
  });

  it('drops an asked question rather than locking it', () => {
    /*
     * The divergence from `SuggestionChips`, which locks its whole row after
     * one pick. That is right for one choice among alternatives and wrong for
     * three independent questions: the answer to an asked one is in the
     * transcript directly above, so a locked chip would be a dead control next
     * to its own answer.
     */
    const left = remainingQuestions(['timing']);
    expect(left.map((question) => question.id)).toEqual(['covers', 'document']);
  });

  it('offers nothing once all three are asked, rather than an empty row', () => {
    // An empty invitation is worse than none. The composer is still there.
    expect(remainingQuestions(['timing', 'covers', 'document'])).toHaveLength(
      0,
    );
  });

  it('ignores an id it does not know', () => {
    // A stale id from an older session must not blank the row.
    expect(remainingQuestions(['nonsense'])).toHaveLength(3);
  });
});
