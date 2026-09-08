'use client';

import React, { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/design/foundations/components/button';
import { useRightSidebar } from '@/components/design/tabular-playbook/contexts/RightSidebarContext';

interface RightSidebarPanelProps {
  isMobile?: boolean;
}

const MIN_WIDTH = 360;
/** Room the grid keeps to its left, so docking can never squeeze it out. */
const MIN_MAIN_WIDTH = 480;

const computeMaxWidth = (): number => {
  if (typeof window === 'undefined') return 800;
  const fiftyFivePercent = Math.floor(window.innerWidth * 0.55);
  return Math.max(
    MIN_WIDTH,
    Math.min(fiftyFivePercent, 1100, window.innerWidth - MIN_MAIN_WIDTH),
  );
};

const clampWidth = (desired: number, max: number): number =>
  Math.min(Math.max(desired, MIN_WIDTH), max);

/**
 * Generic host for the right drawer. On desktop it docks beside the table and
 * shifts it, the way the agent panel does — reading a clause against the row it
 * came from is the point, so it never covers the grid. Phones have no room to
 * dock, so there it stays a modal overlay. Opened through
 * `useRightSidebar().openSidebar` — currently by citation markers showing their
 * source document.
 */
export function RightSidebarPanel({
  isMobile = false,
}: RightSidebarPanelProps) {
  const {
    isOpen,
    content,
    title,
    titleComponent,
    closeSidebar,
    requestClose,
    sidebarWidth,
    updateWidth,
  } = useRightSidebar();
  const initialMaxWidth = computeMaxWidth();
  const baseDesired =
    typeof window === 'undefined' ? 640 : Math.floor(window.innerWidth * 0.38);
  const initialWidth = clampWidth(baseDesired, initialMaxWidth);
  const [width, setWidth] = useState<number>(initialWidth);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [shouldRender, setShouldRender] = useState<boolean>(false);
  const [mobileVisible, setMobileVisible] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isHoveringHandle, setIsHoveringHandle] = useState<boolean>(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const sidebarWidthRef = useRef<number>(sidebarWidth);
  const [maxWidth, setMaxWidth] = useState<number>(initialMaxWidth);
  const isOverlayMode = isMobile;

  useEffect(() => {
    sidebarWidthRef.current = sidebarWidth;
  }, [sidebarWidth]);

  useEffect(() => {
    const handleResize = (): void => {
      const updatedMax = computeMaxWidth();
      setMaxWidth(updatedMax);

      const clamped = clampWidth(sidebarWidth ?? width, updatedMax);
      if (width !== clamped) setWidth(clamped);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, sidebarWidth]);

  const prevIsMobileRef = useRef<boolean>(isMobile);
  const closeSidebarRef = useRef(closeSidebar);
  const requestCloseRef = useRef(requestClose);

  useEffect(() => {
    closeSidebarRef.current = closeSidebar;
    requestCloseRef.current = requestClose;
  }, [closeSidebar, requestClose]);

  useEffect(() => {
    const wasMobile = prevIsMobileRef.current;
    if (!wasMobile && isMobile && isOpen) closeSidebarRef.current();
    prevIsMobileRef.current = isMobile;
  }, [isMobile, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);

      if (isOverlayMode) {
        setMobileVisible(false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setMobileVisible(true));
        });
      } else {
        setWidth(clampWidth(sidebarWidthRef.current ?? initialWidth, maxWidth));
        setIsVisible(false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setIsVisible(true));
        });
      }
      return;
    }

    if (isOverlayMode) setMobileVisible(false);
    else setIsVisible(false);
    const timer = setTimeout(() => setShouldRender(false), 300);
    return () => clearTimeout(timer);
  }, [isOpen, isOverlayMode, initialWidth, maxWidth]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape' || !isOpen) return;
      // A menu or popover inside the drawer handles Escape first and marks the
      // event handled; closing the drawer as well would spend two dismissals on
      // one keypress.
      if (e.defaultPrevented) return;
      requestCloseRef.current();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent): void => {
      if (!isResizing) return;
      e.preventDefault();
      // Dragging left widens the panel.
      const delta = startXRef.current - e.clientX;
      setWidth(clampWidth(startWidthRef.current + delta, maxWidth));
    };

    const handleMouseUp = (e: MouseEvent): void => {
      const delta = startXRef.current - e.clientX;
      updateWidth(clampWidth(startWidthRef.current + delta, maxWidth));

      setIsResizing(false);
      setIsHoveringHandle(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, maxWidth, isMobile, updateWidth]);

  const startResizing = (e: React.MouseEvent): void => {
    if (isMobile) return;

    e.preventDefault();
    e.stopPropagation();

    startXRef.current = e.clientX;
    startWidthRef.current = width;

    setIsResizing(true);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHoveringHandle(true);

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseEnter = (): void => {
    if (!isResizing && !isMobile) {
      hoverTimeoutRef.current = setTimeout(
        () => setIsHoveringHandle(true),
        300,
      );
    }
  };

  const handleMouseLeave = (): void => {
    if (!isResizing && !isMobile) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      setIsHoveringHandle(false);
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const resizeHandle = (
    <div
      className="absolute left-0 top-0 z-[100] h-full w-3 cursor-col-resize"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        startResizing(e);
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="pointer-events-none absolute left-0 top-0 h-full transition-all duration-100"
        style={{
          width: isResizing ? '3px' : '2px',
          backgroundColor:
            isResizing || isHoveringHandle
              ? 'var(--foreground)'
              : 'transparent',
          opacity: isResizing ? 1 : isHoveringHandle ? 0.6 : 0,
        }}
      />
    </div>
  );

  const body = (
    <div className="flex h-full flex-col">
      <div className="text-dt-fg-primary flex min-h-[48px] shrink-0 items-center justify-between p-2 text-lg font-semibold tracking-tight">
        {titleComponent ?? (
          <h2 className="text-dt-fg-primary flex-1 truncate pt-0.5 text-lg font-medium">
            {title}
          </h2>
        )}

        <Button
          variant="link"
          onClick={requestClose}
          className="ml-2 px-3 py-1 text-sm"
        >
          Close
        </Button>
      </div>

      <div className="flex-1 overflow-auto">{content}</div>
    </div>
  );

  if (!shouldRender) return null;

  const currentWidth = clampWidth(width, maxWidth);

  if (isOverlayMode) {
    return (
      <>
        <div
          className="bg-dt-bg-overlay fixed inset-0 z-40 backdrop-blur-[2px]"
          style={{
            opacity: mobileVisible ? 1 : 0,
            transition: 'opacity 200ms ease-in-out',
          }}
          onClick={requestClose}
          aria-hidden="true"
        />
        <div
          ref={sidebarRef}
          data-tp-drawer
          className="border-dt-line-secondary bg-dt-bg-primary fixed right-0 top-0 z-[45] h-full overflow-hidden border-l"
          style={{
            width: isMobile ? 'min(640px, 90vw)' : `${currentWidth}px`,
            transform: mobileVisible ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        >
          {!isMobile && resizeHandle}
          {body}
        </div>
      </>
    );
  }

  return (
    <div
      className="relative self-stretch overflow-hidden"
      style={{
        width: isVisible ? `${currentWidth}px` : '0px',
        maxWidth: `${maxWidth}px`,
        transition: isResizing
          ? 'none'
          : 'width 300ms cubic-bezier(0.32, 0.72, 0, 1)',
        flexShrink: 0,
      }}
    >
      <div
        ref={sidebarRef}
        data-tp-drawer
        className="border-dt-line-secondary bg-dt-bg-primary absolute inset-y-0 right-0 border-l"
        style={{
          width: `${currentWidth}px`,
          transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
          transition: isResizing
            ? 'none'
            : 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {resizeHandle}
        {body}
      </div>
    </div>
  );
}
