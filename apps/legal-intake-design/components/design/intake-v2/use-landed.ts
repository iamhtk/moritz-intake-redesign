'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Did this *just* become true, or has it always been?
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE DIFFERENCE BETWEEN AN EVENT AND A STATE, AND WHY IT IS THE WHOLE BUG.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Every animation in `animations.md` §1 fires on *something happening* — a
 * value arriving, a row being confirmed, a document answering four fields. In
 * React the thing available at render time is not the event but the state it
 * left behind, and those two look identical from inside a component: a row
 * that was confirmed a second ago and a row that was confirmed yesterday both
 * render with `confirmed: true`.
 *
 * Animate on the state and the brief panel replays every tick it has ever
 * drawn on every mount. A client who refreshes mid-intake, or comes back to a
 * restored draft, gets eight ticks drawing themselves at once for events that
 * happened before they left — which is not a celebration, it is the panel
 * looking like it is loading. The reduced-motion client is spared it and
 * everybody else is told their case just did eight things.
 *
 * So this deliberately returns `false` on the first render no matter what the
 * value is. Only a *transition* observed by this component, while mounted,
 * counts. Restored state is history and history does not animate.
 *
 * The flag clears itself after `holdMs`, which has to outlast the longest
 * animation keyed off it — otherwise the class is pulled mid-draw and the
 * element snaps to its resting state, which is the half-drawn tick this whole
 * file exists to avoid.
 */
export function useJustTurnedTrue(value: boolean, holdMs = 600): boolean {
  const previous = useRef<boolean | null>(null);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    const before = previous.current;
    previous.current = value;

    /*
     * First observation. Record it and animate nothing: this is the mount,
     * and whatever the value is, it did not happen here.
     */
    if (before === null) return;
    if (before === value || !value) return;

    setLanded(true);
    const timer = window.setTimeout(() => setLanded(false), holdMs);
    return () => window.clearTimeout(timer);
  }, [value, holdMs]);

  return landed;
}

/**
 * Did this value just change to something new and non-empty?
 *
 * The brief's version of the same question. A field's value goes from
 * `undefined` to "Acme GmbH" when Moritz works it out, and from "Acme GmbH"
 * to "Acme Holdings GmbH" when the client corrects it; both are arrivals
 * worth showing (#7, and #57's correction diff builds on the same signal).
 *
 * Clearing to empty is not an arrival and does not animate — a value being
 * removed should not slide in from the left as though it were being added.
 */
export function useValueLanded(
  value: string | undefined,
  holdMs = 600,
): boolean {
  const previous = useRef<string | undefined | null>(null);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    const before = previous.current;
    previous.current = value;

    if (before === null) return;
    if (before === value) return;
    if (!value) return;

    setLanded(true);
    const timer = window.setTimeout(() => setLanded(false), holdMs);
    return () => window.clearTimeout(timer);
  }, [value, holdMs]);

  return landed;
}
