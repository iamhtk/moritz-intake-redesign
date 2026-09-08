'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp } from '@repo/ui/icons';
import { Button } from '@/components/design/design-system/button';
import { RichTextViewer } from '@/components/rich-text/rich-text-viewer';

interface CollapsibleRichTextProps {
  value: string;
  className?: string;
  /** Height (px) the content collapses to before the toggle appears. */
  collapsedMaxHeight?: number;
}

/**
 * Renders rich text with a height clamp + soft bottom fade when the content is
 * tall, plus a quiet "View all" / "Show less" toggle. Measures the rendered
 * content (rather than CSS line-clamp) so it works across multi-block rich text.
 */
export function CollapsibleRichText({
  value,
  className,
  collapsedMaxHeight = 240,
}: CollapsibleRichTextProps) {
  const t = useTranslations('cases.create');
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  const measure = useCallback(() => {
    const node = contentRef.current;
    if (!node) {
      return;
    }
    setContentHeight(node.scrollHeight);
    setIsOverflowing(node.scrollHeight > collapsedMaxHeight + 1);
  }, [collapsedMaxHeight]);

  useLayoutEffect(() => {
    measure();
    const node = contentRef.current;
    if (!node || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(() => measure());
    observer.observe(node);
    return () => observer.disconnect();
  }, [measure, value]);

  const isClamped = isOverflowing && !expanded;

  return (
    <div>
      <div className="relative">
        <div
          ref={contentRef}
          className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
          style={{
            maxHeight: isOverflowing
              ? expanded
                ? contentHeight
                : collapsedMaxHeight
              : undefined,
          }}
        >
          <RichTextViewer value={value} className={className} />
        </div>
        {isClamped ? (
          <div className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t to-transparent" />
        ) : null}
      </div>
      {isOverflowing ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground -ms-2 mt-2"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? (
            <ChevronUp data-icon="inline-start" aria-hidden />
          ) : (
            <ChevronDown data-icon="inline-start" aria-hidden />
          )}
          {expanded ? t('showLess') : t('viewAll')}
        </Button>
      ) : null}
    </div>
  );
}
