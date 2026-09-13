import { describe, expect, it } from 'vitest';
import { splitTail } from './stream-tail';

/**
 * The one invariant that matters more than the split itself.
 *
 * The bubble is `whitespace-pre-wrap`, so a space lost or gained in here
 * reflows the client's reply while they are reading it. Asserted on every case
 * below rather than as a test of its own, because a split that is correct on a
 * sentence and wrong on a paragraph break is the shape this would fail in.
 */
function expectLossless(text: string, tailWords: number) {
  const { head, tail } = splitTail(text, tailWords);
  expect(head + tail.join('')).toBe(text);
  return { head, tail };
}

describe('splitting the wet ink off a streaming reply', () => {
  it('peels the last words and leaves the rest settled', () => {
    const { head, tail } = expectLossless('I have put that down for you', 3);
    expect(head).toBe('I have put that ');
    expect(tail).toEqual(['down ', 'for ', 'you']);
  });

  it('gives every tail segment a word to start with', () => {
    const { tail } = expectLossless('one two three four five', 3);
    expect(tail.every((segment) => /^\S/.test(segment))).toBe(true);
  });

  /*
   * A reply two words in is entirely wet, which is correct: there is nothing
   * settled yet to contrast against.
   */
  it('takes what there is when the reply is shorter than the tail', () => {
    const { head, tail } = expectLossless('Got it', 4);
    expect(head).toBe('');
    expect(tail).toEqual(['Got ', 'it']);
  });

  it('handles a single word', () => {
    const { head, tail } = expectLossless('Right', 3);
    expect(head).toBe('');
    expect(tail).toEqual(['Right']);
  });

  /*
   * The stream cuts mid-word constantly — `extractPartialReply` hands over
   * whatever has arrived — and a half-written word is exactly the thing that
   * should be lightest.
   */
  it('treats a half-arrived final word as the leading edge', () => {
    const { tail } = expectLossless('I have put that dow', 2);
    expect(tail).toEqual(['that ', 'dow']);
  });

  /*
   * A paragraph break inside the tail. The reply carries these — the progress
   * note is joined on with a blank line — and splitting one in half would show
   * the client a gap that is not in the text.
   */
  it('keeps a paragraph break whole', () => {
    const { head, tail } = expectLossless('Done.\n\nOne question left', 3);
    expect(head).toBe('Done.\n\n');
    expect(tail).toEqual(['One ', 'question ', 'left']);
  });

  it('keeps trailing whitespace with the last segment', () => {
    const { head, tail } = expectLossless('almost there  ', 1);
    expect(head).toBe('almost ');
    expect(tail).toEqual(['there  ']);
  });

  it('keeps leading whitespace on the head', () => {
    const { head, tail } = expectLossless('  starting up', 1);
    expect(head).toBe('  starting ');
    expect(tail).toEqual(['up']);
  });

  describe('the cases with no ink in them', () => {
    it.each([
      ['nothing at all', '', 3],
      ['whitespace only', '   ', 3],
      ['a newline only', '\n', 3],
      ['no tail asked for', 'some words here', 0],
      ['a negative tail', 'some words here', -1],
    ])('%s leaves the text settled', (_name, text, tailWords) => {
      const { head, tail } = expectLossless(text, tailWords);
      expect(head).toBe(text);
      expect(tail).toEqual([]);
    });
  });
});
