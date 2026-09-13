'use client';

import { Dialog as DialogPrimitive } from 'radix-ui';

import { DocumentPanel, type DocumentPanelProps } from './document-panel';

/**
 * The maximised document: the same panel, seated as a centred overlay.
 *
 * Modelled on the command palette rather than on a full-screen page, because
 * the client asked for the document to get the screen without leaving the
 * intake — and a route change, or an edge-to-edge takeover, would say they had
 * left it. The conversation stays visible around the edges, dimmed, which is
 * what makes minimising back to the column feel like returning rather than
 * navigating.
 *
 * Escape and the backdrop minimise; only the × closes. The two are different
 * intentions — "I am done with the big view" and "I am done with this
 * document" — and the reversible one is what an accidental Escape should get.
 */
export function DocumentOverlay(
  props: Omit<DocumentPanelProps, 'compact' | 'maximised' | 'className'>,
) {
  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open) props.onMinimise();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="bg-foreground/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 duration-100 supports-[backdrop-filter]:backdrop-blur-[2px]" />
        <div className="pointer-events-none fixed inset-0 z-50 flex justify-center p-4 sm:p-6">
          <DialogPrimitive.Content
            aria-label={props.active.name}
            className="ring-foreground/10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95 pointer-events-auto h-full max-h-[min(90vh,1000px)] w-full max-w-[min(72rem,94vw)] self-center overflow-hidden rounded-2xl shadow-lg ring-1 duration-100 will-change-transform data-[state=closed]:ease-in data-[state=open]:ease-out"
          >
            {/*
             * The dialog needs a title for screen readers and the panel already
             * shows the file name at the top of itself, so the accessible one is
             * hidden rather than drawn twice.
             */}
            <DialogPrimitive.Title className="sr-only">
              {props.active.name}
            </DialogPrimitive.Title>
            <DocumentPanel
              {...props}
              compact={false}
              maximised
              className="h-full"
            />
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
