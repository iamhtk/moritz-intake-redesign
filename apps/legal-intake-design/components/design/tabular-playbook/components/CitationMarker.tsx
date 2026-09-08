'use client';

import { Button } from '@/components/design/foundations/components/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/design/foundations/components/hover-card';
import { useRightSidebar } from '../contexts/RightSidebarContext';
import type { CitationSource } from '../types';
import { SourceDocumentPreview } from './SourceDocumentPreview';

/** Drawer width for the source document, wide enough for a clause to breathe. */
const SOURCE_DRAWER_WIDTH = 480;

/**
 * A filled neutral chip a shade larger than a plain superscript: enough to be
 * spotted while scanning a paragraph, without colouring provenance as if it
 * carried a status. `min-w` rather than a fixed width, so a two-digit number
 * widens the chip instead of spilling out of it.
 */
const markerClasses =
  'relative mx-0.5 inline-flex h-[1.125rem] min-w-[1.125rem] translate-y-[3px] items-center justify-center rounded border border-dt-line-primary bg-dt-bg-tertiary px-1 align-super text-[11px]/none font-semibold text-dt-fg-primary';

/**
 * Inline provenance marker for extracted values.
 *
 * Given a `source`, hovering the marker previews the cited passage; the card's
 * own button is the only way into the full document, so brushing past a marker
 * while reading can never throw the drawer open. Without a `source` it stays a
 * static reference, so the numbering still shows which sentence an answer came
 * from.
 */
export function CitationMarker({
  number,
  source,
}: {
  number: number;
  source?: CitationSource;
}) {
  const { openSidebar } = useRightSidebar();

  if (!source) {
    return <span className={markerClasses}>{number}</span>;
  }

  const openSource = () => {
    openSidebar(
      <SourceDocumentPreview source={source} />,
      source.documentName,
      SOURCE_DRAWER_WIDTH,
    );
  };

  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>
        {/*
         * Focusable but inert: the trigger exists so keyboard users can bring
         * the preview up, while the card holds the only action.
         */}
        <button
          type="button"
          aria-label={`Preview citation ${number} from ${source.documentName}`}
          className={`${markerClasses} focus-visible:outline-ring hover:border-dt-bg-contrast hover:bg-dt-bg-contrast hover:text-dt-fg-contrast focus-visible:outline-solid cursor-default transition-colors focus-visible:outline-2 focus-visible:outline-offset-1`}
        >
          {number}
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="top" align="start" className="w-80 p-3">
        <div className="space-y-2">
          <p className="text-dt-fg-primary text-sm font-semibold">
            {source.documentName}
          </p>
          <p className="text-dt-fg-secondary line-clamp-5 text-sm leading-relaxed">
            {source.snippet}
          </p>
          <Button variant="outline" size="sm" onClick={openSource}>
            View source document
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
