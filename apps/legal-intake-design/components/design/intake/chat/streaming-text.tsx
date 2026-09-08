'use client';

import { useEffect, useRef, useState } from 'react';

type StreamingTextProps = {
  /** The full message to reveal. */
  text: string;
  /** Fired on each reveal step so the transcript can keep scrolling. */
  onTick?: () => void;
  /** Fired once the full text has been revealed (or immediately if skipped). */
  onComplete?: () => void;
};

/** Per-word cadence, with a floor on total duration so long replies don't drag. */
const MS_PER_WORD = 34;
const MAX_DURATION_MS = 1400;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Splits `text` into alternating word / whitespace parts (whitespace runs,
 * including paragraph breaks, kept as their own entries). Word slots live at the
 * even indices, so whitespace can never be trapped inside an animated word span.
 */
function splitParts(text: string): string[] {
  return text.length > 0 ? text.split(/(\s+)/) : [];
}

/**
 * Reveals `text` word-by-word at a calm cadence to mimic Moritz "typing" out a
 * reply. Already-revealed text renders as a single plain node (so spaces and
 * paragraph breaks flow as normal text, in source order) and only the newest
 * word fades in via the `mz-word-in` utility for a smooth leading edge. Streams
 * once on mount; if the user prefers reduced motion (or the text is empty) it
 * renders the full string immediately.
 */
export function StreamingText({
  text,
  onTick,
  onComplete,
}: StreamingTextProps) {
  const parts = splitParts(text);
  const wordCount = Math.ceil(parts.length / 2);
  const [count, setCount] = useState(() =>
    prefersReducedMotion() ? wordCount : 0,
  );
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Derive the count from `text` so the effect's only dependency is `text`.
    const totalWords = Math.ceil(splitParts(text).length / 2);
    if (prefersReducedMotion() || totalWords === 0) {
      setCount(totalWords);
      onCompleteRef.current?.();
      return;
    }
    setCount(0);
    const step = Math.max(
      MS_PER_WORD,
      Math.floor(MAX_DURATION_MS / totalWords),
    );
    let revealed = 0;
    const timer = window.setInterval(() => {
      revealed += 1;
      setCount(revealed);
      onTickRef.current?.();
      if (revealed >= totalWords) {
        window.clearInterval(timer);
        onCompleteRef.current?.();
      }
    }, step);
    return () => window.clearInterval(timer);
  }, [text]);

  // Everything before the latest word renders as one plain text node; the newest
  // word is the only animated span. The latest word lives at array index
  // 2*(count-1) (whitespace runs occupy the odd indices in between).
  const lastWordIdx = 2 * (count - 1);
  const head = count > 0 ? parts.slice(0, lastWordIdx).join('') : '';
  const lastWord = count > 0 ? (parts[lastWordIdx] ?? '') : '';

  return (
    <span className="whitespace-pre-wrap">
      {head}
      {lastWord ? (
        <span key={count} className="mz-word-in">
          {lastWord}
        </span>
      ) : null}
    </span>
  );
}
