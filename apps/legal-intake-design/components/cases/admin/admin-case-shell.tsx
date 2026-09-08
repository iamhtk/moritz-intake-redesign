'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { File, FileDiff, Info, Scale, User } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
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
import { MotionConfig } from 'motion/react';

import { useIsMobile } from '@/hooks/use-mobile';
import { PanelResizeHandle } from '@/components/design/panels/panel-resize-handle';
import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import { usePlayground } from '@/components/playground/role-context';
import { AdminCaseHeader } from '@/components/cases/admin/admin-case-header';
import { AdminCaseChat } from '@/components/cases/admin/admin-case-chat';
import { AdminCaseFirstDraft } from '@/components/cases/admin/admin-case-first-draft';
import { DraftAgentPanel } from '@/components/cases/admin/first-draft/draft-agent-panel';
import { useFirstDraftWorkspace } from '@/components/cases/admin/first-draft/use-first-draft-workspace';
import { handoffDocuments } from '@/components/cases/admin/first-draft/handoff-documents';
import { AdminForClientPanel } from '@/components/cases/admin/admin-for-client-panel';
import { AdminForLawyerPanel } from '@/components/cases/admin/admin-for-lawyer-panel';
import { AdminCaseOverviewPanel } from '@/components/cases/admin/admin-case-overview-panel';
import { CaseDocumentsTab } from '@/components/cases/case-documents-tab';
import type { LegalCase, Message } from '@/lib/types';

type AdminCaseShellProps = {
  legalCase: LegalCase;
  messages: Message[];
  currentUserId: string;
};

/**
 * The rail tab that opens the drafting workspace: picking it takes the case's
 * main column to the document and gives the tab itself to the agent.
 */
const FIRST_DRAFT_TAB = 'first-draft';

const RAIL_MIN_WIDTH = 360;
const RAIL_DEFAULT_WIDTH = 440;

/**
 * Ceiling for the rail, so dragging can never squeeze the conversation or the
 * document out of the case. Matches the playbook agent: 55% of the viewport,
 * capped at 1100px.
 */
function computeRailMaxWidth(): number {
  if (typeof window === 'undefined') return RAIL_DEFAULT_WIDTH;
  return Math.max(
    RAIL_MIN_WIDTH,
    Math.min(Math.round(window.innerWidth * 0.55), 1100),
  );
}

/** Softens whichever end of the tab strip still has tabs behind it. */
const STRIP_FADE = {
  none: '',
  start: '[mask-image:linear-gradient(to_right,transparent,black_24px)]',
  end: '[mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)]',
  both: '[mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)]',
};

/**
 * Admin case detail layout: the in-page header + full-bleed conversation between
 * the client and counsel, with the admin "Case details" controls (overview /
 * for client / for lawyer) docked in a right-side Sheet. The panel is a
 * non-modal side rail on desktop (pushing the content left) and a modal, dimmed
 * sheet on mobile — mirroring the legal and client case shells.
 */
export function AdminCaseShell({
  legalCase,
  messages,
  currentUserId,
}: AdminCaseShellProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(false);
  const isMobile = useIsMobile();
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );

  // How much of the case the rail takes. The draft in particular is a trade
  // between the document and the agent, so the split is the reader's to make.
  const [railWidth, setRailWidth] = useState(RAIL_DEFAULT_WIDTH);
  const [railMaxWidth, setRailMaxWidth] = useState(RAIL_DEFAULT_WIDTH);
  const [isResizingRail, setIsResizingRail] = useState(false);

  useEffect(() => {
    const applyBounds = () => {
      const max = computeRailMaxWidth();
      setRailMaxWidth(max);
      setRailWidth((current) => Math.min(current, max));
    };
    applyBounds();
    window.addEventListener('resize', applyBounds);
    return () => window.removeEventListener('resize', applyBounds);
  }, []);

  const { flags } = useDesignFlags();
  const { role } = usePlayground();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The draft is a view of the case, so it belongs in the URL: a link to a
  // clause someone is arguing about opens on the document, not the thread.
  // Drafting is internal ops work, so only internal roles are offered it — a
  // client or a lawyer looking at this case never sees the tab.
  const hasFirstDraft =
    flags.useFirstDraftsAdmin === true &&
    (role === 'INTERNAL_ADMIN' || role === 'INTERNAL_ASSISTANT');
  const isDrafting =
    hasFirstDraft && searchParams.get('view') === 'first-draft';

  /**
   * v0.1 ships the drafting conversation on its own, before there is anything
   * to render a document with. The tab still opens the agent in the rail, but
   * the case keeps its own thread in the main column — so the whole feature is
   * the chat, and nothing on screen promises a document ops cannot open yet.
   */
  const chatOnly = flags.useFirstDraftV0 === true;
  const showsDocument = isDrafting && !chatOnly;

  const workspace = useFirstDraftWorkspace(
    legalCase,
    chatOnly ? 'chat' : 'workspace',
  );

  const setDrafting = useCallback(
    (next: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set('view', 'first-draft');
      else params.delete('view');
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  // The rail's tabs are the case's sections, and the draft is one of them: the
  // tab both opens the document in the main column and hands the rail to the
  // agent, so there is one place to switch between the thread and the draft.
  const [railTab, setRailTab] = useState(() =>
    isDrafting ? FIRST_DRAFT_TAB : 'overview',
  );

  // Keep the tab honest when the view changes from outside the strip — the back
  // button, or the flag going away mid-session.
  useEffect(() => {
    setRailTab((tab) => {
      if (isDrafting) return FIRST_DRAFT_TAB;
      return tab === FIRST_DRAFT_TAB ? 'overview' : tab;
    });
  }, [isDrafting]);

  const handleRailTabChange = (value: string) => {
    setRailTab(value);
    setDrafting(value === FIRST_DRAFT_TAB);
  };

  // An approved draft is a case file, so it joins the Documents tab.
  const caseDocuments = useMemo(
    () => [...handoffDocuments(workspace.handoff), ...legalCase.documents],
    [workspace.handoff, legalCase.documents],
  );

  // The strip is wider than the rail, so bring the open tab into view — both
  // when it is picked from the far end and when the case opens on the draft.
  const tabStripRef = useRef<HTMLDivElement>(null);

  // Which way there are more tabs, so the strip can fade on that side rather
  // than cutting a label off mid-word.
  const [stripOverflow, setStripOverflow] = useState({
    start: false,
    end: false,
  });
  const syncStripOverflow = useCallback(() => {
    const strip = tabStripRef.current;
    if (!strip) return;
    const slack = 4;
    setStripOverflow({
      start: strip.scrollLeft > slack,
      end: strip.scrollLeft + strip.clientWidth < strip.scrollWidth - slack,
    });
  }, []);

  useEffect(() => {
    syncStripOverflow();
    window.addEventListener('resize', syncStripOverflow);
    return () => window.removeEventListener('resize', syncStripOverflow);
  }, [syncStripOverflow, hasFirstDraft]);

  useEffect(() => {
    const strip = tabStripRef.current;
    const active = strip?.querySelector<HTMLElement>('[data-state="active"]');
    if (!strip || !active) return;
    const stripEdges = strip.getBoundingClientRect();
    const tabEdges = active.getBoundingClientRect();
    const gutter = 12;
    if (tabEdges.left < stripEdges.left) {
      strip.scrollBy({
        left: tabEdges.left - stripEdges.left - gutter,
        behavior: 'smooth',
      });
    } else if (tabEdges.right > stripEdges.right) {
      strip.scrollBy({
        left: tabEdges.right - stripEdges.right + gutter,
        behavior: 'smooth',
      });
    }
  }, [railTab]);

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
    /*
     * The rail's width is published as a variable so the content's padding and
     * the panel itself stay in step, including through the portal the sheet
     * renders into — it lives in this subtree.
     */
    <div
      className={cn(
        'flex h-full flex-col',
        // The document wants the whole frame; the conversation keeps the
        // dashboard's reading column.
        showsDocument && 'case-workspace-wide',
      )}
      style={{ '--case-rail-width': `${railWidth}px` } as CSSProperties}
    >
      <div
        className={cn(
          'flex h-full flex-col',
          // Sliding the padding looks right when the panel opens, but lags the
          // cursor while dragging.
          !isResizingRail && 'transition-[padding-right] duration-300 ease-out',
          isPanelOpen ? 'md:pr-[calc(var(--case-rail-width)+1rem)]' : 'md:pr-0',
        )}
      >
        {/*
         * The draft comes with its own toolbar — the document, its versions and
         * the approval — so the case header stands down rather than stacking a
         * second row of case-level controls above it.
         */}
        {!showsDocument && (
          <AdminCaseHeader
            legalCase={legalCase}
            isPanelOpen={isPanelOpen}
            onTogglePanel={() => setIsPanelOpen((value) => !value)}
          />
        )}
        {/*
         * The conversation scrolls up under the blurred header, so it is pulled
         * beneath it.
         */}
        <div
          // Keyed on the view so the step animation replays on every switch,
          // the same fade-and-rise the rail's own tabs arrive with.
          key={showsDocument ? 'first-draft' : 'conversation'}
          className={cn(
            'mz-animate-step flex min-h-0 flex-1 flex-col',
            !showsDocument && '-mt-14',
          )}
        >
          {showsDocument ? (
            <AdminCaseFirstDraft
              legalCase={legalCase}
              workspace={workspace}
              isPanelOpen={isPanelOpen}
              onTogglePanel={() => setIsPanelOpen((value) => !value)}
            />
          ) : (
            <AdminCaseChat
              caseId={legalCase.id}
              messages={messages}
              currentUserId={currentUserId}
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
            // Docked card treatment, matching the client's rail: a hairline
            // outline with the inner edge rounded so the panel reads as a card
            // running the full height. Borders (drawn inside the box) rather
            // than a ring, so the top/bottom edges aren't clipped; the right
            // edge hugs the frame and carries none. `md:max-w-none` releases
            // the `sm:max-w-md` cap so the rail can be dragged past 448px.
            'md:border-foreground/10 md:inset-y-0 md:right-0 md:w-[var(--case-rail-width)] md:max-w-none md:rounded-l-2xl md:border md:border-r-0',
            !animationsEnabled && '[--tw-animation-duration:0s]',
            // The sheet transitions every property, width included, which would
            // trail the pointer through a drag.
            isResizingRail && 'transition-none',
          )}
          onPointerDownOutside={(event) => {
            if (!isMobile) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (!isMobile) event.preventDefault();
          }}
        >
          {/*
           * The tab strip's underline is a layout animation, so a drag would
           * have it chasing the tabs a frame behind. While the rail is being
           * sized it moves with them instead.
           */}
          <MotionConfig
            transition={isResizingRail ? { duration: 0 } : undefined}
          >
            <Tabs
              value={railTab}
              onValueChange={handleRailTabChange}
              className="flex h-full min-h-0 flex-col"
            >
              <SheetHeader>
                {/* The rail belongs to whatever is in it: the case's details
                    most of the time, the drafting conversation while the draft
                    is open. */}
                <SheetTitle data-font="serif" className="heading-4">
                  {railTab === FIRST_DRAFT_TAB
                    ? 'Drafting agent'
                    : 'Case details'}
                </SheetTitle>
                {/*
                 * Five named tabs are wider than the rail, so the strip scrolls
                 * sideways (the bottom padding keeps the active underline inside
                 * the scroll box, and the matching negative margin gives the
                 * space back to the panel).
                 */}
                <TabsList
                  ref={tabStripRef}
                  onScroll={syncStripOverflow}
                  className={cn(
                    'bg-background -mb-3 mt-1 max-w-full overflow-x-auto pb-3',
                    '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                    STRIP_FADE[
                      stripOverflow.start
                        ? stripOverflow.end
                          ? 'both'
                          : 'start'
                        : stripOverflow.end
                          ? 'end'
                          : 'none'
                    ],
                  )}
                >
                  <TabsTrigger value="overview">
                    <Info className="h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  {hasFirstDraft && (
                    <TabsTrigger value={FIRST_DRAFT_TAB}>
                      <FileDiff className="h-4 w-4" />
                      First draft
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="documents">
                    <File className="h-4 w-4" />
                    Documents
                  </TabsTrigger>
                  <TabsTrigger value="client">
                    <User className="h-4 w-4" />
                    For client
                  </TabsTrigger>
                  <TabsTrigger value="lawyer">
                    <Scale className="h-4 w-4" />
                    For lawyer
                  </TabsTrigger>
                </TabsList>
              </SheetHeader>
              {/*
               * The agent is a chat: it manages its own scrolling and pins a
               * composer to the bottom, so it gets the panel's full height rather
               * than the padded, scrolling body the detail tabs sit in.
               */}
              {isDrafting && railTab === FIRST_DRAFT_TAB ? (
                <TabsContent
                  value={FIRST_DRAFT_TAB}
                  className="min-h-0 flex-1 overflow-hidden"
                >
                  <DraftAgentPanel
                    workspace={workspace}
                    playbookName={`${legalCase.client.name} playbook`}
                    ownsDocuments={chatOnly}
                  />
                </TabsContent>
              ) : (
                <div className="flex-1 overflow-y-auto px-4 pb-6">
                  <TabsContent value="overview">
                    <AdminCaseOverviewPanel legalCase={legalCase} />
                  </TabsContent>
                  <TabsContent value="documents">
                    <CaseDocumentsTab
                      legalCase={legalCase}
                      documents={caseDocuments}
                    />
                  </TabsContent>
                  <TabsContent value="client">
                    <AdminForClientPanel legalCase={legalCase} />
                  </TabsContent>
                  <TabsContent value="lawyer">
                    <AdminForLawyerPanel legalCase={legalCase} />
                  </TabsContent>
                </div>
              )}
            </Tabs>
          </MotionConfig>

          {/* On phones the sheet covers the case, so there is nothing to trade
              width against. */}
          {!isMobile && (
            <PanelResizeHandle
              edge="leading"
              label="Resize case details"
              width={railWidth}
              minWidth={RAIL_MIN_WIDTH}
              maxWidth={railMaxWidth}
              onResize={setRailWidth}
              onResizeStart={() => setIsResizingRail(true)}
              onResizeEnd={() => setIsResizingRail(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
