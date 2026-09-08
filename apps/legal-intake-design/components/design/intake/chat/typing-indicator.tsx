'use client';

import {
  Marker,
  MarkerContent,
} from '@/components/design/foundations/components/marker';
import { Spinner } from '@/components/design/foundations/components/spinner';
import { MoritzAvatar } from './moritz-avatar';

/**
 * Moritz "thinking" turn: the Moritz avatar beside a foundation status Marker
 * with a spinner and a shimmering label, so the reply feels like it's coming
 * from him while it streams in.
 */
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3.5">
      <MoritzAvatar />
      <Marker role="status" aria-label="Moritz is thinking">
        <Spinner className="size-3.5" />
        <MarkerContent className="shimmer">Thinking…</MarkerContent>
      </Marker>
    </div>
  );
}
