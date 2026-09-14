'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { useMessageScroller } from '@/components/design/foundations/components/message-scroller';

/**
 * Keep the newest words on screen while a reply is arriving.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE BUG, AND WHY IT WAS NOT A MISSING FEATURE.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `MessageScrollerProvider autoScroll` already follows the live edge, and
 * `chat-message.tsx` already gave up its `scrollAnchor` so that following is
 * what happens rather than pinning the question to the top. Both of those are
 * right and neither was enough: on a phone the client still had to scroll down
 * after every message they sent, and by the fifth turn the newest reply sat
 * 714px below the fold with 738px of transcript unread.
 *
 * It is a race, which is why it read as intermittent and why it looked fixed
 * on a laptop. The scroller keeps a mode — `following-bottom` until the client
 * scrolls away — and it recomputes that mode from the scroll position on every
 * commit, with a `scrollEdgeThreshold` of 8px. Streaming text does not grow in
 * 8px steps. A chunk lands, the gap to the bottom jumps past the threshold,
 * and if a commit happens in the frames before the scroller has caught up
 * (its own "I am scrolling" flag lasts 180ms) the mode is revoked as though
 * the client had scrolled up. Traced on a 390px viewport:
 *
 *   gap 0    following
 *   gap 156  ← content grew, not caught up yet, flag already expired
 *   gap 0    caught up
 *   gap 92   ← this one is never recovered
 *   gap 272 → 328 → 484
 *
 * A 618px viewport wins that race most of the time. A 385px one loses it
 * inside three turns, and the settle moment is the worst of all: the rail, the
 * one-tap answers and the document aside all render in a single commit, so the
 * content can gain 300px between two frames.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SO THIS IS A WATCHDOG, NOT A SECOND SCROLLER.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * It does not compute scroll positions and it does not fight the package for
 * control. It watches the transcript's size, and whenever the transcript grows
 * while the client has not scrolled away, it calls the scroller's own
 * `scrollToEnd`. That call does two things: it puts the newest line on screen,
 * and it sets the mode back to `following-bottom`, so the package's native
 * following is repaired rather than replaced. Nothing here knows what a pixel
 * is.
 *
 * Raising `scrollEdgeThreshold` instead was the other candidate and it is
 * worse. The threshold that would have survived a 328px settle is a threshold
 * that yanks back a client who has deliberately scrolled up to re-read three
 * lines, and it is the same number the jump-to-latest button reads, so the
 * button would stop appearing when there was something below to see.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT STILL INTERRUPTS IT, WHICH IS THE HALF THAT MATTERS.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Scrolling up. A wheel, a drag, or a key that scrolls sets the hold aside,
 * and it comes back when the client returns to the bottom, exactly as it would
 * in any chat they have used. What must *not* interrupt it is a reply arriving
 * — that was the old behaviour and it is the bug.
 *
 * The gesture is what releases the hold, not the scroll event, and the
 * distinction is the whole reason this works: the scroll events our own
 * `scrollToEnd` produces are indistinguishable from a client's by position
 * alone, and treating them as intent is how the original mode flip went wrong.
 * So a gesture arms `released`, the next scroll reads the position and decides,
 * and a programmatic scroll with no gesture in front of it is ignored.
 */

/**
 * How close to the bottom still counts as the bottom, in pixels.
 *
 * Generous rather than exact, and it is doing a different job from the
 * scroller's own 8px: this one is only read after the client has made a
 * gesture, to decide whether that gesture left them at the bottom. A client
 * who flicks a touch screen lands a few pixels short of the end more often
 * than not, and reading that as "they went to look at something" would stop
 * the transcript following for the rest of the conversation.
 */
const BOTTOM_SLACK = 64;

/** Keys that scroll a focused region, and so count as looking away. */
const SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
]);

export function useStickToBottom({
  viewportRef,
  /**
   * Bumped whenever the client sends something, which re-arms the hold.
   *
   * Pressing send is the clearest statement of intent in the flow: whatever
   * they were reading, they have now asked a question and want the answer. So
   * a new outgoing turn takes the hold back even if they had scrolled up to
   * check something first.
   */
  sendCount,
}: {
  viewportRef: RefObject<HTMLDivElement | null>;
  sendCount: number;
}): void {
  const { scrollToEnd } = useMessageScroller();

  /** False while the client is reading something further up. */
  const held = useRef(true);
  /** Set by a gesture, read by the scroll it causes. See the note above. */
  const gestured = useRef(false);

  useEffect(() => {
    held.current = true;
    scrollToEnd({ behavior: 'auto' });
  }, [scrollToEnd, sendCount]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const atBottom = () =>
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <=
      BOTTOM_SLACK;

    const gesture = () => {
      gestured.current = true;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (SCROLL_KEYS.has(event.key)) gestured.current = true;
    };
    const onScroll = () => {
      if (!gestured.current) return;
      gestured.current = false;
      held.current = atBottom();
    };

    viewport.addEventListener('wheel', gesture, { passive: true });
    viewport.addEventListener('touchmove', gesture, { passive: true });
    viewport.addEventListener('keydown', onKeyDown);
    viewport.addEventListener('scroll', onScroll, { passive: true });

    /*
     * The transcript's own size, which is the one signal that covers every way
     * it can grow: a chunk of streamed text, a turn appearing, the rail
     * unfolding, a row of one-tap answers, the document aside. Watching state
     * instead would mean naming each of those and forgetting the next one.
     *
     * The viewport is observed too, and that is the phone fix rather than a
     * nicety: the on-screen keyboard opening does not change the transcript at
     * all, it shortens the window, and the last thing the client typed goes
     * under the keyboard with nothing to say it moved.
     */
    const content = viewport.querySelector<HTMLElement>(
      '[data-slot="message-scroller-content"]',
    );

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        viewport.removeEventListener('wheel', gesture);
        viewport.removeEventListener('touchmove', gesture);
        viewport.removeEventListener('keydown', onKeyDown);
        viewport.removeEventListener('scroll', onScroll);
      };
    }

    const observer = new ResizeObserver(() => {
      if (held.current) scrollToEnd({ behavior: 'auto' });
    });
    if (content) observer.observe(content);
    observer.observe(viewport);

    return () => {
      observer.disconnect();
      viewport.removeEventListener('wheel', gesture);
      viewport.removeEventListener('touchmove', gesture);
      viewport.removeEventListener('keydown', onKeyDown);
      viewport.removeEventListener('scroll', onScroll);
    };
  }, [scrollToEnd, viewportRef]);
}
