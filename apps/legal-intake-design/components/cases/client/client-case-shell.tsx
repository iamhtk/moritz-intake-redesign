'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BanknoteArrowUp, File, Info } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { createUploadedDocuments } from '@/components/design/documents/document-model';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/design/foundations/components/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { ClientCaseHeader } from '@/components/cases/client/client-case-header';
import { ClientCaseChat } from '@/components/cases/client/client-case-chat';
import { ClientCaseDetailsPanel } from '@/components/cases/client/client-case-details-panel';
import { ClientPaymentsList } from '@/components/cases/client/billing/client-payments-list';
import { CaseDocumentsTab } from '@/components/cases/case-documents-tab';
import { getInvoicesForCase } from '@/lib/mocks/billing';
import type { Document, LegalCase, Message } from '@/lib/types';

type ClientCaseShellProps = {
  legalCase: LegalCase;
  messages: Message[];
  currentUserId: string;
};

/**
 * Client case detail layout: the in-page header + tabs (chat / payments /
 * documents) with the "Case details" content docked in a right-side Sheet.
 * The panel is a non-modal side rail on desktop (pushing the content left) and
 * a modal, dimmed sheet on mobile — mirroring the intake progress panel.
 */
export function ClientCaseShell({
  legalCase,
  messages,
  currentUserId,
}: ClientCaseShellProps) {
  // Land on the Payments tab when there's an outstanding payment the client
  // needs to act on (an open/draft request), so a requested payment isn't
  // buried behind Overview.
  const hasActivePaymentRequest = getInvoicesForCase(legalCase.id).some(
    (invoice) => invoice.status === 'OPEN' || invoice.status === 'DRAFT',
  );
  const defaultTab = hasActivePaymentRequest ? 'payments' : 'overview';

  // The case's documents are lifted here so files sent in the chat also surface
  // in the Documents tab. A ref mirrors the state so the upload handler can
  // version against the latest list and return the created records synchronously.
  const [documents, setDocuments] = useState<Document[]>(() =>
    legalCase.documents.filter(
      (document) =>
        document.uploaderActor === 'client' || document.status === 'delivered',
    ),
  );
  const documentsRef = useRef(documents);
  documentsRef.current = documents;

  const handleUploadDocuments = useCallback(
    (fileNames: string[]): Document[] => {
      const created = createUploadedDocuments(
        documentsRef.current,
        fileNames,
        'client',
      );
      setDocuments((prev) => [...prev, ...created]);
      return created;
    },
    [],
  );

  const [isPanelOpen, setIsPanelOpen] = useState(true);
  // The docked panel is open from the first paint, so its slide-in enter
  // animation must stay suppressed until the user actually toggles it — that
  // way navigating into a case shows the panel already in place with no jitter
  // (mirrors the new-case intake panel). Later manual opens/closes animate.
  const [hasInteracted, setHasInteracted] = useState(false);
  const isMobile = useIsMobile();
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );

  // Keep the panel docked-open on desktop/tablet and closed on phones, tracking
  // viewport changes. Closing the modal sheet on a phone then widening back to
  // desktop re-opens it automatically; on desktop the header's panel toggle
  // hides/shows it manually.
  useEffect(() => {
    setIsPanelOpen(!isMobile);
  }, [isMobile]);

  const handleOpenChange = (next: boolean) => {
    setHasInteracted(true);
    setIsPanelOpen(next);
  };

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'flex h-full flex-col transition-[padding-right] duration-300 ease-out',
          isPanelOpen ? 'md:pr-[456px]' : 'md:pr-0',
        )}
      >
        <ClientCaseHeader
          legalCase={legalCase}
          isPanelOpen={isPanelOpen}
          onTogglePanel={() => handleOpenChange(!isPanelOpen)}
        />
        <div className="-mt-14 flex min-h-0 flex-1 flex-col">
          <ClientCaseChat
            caseId={legalCase.id}
            messages={messages}
            currentUserId={currentUserId}
            onUploadDocuments={handleUploadDocuments}
          />
        </div>
      </div>

      <div
        ref={setPortalContainer}
        aria-hidden="true"
        className={cn(
          'pointer-events-none fixed inset-0 z-40 overflow-hidden [transform:translateZ(0)]',
          // Start below the app header (and the inset gutter) so the docked
          // panel sits beside the content, not over the nav. `--header-height`
          // is supplied by the surrounding layout (sidebar or top-nav chrome).
          'md:bottom-2 md:left-2 md:right-2 md:top-[calc(var(--header-height,3rem)+0.5rem)] md:rounded-b-xl',
        )}
      />

      <Sheet
        open={isPanelOpen}
        onOpenChange={handleOpenChange}
        modal={isMobile}
      >
        <SheetContent
          id="case-details-panel"
          side="right"
          showOverlay={isMobile}
          showCloseButton={false}
          container={portalContainer}
          className={cn(
            'sm:max-w-md',
            // Docked card treatment matching the intake progress panel: a
            // hairline outline with the inner edge rounded so the panel reads as
            // a card whose outline runs the full height. Borders (drawn inside
            // the box) are used instead of a ring so the top/bottom edges aren't
            // clipped; the right edge hugs the frame, so it carries no border.
            'md:border-foreground/10 md:inset-y-0 md:right-0 md:w-[440px] md:rounded-l-2xl md:border md:border-r-0',
          )}
          // Suppress the slide-in enter animation until the user interacts, so
          // the initially-docked panel doesn't animate on page load.
          style={!hasInteracted ? { animation: 'none' } : undefined}
          // On desktop the panel is docked open from first paint, so don't pull
          // focus into it (which would leave the first tab showing a focus ring
          // on load). Mobile keeps default focus trapping for the modal sheet.
          onOpenAutoFocus={(event) => {
            if (!isMobile) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (!isMobile) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (!isMobile) event.preventDefault();
          }}
        >
          <Tabs
            defaultValue={defaultTab}
            className="flex h-full min-h-0 flex-col"
          >
            <SheetHeader>
              <SheetTitle data-font="serif" className="heading-4">
                Case details
              </SheetTitle>
              <TabsList className="bg-background mt-1 max-w-full">
                <TabsTrigger value="overview">
                  <Info className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="payments">
                  <BanknoteArrowUp className="h-4 w-4" />
                  Payments
                </TabsTrigger>
                <TabsTrigger value="documents">
                  <File className="h-4 w-4" />
                  Documents
                </TabsTrigger>
              </TabsList>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              <TabsContent value="overview">
                <ClientCaseDetailsPanel legalCase={legalCase} />
              </TabsContent>
              <TabsContent value="payments">
                <ClientPaymentsList legalCase={legalCase} />
              </TabsContent>
              <TabsContent value="documents">
                <CaseDocumentsTab legalCase={legalCase} documents={documents} />
              </TabsContent>
            </div>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  );
}
