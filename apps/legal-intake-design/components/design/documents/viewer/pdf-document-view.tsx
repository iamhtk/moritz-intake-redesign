'use client';

import { useTranslations } from 'next-intl';

import { FileWarning, Lock } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

import { PdfPage } from './pdf-page';
import type { PdfViewer } from './use-pdf-viewer';

/**
 * The document itself: pages down a scroller, drawn as they are reached.
 *
 * Deliberately not a "page at a time" viewer. A contract is read by scrolling
 * — a clause runs over a page break, and the client checking a notice period
 * wants the sentence after it — and paging controls that also have to be a
 * scroll position are two models of the same thing. The page number in the
 * toolbar is therefore a readout and a jump, not a mode.
 */
export function PdfDocumentView({
  viewer,
  className,
}: {
  viewer: PdfViewer;
  className?: string;
}) {
  const t = useTranslations('intake.documents');

  return (
    <div
      ref={viewer.scrollerRef}
      data-document-scroller
      className={cn(
        'mz-scrollbar-on-scroll bg-muted/40 relative min-h-0 flex-1 overflow-auto',
        className,
      )}
    >
      {viewer.status === 'error' ? (
        <div className="flex h-full items-center justify-center p-8">
          {/*
           * A document that cannot be opened says which of the two things went
           * wrong, because they have different answers: a password is the
           * client's to supply, damage is not. Both end with the file still
           * downloadable — the firm can open what this browser could not.
           */}
          <div className="max-w-xs space-y-2 text-center">
            <div className="text-muted-foreground flex justify-center">
              {viewer.failure === 'password' ? (
                <Lock className="size-5" aria-hidden />
              ) : (
                <FileWarning className="size-5" aria-hidden />
              )}
            </div>
            <p className="text-foreground text-sm font-medium">
              {t(
                viewer.failure === 'password'
                  ? 'error.passwordTitle'
                  : 'error.openTitle',
              )}
            </p>
            <p className="text-muted-foreground text-[13px]">
              {t(
                viewer.failure === 'password'
                  ? 'error.passwordBody'
                  : 'error.openBody',
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 p-6">
          {viewer.pages.map((box) => (
            <PdfPage
              key={box.page}
              doc={viewer.doc!}
              page={box.page}
              width={box.width}
              height={box.height}
              scale={viewer.scale}
              highlights={viewer.highlights}
              activeHighlightId={viewer.activeHighlightId}
            />
          ))}

          {/*
           * Nothing to show yet is a single sheet of paper rather than a
           * spinner, for the same reason an unrendered page is: the shape of
           * what is coming is more reassuring than an abstraction of waiting.
           */}
          {viewer.status === 'loading' && (
            <div className="bg-background ring-foreground/10 h-[60vh] w-full max-w-[46rem] animate-pulse rounded-[0.5rem] ring-1" />
          )}
        </div>
      )}
    </div>
  );
}
