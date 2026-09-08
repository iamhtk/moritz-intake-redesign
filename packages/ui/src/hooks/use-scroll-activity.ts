'use client';

import { useCallback, useEffect, useRef, type UIEvent } from 'react';

/** How long after the last scroll event a region counts as settled. */
const SETTLE_MS = 700;

/**
 * Marks a scroll region `data-scrolling` while the reader is moving it and
 * clears the mark once it settles, which is what lets `mz-scrollbar-on-scroll`
 * surface a scrollbar only while the region is in use.
 *
 * The mark is written straight to the node rather than held in state: a
 * streaming transcript scrolls on every token, and re-rendering per event would
 * be ruinous. Scrolls a component performs for itself carry
 * `data-autoscrolling` and are ignored, so following the live edge never flashes
 * a bar the reader did not ask for.
 */
export function useScrollActivity(settleMs: number = SETTLE_MS) {
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => () => clearTimeout(settleTimer.current), []);

  return useCallback(
    (event: UIEvent<HTMLElement>) => {
      // Read synchronously: React clears `currentTarget` once the handler
      // returns, and the timeout below outlives it.
      const node = event.currentTarget;
      if (node.hasAttribute('data-autoscrolling')) return;

      node.setAttribute('data-scrolling', '');
      clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(
        () => node.removeAttribute('data-scrolling'),
        settleMs,
      );
    },
    [settleMs],
  );
}
