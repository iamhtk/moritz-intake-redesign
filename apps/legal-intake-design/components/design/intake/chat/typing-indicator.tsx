'use client';

import {
  Marker,
  MarkerContent,
} from '@/components/design/foundations/components/marker';
import { Spinner } from '@/components/design/foundations/components/spinner';
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
    <Marker role="status" aria-label={label}>
      <Spinner className="size-3.5" />
      <MarkerContent className="shimmer">{label}</MarkerContent>
    </Marker>
  );
}
