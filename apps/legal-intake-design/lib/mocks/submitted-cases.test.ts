import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCaseById } from '@/lib/mocks/cases';
import { SUBMITTED_CASE } from '@/lib/intake/submitted-case';
import { applySubmission, type SubmittedCase } from './submitted-cases';

/**
 * What "Your cases" shows after an intake is sent.
 *
 * The fixture the submission lands on describes a warehousing MSA, because it
 * had to describe something. Every assertion here is about the overlay not
 * leaving any of that fixture prose on a case the client filled in themselves —
 * which was the visible half of the bug: exit a sent case, open "Your cases",
 * and find a matter you had never mentioned sitting under today's date.
 */

const FIXTURE = getCaseById(SUBMITTED_CASE.id)!;

const SUBMISSION: SubmittedCase = {
  id: SUBMITTED_CASE.id,
  title: 'Unpaid notice period: former operations lead',
  description:
    'The client dismissed an operations lead in June and wants to know what notice is owed.',
  documentNames: ['employment-contract.pdf', 'termination-letter.pdf'],
  transcript: [
    {
      role: 'moritz',
      text: 'Tell me what you need.',
      at: '2026-09-12T14:55:00.000Z',
    },
    {
      role: 'client',
      text: 'Here is the contract.',
      at: '2026-09-12T14:56:00.000Z',
      attachments: ['employment-contract.pdf'],
    },
  ],
  submittedAt: '2026-09-12T15:04:00.000Z',
};

describe('applySubmission', () => {
  const merged = applySubmission(FIXTURE, SUBMISSION);

  it('names the matter the client sent, not the fixture', () => {
    expect(merged.title).toBe(SUBMISSION.title);
    expect(merged.title).not.toBe(FIXTURE.title);
  });

  it('describes it with the recap the brief produced', () => {
    expect(merged.description).toBe(SUBMISSION.description);
  });

  // A recap that failed should leave the case readable. The fields on the
  // brief still say everything the paragraph would have summarised.
  it('keeps the fixture description when the recap had none', () => {
    const noRecap = applySubmission(FIXTURE, {
      ...SUBMISSION,
      description: null,
    });
    expect(noRecap.description).toBe(FIXTURE.description);
  });

  it('lists the documents that were handed over', () => {
    expect(merged.documents.map((one) => one.name)).toEqual(
      SUBMISSION.documentNames,
    );
  });

  it('files them as the client’s own uploads, so the client can see them', () => {
    for (const document of merged.documents) {
      expect(document.uploaderActor).toBe('client');
      expect(document.uploadedAt).toBe(SUBMISSION.submittedAt);
    }
  });

  /*
   * The store hands these out through `useSyncExternalStore`, which loops
   * forever on a snapshot whose identity changes between reads. The documents
   * are built from the record rather than generated, and this is the assertion
   * that keeps it that way.
   */
  it('produces the same records every time it is read', () => {
    expect(applySubmission(FIXTURE, SUBMISSION)).toEqual(merged);
  });

  it('dates the case from the moment of sending', () => {
    expect(merged.createdAt).toBe(SUBMISSION.submittedAt);
    expect(merged.receivedAt).toBe(SUBMISSION.submittedAt);
    expect(merged.updatedAt).toBe(SUBMISSION.submittedAt);
    expect(Number.isNaN(new Date(merged.createdAt).getTime())).toBe(false);
  });

  // Where the case sits in the firm's queue is not the submission's call, and
  // the fixture was already written as a just-submitted one (see
  // submitted-case.test.ts).
  it('leaves the case at step one of the client timeline', () => {
    expect(merged.status).toBe(FIXTURE.status);
    expect(merged.quoteAmount).toBeNull();
    expect(merged.assignedLawyer).toBeNull();
    expect(merged.caseNumber).toBe(SUBMITTED_CASE.reference);
  });

  // The line the firm's lawyers read before claiming a case is an anonymisation
  // step this prototype has no backend to perform, so it stays the fixture's
  // rather than becoming un-anonymised client prose.
  it('does not touch the anonymised description', () => {
    expect(merged.anonDescription).toBe(FIXTURE.anonDescription);
  });
});

/**
 * The store itself, which is the half of this that cannot be clicked through in
 * a unit test: it only exists once there is a `window`, and its module state is
 * what survives a reload.
 *
 * Each case re-imports the module against a fresh fake `localStorage`, which is
 * exactly the "opened the page again" boundary the behaviour is about.
 */
describe('the submitted case store', () => {
  function fakeStorage(seed: Record<string, string> = {}) {
    const data = new Map(Object.entries(seed));
    return {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
      removeItem: (key: string) => void data.delete(key),
      data,
    };
  }

  async function freshStore(seed?: Record<string, string>) {
    const localStorage = fakeStorage(seed);
    vi.resetModules();
    vi.stubGlobal('window', { localStorage });
    const store = await import('./submitted-cases');
    return { store, localStorage };
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('remembers what was sent', async () => {
    const { store } = await freshStore();
    store.recordSubmittedCase(SUBMISSION);
    expect(store.readSubmissions()[SUBMISSION.id]).toEqual(SUBMISSION);
  });

  it('survives the page being opened again', async () => {
    const first = await freshStore();
    first.store.recordSubmittedCase(SUBMISSION);
    const stored = Object.fromEntries(first.localStorage.data);

    const second = await freshStore(stored);
    expect(second.store.readSubmissions()[SUBMISSION.id]).toEqual(SUBMISSION);
  });

  /*
   * The whole point of the change. One case id is all this prototype has to
   * land a submission on, so a client who sends a case, starts another and
   * sends that one has to find the second one under it — a dedupe would leave
   * them reading the title of the matter before last.
   */
  it('replaces the previous submission rather than keeping it', async () => {
    const { store } = await freshStore();
    store.recordSubmittedCase(SUBMISSION);
    store.recordSubmittedCase({
      ...SUBMISSION,
      title: 'Supplier renewal clause',
      documentNames: ['renewal-notice.pdf'],
    });

    const current = store.readSubmissions()[SUBMISSION.id];
    expect(current?.title).toBe('Supplier renewal clause');
    expect(current?.documentNames).toEqual(['renewal-notice.pdf']);
  });

  it('takes documents handed over after the case was sent', async () => {
    const { store } = await freshStore();
    store.recordSubmittedCase(SUBMISSION);
    store.addSubmittedCaseDocuments(SUBMISSION.id, ['payslips.pdf']);

    expect(store.readSubmissions()[SUBMISSION.id]?.documentNames).toEqual([
      ...SUBMISSION.documentNames,
      'payslips.pdf',
    ]);
  });

  // Being asked to add a document to a case that was never sent means
  // something upstream is confused. Inventing a submission here would put a
  // case in "Your cases" that nobody submitted.
  it('does not invent a submission to hang a late document on', async () => {
    const { store } = await freshStore();
    store.addSubmittedCaseDocuments(SUBMISSION.id, ['payslips.pdf']);
    expect(store.readSubmissions()).toEqual({});
  });

  it('hands out a stable snapshot, so a subscriber cannot loop', async () => {
    const { store } = await freshStore();
    expect(store.readSubmissions()).toBe(store.readSubmissions());
    store.recordSubmittedCase(SUBMISSION);
    expect(store.readSubmissions()).toBe(store.readSubmissions());
  });

  // A browser refusing to store is not a reason to lose the confirmation the
  // client is looking at.
  it('keeps the submission in memory when storage is blocked', async () => {
    vi.resetModules();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => null,
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
        removeItem: () => {},
      },
    });
    const store = await import('./submitted-cases');
    expect(() => store.recordSubmittedCase(SUBMISSION)).not.toThrow();
    expect(store.readSubmissions()[SUBMISSION.id]).toEqual(SUBMISSION);
  });

  it('keeps the conversation that produced the case', async () => {
    const { store } = await freshStore();
    store.recordSubmittedCase(SUBMISSION);
    expect(store.readSubmissions()[SUBMISSION.id]?.transcript).toEqual(
      SUBMISSION.transcript,
    );
  });

  /*
   * A document arriving on the case with nothing said about it is the silence
   * Decision 24 exists to close: the client is told the file is going to the
   * case, so the case thread has to show it arriving.
   */
  it('appends what Moritz said about a late document to the thread', async () => {
    const { store } = await freshStore();
    store.recordSubmittedCase(SUBMISSION);
    store.addSubmittedCaseDocuments(
      SUBMISSION.id,
      ['payslips.pdf'],
      [
        {
          role: 'moritz',
          text: 'Got payslips.pdf.',
          at: '2026-09-12T15:20:00.000Z',
        },
      ],
    );

    const current = store.readSubmissions()[SUBMISSION.id];
    expect(current?.transcript?.at(-1)).toEqual({
      role: 'moritz',
      text: 'Got payslips.pdf.',
      at: '2026-09-12T15:20:00.000Z',
    });
    expect(current?.transcript).toHaveLength(3);
  });

  /*
   * Words added after submission, with no document attached to them.
   *
   * The gap this closes was the quiet one. The transcript was snapshotted once
   * at submission and never appended to again, so a client answering a
   * question on the confirmation screen — or asking one, and being answered —
   * produced an exchange that existed in React state and nowhere a lawyer
   * would ever look. Garzai's description of the real system is the standard:
   * "anything added after submission is picked up by the agent in the
   * background and forwarded into drafting if it matters."
   *
   * A prototype that shows a reply and drops the message is worse than one
   * with no chat after submit, because it looks like the message landed.
   */
  it('appends an exchange that came with no document', async () => {
    const { store } = await freshStore();
    store.recordSubmittedCase(SUBMISSION);
    store.addSubmittedCaseTurns(SUBMISSION.id, [
      {
        role: 'client',
        text: 'A short list of the clauses we can use to get out early.',
        at: '2026-09-12T15:30:00.000Z',
      },
      {
        role: 'moritz',
        text: 'Added. That goes to the lawyer pricing your case.',
        at: '2026-09-12T15:30:00.000Z',
      },
    ]);

    const current = store.readSubmissions()[SUBMISSION.id];
    expect(current?.transcript).toHaveLength(4);
    expect(current?.transcript?.at(-2)?.role).toBe('client');
    expect(current?.transcript?.at(-2)?.text).toContain('get out early');
    // The documents are untouched: this path is words only.
    expect(current?.documentNames).toEqual(SUBMISSION.documentNames);
  });

  it('does nothing when there is no case to append to', async () => {
    /*
     * The same rule the document path follows. Inventing a submission here
     * would put a case in "Your cases" that was never sent, which is a worse
     * outcome than losing a sentence — and being called without one means
     * something upstream is confused rather than that the client did anything.
     */
    const { store } = await freshStore();
    store.addSubmittedCaseTurns('case_nothing', [
      { role: 'client', text: 'Hello?', at: '2026-09-12T15:30:00.000Z' },
    ]);
    expect(store.readSubmissions()).toEqual({});
  });

  it('ignores an empty list rather than rewriting the case', async () => {
    const { store } = await freshStore();
    store.recordSubmittedCase(SUBMISSION);
    store.addSubmittedCaseTurns(SUBMISSION.id, []);
    expect(store.readSubmissions()[SUBMISSION.id]).toEqual(SUBMISSION);
  });
});
