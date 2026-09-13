'use client';

import { Fragment, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

import {
  FileText,
  Image as ImageIcon,
  Mail,
  Maximize2,
  Minimize2,
  X,
} from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

import { Button } from '@/components/design/foundations/components/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import type { DocumentCitation } from './document-about';
import { DocumentTabs } from './document-tabs';
import { DocumentToolbar } from './document-toolbar';
import { ImageDocumentView } from './image-document-view';
import { PdfDocumentView } from './pdf-document-view';
import type { DocumentReveal, FileDocument, IntakeDocument } from './types';
import { usePdfViewer } from './use-pdf-viewer';

export type DocumentPanelProps = {
  tabs: readonly IntakeDocument[];
  active: IntakeDocument;
  /** `true` in the docked column, `false` in the overlay. */
  compact: boolean;
  maximised: boolean;
  citations: readonly DocumentCitation[];
  reveal: DocumentReveal | null;
  onRevealHandled: (found: boolean) => void;
  onSelect: (id: string) => void;
  onCloseTab: (id: string) => void;
  onClose: () => void;
  onMaximise: () => void;
  onMinimise: () => void;
  /**
   * The grip on the panel's leading edge, in the docked column only.
   *
   * Passed in rather than built here because resizing is a fact about the grid
   * the panel sits in, not about the panel: in the overlay there is no column
   * to take width from and the prop is simply absent.
   */
  resizeHandle?: React.ReactNode;
  className?: string;
};

/**
 * A PDF, with the controls that only make sense over a PDF.
 *
 * Split out from the panel because the viewer's state — pages, zoom, the search
 * index — belongs to one document, and the cleanest way to say that in React is
 * a component mounted per document. Keyed by id by the caller, so switching
 * tabs does not carry page 14 of the contract over to the order form.
 */
function PdfBody({
  item,
  compact,
  citations,
  reveal,
  onRevealHandled,
}: {
  item: FileDocument;
  compact: boolean;
  citations: readonly DocumentCitation[];
  reveal: DocumentReveal | null;
  onRevealHandled: (found: boolean) => void;
}) {
  const viewer = usePdfViewer(item.file);

  /*
   * One reveal, acted on once.
   *
   * The request lives in state until the panel reports back, and reporting back
   * is itself a render — so without a mark of what has already been searched
   * for, every render in between would start the same search again. Keyed by
   * the request rather than a boolean, so a second click on the same row after
   * the client has scrolled away still works.
   */
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (reveal === null || reveal.documentId !== item.id) {
      handled.current = null;
      return;
    }
    if (viewer.status !== 'ready') return;

    const key = `${reveal.documentId}:${reveal.quote ?? ''}:${reveal.page ?? ''}`;
    if (handled.current === key) return;
    handled.current = key;

    if (reveal.quote === undefined) {
      if (reveal.page !== undefined) viewer.goToPage(reveal.page);
      onRevealHandled(true);
      return;
    }

    void viewer.revealQuote(reveal.quote).then(onRevealHandled);
  }, [item.id, onRevealHandled, reveal, viewer]);

  return (
    <>
      <DocumentToolbar
        item={item}
        viewer={viewer}
        compact={compact}
        citations={citations}
        onRevealCitation={(citation) => {
          if (citation.quote === null) return;
          void viewer.revealQuote(citation.quote);
        }}
      />
      <PdfDocumentView viewer={viewer} />
    </>
  );
}

/**
 * The document surface: title, tabs, tools, document.
 *
 * One component for both places it appears. The docked column and the
 * maximised overlay differ in exactly two things — how wide they are and which
 * window control they offer — and both are props. Two components would have
 * been two toolbars, and the second one would have been the one that fell
 * behind.
 */
export function DocumentPanel({
  tabs,
  active,
  compact,
  maximised,
  citations,
  reveal,
  onRevealHandled,
  onSelect,
  onCloseTab,
  onClose,
  onMaximise,
  onMinimise,
  resizeHandle,
  className,
}: DocumentPanelProps) {
  const t = useTranslations('intake.documents');
  const Icon =
    active.kind === 'reader'
      ? Mail
      : active.kind === 'pdf'
        ? FileText
        : ImageIcon;

  return (
    <div
      data-document-panel
      className={cn(
        'bg-background relative flex min-h-0 min-w-0 flex-col',
        // The dock's own hairline is the grid's; the overlay brings its own.
        className,
      )}
    >
      {resizeHandle}
      <div className="flex shrink-0 items-center gap-2 px-3 py-2.5">
        <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
        {/*
         * The file's own name, at document weight. It is the title of the thing
         * being read, and the one piece of text in this panel the client
         * supplied themselves.
         */}
        <h2 className="text-foreground min-w-0 flex-1 truncate text-[13.5px] font-medium">
          {active.name}
        </h2>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t(maximised ? 'minimise' : 'maximise')}
              onClick={maximised ? onMinimise : onMaximise}
              className="text-muted-foreground hover:text-foreground"
            >
              {maximised ? (
                <Minimize2 className="size-3.5" aria-hidden />
              ) : (
                <Maximize2 className="size-3.5" aria-hidden />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {t(maximised ? 'minimise' : 'maximise')}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('close')}
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('close')}</TooltipContent>
        </Tooltip>
      </div>

      <DocumentTabs
        tabs={tabs}
        activeId={active.id}
        onSelect={onSelect}
        onClose={onCloseTab}
      />

      {active.kind === 'pdf' ? (
        <PdfBody
          key={active.id}
          item={active}
          compact={compact}
          citations={citations}
          reveal={reveal}
          onRevealHandled={onRevealHandled}
        />
      ) : active.kind === 'reader' ? (
        <>
          {/*
           * The envelope, above the message, where a mail client puts it.
           *
           * It was behind About for one iteration, and that was wrong for a
           * specific reason: the line that opens this says "a copy is on its
           * way to alex.morgan@…", so the question a client brings here is
           * whether it went to the right address. An answer to that belongs on
           * screen, not one click further in. There is no toolbar for a reader
           * document either — download and print belong to a file, and this one
           * is already in their inbox, where their own mail client does both
           * better than we could.
           */}
          <dl className="border-border grid shrink-0 grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 border-b px-3 py-2.5 text-[12.5px]">
            {active.meta.map(([label, value]) => (
              <Fragment key={label}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-foreground truncate" title={value}>
                  {value}
                </dd>
              </Fragment>
            ))}
          </dl>

          {/*
           * The message, on the same grey a mail client would put behind it.
           * The panel scrolls it rather than the body carrying its own height:
           * in here it is a document in a column, not a preview inside a dialog
           * that had to be told how tall to be.
           */}
          <div className="mz-scrollbar-on-scroll min-h-0 flex-1 overflow-y-auto bg-[#f6f9fc]">
            {active.body}
          </div>
        </>
      ) : (
        <>
          <DocumentToolbar
            item={active}
            viewer={null}
            compact={compact}
            citations={citations}
            onRevealCitation={() => {}}
          />
          <ImageDocumentView file={active.file} alt={active.name} />
        </>
      )}
    </div>
  );
}
