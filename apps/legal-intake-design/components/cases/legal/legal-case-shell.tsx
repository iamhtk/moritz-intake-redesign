'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Bot, ClipboardCheck, File, Info } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import {
  createReviewedDocumentVersion,
  createUploadedDocuments,
} from '@/components/design/documents/document-model';
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
import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import { LegalCaseHeader } from '@/components/cases/legal/legal-case-header';
import { LegalCaseChat } from '@/components/cases/legal/legal-case-chat';
import { LegalCaseDetailsPanel } from '@/components/cases/legal/legal-case-details-panel';
import { LegalCaseReview } from '@/components/cases/legal/legal-case-review';
import { ReviewHistoryPanel } from '@/components/cases/legal/review/review-history-panel';
import { useReviewWorkspace } from '@/components/cases/legal/review/use-review-workspace';
import { LegalAiFirstDraft } from '@/components/cases/legal-ai-first-draft';
import {
  FirstDraftHandoffNotice,
  useFirstDraftHandoff,
} from '@/components/cases/admin/first-draft/handoff-notice';
import { handoffDocuments } from '@/components/cases/admin/first-draft/handoff-documents';
import { CaseDocumentsTab } from '@/components/cases/case-documents-tab';
import type { Document, LegalCase, Message } from '@/lib/types';

/**
 * The rail tab that opens the submission workspace: picking it takes the case's
 * main column to the work being handed in and its verdict, and gives the tab
 * itself to the rounds behind it.
 */
const REVIEW_TAB = 'review';

type LegalCaseShellProps = {
  legalCase: LegalCase;
  messages: Message[];
  currentUserId: string;
};

/**
 * Legal case detail layout: the in-page header + full-bleed conversation with
 * the client, with the "Case details" content (first draft / overview /
 * documents) docked in a right-side Sheet. The panel is a non-modal side rail
 * on desktop (pushing the content left) and a modal, dimmed sheet on mobile —
 * mirroring the client case shell.
 */
export function LegalCaseShell({
  legalCase,
  messages,
  currentUserId,
}: LegalCaseShellProps) {
  // The case's documents are lifted here so files sent in the chat also surface
  // in the Documents tab. A ref mirrors the state so the upload handler can
  // version against the latest list and return the created records synchronously.
  const [documents, setDocuments] = useState<Document[]>(() => {
    const byId = new Map(
      [...legalCase.documents, ...legalCase.draftDocuments].map((document) => [
        document.id,
        document,
      ]),
    );
    return [...byId.values()];
  });
  const documentsRef = useRef(documents);
  documentsRef.current = documents;
  // What ops approved and sent over, if the first draft has been handed off.
  const firstDraftHandoff = useFirstDraftHandoff(legalCase.id);
  // The approved versions are case files here too, filed under "From Moritz".
  const caseDocuments = useMemo(
    () => [...handoffDocuments(firstDraftHandoff), ...documents],
    [firstDraftHandoff, documents],
  );

  const handleUploadDocuments = useCallback(
    (fileNames: string[]): Document[] => {
      const created = createUploadedDocuments(
        documentsRef.current,
        fileNames,
        'legal',
      );
      setDocuments((prev) => [...prev, ...created]);
      return created;
    },
    [],
  );

  const handleUploadReviewedVersion = useCallback(
    (source: Document, file: File, reviewNote?: string): Document => {
      const created = createReviewedDocumentVersion(
        documentsRef.current,
        source,
        file,
        reviewNote,
      );
      setDocuments((current) => [...current, created]);
      return created;
    },
    [],
  );

  const handleDeliverDocument = useCallback((documentId: string) => {
    setDocuments((current) =>
      current.map((document) =>
        document.id === documentId
          ? {
              ...document,
              status: 'delivered',
              isDraft: false,
            }
          : document,
      ),
    );
  }, []);

  const handleApproveDocument = useCallback((documentId: string) => {
    setDocuments((current) =>
      current.map((document) =>
        document.id === documentId
          ? {
              ...document,
              status: 'final',
              isDraft: false,
            }
          : document,
      ),
    );
  }, []);

  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(false);
  const isMobile = useIsMobile();
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );

  const { flags } = useDesignFlags();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // A verdict is a thing people link each other to — "look at what QA said" —
  // so which round is open belongs in the URL rather than in component state.
  const hasReview = flags.useLawyerQa === true;
  const isReviewing = hasReview && searchParams.get('view') === REVIEW_TAB;
  const reviewWorkspace = useReviewWorkspace(legalCase);

  const setReviewing = useCallback(
    (next: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set('view', REVIEW_TAB);
      else params.delete('view');
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const [railTab, setRailTab] = useState(() =>
    isReviewing ? REVIEW_TAB : 'first-draft',
  );

  // Keep the tab honest when the view changes from outside the strip — the back
  // button, or the flag going away mid-session.
  useEffect(() => {
    setRailTab((tab) => {
      if (isReviewing) return REVIEW_TAB;
      return tab === REVIEW_TAB ? 'first-draft' : tab;
    });
  }, [isReviewing]);

  const handleRailTabChange = (value: string) => {
    setRailTab(value);
    setReviewing(value === REVIEW_TAB);
  };

  // A revised draft is picked up in the rail but submitted from the form in the
  // main column, so which document the next round starts from is held here.
  const [adoptedRevision, setAdoptedRevision] = useState<string | null>(null);

  const handleAdoptRevision = useCallback((fileName: string) => {
    setAdoptedRevision(fileName);
    toast.success('Revised draft attached', {
      description: 'Add any comments and submit, or swap in your own edit.',
    });
  }, []);

  // The panel is open by default so navigating into a case shows it already in
  // place (no slide, no content shift). On phones, close it on mount so the
  // modal sheet doesn't cover the chat. Enable slide/shift animations only
  // after the initial paint so the first render is instant, while later manual
  // toggles still animate.
  useEffect(() => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      setIsPanelOpen(false);
    }
    const id = requestAnimationFrame(() => setAnimationsEnabled(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'flex h-full flex-col transition-[padding-right] duration-300 ease-out',
          isPanelOpen ? 'md:pr-[456px]' : 'md:pr-0',
        )}
      >
        {/*
         * Submitting work comes with its own toolbar — what is being handed in
         * and where it stands — so the case header stands down rather than
         * stacking a second row of case-level controls above it.
         */}
        {!isReviewing && (
          <LegalCaseHeader
            legalCase={legalCase}
            isPanelOpen={isPanelOpen}
            onTogglePanel={() => setIsPanelOpen((value) => !value)}
          />
        )}
        <div
          // Keyed on the view so the step animation replays on every switch,
          // the same fade-and-rise the rail's own tabs arrive with.
          key={isReviewing ? 'review' : 'conversation'}
          className={cn(
            'mz-animate-step flex min-h-0 flex-1 flex-col',
            !isReviewing && '-mt-14',
          )}
        >
          {isReviewing ? (
            <LegalCaseReview
              legalCase={legalCase}
              workspace={reviewWorkspace}
              attachedFileName={adoptedRevision}
              isPanelOpen={isPanelOpen}
              onTogglePanel={() => setIsPanelOpen((value) => !value)}
            />
          ) : (
            <LegalCaseChat
              caseId={legalCase.id}
              messages={messages}
              currentUserId={currentUserId}
              onUploadDocuments={handleUploadDocuments}
            />
          )}
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
          'md:bottom-2 md:left-2 md:right-2 md:top-[calc(var(--header-height,3rem)+0.5rem)] md:rounded-xl',
        )}
      />

      <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen} modal={isMobile}>
        <SheetContent
          id="case-details-panel"
          side="right"
          showOverlay={isMobile}
          showCloseButton={false}
          container={portalContainer}
          className={cn(
            'sm:max-w-md',
            // Docked card treatment, matching the client's and admin's rails: a
            // hairline outline with the inner edge rounded so the panel reads as
            // a card running the full height. Borders (drawn inside the box)
            // rather than a ring, so the top/bottom edges aren't clipped; the
            // right edge hugs the frame and carries none.
            'md:border-foreground/10 md:inset-y-0 md:right-0 md:w-[440px] md:rounded-l-2xl md:border md:border-r-0',
            !animationsEnabled && '[--tw-animation-duration:0s]',
          )}
          onPointerDownOutside={(event) => {
            if (!isMobile) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (!isMobile) event.preventDefault();
          }}
        >
          <Tabs
            value={railTab}
            onValueChange={handleRailTabChange}
            className="flex h-full min-h-0 flex-col"
          >
            <SheetHeader>
              {/* The rail belongs to whatever is in it: the case's details most
                  of the time, the rounds of work while the submission is open. */}
              <SheetTitle data-font="serif" className="heading-4">
                {railTab === REVIEW_TAB ? 'Review history' : 'Case details'}
              </SheetTitle>
              <TabsList className="bg-background mt-1 max-w-full">
                {/* "Draft" rather than "First draft": ops may go back to the
                    drafting agent more than once on a case. */}
                <TabsTrigger value="first-draft">
                  <Bot className="h-4 w-4" />
                  Draft
                </TabsTrigger>
                {hasReview && (
                  <TabsTrigger value={REVIEW_TAB}>
                    <ClipboardCheck className="h-4 w-4" />
                    Submit work
                  </TabsTrigger>
                )}
                <TabsTrigger value="overview">
                  <Info className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="documents">
                  <File className="h-4 w-4" />
                  Documents
                </TabsTrigger>
              </TabsList>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              <TabsContent value="first-draft">
                {/*
                 * Once ops hands over, the approved versions are the tab's
                 * subject; the "not ready yet" placeholder would only
                 * contradict them.
                 */}
                {firstDraftHandoff ? (
                  <FirstDraftHandoffNotice handoff={firstDraftHandoff} />
                ) : null}
                <LegalAiFirstDraft
                  legalCase={legalCase}
                  documents={documents}
                  hideEmptyState={Boolean(firstDraftHandoff)}
                  onUploadReviewedVersion={handleUploadReviewedVersion}
                  onApproveDocument={handleApproveDocument}
                  onDeliverDocument={handleDeliverDocument}
                />
              </TabsContent>
              {hasReview && (
                <TabsContent value={REVIEW_TAB}>
                  <ReviewHistoryPanel
                    caseId={legalCase.id}
                    workspace={reviewWorkspace}
                    onAdoptRevision={handleAdoptRevision}
                  />
                </TabsContent>
              )}
              <TabsContent value="overview">
                <LegalCaseDetailsPanel legalCase={legalCase} />
              </TabsContent>
              <TabsContent value="documents">
                <CaseDocumentsTab
                  legalCase={legalCase}
                  documents={caseDocuments}
                />
              </TabsContent>
            </div>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  );
}
