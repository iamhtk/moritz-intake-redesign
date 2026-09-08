'use client';

import * as React from 'react';
import {
  MessageScroller as MessageScrollerPrimitive,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from '@shadcn/react/message-scroller';

import { ChevronDown, ChevronUp } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

/**
 * Foundation Message Scroller — design-iteration styled wrapper over the headless
 * `@shadcn/react/message-scroller`. A chat transcript scroller built for
 * streaming chat: opening position, follow-the-live-edge auto-scroll, new-turn
 * anchoring, previous-turn peek, prepended-history preservation, visibility
 * tracking, and a jump-to-latest control.
 *
 * The behavior lives in the headless package; this wrapper only adds the
 * foundation styling and sensible a11y defaults onto each part. The headless
 * parts already mirror their state onto the DOM, so the styling can react to
 * them: the root and viewport expose `data-scrollable` and `data-autoscrolling`,
 * each item exposes `data-message-id`/`data-scroll-anchor`, and the button
 * exposes `data-active` (and becomes `inert` with `tabIndex=-1` when there is
 * nothing to scroll toward).
 *
 * Composition mirrors shadcn 1:1:
 *   MessageScrollerProvider (headless root; owns scroll state + behavior props)
 *   └── MessageScroller (styled frame)
 *       ├── MessageScrollerViewport (the scroll region; role="region")
 *       │   └── MessageScrollerContent (the transcript; role="log")
 *       │       └── MessageScrollerItem (a message, marker, or row)
 *       └── MessageScrollerButton (jump-to-latest control)
 *
 * `MessageScroller` fills its parent, so place it inside a height-constrained
 * container.
 *
 * TODO(@repo/ui): fold this primitive into `packages/ui` during
 * productionisation so production code can consume it directly. The behavior
 * dependency is `@shadcn/react`.
 */

function MessageScrollerProvider({
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Provider>) {
  return <MessageScrollerPrimitive.Provider {...props} />;
}

function MessageScroller({
  className,
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Root>) {
  return (
    <MessageScrollerPrimitive.Root
      data-slot="message-scroller"
      className={cn(
        'relative isolate flex h-full min-h-0 w-full flex-col overflow-hidden',
        className,
      )}
      {...props}
    />
  );
}

function MessageScrollerViewport({
  className,
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Viewport>) {
  return (
    <MessageScrollerPrimitive.Viewport
      data-slot="message-scroller-viewport"
      className={cn(
        'focus-visible:ring-ring/50 min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset',
        className,
      )}
      {...props}
    />
  );
}

function MessageScrollerContent({
  className,
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Content>) {
  return (
    <MessageScrollerPrimitive.Content
      data-slot="message-scroller-content"
      className={cn('flex flex-col gap-4', className)}
      {...props}
    />
  );
}

function MessageScrollerItem({
  className,
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Item>) {
  return (
    <MessageScrollerPrimitive.Item
      data-slot="message-scroller-item"
      // Keep rows in the DOM (selection, copy, find-in-page, a11y) while letting
      // the browser skip rendering work for rows far outside the viewport.
      className={cn(
        '[contain-intrinsic-size:auto_3rem] [content-visibility:auto]',
        className,
      )}
      {...props}
    />
  );
}

function MessageScrollerButton({
  className,
  children,
  direction = 'end',
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Button>) {
  const Icon = direction === 'start' ? ChevronUp : ChevronDown;

  return (
    <MessageScrollerPrimitive.Button
      data-slot="message-scroller-button"
      direction={direction}
      className={cn(
        'bg-background text-foreground not-disabled:hover:bg-foreground/5 absolute bottom-3 left-1/2 z-20 inline-flex size-9 -translate-x-1/2 items-center justify-center rounded-full border shadow-md transition-all duration-150',
        'focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-[3px]',
        // The headless button toggles `data-active`; hide it (and lift it out of
        // the layout flow visually) when there is nothing to scroll toward.
        'data-[active=false]:pointer-events-none data-[active=false]:translate-y-2 data-[active=false]:opacity-0',
        'data-[active=true]:opacity-100',
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          <Icon aria-hidden="true" className="size-4" />
          <span className="sr-only">
            {direction === 'start' ? 'Scroll to top' : 'Scroll to latest'}
          </span>
        </>
      )}
    </MessageScrollerPrimitive.Button>
  );
}

export {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
};
