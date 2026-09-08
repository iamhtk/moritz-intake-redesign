'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH } from '../types';

/**
 * How close to the viewport edge the pointer must get before the grid starts
 * scrolling itself. Small on purpose: the trailing column's handle already sits
 * a few pixels inside the edge, and merely grabbing it should not start a scroll.
 */
const AUTO_SCROLL_EDGE_PX = 4;

/** Auto-scroll speed per frame, ramped over this much overshoot past the edge. */
const AUTO_SCROLL_RAMP_PX = 40;
const AUTO_SCROLL_MIN_STEP_PX = 3;
const AUTO_SCROLL_MAX_STEP_PX = 18;

interface ColumnResizeHandleProps {
  columnKey: string;
  currentWidth: number;
  onResize: (columnKey: string, newWidth: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  /** If true, the handle extends past its header cell down over the rows. */
  fullHeight?: boolean;
  /** Measured height of the scroll viewport the handle should span. */
  tableHeight?: number;
  /** If true, the resize handle is hidden and non-interactive */
  disabled?: boolean;
  /**
   * The horizontally scrolling viewport the column lives in. Supplying it lets a
   * drag that reaches the edge scroll the grid instead of dead-ending, which is
   * what makes the trailing column resizable at all.
   */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * ColumnResizeHandle provides a draggable handle at the right edge of columns
 * for manually adjusting column widths.
 *
 * Features:
 * - Visual feedback on hover (highlighted line)
 * - Drag to resize with min/max constraints
 * - Full column height resize area (like Excel)
 * - Prevents text selection during drag
 * - Pushing against either edge of the viewport scrolls the grid mid-drag
 */
export function ColumnResizeHandle({
  columnKey,
  currentWidth,
  onResize,
  onResizeStart,
  onResizeEnd,
  fullHeight = false,
  tableHeight,
  disabled = false,
  scrollContainerRef,
}: ColumnResizeHandleProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const handleRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const frameRef = useRef<number | null>(null);
  const pointerXRef = useRef<number>(0);
  const publishedWidthRef = useRef<number | null>(null);
  /**
   * Scrolling we performed ourselves during this drag. Every pixel the viewport
   * moves left slides the column's leading edge with it, so it counts toward the
   * new width on top of the pointer's own travel. Only self-inflicted scrolling
   * is tracked: compensating for the browser clamping `scrollLeft` as the canvas
   * shrinks would feed a shrink back into itself.
   */
  const autoScrollRef = useRef<number>(0);

  /** Scrolls the viewport if the pointer is at an edge; returns pixels moved. */
  const autoScroll = useCallback(() => {
    const container = scrollContainerRef?.current;
    if (!container) return 0;

    const { left, right } = container.getBoundingClientRect();
    const pointerX = pointerXRef.current;
    const overshoot =
      pointerX >= right - AUTO_SCROLL_EDGE_PX
        ? pointerX - (right - AUTO_SCROLL_EDGE_PX)
        : pointerX <= left + AUTO_SCROLL_EDGE_PX
          ? pointerX - (left + AUTO_SCROLL_EDGE_PX)
          : 0;
    if (overshoot === 0) return 0;

    const ramp = Math.min(Math.abs(overshoot) / AUTO_SCROLL_RAMP_PX, 1);
    const step =
      AUTO_SCROLL_MIN_STEP_PX +
      ramp * (AUTO_SCROLL_MAX_STEP_PX - AUTO_SCROLL_MIN_STEP_PX);

    const before = container.scrollLeft;
    container.scrollLeft = before + Math.sign(overshoot) * step;
    return container.scrollLeft - before;
  }, [scrollContainerRef]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsResizing(true);
      startXRef.current = e.clientX;
      pointerXRef.current = e.clientX;
      startWidthRef.current = currentWidth;
      autoScrollRef.current = 0;
      publishedWidthRef.current = currentWidth;

      // Prevent text selection during resize
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';

      onResizeStart?.();
    },
    [currentWidth, onResizeStart],
  );

  const handleMouseMove = useCallback((e: MouseEvent) => {
    pointerXRef.current = e.clientX;
  }, []);

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      setIsResizing(false);
      /*
       * A drag nearly always ends with the pointer off the handle: it left while
       * `isResizing` was suppressing the hover reset, and no `mouseleave`
       * follows for an element the pointer has already left. Left alone the line
       * stays lit until the handle is hovered and left again, so hover is
       * settled here against where the pointer actually released.
       */
      setIsHovering(
        e.target instanceof Node
          ? Boolean(handleRef.current?.contains(e.target))
          : false,
      );

      // Restore normal cursor and text selection
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      onResizeEnd?.();
    },
    [onResizeEnd],
  );

  /*
   * A resize re-renders every cell in the grid, so the width is published at most
   * once per frame, and only when it actually changed. Reading the pointer from a
   * frame loop rather than from `mousemove` also lets an edge-parked pointer keep
   * scrolling — the pointer stops moving but the column keeps growing.
   */
  useEffect(() => {
    if (!isResizing) return;

    const tick = () => {
      autoScrollRef.current += autoScroll();

      const width = Math.max(
        MIN_COLUMN_WIDTH,
        Math.min(
          MAX_COLUMN_WIDTH,
          startWidthRef.current +
            (pointerXRef.current - startXRef.current) +
            autoScrollRef.current,
        ),
      );
      if (width !== publishedWidthRef.current) {
        publishedWidthRef.current = width;
        onResize(columnKey, width);
      }

      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isResizing,
    autoScroll,
    columnKey,
    onResize,
    handleMouseMove,
    handleMouseUp,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, []);

  // Height of the resize hit-target. Falls back to the header cell alone until
  // the caller has measured its scroll viewport; a hardcoded tall value
  // (previously 5000px) sits inside the scroll container and invents empty
  // scrollable space past the last row, so the measurement has to be real.
  const handleHeight = fullHeight && tableHeight ? tableHeight : '100%';

  if (disabled) return null;

  return (
    <div
      ref={handleRef}
      className="absolute right-0 top-0"
      style={{
        width: '12px',
        height:
          typeof handleHeight === 'number' ? `${handleHeight}px` : handleHeight,
        cursor: 'col-resize',
        transform: 'translateX(50%)',
        /*
         * Only needs to beat the neighbouring header, which is unpositioned:
         * the grip straddles the column boundary, so half of its hit target
         * lies in the next column. Anything higher also beats the frozen
         * Position column (z-10) two levels up, which let a scrolled-away
         * column keep grabbing drags over that column's header.
         */
        zIndex: 1,
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => !isResizing && setIsHovering(false)}
    >
      {/* Visual indicator line - extends full height */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 transition-all duration-100"
        style={{
          width: isResizing ? '3px' : '2px',
          height: '100%',
          transform: 'translateX(-50%)',
          backgroundColor:
            isResizing || isHovering ? 'var(--foreground)' : 'transparent',
          opacity: isResizing ? 1 : isHovering ? 0.6 : 0,
        }}
      />
    </div>
  );
}

export default ColumnResizeHandle;
