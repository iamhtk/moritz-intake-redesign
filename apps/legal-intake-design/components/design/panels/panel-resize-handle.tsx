'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@repo/ui/lib/utils';

/** Keyboard nudge per arrow press, in pixels. */
const KEYBOARD_STEP = 16;

interface PanelResizeHandleProps {
  /** Current panel width in pixels. */
  width: number;
  minWidth: number;
  maxWidth: number;
  onResize: (width: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  /** Accessible name for the separator, e.g. "Resize assistant panel". */
  label: string;
  /**
   * Which edge of the panel the handle rides, following where the panel is
   * docked: a panel on the left grows to the right ("trailing", the default),
   * one on the right grows to the left ("leading").
   */
  edge?: 'leading' | 'trailing';
  className?: string;
}

/**
 * Drag handle for the trailing edge of a docked side panel.
 *
 * Shares `ColumnResizeHandle`'s interaction language: a 12px hit target with a
 * hairline that only appears on hover or while dragging, widths published at
 * most once per frame, and the `col-resize` cursor pinned to <body> so it
 * survives the pointer outrunning the handle mid-drag. Unlike the column
 * version the bounds are props, because the panel's ceiling depends on the
 * viewport, and the handle is focusable so the panel can also be sized from the
 * keyboard.
 */
export function PanelResizeHandle({
  width,
  minWidth,
  maxWidth,
  onResize,
  onResizeStart,
  onResizeEnd,
  label,
  edge = 'trailing',
  className,
}: PanelResizeHandleProps) {
  /** Which way the pointer has to travel for the panel to get wider. */
  const direction = edge === 'leading' ? -1 : 1;
  const [isResizing, setIsResizing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const handleRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const pendingWidthRef = useRef<number | null>(null);

  // The drag listeners live on <document> for the length of the gesture, so they
  // read the bounds through refs rather than closing over a stale render.
  const boundsRef = useRef({ minWidth, maxWidth });
  boundsRef.current = { minWidth, maxWidth };

  const clamp = useCallback(
    (desired: number) =>
      Math.min(
        Math.max(desired, boundsRef.current.minWidth),
        boundsRef.current.maxWidth,
      ),
    [],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = width;

      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';

      onResizeStart?.();
    },
    [width, onResizeStart],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      pendingWidthRef.current = clamp(
        startWidthRef.current + (e.clientX - startXRef.current) * direction,
      );

      if (frameRef.current !== null) return;
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        if (pendingWidthRef.current !== null) {
          onResize(pendingWidthRef.current);
        }
      });
    },
    [clamp, direction, onResize],
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      // Land on the final pointer position even if it arrived mid-frame.
      if (pendingWidthRef.current !== null) {
        onResize(pendingWidthRef.current);
        pendingWidthRef.current = null;
      }

      setIsResizing(false);
      /*
       * A drag nearly always ends with the pointer off the handle: it left
       * while `isResizing` was suppressing the hover reset, and no `mouseleave`
       * follows for an element the pointer has already left. Left alone the
       * hairline stays lit until the handle is hovered and left again, so hover
       * is settled here against where the pointer actually released.
       */
      setIsHovering(
        e.target instanceof Node
          ? Boolean(handleRef.current?.contains(e.target))
          : false,
      );
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      onResizeEnd?.();
    },
    [onResize, onResizeEnd],
  );

  useEffect(() => {
    if (!isResizing) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // The arrows move the separator itself, so which one widens the panel
      // depends on the side it is docked to.
      const step =
        e.key === 'ArrowLeft'
          ? -KEYBOARD_STEP
          : e.key === 'ArrowRight'
            ? KEYBOARD_STEP
            : 0;
      if (step === 0) return;
      e.preventDefault();
      onResize(clamp(width + step * direction));
    },
    [clamp, direction, onResize, width],
  );

  return (
    <div
      ref={handleRef}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={width}
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      tabIndex={0}
      className={cn(
        'focus-visible:outline-ring focus-visible:outline-solid absolute top-0 z-50 h-full w-3 cursor-col-resize focus-visible:outline-2 focus-visible:-outline-offset-2',
        edge === 'leading' ? 'left-0' : 'right-0',
        className,
      )}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => !isResizing && setIsHovering(false)}
      onKeyDown={handleKeyDown}
    >
      <div
        className={cn(
          'pointer-events-none absolute top-0 h-full transition-all duration-100',
          edge === 'leading' ? 'left-0' : 'right-0',
        )}
        style={{
          width: isResizing ? '3px' : '2px',
          backgroundColor:
            isResizing || isHovering ? 'var(--foreground)' : 'transparent',
          opacity: isResizing ? 1 : isHovering ? 0.6 : 0,
        }}
      />
    </div>
  );
}

export default PanelResizeHandle;
