/**
 * Where the settled part of a streaming reply ends and the wet ink begins (L6).
 *
 * Reply text arrives from the route a few characters at a time and is written
 * straight into the bubble, so what the client watches is real writing rather
 * than a reveal animation played over a finished string. That is honest and it
 * reads as slightly *less* alive than the fake version, because every word is
 * the same weight the moment it lands: there is nothing to say which part of
 * the sentence Moritz has committed to and which part is still arriving.
 *
 * So the last few words are set lighter, ramping toward the leading edge. It is
 * a colour ramp and nothing else — no timers, no per-word animation, no second
 * cadence laid over the first. The ramp moves because the text does.
 *
 * Kept here, as a pure split over the string, for two reasons. It has awkward
 * edges (a partial final word, a run of whitespace, a paragraph break landing
 * mid-tail) that are much easier to assert than to look at; and the rejoin has
 * to be exact, because the bubble is `whitespace-pre-wrap` and a single space
 * lost in the split would reflow the client's reply as it was being read.
 */

/**
 * Split `text` so the final `tailWords` words can be rendered separately.
 *
 * `head + tail.join('')` is exactly `text`, always. Each tail segment begins
 * with a word and carries the whitespace that follows it, so whitespace is
 * never orphaned into a span of its own and the head owns the space before the
 * first tail word.
 *
 * @param tailWords how many words at the end to peel off. Fewer words than that
 * in the string is not an error: a reply two words in has both of them wet, and
 * the ramp simply starts short.
 */
export function splitTail(
  text: string,
  tailWords: number,
): { head: string; tail: string[] } {
  if (text === '' || tailWords <= 0) return { head: text, tail: [] };

  // Alternating word / whitespace parts, whitespace runs kept whole so a
  // paragraph break survives the round trip. Words sit at the even indices;
  // the first and last can be `''` when the text starts or ends with space.
  const parts = text.split(/(\s+)/);
  const wordIndexes: number[] = [];
  for (let index = 0; index < parts.length; index += 2) {
    if (parts[index] !== '') wordIndexes.push(index);
  }
  if (wordIndexes.length === 0) return { head: text, tail: [] };

  const boundaries = wordIndexes.slice(-tailWords);
  const first = boundaries[0]!;

  const tail = boundaries.map((start, position) => {
    const next = boundaries[position + 1];
    return parts.slice(start, next).join('');
  });

  return { head: parts.slice(0, first).join(''), tail };
}
