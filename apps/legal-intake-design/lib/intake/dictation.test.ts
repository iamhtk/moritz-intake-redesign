import { describe, expect, it } from 'vitest';
import {
  appendTranscript,
  dictationErrorKey,
  isSilentDictationError,
  readResults,
  recognitionLanguage,
  speechRecognition,
  type SpeechRecognitionResultEvent,
} from './dictation';

/** A result event shaped the way the browser sends them. */
function resultEvent(
  results: { text: string; isFinal: boolean }[],
  resultIndex = 0,
): SpeechRecognitionResultEvent {
  return {
    resultIndex,
    results: {
      length: results.length,
      ...Object.fromEntries(
        results.map((one, index) => [
          index,
          { isFinal: one.isFinal, length: 1, 0: { transcript: one.text } },
        ]),
      ),
    },
  } as SpeechRecognitionResultEvent;
}

describe('speechRecognition', () => {
  // Node has no window, and the composer has to survive the server render.
  it('is null where there is no browser', () => {
    expect(speechRecognition()).toBeNull();
  });
});

describe('readResults', () => {
  it('separates settled text from text still being revised', () => {
    const event = resultEvent([
      { text: 'We signed an MSA with Acme', isFinal: true },
      { text: ' and we want out', isFinal: false },
    ]);
    expect(readResults(event)).toEqual({
      final: 'We signed an MSA with Acme',
      interim: ' and we want out',
    });
  });

  /*
   * The stutter bug. The event carries every result from the whole session
   * each time, and `resultIndex` says where the new ones begin. Reading from
   * zero re-reads what is already committed, so a dictated clause appears
   * twice, then three times.
   */
  it('reads only from resultIndex, so committed text is not repeated', () => {
    const event = resultEvent(
      [
        { text: 'already committed', isFinal: true },
        { text: 'the new part', isFinal: true },
      ],
      1,
    );
    expect(readResults(event).final).toBe('the new part');
  });

  it('survives an empty result with no alternatives', () => {
    const event = {
      resultIndex: 0,
      results: { length: 1, 0: { isFinal: true, length: 0 } },
    } as unknown as SpeechRecognitionResultEvent;
    expect(readResults(event)).toEqual({ final: '', interim: '' });
  });

  it('joins several settled fragments in order', () => {
    const event = resultEvent([
      { text: 'first. ', isFinal: true },
      { text: 'second.', isFinal: true },
    ]);
    expect(readResults(event).final).toBe('first. second.');
  });
});

describe('appendTranscript', () => {
  // Dictation adds to what the client typed; it never replaces it.
  it('keeps what was already typed', () => {
    expect(appendTranscript('We signed an MSA', 'with Acme')).toBe(
      'We signed an MSA with Acme',
    );
  });

  it('is the transcript alone when the field was empty', () => {
    expect(appendTranscript('', 'We signed an MSA')).toBe('We signed an MSA');
    expect(appendTranscript('   ', 'We signed an MSA')).toBe(
      'We signed an MSA',
    );
  });

  it('never doubles a space', () => {
    expect(appendTranscript('We signed an MSA ', '  with Acme  ')).toBe(
      'We signed an MSA with Acme',
    );
  });

  it('changes nothing when there is nothing to add', () => {
    expect(appendTranscript('We signed an MSA', '   ')).toBe(
      'We signed an MSA',
    );
  });

  // Recognition returns ", and" or "." as its own fragment often enough that
  // "Acme ." reaches the screen without this.
  it('does not put a space before closing punctuation', () => {
    expect(appendTranscript('We signed with Acme', '.')).toBe(
      'We signed with Acme.',
    );
    expect(appendTranscript('We signed with Acme', ', and we want out')).toBe(
      'We signed with Acme, and we want out',
    );
  });
});

describe('dictationErrorKey', () => {
  it('tells the failures that need different answers apart', () => {
    expect(dictationErrorKey('not-allowed')).toBe('denied');
    expect(dictationErrorKey('service-not-allowed')).toBe('denied');
    expect(dictationErrorKey('audio-capture')).toBe('noMicrophone');
    expect(dictationErrorKey('network')).toBe('network');
  });

  // Pressing the button and then thinking about what to say is not a fault.
  it('treats silence as its own gentle case', () => {
    expect(dictationErrorKey('no-speech')).toBe('noSpeech');
  });

  it('has a fallback for anything the spec adds later', () => {
    expect(dictationErrorKey('something-new')).toBe('failed');
    expect(dictationErrorKey('')).toBe('failed');
  });
});

describe('isSilentDictationError', () => {
  // Pressing stop reports `aborted`. Reporting that back would mean every
  // successful dictation ended with an error message.
  it('says nothing about a dictation the client stopped', () => {
    expect(isSilentDictationError('aborted')).toBe(true);
    expect(isSilentDictationError('not-allowed')).toBe(false);
  });
});

describe('recognitionLanguage', () => {
  it("uses the client's own browser language when it is the same language", () => {
    expect(recognitionLanguage('en', 'en-GB')).toBe('en-GB');
    expect(recognitionLanguage('en', 'en-US')).toBe('en-US');
  });

  // Never invent a region: choosing one would hand half an English-speaking
  // client base the worse acoustic model.
  it('falls back to the app locale rather than guessing a region', () => {
    expect(recognitionLanguage('en')).toBe('en');
    expect(recognitionLanguage('en', 'fr-FR')).toBe('en');
  });

  it('is case insensitive about the browser tag', () => {
    expect(recognitionLanguage('en', 'EN-gb')).toBe('EN-gb');
  });
});
