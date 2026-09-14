import { describe, expect, it } from 'vitest';
import { createTranslator } from 'next-intl';
import messages from '@/messages/en.json';
import {
  CASE_RECEIVED_NOTIFICATION_ID,
  QUOTE_READY_NOTIFICATION_ID,
  caseReceivedNotification,
  quoteReadyNotification,
} from './intake-notifications';

const input = {
  caseNumber: 'M-2026-0126',
  caseTitle: 'MSA early exit: Acme',
  href: '/client/cases/case_009',
  title: 'We have your case',
  content: 'Your case is with us and a quote is being prepared.',
};

describe('caseReceivedNotification', () => {
  it('is a case-received row for the submitted case', () => {
    const notification = caseReceivedNotification(input);
    expect(notification.type).toBe('CASE_RECEIVED');
    expect(notification.caseNumber).toBe('M-2026-0126');
    expect(notification.caseTitle).toBe('MSA early exit: Acme');
    expect(notification.href).toBe('/client/cases/case_009');
  });

  it('carries the copy it was given', () => {
    const notification = caseReceivedNotification(input);
    expect(notification.title).toBe('We have your case');
    expect(notification.content).toBe(
      'Your case is with us and a quote is being prepared.',
    );
  });

  // The unread badge is the whole mechanism: it is what a client sees on the
  // bell when they come back to a tab they left.
  it('arrives unread', () => {
    expect(caseReceivedNotification(input).read).toBe(false);
  });

  /*
   * `raisePortalNotification` dedupes on id, so a fixed id is what stops a
   * reload, a re-render or a second submit from stacking three identical rows.
   */
  it('has a stable id', () => {
    expect(caseReceivedNotification(input).id).toBe(
      CASE_RECEIVED_NOTIFICATION_ID,
    );
    expect(caseReceivedNotification(input).id).toBe(
      caseReceivedNotification({ ...input, caseTitle: 'Something else' }).id,
    );
  });

  // Attributing it to a lawyer would put a face on the row and say, wrongly,
  // that a person has the case (B, Decision 21).
  it('has no actor', () => {
    expect(caseReceivedNotification(input).triggeredBy).toBeNull();
  });

  it('timestamps when it was raised, and parses', () => {
    const now = new Date('2026-09-12T10:30:00.000Z');
    const notification = caseReceivedNotification({ ...input, now });
    expect(notification.createdAt).toBe('2026-09-12T10:30:00.000Z');
    expect(Number.isNaN(Date.parse(notification.createdAt))).toBe(false);
  });
});

describe('quoteReadyNotification', () => {
  const lawyer = { name: 'Mei Tan', image: '/onboarding-lawyers/mei.jpg' };

  it('is a quote row for the submitted case', () => {
    const notification = quoteReadyNotification({
      ...input,
      title: 'Your quote is ready',
      content: 'A fixed price is waiting in your case chat.',
      lawyer,
    });
    expect(notification.type).toBe('QUOTE_CREATED');
    expect(notification.caseNumber).toBe('M-2026-0126');
    expect(notification.href).toBe('/client/cases/case_009');
    expect(notification.read).toBe(false);
  });

  it('has a stable id, distinct from the received row', () => {
    const notification = quoteReadyNotification({
      ...input,
      title: 'Your quote is ready',
      content: 'A fixed price is waiting.',
      lawyer,
    });
    expect(notification.id).toBe(QUOTE_READY_NOTIFICATION_ID);
    expect(notification.id).not.toBe(CASE_RECEIVED_NOTIFICATION_ID);
  });

  /*
   * The difference between the two rows, and it is the rule rather than a
   * detail. Submission is the client's own action so there is nobody to
   * attribute it to; a quote is written by a named lawyer, which is the one
   * claim about an individual this flow can stand behind. It is also the first
   * time in the whole journey a real person is attached to the case.
   */
  it('carries the lawyer who wrote it, unlike the received row', () => {
    const notification = quoteReadyNotification({
      ...input,
      title: 'Your quote is ready',
      content: 'A fixed price is waiting.',
      lawyer,
    });
    expect(notification.triggeredBy).toEqual(lawyer);
    expect(caseReceivedNotification(input).triggeredBy).toBeNull();
  });

  it('survives a lawyer with no headshot', () => {
    const notification = quoteReadyNotification({
      ...input,
      title: 'Your quote is ready',
      content: 'A fixed price is waiting.',
      lawyer: { name: 'Amara Nwosu', image: null },
    });
    expect(notification.triggeredBy).toEqual({
      name: 'Amara Nwosu',
      image: null,
    });
  });
});

/**
 * The two rows' own copy, which is stored rather than translated at render.
 *
 * These notifications outlive the render that made them: they are written to
 * localStorage and read back on a later visit, so the strings are baked in at
 * creation time by the caller. That puts them outside every copy guard in the
 * repo, and the received row is where that mattered — it used to say "A lawyer
 * is reading it now", a claim about a person working this second, raised from
 * the same screen as a card built to stop exactly that misreading.
 */
describe('the notification copy', () => {
  const translator = createTranslator({
    locale: 'en',
    messages: { intake: messages.intake },
    namespace: 'intake.notification',
  });
  const t = translator as unknown as (
    key: string,
    values?: Record<string, unknown>,
  ) => string;

  it('exists for both rows', () => {
    for (const key of [
      'receivedTitle',
      'receivedBody',
      'quoteTitle',
      'quoteBody',
    ]) {
      expect(t(key, { reference: 'M-2026-0126' })).not.toBe(key);
    }
  });

  it('never says a lawyer is reading the case right now', () => {
    const received = t('receivedBody', {
      reference: 'M-2026-0126',
    }).toLowerCase();
    expect(received).not.toMatch(/reading it now/);
    expect(received).not.toMatch(/lawyer is reviewing/);
  });

  /*
   * What it says instead. Garzai is explicit that the next step is a quote and
   * that nobody is assigned until it is paid, so the receipt has to point at
   * the price rather than at a person.
   */
  it('points at the quote as the next event', () => {
    expect(
      t('receivedBody', { reference: 'M-2026-0126' }).toLowerCase(),
    ).toMatch(/quote/);
  });
});
