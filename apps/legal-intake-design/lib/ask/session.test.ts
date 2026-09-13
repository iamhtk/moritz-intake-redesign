import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearTranscript,
  readAskMode,
  readTranscript,
  resetAskSession,
  writeAskMode,
  writeTranscript,
  type AskTurn,
} from './session';

/**
 * The transcript store (task N6).
 *
 * Small, and worth testing for one claim only: **the two modes never share a
 * transcript.** §8.6 requires it and the reason is specific to this app — a
 * general-legal sentence sitting in the same thread as a grounded answer becomes
 * citable as the basis for it, and where the source was internal-facing, ours
 * is client-facing. So the isolation is a property of the store rather than a
 * habit of the UI, and it is asserted here where it cannot be undone by a
 * refactor of the panel.
 */

const turn = (text: string): AskTurn => ({
  id: text,
  role: 'assistant',
  text,
});

beforeEach(resetAskSession);

describe('mode isolation', () => {
  it('keeps the two transcripts entirely separate', () => {
    writeTranscript('cases', [turn('your four cases')]);
    writeTranscript('general', [turn('what an indemnity is')]);

    expect(readTranscript('cases').map((t) => t.text)).toEqual([
      'your four cases',
    ]);
    expect(readTranscript('general').map((t) => t.text)).toEqual([
      'what an indemnity is',
    ]);
  });

  it('leaves one mode untouched when the other is written', () => {
    writeTranscript('cases', [turn('a')]);
    writeTranscript('general', [turn('b'), turn('c')]);
    writeTranscript('cases', [turn('a'), turn('d')]);

    expect(readTranscript('general')).toHaveLength(2);
  });

  it('leaves one mode untouched when the other is cleared', () => {
    writeTranscript('cases', [turn('a')]);
    writeTranscript('general', [turn('b')]);

    clearTranscript('cases');

    expect(readTranscript('cases')).toEqual([]);
    expect(readTranscript('general')).toHaveLength(1);
  });
});

describe('survival', () => {
  /*
   * The reason the store is at module scope rather than in the panel's state:
   * opening Ask from the command palette mounts and unmounts a dialog, and a
   * reader who asks a question, presses ⌘K to go and look at the case, then
   * comes back must find their thread. Reading after an unrelated write is the
   * closest a unit test gets to that remount.
   */
  it('holds a transcript across unrelated reads and writes', () => {
    writeTranscript('cases', [turn('kept')]);
    writeAskMode('general');
    writeAskMode('cases');
    expect(readTranscript('cases').map((t) => t.text)).toEqual(['kept']);
  });

  it('starts on the reader’s own cases and remembers a switch', () => {
    expect(readAskMode()).toBe('cases');
    writeAskMode('general');
    expect(readAskMode()).toBe('general');
  });

  it('starts empty', () => {
    expect(readTranscript('cases')).toEqual([]);
    expect(readTranscript('general')).toEqual([]);
  });
});
