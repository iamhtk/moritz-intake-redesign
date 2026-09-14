/**
 * Speaking into the composer, for real (Decision 19, revisited).
 *
 * The voice button was removed in Wave 5 and is now back, because it was part
 * of the product being redesigned and a client describing a legal problem out
 * loud is a genuine way in: it is faster than typing, it is what people reach
 * for on a phone, and a matter explained in someone's own words is usually a
 * better brief than one typed in bullet points.
 *
 * What Decision 19 objected to was never the button. It was that the old one
 * ignored the microphone entirely and pasted a fixed sentence, "I'd like to
 * understand my options before deciding how to proceed", into the field
 * unlabelled and ready to send. Words the client never said, on their way into
 * a legal case, is the thing that was indefensible, and none of it followed
 * from having a microphone in the composer.
 *
 * So the button is back and the dictation is real: the browser's own speech
 * recognition, the client's actual words, landing in the text field where they
 * can be read and edited before anything is sent. Three rules fall out of that
 * and they are the whole reason this module exists rather than a `useState` in
 * the composer:
 *
 * 1. **Nothing is ever auto-sent.** Dictation fills the field and stops.
 * 2. **No recognition, no button.** Where the browser cannot transcribe, the
 *    control is not rendered at all. A microphone that cannot hear is the
 *    original defect wearing a disabled attribute.
 * 3. **Failures are named.** A denied permission, a silent room and a dropped
 *    network are three different things and the client is told which.
 */

/**
 * The parts of the Web Speech API this uses.
 *
 * Declared here because `SpeechRecognition` is not in the DOM lib this project
 * compiles against, and because a hand-written interface is what lets the
 * behaviour below be tested against a fake instead of a browser.
 */
export type SpeechResultAlternative = { transcript: string };
export type SpeechResult = {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: SpeechResultAlternative;
};
export type SpeechResultList = {
  readonly length: number;
  readonly [index: number]: SpeechResult;
};
export type SpeechRecognitionResultEvent = {
  readonly resultIndex: number;
  readonly results: SpeechResultList;
};
export type SpeechRecognitionErrorEvent = { readonly error: string };

export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

/**
 * The constructor this browser offers, or `null`.
 *
 * Still vendor-prefixed in Chrome and Safari years on, and absent in Firefox.
 * `null` is a real answer that the UI acts on, not an error.
 */
export function speechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const scope = window as unknown as SpeechWindow;
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

/** What a result event adds to the transcript, split by whether it is settled. */
export function readResults(event: SpeechRecognitionResultEvent): {
  final: string;
  interim: string;
} {
  let final = '';
  let interim = '';

  /*
   * From `resultIndex`, not from zero.
   *
   * The event carries the whole session's results every time, and the index
   * says where the new ones start. Reading from zero re-reads everything
   * already committed, which is how dictation ends up stuttering the same
   * clause three times.
   */
  for (let i = event.resultIndex; i < event.results.length; i += 1) {
    const result = event.results[i];
    if (!result || result.length === 0) continue;
    const text = result[0]?.transcript ?? '';
    if (result.isFinal) final += text;
    else interim += text;
  }

  return { final, interim };
}

/**
 * Join dictated text onto whatever is already in the field.
 *
 * Speech recognition returns fragments with inconsistent leading spaces, and
 * the client may have typed something before pressing the button. The rule is
 * that dictation never eats what was already there and never doubles a space.
 */
export function appendTranscript(existing: string, addition: string): string {
  const tail = addition.trim();
  if (tail === '') return existing;
  const head = existing.trimEnd();
  if (head === '') return tail;
  // No space before punctuation that closes a clause: recognition sometimes
  // returns ", and" or "." as its own fragment.
  if (/^[,.;:!?]/.test(tail)) return `${head}${tail}`;
  return `${head} ${tail}`;
}

/** Why dictation stopped, as a copy key under `intake.voice`. */
export type DictationErrorKey =
  | 'denied'
  | 'noSpeech'
  | 'noMicrophone'
  | 'network'
  | 'failed';

/**
 * Map the API's error string onto something worth reading.
 *
 * `no-speech` is deliberately *not* an error the client is scolded for: it is
 * what happens when someone presses the button and then thinks about what to
 * say. It gets the gentlest line of the five.
 */
export function dictationErrorKey(error: string): DictationErrorKey {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'denied';
    case 'no-speech':
      return 'noSpeech';
    case 'audio-capture':
      return 'noMicrophone';
    case 'network':
      return 'network';
    default:
      return 'failed';
  }
}

/**
 * `aborted` is what the API reports when the client presses stop, and a normal
 * stop is not a failure to report.
 */
export function isSilentDictationError(error: string): boolean {
  return error === 'aborted';
}

/**
 * The BCP 47 tag to recognise against.
 *
 * Recognition wants a region because the acoustic model differs by accent, and
 * the app's locales are bare language codes (`en`). Rather than pick a region
 * on the product's behalf, this prefers the client's own browser language when
 * it is the same language, so someone on `en-GB` is transcribed as `en-GB` and
 * someone on `en-US` as `en-US`. A hardcoded region would mean choosing which
 * half of an English-speaking client base gets the worse transcription.
 *
 * @param preferred usually `navigator.language`.
 */
export function recognitionLanguage(
  locale: string,
  preferred?: string,
): string {
  if (!preferred) return locale;
  const base = preferred.split('-')[0]?.toLowerCase();
  return base === locale.toLowerCase() ? preferred : locale;
}
