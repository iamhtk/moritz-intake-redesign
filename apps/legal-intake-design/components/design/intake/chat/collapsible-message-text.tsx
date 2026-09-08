'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { ChevronDown } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

/**
 * A chat message's text with a line clamp + Show more / Show less toggle, shown
 * only once the text overflows the collapsed height. Overflow is measured (via
 * `scrollHeight` vs `clientHeight` while clamped) rather than by character count
 * so any long message collapses reliably — including unbroken strings that wrap
 * to many lines. The toggle inherits the bubble's text color (at reduced
 * opacity) so it reads on both muted and primary surfaces.
 */
export function CollapsibleMessageText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const measure = useCallback(() => {
    const el = ref.current;
    // Only meaningful while clamped: expanded content has no overflow to detect,
    // so skip (keeps the toggle visible once shown).
    if (!el || expanded) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [expanded]);

  useLayoutEffect(() => {
    measure();
  }, [measure, text]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  return (
    <div>
      <div
        ref={ref}
        className={cn(
          'whitespace-pre-wrap break-words',
          !expanded && 'line-clamp-[10]',
          className,
        )}
      >
        {text}
      </div>
      {overflowing ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1 inline-flex items-center gap-1 text-xs font-medium underline-offset-2 opacity-70 transition-opacity hover:underline hover:opacity-100"
        >
          {expanded ? 'Show less' : 'Show more'}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'size-3.5 transition-transform',
              expanded && 'rotate-180',
            )}
          />
        </button>
      ) : null}
    </div>
  );
}
