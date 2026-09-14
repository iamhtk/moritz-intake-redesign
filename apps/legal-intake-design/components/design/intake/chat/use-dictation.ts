'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import {
  appendTranscript,
  dictationErrorKey,
  isSilentDictationError,
  readResults,
  recognitionLanguage,
  speechRecognition,
  type DictationErrorKey,
  type SpeechRecognitionLike,
} from '@/lib/intake/dictation';

/**
 * Dictation for the composer: the client's own words, into the text field.
 *
 * The rules that make this honest rather than a microphone-shaped decoration
 * are in `lib/intake/dictation.ts` along with the reasoning; this is the React
 * around them. Two things it does are worth reading before changing:
 *
 * **It reports interim text.** Recognition revises itself as it goes, so what
 * appears in the field during dictation is not final. Showing it anyway is the
 * difference between a control that looks alive and one that looks broken, and
 * it is also the client's only chance to notice it is mishearing them.
 *
 * **It never sends.** `onText` writes the field and nothing else. Whatever was
 * heard sits there to be read and edited, which is the entire objection
 * Decision 19 raised about the version this replaces.
 */
export function useDictation({
  onText,
  onInterim,
}: {
  /** Settled text, to be committed to the field. */
  onText: (append: (existing: string) => string) => void;
  /** Text still being revised, shown but never committed. */
  onInterim: (text: string) => void;
}): {
  /** `false` where the browser cannot transcribe, so no button is rendered. */
  supported: boolean;
  recording: boolean;
  error: DictationErrorKey | null;
  start: () => void;
  stop: () => void;
  clearError: () => void;
} {
  const locale = useLocale();
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<DictationErrorKey | null>(null);
  const recognition = useRef<SpeechRecognitionLike | null>(null);

  /*
   * Checked after mount, not during render.
   *
   * `window` does not exist on the server, and a button whose presence depends
   * on it would make the first client paint differ from the server's HTML.
   * Starting at `false` means the control fades in rather than hydrating
   * wrong.
   */
  useEffect(() => {
    setSupported(speechRecognition() !== null);
  }, []);

  // A recognition session left running after the composer unmounts keeps the
  // microphone indicator lit in the browser chrome, which is alarming and
  // entirely our fault.
  useEffect(
    () => () => {
      recognition.current?.abort();
      recognition.current = null;
    },
    [],
  );

  const stop = useCallback(() => {
    recognition.current?.stop();
    setRecording(false);
    onInterim('');
  }, [onInterim]);

  const start = useCallback(() => {
    const Recognition = speechRecognition();
    if (!Recognition) return;

    setError(null);
    const instance = new Recognition();
    instance.lang = recognitionLanguage(
      locale,
      typeof navigator === 'undefined' ? undefined : navigator.language,
    );
    // Continuous, because a client describing a legal problem pauses to think
    // and a single-utterance session would cut them off mid-sentence.
    instance.continuous = true;
    instance.interimResults = true;

    instance.onresult = (event) => {
      const { final, interim } = readResults(event);
      if (final) onText((existing) => appendTranscript(existing, final));
      onInterim(interim);
    };

    instance.onerror = (event) => {
      // Stopping reports `aborted`, so a successful dictation would otherwise
      // always end by telling the client something went wrong.
      if (!isSilentDictationError(event.error)) {
        setError(dictationErrorKey(event.error));
      }
      setRecording(false);
      onInterim('');
    };

    // Recognition ends on its own: a long silence, a lost connection, or the
    // browser deciding the utterance is over. The button has to come back out
    // of its recording state when that happens or it lies about being live.
    instance.onend = () => {
      setRecording(false);
      onInterim('');
    };

    recognition.current = instance;
    try {
      instance.start();
      setRecording(true);
    } catch {
      // `start()` throws if a session is already running, which a fast double
      // press can do. The existing session is the one to keep.
      setRecording(true);
    }
  }, [locale, onInterim, onText]);

  const clearError = useCallback(() => setError(null), []);

  return { supported, recording, error, start, stop, clearError };
}
