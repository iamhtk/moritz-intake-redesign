'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from 'react';

/**
 * How far the pointer has to travel before a press counts as a drag. Under it
 * the reader meant to click; over it they meant to move the strip.
 */
const DRAG_THRESHOLD_PX = 5;

type Press = {
  pointerId: number;
  originX: number;
  originScrollLeft: number;
  target: HTMLElement;
  hasTravelled: boolean;
};

type DragScrollOptions = {
  /** Off for strips that scroll on another axis, where a grab makes no sense. */
  enabled?: boolean;
  /**
   * Puts back a press that never became a drag, on the element it landed on.
   * The press is withheld while the pointer is down, so a strip whose contents
   * act on press needs this to stay usable.
   */
  onPress?: (target: HTMLElement) => void;
};

/**
 * Grab-and-drag scrolling for a horizontally scrolling strip: hold the pointer
 * down anywhere on it and pull, the way a map moves.
 *
 * The press underneath is withheld until release, because controls commonly act
 * on press and would fire the instant a drag began. A release that never
 * travelled is handed back through `onPress`; one that did is dropped. Touch is
 * left alone — it already scrolls the strip, and taking the pointer would only
 * fight the browser — and a strip with nothing to scroll is never grabbed at
 * all, so it behaves exactly as it did before.
 */
export function useDragScroll<T extends HTMLElement>({
  enabled = true,
  onPress,
}: DragScrollOptions = {}) {
  const ref = useRef<T | null>(null);
  const press = useRef<Press | null>(null);
  const onPressRef = useRef(onPress);
  // Undone when the press ends. A release the strip never hears about would
  // otherwise leave it stuck mid-drag — see the window listeners below.
  const detachFallback = useRef<(() => void) | null>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    onPressRef.current = onPress;
  });

  // Unmount only detaches the window listeners: leaving the document already
  // releases any capture the strip held, and the ref is gone by cleanup time.
  useEffect(() => () => detachFallback.current?.(), []);

  const measure = useCallback(() => {
    const node = ref.current;
    setIsScrollable(!!node && enabled && node.scrollWidth > node.clientWidth);
  }, [enabled]);

  // Measured on every render as well as on resize: the strip can gain or lose
  // items without its own box changing, and only a fresh reading tells whether
  // there is still overflow to grab.
  useEffect(measure);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [measure]);

  // A press taken away rather than released — the system claiming the pointer,
  // the window losing it — ends the drag and is never handed back as a click.
  const endPress = useCallback(() => {
    // Cleared before the release: releasing fires lostpointercapture, whose
    // handler re-enters the press logic and must find nothing to hand back.
    const current = press.current;
    press.current = null;
    const node = ref.current;
    // The capture has to go with the press: a mouse pointer is permanent, so
    // a capture that outlives its press retargets every later mouse event on
    // the page to the strip — which then swallows them, deadening the whole
    // document until a reload.
    if (current && node?.hasPointerCapture?.(current.pointerId)) {
      try {
        node.releasePointerCapture(current.pointerId);
      } catch {
        // A pointer the browser already reclaimed cannot be released again.
      }
    }
    detachFallback.current?.();
    detachFallback.current = null;
    setIsDragging(false);
  }, []);

  const onPointerDown = useCallback(
    (event: PointerEvent<T>) => {
      const node = ref.current;
      if (!enabled || !node) return;
      // A touch already scrolls the strip, and neither a secondary button nor
      // the ctrl-press macOS reads as one is a grab.
      if (
        event.pointerType === 'touch' ||
        event.button !== 0 ||
        event.ctrlKey
      ) {
        return;
      }
      // Nothing to scroll, so no reason to take the press.
      if (node.scrollWidth <= node.clientWidth) return;

      press.current = {
        pointerId: event.pointerId,
        originX: event.clientX,
        originScrollLeft: node.scrollLeft,
        target: event.target as HTMLElement,
        hasTravelled: false,
      };
      // Withholds the focus and the text selection the press would start.
      // Before the capture below, which can throw: losing the capture only
      // shortens the reach of a drag, but losing this would let a drag land
      // on the tab it passed over.
      event.preventDefault();
      try {
        // Keeps the moves and the release coming once the pointer has left the
        // strip, which a drag along a short strip does immediately.
        node.setPointerCapture(event.pointerId);
      } catch {
        // A pointer already gone by the time this runs cannot be captured; the
        // drag still works while the pointer stays over the strip.
      }

      // The strip only hears a release it captured or that happened over it,
      // and a refused capture leaves both in doubt. This backstop runs after
      // the strip's own handlers, so it only ever clears a press nothing else
      // did — without it the strip stays grabbed with the pointer long gone.
      const { pointerId } = event;
      const onWindowRelease = (native: globalThis.PointerEvent) => {
        if (native.pointerId === pointerId) endPress();
      };
      // Focus stolen mid-press delivers neither pointerup nor pointercancel
      // for a mouse; the blur is the only signal left that the press is over.
      const onWindowBlur = () => endPress();
      window.addEventListener('pointerup', onWindowRelease);
      window.addEventListener('pointercancel', onWindowRelease);
      window.addEventListener('blur', onWindowBlur);
      detachFallback.current = () => {
        window.removeEventListener('pointerup', onWindowRelease);
        window.removeEventListener('pointercancel', onWindowRelease);
        window.removeEventListener('blur', onWindowBlur);
      };
    },
    [enabled, endPress],
  );

  const onPointerMove = useCallback((event: PointerEvent<T>) => {
    const node = ref.current;
    const current = press.current;
    if (!node || !current || current.pointerId !== event.pointerId) return;

    const travel = event.clientX - current.originX;
    if (!current.hasTravelled) {
      if (Math.abs(travel) <= DRAG_THRESHOLD_PX) return;
      current.hasTravelled = true;
      setIsDragging(true);
    }
    node.scrollLeft = current.originScrollLeft - travel;
  }, []);

  // The end of a press that was released rather than taken away. Browsers
  // disagree on whether the release or the loss of the capture comes first, so
  // whichever arrives puts the press back and the other finds nothing to do.
  const releasePress = useCallback(
    (event: PointerEvent<T>) => {
      const current = press.current;
      if (!current || current.pointerId !== event.pointerId) return;
      endPress();
      if (!current.hasTravelled && current.target.isConnected) {
        onPressRef.current?.(current.target);
      }
    },
    [endPress],
  );

  const onMouseDownCapture = useCallback((event: MouseEvent<T>) => {
    if (!press.current) return;
    // Anything that acts on press would fire before the drag could start, so
    // the press stops here; `onPress` decides what a release means.
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return {
    ref,
    /** True while the strip has overflow, and so something to grab. */
    isScrollable,
    isDragging,
    props: {
      onPointerDown,
      onPointerMove,
      onPointerUp: releasePress,
      onPointerCancel: endPress,
      onLostPointerCapture: releasePress,
      onMouseDownCapture,
    },
  };
}
