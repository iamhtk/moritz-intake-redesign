'use client';

import { useEffect, useState } from 'react';

/**
 * Long enough to read a whole sentence and then think about it.
 *
 * The examples are full sentences rather than the two or three words a
 * rotating placeholder usually carries, and a client who looks up mid-sentence
 * to find a different one has been shown a glitch rather than an example. Six
 * seconds is the lawyer note's figure (`ROTATE_MS` in
 * `intake-lawyer-note.tsx`) and it was arrived at for the same reason, so the
 * two things rotating on this screen at least rotate at one speed.
 */
const ROTATE_MS = 6000;

/**
 * The composer's placeholder, cycling through real first sentences.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THE PLACEHOLDER IS DOING ANY WORK AT ALL.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * "Describe your matter" tells a client what kind of thing to type and nothing
 * about how much, how formally, or where to start, and the gap between those
 * is where somebody sits and writes nothing. The examples answer all three
 * without a word of instruction: they are one sentence, they are plain, and
 * they begin in the middle of the problem rather than with a preamble.
 *
 * **Frame 0 is the instruction, not an example.** It stays
 * `intake.chat.placeholderFirst` — "Describe your matter, or attach a
 * document…" — because it is the only frame that mentions the document, and
 * the start screen's own copy is written on the assumption that this
 * placeholder carries that affordance (see the comment above the greeting in
 * `intake-v2.tsx`). An example-only rotation would have quietly deleted the
 * one place the flow says a file can be handed over before anything is typed.
 *
 * So under `prefers-reduced-motion` this parks on frame 0 and the composer is
 * exactly what it was before this hook existed. That is the cheapest possible
 * reduced-motion fallback: not a degraded version of the feature, but the
 * screen as it shipped.
 *
 * Parking on the *first* frame rather than holding whichever one was up is the
 * same choice `useRotatingLawyer` makes, for the same reason — a client who
 * turns reduced motion on mid-session should land somewhere curated rather
 * than wherever the timer happened to stop.
 *
 * @param frames Frame 0 first. Fewer than two frames disables the timer.
 * @param enabled False once the rotation has no audience — a placeholder is
 *   invisible behind typed text, and the reply composer is not offering
 *   examples of how to start.
 */
export function useRotatingPlaceholder(
  frames: readonly string[],
  enabled: boolean,
): string {
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const rotating = enabled && !reducedMotion && frames.length > 1;

  useEffect(() => {
    if (!rotating) {
      setIndex(0);
      return;
    }
    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % frames.length);
    }, ROTATE_MS);
    return () => window.clearInterval(interval);
  }, [rotating, frames.length]);

  return frames[index] ?? frames[0] ?? '';
}
