import { describe, expect, it } from 'vitest';
import type { Document } from '@/lib/types';
import {
  MORITZ_AI,
  toCaseTranscript,
  toTranscript,
  type IntakeTurn,
} from './case-transcript';

const CLIENT = {
  id: 'usr_client_001',
  name: 'Alex Morgan',
  email: 'alex.morgan@northwindltd.com',
  image: null,
  actor: 'client' as const,
  companyName: 'Northwind Ltd.',
};

const SENT_AT = Date.parse('2026-09-12T15:04:00.000Z');

const CONTRACT: Document = {
  id: 'doc_submitted_1',
  familyId: 'fam_submitted_1',
  version: 1,
  name: 'employment-contract.pdf',
  size: 0,
  mimeType: '',
  uploadedAt: '2026-09-12T15:04:00.000Z',
  uploadedBy: 'You',
  uploaderActor: 'client',
  docType: 'other',
  status: 'final',
  isDraft: false,
};

describe('toTranscript', () => {
  it('keeps what was said, in order, and says who said it', () => {
    const turns: IntakeTurn[] = [
      { role: 'assistant', text: 'Tell me what you need.', at: SENT_AT - 6000 },
      {
        role: 'user',
        text: 'We dismissed someone in June.',
        at: SENT_AT - 4000,
      },
    ];
    expect(toTranscript(turns, SENT_AT)).toEqual([
      {
        role: 'moritz',
        text: 'Tell me what you need.',
        at: new Date(SENT_AT - 6000).toISOString(),
      },
      {
        role: 'client',
        text: 'We dismissed someone in June.',
        at: new Date(SENT_AT - 4000).toISOString(),
      },
    ]);
  });

  // The same reason the session itself never saves one: on the next read it
  // looks like Moritz stopped mid-sentence.
  it('drops a reply that was still being written', () => {
    const turns: IntakeTurn[] = [
      { role: 'assistant', text: '', at: SENT_AT, pending: true },
      {
        role: 'assistant',
        text: '',
        at: SENT_AT,
        pending: true,
        activity: 'Reading',
      } as IntakeTurn,
    ];
    expect(toTranscript(turns, SENT_AT)).toEqual([]);
  });

  it('drops a turn that settled with nothing in it', () => {
    expect(
      toTranscript([{ role: 'assistant', text: '   ', at: SENT_AT }], SENT_AT),
    ).toEqual([]);
  });

  /*
   * The aside is a second paragraph of the same turn, not a turn of its own —
   * and it is a request the client was actually made, so losing it would lose
   * part of the record.
   */
  it('keeps the aside with the turn it belonged to', () => {
    const [turn] = toTranscript(
      [
        {
          role: 'assistant',
          text: 'When did the dismissal happen?',
          aside: 'If you have the contract and any payslips, those help most.',
          at: SENT_AT,
        },
      ],
      SENT_AT,
    );
    expect(turn?.text).toBe(
      'When did the dismissal happen?\n\nIf you have the contract and any payslips, those help most.',
    );
  });

  it('records the files sent with a turn', () => {
    const [turn] = toTranscript(
      [
        {
          role: 'user',
          text: 'Here is the contract.',
          at: SENT_AT,
          attachments: [{ name: 'employment-contract.pdf' }],
        },
      ],
      SENT_AT,
    );
    expect(turn?.attachments).toEqual(['employment-contract.pdf']);
  });

  // A session saved before turns carried a time comes back without one. The
  // order is still known; the clock is not, and inventing a plausible spread
  // would put made-up timestamps on a record a lawyer reads.
  it('falls back to the moment of sending when a turn has no time', () => {
    const [turn] = toTranscript([{ role: 'user', text: 'Hello' }], SENT_AT);
    expect(turn?.at).toBe(new Date(SENT_AT).toISOString());
  });
});

describe('toCaseTranscript', () => {
  const turns = toTranscript(
    [
      { role: 'assistant', text: 'Tell me what you need.', at: SENT_AT - 6000 },
      {
        role: 'user',
        text: 'Here is the contract.',
        at: SENT_AT - 4000,
        attachments: [{ name: 'employment-contract.pdf' }],
      },
    ],
    SENT_AT,
  );

  const messages = toCaseTranscript({
    caseId: 'case_009',
    turns,
    client: CLIENT,
    documents: [CONTRACT],
  });

  // This is what the case chat's phase divider and its "before counsel joined"
  // grouping read off. Untagged messages are treated as counsel.
  it('tags every message as intake', () => {
    expect(messages.every((one) => one.phase === 'intake')).toBe(true);
  });

  it('attributes the client’s words to the client and the rest to Moritz', () => {
    expect(messages[0]?.author).toBe(MORITZ_AI);
    expect(messages[1]?.author).toBe(CLIENT);
  });

  it('carries the times the conversation actually happened', () => {
    expect(messages[0]?.createdAt).toBe(new Date(SENT_AT - 6000).toISOString());
    expect(messages[1]?.createdAt).toBe(new Date(SENT_AT - 4000).toISOString());
  });

  // A question that was visibly answered showing "Delivered" reads as broken.
  it('marks the client’s own turns as read', () => {
    expect(messages[1]?.readAt).toBe(messages[1]?.createdAt);
    expect(messages[0]?.readAt).toBeUndefined();
  });

  /*
   * The chip in the bubble and the row in the Documents tab have to be one
   * record. Two records with the same name is how a client ends up wondering
   * whether they sent the contract once or twice.
   */
  it('attaches the case’s own document record, not a copy of it', () => {
    expect(messages[1]?.attachments).toEqual([CONTRACT]);
    expect(messages[1]?.attachments?.[0]).toBe(CONTRACT);
  });

  it('leaves a named file off the turn when the case has no such document', () => {
    const [, withFile] = toCaseTranscript({
      caseId: 'case_009',
      turns,
      client: CLIENT,
      documents: [],
    });
    expect(withFile?.attachments).toBeUndefined();
  });

  /*
   * The case shell holds its documents in state and merges arriving records by
   * id. Ids that changed between reads would re-add the same files on every
   * render.
   */
  it('gives the same message the same id every time', () => {
    const again = toCaseTranscript({
      caseId: 'case_009',
      turns,
      client: CLIENT,
      documents: [CONTRACT],
    });
    expect(again.map((one) => one.id)).toEqual(messages.map((one) => one.id));
    expect(messages.map((one) => one.id)).toEqual([
      'case_009_intake_1',
      'case_009_intake_2',
    ]);
  });

  it('files every message under the case it belongs to', () => {
    expect(messages.every((one) => one.caseId === 'case_009')).toBe(true);
  });
});
