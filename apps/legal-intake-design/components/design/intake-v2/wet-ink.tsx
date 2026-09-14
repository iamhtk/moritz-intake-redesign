'use client';

import { splitTail } from '@/lib/intake/stream-tail';

/**
 * How many words at the leading edge are still arriving (L6).
 *
 * Three, and the number is doing real work. One reads as a highlight on the
 * last word rather than as writing. Five is long enough that a short reply is
 * entirely grey, which inverts the whole effect: the sentence looks like it is
 * fading out instead of being written. Three is about a glance behind where the
 * client is reading, which is where a person's hand actually is.
 */
const TAIL_WORDS = 3;

/**
 * Each step of the ramp, lightest last.
 *
 * Opacity on `--foreground` rather than three new colours, which is both the
 * rule (`notes/check-colours.sh` — no new literals, and greyscale carries
 * state here) and the honest way to express it: this is one colour at three
 * distances from settled, not three colours. `text-muted-foreground` is not
 * reused for the last step even though it is close, because that token means
 * "secondary information" everywhere else in the flow and this text is the
 * primary thing on screen; it is arriving, not less important.
 */
const RAMP = ['text-foreground/70', 'text-foreground/45', 'text-foreground/25'];

/**
 * A reply that is still being written, with the wet ink lighter than the rest.
 *
 * We already stream for real: the route sends the reply a few characters at a
 * time and each one is written straight into the bubble, with `ChatMessage`'s
 * word-by-word reveal deliberately switched off because faking a second
 * animation on top of real streaming makes Moritz look slower than he is.
 *
 * The cost of being honest about it was that streaming read as *less* alive
 * than the fake version. Every word lands at full weight, so there is nothing
 * to distinguish the part of the sentence Moritz has committed to from the part
 * still arriving, and a reply appearing at full strength a clause at a time
 * looks more like a page loading in chunks than like someone writing.
 *
 * So: a colour ramp over the last three words, and nothing else. No timer, no
 * cadence, no reveal. The ramp moves because the text underneath it moved,
 * which means it cannot ever be ahead of or behind what has actually arrived —
 * the failure mode of every typing animation laid over a real stream.
 *
 * Not rendered once the turn settles. The caller passes the plain string then,
 * so the final words go to full weight the moment the reply is complete, which
 * is the signal that it is finished and safe to act on. See `chat-column.tsx`.
 */
export function WetInk({ text }: { text: string }) {
  const { head, tail } = splitTail(text, TAIL_WORDS);

  /*
   * The ramp is aligned to the *end*, not the start. A reply one word in has
   * one tail segment, and it should be the lightest step rather than the
   * darkest: it is the leading edge either way.
   */
  const offset = RAMP.length - tail.length;

  return (
    <>
      {head}
      {tail.map((segment, index) => (
        <span
          // Index-keyed on purpose, and this is the one place that is right.
          // A segment here is a *position* in the ramp, not a word: the text
          // slides through three fixed slots as it arrives, so slot 0 holds a
          // different word on every chunk. Keying by content would make React
          // unmount and rebuild all three spans several times a second for a
          // string that is simply growing at one end.
          key={index}
          className={RAMP[Math.max(0, offset + index)]}
        >
          {segment}
        </span>
      ))}
    </>
  );
}
