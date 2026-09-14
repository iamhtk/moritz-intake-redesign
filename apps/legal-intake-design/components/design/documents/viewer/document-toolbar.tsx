'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Info,
  Printer,
  Search,
  X,
} from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

import { Button } from '@/components/design/foundations/components/button';
import { Input } from '@/components/design/foundations/components/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/design/foundations/components/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { DocumentAbout, type DocumentCitation } from './document-about';
import { downloadDocument, printDocument } from './document-actions';
import { MIN_QUERY_LENGTH } from './pdf-text';
import type { FileDocument } from './types';
import type { PdfViewer } from './use-pdf-viewer';

/**
 * A toolbar control.
 *
 * Icon-only in the docked column and labelled in the overlay, from one
 * definition rather than two branches: the panel is 30rem wide beside a
 * conversation and a brief, and five labelled buttons do not fit in it. The
 * label becomes the tooltip when it cannot be shown, so the control is never
 * just a glyph a client has to guess at.
 */
function ToolbarButton({
  label,
  icon,
  compact,
  onClick,
  disabled,
  active,
}: {
  label: string;
  icon: React.ReactNode;
  compact: boolean;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  const button = (
    <Button
      type="button"
      variant="ghost"
      size={compact ? 'icon-sm' : 'sm'}
      disabled={disabled}
      onClick={onClick}
      /*
       * Always, not only when `compact`. The label below can be hidden by a
       * container query as well as by the prop, and a `hidden` span is out of
       * the accessibility tree — so a button that was named by its own text
       * became a nameless glyph the moment the overlay got narrow. Setting it
       * unconditionally is the same string either way.
       */
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'text-muted-foreground hover:text-foreground font-normal',
        active && 'bg-foreground/[0.06] text-foreground',
      )}
    >
      {icon}
      {!compact && <span className="@max-[30rem]:hidden">{label}</span>}
    </Button>
  );

  if (!compact) return button;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export function DocumentToolbar({
  item,
  viewer,
  compact,
  citations,
  onRevealCitation,
}: {
  item: FileDocument;
  /** `null` for a photograph: no pages, no text, no search. */
  viewer: PdfViewer | null;
  compact: boolean;
  citations: readonly DocumentCitation[];
  onRevealCitation: (citation: DocumentCitation) => void;
}) {
  const t = useTranslations('intake.documents');
  const [finding, setFinding] = useState(false);
  const findRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (finding) findRef.current?.focus();
  }, [finding]);

  const closeFind = () => {
    viewer?.clearQuery();
    setFinding(false);
  };

  const pageCount = viewer?.pages.length ?? null;
  const hasMatches = (viewer?.matchCount ?? 0) > 0;
  const searched = (viewer?.query.trim().length ?? 0) >= MIN_QUERY_LENGTH;

  return (
    /*
     * `@container`, so the two strips below react to the width the toolbar is
     * actually given rather than to the window. The same toolbar is a 30rem
     * docked column, a centred overlay on a laptop, and a full-bleed overlay
     * on a phone, and only the first of those is predictable from a media
     * query.
     */
    <div className="@container border-border shrink-0 border-b">
      {/*
       * Two clusters, one flex line that is allowed to become two.
       *
       * What is in this row is two different jobs: things you do to the
       * *file* (read about it, download it, print it, search it) and things
       * you do to the *view* (which page, how big). Six controls and a page
       * readout do not fit across a phone, and the old row simply overflowed
       * — the zoom controls ran off the right edge.
       *
       * `flex-wrap` rather than a breakpoint, because the split is a fact
       * about whether they fit: the file actions keep the first strip, the
       * view controls drop onto a second one underneath, and on anything
       * wide enough the two sit on one line exactly as before. Nothing is
       * hidden, nothing is behind an overflow menu, and there is no width at
       * which a control is unreachable.
       */}
      <div className="flex flex-wrap items-center justify-between gap-x-1 gap-y-0.5 px-2 py-1.5">
        <div className="flex min-w-0 items-center gap-0.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size={compact ? 'icon-sm' : 'sm'}
                aria-label={t('about.label')}
                className="text-muted-foreground hover:text-foreground font-normal"
              >
                <Info aria-hidden />
                {!compact && (
                  <span className="@max-[30rem]:hidden">
                    {t('about.label')}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-4">
              <DocumentAbout
                item={item}
                pageCount={pageCount}
                citations={citations}
                onRevealCitation={onRevealCitation}
              />
            </PopoverContent>
          </Popover>

          <ToolbarButton
            label={t('download')}
            icon={<Download aria-hidden />}
            compact={compact}
            onClick={() => downloadDocument(item)}
          />
          <ToolbarButton
            label={t('print')}
            icon={<Printer aria-hidden />}
            compact={compact}
            onClick={() => printDocument(item)}
          />
          {viewer !== null && (
            <ToolbarButton
              label={t('find')}
              icon={<Search aria-hidden />}
              compact={compact}
              active={finding}
              onClick={() => (finding ? closeFind() : setFinding(true))}
            />
          )}
        </div>

        {viewer !== null && viewer.status === 'ready' && (
          <div className="flex shrink-0 items-center gap-0.5">
            {/*
             * Page nav is a readout first and a control second. The number is
             * the page the client is looking at, updated by scrolling, and the
             * chevrons move it — rather than a "page 3 of 53" that is a
             * separate idea from where the scroller happens to be.
             */}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('previousPage')}
              disabled={viewer.currentPage <= 1}
              onClick={() => viewer.goToPage(viewer.currentPage - 1)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft aria-hidden />
            </Button>
            <span className="text-muted-foreground px-0.5 text-[12px] tabular-nums">
              {t('pageOf', {
                page: viewer.currentPage,
                total: viewer.pages.length,
              })}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('nextPage')}
              disabled={viewer.currentPage >= viewer.pages.length}
              onClick={() => viewer.goToPage(viewer.currentPage + 1)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronRight aria-hidden />
            </Button>

            <div className="bg-border mx-1 h-4 w-px" />

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('zoomOut')}
              disabled={!viewer.canZoomOut}
              onClick={viewer.zoomOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <span aria-hidden className="text-[13px]">
                &minus;
              </span>
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={viewer.fitWidth}
                  className={cn(
                    'text-muted-foreground hover:text-foreground cursor-pointer rounded-[0.5rem] px-1 text-[12px] tabular-nums transition-colors',
                    // Fitted is the resting state, so it is not announced as a
                    // setting; a percentage is only news once it is not the
                    // width of the column.
                    viewer.fitted && 'text-muted-foreground/70',
                  )}
                >
                  {Math.round(viewer.scale * 100)}%
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('fitWidth')}</TooltipContent>
            </Tooltip>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('zoomIn')}
              disabled={!viewer.canZoomIn}
              onClick={viewer.zoomIn}
              className="text-muted-foreground hover:text-foreground"
            >
              <span aria-hidden className="text-[13px]">
                +
              </span>
            </Button>
          </div>
        )}
      </div>

      {/*
       * Find gets its own row rather than a slot in the one above. In the
       * docked column there is no width for an input beside five buttons, and
       * a search that only appears when asked for is also a search that can
       * take the whole width when it does.
       */}
      {finding && viewer !== null && (
        <div className="border-border/60 relative border-t px-2 py-1.5">
          <Input
            ref={findRef}
            type="search"
            value={viewer.query}
            placeholder={t('findPlaceholder')}
            aria-label={t('findPlaceholder')}
            onChange={(event) => viewer.setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                closeFind();
                return;
              }
              if (event.key !== 'Enter') return;
              event.preventDefault();
              viewer.stepMatch(event.shiftKey ? -1 : 1);
            }}
            /*
             * The engine's own clear button is hidden: Chrome draws one inside
             * every `type="search"` field, and it landed on top of the match
             * counter. The × at the end of the row does the same job in the
             * same place for every browser, and it also closes the search
             * rather than only emptying it.
             */
            className="[&>input]:h-8 [&>input]:pe-24 [&>input]:ps-8 [&>input]:text-[13px] [&_input::-webkit-search-cancel-button]:hidden [&_input::-webkit-search-decoration]:hidden"
          />
          <Search
            className="text-muted-foreground pointer-events-none absolute start-4 top-1/2 size-3.5 -translate-y-1/2"
            aria-hidden
          />
          <div className="absolute end-3 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
            <span
              aria-live="polite"
              className="text-muted-foreground pe-1 text-[11.5px] tabular-nums"
            >
              {viewer.searching
                ? t('searching')
                : searched
                  ? t('matchOf', {
                      index: hasMatches ? viewer.activeMatch + 1 : 0,
                      total: viewer.matchCount,
                    })
                  : ''}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-6"
              aria-label={t('previousMatch')}
              disabled={!hasMatches}
              onClick={() => viewer.stepMatch(-1)}
            >
              <ChevronUp className="size-3" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-6"
              aria-label={t('nextMatch')}
              disabled={!hasMatches}
              onClick={() => viewer.stepMatch(1)}
            >
              <ChevronDown className="size-3" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-6"
              aria-label={t('closeFind')}
              onClick={closeFind}
            >
              <X className="size-3" aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
