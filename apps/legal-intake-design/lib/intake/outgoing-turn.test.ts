import { describe, expect, it } from 'vitest';
import { documentsOnlyMessage, isSendable } from './outgoing-turn';

describe('isSendable', () => {
  it('sends words', () => {
    expect(isSendable({ text: 'We signed an MSA', documents: 0 })).toBe(true);
  });

  /*
   * The bug. Dropping a contract on the opening screen and pressing send
   * without typing is a real opening move, and the composer's own Send button
   * is live for it — so refusing the turn here meant the attachment vanished,
   * the document was read, and nothing was ever said.
   */
  it('sends documents with no words', () => {
    expect(isSendable({ text: '', documents: 1 })).toBe(true);
    expect(isSendable({ text: '   \n ', documents: 2 })).toBe(true);
  });

  it('sends nothing when there is nothing', () => {
    expect(isSendable({ text: '', documents: 0 })).toBe(false);
    expect(isSendable({ text: '  ', documents: 0 })).toBe(false);
  });
});

describe('documentsOnlyMessage', () => {
  /*
   * Bracketed, because the route drops it into the CLIENT MESSAGE slot. The
   * model has to read it as a note about what happened rather than as the
   * client's own words — the alternative was inventing a sentence for them.
   */
  it('reads as a note about the event, not as the client speaking', () => {
    const message = documentsOnlyMessage(['msa.pdf']);
    expect(message.startsWith('[')).toBe(true);
    expect(message.endsWith(']')).toBe(true);
  });

  it('names every document, so the reply can be about them', () => {
    const message = documentsOnlyMessage(['msa.pdf', 'order-form.pdf']);
    expect(message).toContain('msa.pdf');
    expect(message).toContain('order-form.pdf');
    expect(message).toContain('2 documents');
  });

  it('counts one document as one', () => {
    expect(documentsOnlyMessage(['msa.pdf'])).toContain('a document');
  });

  // The route rejects a blank message, which is what this exists to avoid.
  it('is never blank', () => {
    expect(documentsOnlyMessage([]).trim()).not.toBe('');
  });
});
