'use client';

import {
  Marker,
  MarkerContent,
} from '@/components/design/foundations/components/marker';
import { MoritzAvatar } from './moritz-avatar';

/**
 * What the marker says when the caller does not name the wait.
 *
 * Kept only for the two older intake flows, which have one undifferentiated
 * wait and nothing to say about it. Intake v2 always passes a label: a wait is
 * a moment where the client is wondering what is happening, and "Thinking…" is
 * an answer about the machine rather than about their case. See `label` below.
 */
const DEFAULT_LABEL = 'Thinking…';

/**
 * Moritz "thinking" turn: the Moritz avatar beside a foundation status Marker
 * with a spinner and a shimmering label, so the reply feels like it's coming
 * from him while it streams in.
 */
export function TypingIndicator({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3.5">
      <MoritzAvatar />
      <ThinkingMarker {...(label !== undefined ? { label } : {})} />
    </div>
  );
}

/**
 * The marker on its own, without an avatar, for callers that already have a
 * Moritz avatar on screen and want the spinner to sit where the reply will.
 *
 * @param label the human activity this particular wait is, e.g. "Reading your
 * document" or "Writing up your case notes".
 *
 * A parameter rather than a constant because there is no such thing as a
 * generic wait here. A client watching a spinner is asking "what is it doing",
 * and every wait in the intake has a real and different answer: reading the
 * contract they just dropped, checking what they said against the rest of the
 * brief, naming the case, sending it. One shared word for all four is a label
 * that describes the software instead of the work, and it is the difference
 * between a colleague going quiet for a second and a page that has hung.
 *
 * It is the accessible name as well as the visible text, so the two cannot
 * drift: the old `aria-label` said "Moritz is thinking" no matter what was
 * actually on screen, which a screen reader would then announce in place of
 * the real label rather than alongside it.
 */
export function ThinkingMarker({ label = DEFAULT_LABEL }: { label?: string }) {
  return (
    /*
     * #69. A breathing line, and no spinner.
     *
     * A spinner says "the software is busy". The label already says
     * something better and truer — "Reading your document", "Writing up your
     * case notes" — and putting a rotating disc in front of it downgrades a
     * sentence about the client's case into a loading state. The one
     * component of this marker that carried no information was the only one
     * animating, which is the wrong way round.
     *
     * So the words do the work and the breath says they are still happening:
     * a slow 3s opacity fade, the same loop the brief's amber dot and the
     * rail's halo use, so a screen showing two of them pulses once rather
     * than keeping two clocks. §6 allows exactly one ambient animation and
     * this is a third view of it.
     *
     * The shimmer it replaces was a gradient swept across the glyphs, which
     * needed `background-clip: text` and a transparent fill — pretty, and it
     * put the label's colour outside the palette's control for the duration.
     * Opacity on the real ink does the same job and leaves the token alone.
     */
    <Marker role="status" aria-label={label}>
      <MarkerContent className="mz-animate-breathe">{label}</MarkerContent>
    </Marker>
  );
}
