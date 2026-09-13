'use client';

import { useCallback, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { GripVertical } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

/** Narrower than this and the toolbar's controls start colliding. */
export const MIN_DOCUMENT_WIDTH = 352;

/**
 * A page is not worth widening past this, and past it the conversation beside
 * it is the thing paying for the extra pixels.
 */
export const MAX_DOCUMENT_WIDTH = 1100;

type DocumentResizeHandleProps = {
  /**
   * What the conversation must keep, in pixels.
   *
   * The drag takes its width from the chat and never from the brief: the brief
   * is a list of labels beside their values, and it stops reading as a document
   * the moment the two drift apart. A conversation is paragraphs, which narrow
   * gracefully until they do not — hence a floor rather than nothing.
   */
  chatFloor: number;
  /**
   * The width already chosen, if any.
   *
   * Used as the starting point for a keystroke rather than measuring the panel
   * again: two presses in the same frame would both measure the width before
   * either was applied, and the second would land on the first's answer. A
   * pointer drag has no such problem — it measures once, at the start.
   */
  width: number | null;
  onResize: (width: number) => void;
  /** Hands the width back to the responsive default. */
  onReset: () => void;
  onResizeStart: () => void;
  onResizeEnd: () => void;
};

/**
 * The grip between the brief and the document.
 *
 * Twelve pixels wide with a one-pixel line drawn inside it: a border is the
 * right visual weight for a division and the wrong target size for a pointer,
 * so the two are separated. It lands on the panel's own left edge, over the
 * hairline that was already there, so nothing about the closed layout changes
 * to accommodate a control that only exists while a document is open.
 *
 * A real `separator` with arrow keys, not a pointer-only affordance. Resizing
 * with a mouse is the obvious half; the keyboard half is what makes it a
 * control rather than a gesture.
 */
export function DocumentResizeHandle({
  chatFloor,
  width,
  onResize,
  onReset,
  onResizeStart,
  onResizeEnd,
}: DocumentResizeHandleProps) {
  const t = useTranslations('intake.documents');
  const ref = useRef<HTMLDivElement>(null);

  /*
   * Held locally rather than read from the panel's state, because it is only
   * ever used to keep this control looking held. The grid needs to know a drag
   * is happening so it can stop animating; the grip needs to know so its own
   * ink stays up while the pointer is somewhere else entirely.
   */
  const [dragging, setDragging] = useState(false);

  /**
   * How wide the document is allowed to get, measured now rather than assumed.
   *
   * Read off the DOM at the moment of the drag because all three inputs move:
   * the window can be any width, the brief's track resolves differently at
   * `xl` and `2xl`, and the document may already have been dragged once. The
   * alternative — recomputing the grid's own arithmetic in JavaScript — is the
   * same numbers kept in two places, and the copy here would be the one that
   * went stale.
   */
  const limits = useCallback(
    (from?: number) => {
      const panel = ref.current?.closest<HTMLElement>('[data-document-panel]');
      const grid = panel?.parentElement;
      const brief = grid?.querySelector<HTMLElement>('#intake-brief-panel');
      if (!panel || !grid) return null;

      const available =
        grid.getBoundingClientRect().width -
        (brief?.getBoundingClientRect().width ?? 0) -
        chatFloor;

      return {
        start: from ?? panel.getBoundingClientRect().width,
        min: MIN_DOCUMENT_WIDTH,
        max: Math.max(
          MIN_DOCUMENT_WIDTH,
          Math.min(MAX_DOCUMENT_WIDTH, available),
        ),
      };
    },
    [chatFloor],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      const bounds = limits();
      if (!bounds) return;

      event.preventDefault();
      const handle = event.currentTarget;
      handle.setPointerCapture(event.pointerId);
      const from = event.clientX;
      setDragging(true);
      onResizeStart();

      const move = (moved: PointerEvent) => {
        // Dragging left widens: the panel's left edge is the thing being moved.
        const next = bounds.start + (from - moved.clientX);
        onResize(Math.round(Math.min(Math.max(next, bounds.min), bounds.max)));
      };

      const done = () => {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', done);
        handle.removeEventListener('pointercancel', done);
        setDragging(false);
        onResizeEnd();
      };

      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', done);
      handle.addEventListener('pointercancel', done);
    },
    [limits, onResize, onResizeEnd, onResizeStart],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const step =
        event.key === 'ArrowLeft' ? 32 : event.key === 'ArrowRight' ? -32 : 0;
      if (step === 0) return;
      const bounds = limits(width ?? undefined);
      if (!bounds) return;
      event.preventDefault();
      onResize(
        Math.round(
          Math.min(Math.max(bounds.start + step, bounds.min), bounds.max),
        ),
      );
    },
    [limits, onResize, width],
  );

  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation="vertical"
      aria-label={t('resize')}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      /*
       * Double click puts it back, the way a window's edge does. A width a
       * client dragged to is theirs until they say otherwise, and this is how
       * they say otherwise without having to find the size it started at.
       */
      onDoubleClick={onReset}
      className={cn(
        'group/resize absolute inset-y-0 -start-2 z-10 hidden w-4 cursor-col-resize touch-none xl:block',
        'focus-visible:outline-ring focus-visible:outline-solid outline-none focus-visible:outline-2',
      )}
    >
      {/*
       * The line itself, centred in the target. It carries the panel's edge at
       * rest and thickens into the brand ink under the pointer, so the division
       * a client has been looking at all along turns out to be the thing they
       * can move.
       */}
      <div
        aria-hidden
        className={cn(
          'absolute inset-y-0 start-1/2 w-px -translate-x-1/2 transition-colors duration-150',
          dragging
            ? 'bg-primary/40'
            : 'group-hover/resize:bg-primary/30 group-focus-visible/resize:bg-primary/40 bg-transparent',
        )}
      />

      {/*
       * And the grip, which is the part that says any of this is possible.
       *
       * Drawn at rest rather than on hover. A divider that only becomes a
       * control once the pointer is already on it is a control for people who
       * were going to try anyway — and the whole reason to resize this column
       * is that the document in it is too narrow, which is a thought a client
       * has while looking at the document, not while sweeping the edges of the
       * screen. So it is visible, and quiet: a hairline capsule in the same
       * grey as the border it sits on, carrying the ridges that mean "hold
       * this" in every window manager the client has ever used.
       *
       * It takes the panel's own background so the border behind it stops
       * cleanly at the capsule rather than running through it.
       */}
      <div
        aria-hidden
        className={cn(
          'bg-background absolute start-1/2 top-1/2 flex h-9 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border transition-colors duration-150',
          dragging
            ? 'border-primary/40 text-foreground'
            : 'border-border text-muted-foreground/70 group-hover/resize:border-primary/40 group-hover/resize:text-foreground group-focus-visible/resize:border-primary/40 group-focus-visible/resize:text-foreground',
        )}
      >
        <GripVertical className="size-3.5" />
      </div>
    </div>
  );
}
