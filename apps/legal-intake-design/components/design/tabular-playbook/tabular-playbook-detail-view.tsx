'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@repo/ui/lib/utils';

import { useRouter } from '@/i18n/navigation';
import {
  useNavigationInterceptor,
  useUnsavedChangesGuard,
} from '@/components/navigation/navigation-guard-context';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { PlaybookAssistantPanel } from '@/components/design/playbook-studio-admin/playbook-assistant-panel';
import {
  IDLE_GENERATION,
  demoGeneratedRules,
  type GenerationState,
} from '@/components/design/playbook-studio-admin/playbook-generation-data';

import TabularPlaybookHeader from './tabular-playbook-header';
import { PanelResizeHandle } from '@/components/design/panels/panel-resize-handle';
import { usePlaybookAutosave } from './utils/usePlaybookAutosave';
import { TabularPlaybook } from '@/components/design/tabular-playbook/tabular-playbook';
import {
  DEMO_TABULAR_PLAYBOOK_NAME,
  isNewTabularPlaybook,
  NEW_TABULAR_PLAYBOOK_NAME,
} from './tabular-playbook-data';
import type {
  Document as TabularPlaybookDocument,
  ReviewSummary,
} from './types';
import {
  GENERATED_CELL_REVEAL_GROUPS,
  mapGeneratedRuleToRow,
} from './utils/mapGeneratedRuleToRow';

const ASSISTANT_MIN_WIDTH = 360;
const ASSISTANT_DEFAULT_WIDTH = 440;

/**
 * Ceiling for the assistant panel, so dragging can never squeeze the grid out
 * of the workspace. Matches the tabular right drawer: 55% of the viewport,
 * capped at 1100px.
 */
function computeAssistantMaxWidth(): number {
  if (typeof window === 'undefined') return ASSISTANT_DEFAULT_WIDTH;
  return Math.max(
    ASSISTANT_MIN_WIDTH,
    Math.min(Math.floor(window.innerWidth * 0.55), 1100),
  );
}

/**
 * Imperative table API used by the generation stream. Mirrors the subset of
 * methods exposed via `useImperativeHandle` on `TabularPlaybook`.
 */
interface TabularPlaybookHandle {
  selectAllRows?: () => void;
  deselectAllRows?: () => void;
  deleteSelectedRows?: () => void;
  refreshCellData?: (selectedCells: string[]) => void;
  flagSelectedCells?: (selectedCells: string[]) => void;
  deselectAllCells?: () => void;
  getExportData?: () => { documents: any[]; columns: any[] } | undefined;
  prepareForGeneration?: () => void;
  appendGeneratingRow?: (row: { id: string; name: string }) => void;
  revealGeneratedCell?: (
    docId: string,
    columnKey: string,
    value: string,
  ) => void;
  finishGeneratedRow?: (docId: string) => void;
  approveSelectedRules?: () => void;
  startRuleReview?: () => void;
}

/**
 * The Tabular Playbook detail workspace.
 *
 * Ported from the source app's in-component router. Every demo playbook id
 * renders the same seeded table, as it did in the original; an id the fixtures
 * don't know is one the user just created, so it opens with the column headers
 * and no rules. Chat reuses the Playbook Studio assistant sheet, and generation
 * streams rules into the table the same way Studio streams cards.
 */
export function TabularPlaybookDetailView({
  tabularPlaybookId,
}: {
  tabularPlaybookId: string;
}) {
  const isNewPlaybook = isNewTabularPlaybook(tabularPlaybookId);
  const playbookName = isNewPlaybook
    ? NEW_TABULAR_PLAYBOOK_NAME
    : DEMO_TABULAR_PLAYBOOK_NAME;
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const tabularPlaybookRef = useRef<TabularPlaybookHandle | null>(null);
  const [textWrapping, setTextWrapping] = useState<boolean>(false);
  const [documents, setDocuments] = useState<TabularPlaybookDocument[]>([]);
  const [isAssistantOpen, setIsAssistantOpen] = useState(true);
  const [assistantWidth, setAssistantWidth] = useState(ASSISTANT_DEFAULT_WIDTH);
  const [assistantMaxWidth, setAssistantMaxWidth] = useState(
    ASSISTANT_DEFAULT_WIDTH,
  );
  const [isResizingAssistant, setIsResizingAssistant] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );
  const [animationsEnabled, setAnimationsEnabled] = useState(false);
  const [generation, setGeneration] =
    useState<GenerationState>(IDLE_GENERATION);
  const [review, setReview] = useState<ReviewSummary>({
    total: 0,
    draftIds: [],
  });
  const [draftsOnly, setDraftsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  /** Rules the grid is showing, which the filters narrow. */
  const [visibleRuleCount, setVisibleRuleCount] = useState(0);
  const generationRunRef = useRef(0);
  const isMobile = useIsMobile();
  const router = useRouter();
  const autosave = usePlaybookAutosave();

  // Match Playbook Studio: enable sheet enter/exit animation after first paint.
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimationsEnabled(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // The assistant's ceiling is viewport-relative, so it has to be measured on
  // the client and re-applied when the window changes size.
  useEffect(() => {
    const applyBounds = () => {
      const max = computeAssistantMaxWidth();
      setAssistantMaxWidth(max);
      setAssistantWidth((current) => Math.min(current, max));
    };
    applyBounds();
    window.addEventListener('resize', applyBounds);
    return () => window.removeEventListener('resize', applyBounds);
  }, []);

  useEffect(() => () => void (generationRunRef.current += 1), []);

  /**
   * Simulates the assistant reading the uploaded document and building the
   * playbook into the table: clears rows, then appends each demo rule with
   * skeleton cells that fill progressively — same phases as Playbook Studio.
   */
  const runGeneration = useCallback((documentName: string | undefined) => {
    const runId = (generationRunRef.current += 1);
    const cancelled = () => generationRunRef.current !== runId;
    const delay = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));
    const table = () => tabularPlaybookRef.current;
    const total = demoGeneratedRules.length;

    void (async () => {
      table()?.prepareForGeneration?.();
      setGeneration({
        phase: 'reading',
        documentName,
        totalRules: total,
        builtRules: 0,
      });
      await delay(1300);
      if (cancelled()) return;

      setGeneration((prev) => ({ ...prev, phase: 'extracting' }));
      await delay(1100);
      if (cancelled()) return;

      setGeneration((prev) => ({ ...prev, phase: 'building' }));

      for (let index = 0; index < total; index += 1) {
        if (cancelled()) return;
        const template = demoGeneratedRules[index]!;
        const id = `rule-gen-${Date.now()}-${index}`;
        const cells = mapGeneratedRuleToRow(template, index);

        setGeneration((prev) => ({
          ...prev,
          builtRules: index,
          currentRuleTitle: template.title,
        }));

        table()?.appendGeneratingRow?.({ id, name: template.title });
        await delay(450);
        if (cancelled()) return;

        for (const group of GENERATED_CELL_REVEAL_GROUPS) {
          if (cancelled()) return;
          for (const columnKey of group) {
            table()?.revealGeneratedCell?.(
              id,
              columnKey,
              cells[columnKey] ?? '',
            );
          }
          await delay(group.length === 1 ? 380 : 280);
        }

        table()?.finishGeneratedRow?.(id);
        setGeneration((prev) => ({ ...prev, builtRules: index + 1 }));
        await delay(220);
      }

      if (cancelled()) return;
      setGeneration((prev) => ({
        ...prev,
        phase: 'done',
        currentRuleTitle: undefined,
      }));
    })();
  }, []);

  const cancelGeneration = useCallback(() => {
    generationRunRef.current += 1;
    setGeneration((prev) => {
      if (prev.phase === 'idle' || prev.phase === 'done') return prev;
      return prev.builtRules > 0
        ? { ...prev, phase: 'done', currentRuleTitle: undefined }
        : IDLE_GENERATION;
    });
  }, []);

  const handleSelectAll = useCallback((): void => {
    tabularPlaybookRef.current?.selectAllRows?.();
  }, []);

  const handleDeselectAll = useCallback((): void => {
    tabularPlaybookRef.current?.deselectAllRows?.();
  }, []);

  const handleDeleteSelected = useCallback((): void => {
    tabularPlaybookRef.current?.deleteSelectedRows?.();
  }, []);

  /*
   * Shared by the grid (publishing what the user picked) and the header (asking
   * for the selection to be dropped after a bulk action), so a clear coming
   * from the header has to be pushed back into the grid or the two views of the
   * selection drift apart.
   */
  const handleSelectedCellsChange = useCallback(
    (newSelectedCells: Set<string>): void => {
      setSelectedCells(newSelectedCells);
      if (newSelectedCells.size === 0) {
        tabularPlaybookRef.current?.deselectAllCells?.();
      }
    },
    [],
  );

  const handleRefreshCellData = useCallback((selectedCells: string[]): void => {
    tabularPlaybookRef.current?.refreshCellData?.(selectedCells);
  }, []);

  const handleFlagSelectedCells = useCallback(
    (selectedCells: string[]): void => {
      tabularPlaybookRef.current?.flagSelectedCells?.(selectedCells);
    },
    [],
  );

  const handleSelectedRowsChange = useCallback((newRows: Set<string>) => {
    setSelectedRows(newRows);
  }, []);

  const handleDocumentsUpdate = useCallback((newDocs: unknown) => {
    setDocuments(newDocs as TabularPlaybookDocument[]);
  }, []);

  const handleApproveSelectedRules = useCallback(() => {
    tabularPlaybookRef.current?.approveSelectedRules?.();
  }, []);

  const handleStartRuleReview = useCallback(() => {
    tabularPlaybookRef.current?.startRuleReview?.();
  }, []);

  const draftCount = review.draftIds.length;
  const selectedDraftCount = review.draftIds.filter((docId) =>
    selectedRows.has(docId),
  ).length;

  /*
   * The filter is only ever entered from the draft count, so an emptied queue
   * has to release it — otherwise approving the last rule leaves the grid
   * looking empty with no visible reason why.
   */
  useEffect(() => {
    if (draftsOnly && draftCount === 0) setDraftsOnly(false);
  }, [draftsOnly, draftCount]);

  const handleToggleAssistant = useCallback(() => {
    setIsAssistantOpen((open) => !open);
  }, []);

  /*
   * Edits autosave a beat after the user stops making them, so the only risk is
   * the short window where one hasn't landed yet. Leaving the app entirely
   * (tab close, refresh) is worth the browser's prompt; leaving for another
   * page in the app isn't — the save is flushed and the navigation continues,
   * which is what an autosaving editor is expected to do.
   */
  useUnsavedChangesGuard(autosave.isSavePending);
  useNavigationInterceptor((href) => {
    if (!autosave.isSavePending) return false;
    autosave.flush();
    router.push(href);
    return true;
  });

  return (
    /*
     * The assistant's width is published as a variable rather than a literal so
     * the panel and the grid's inset can't drift apart: the panel is exactly
     * that wide, and the grid clears it plus the workspace card's 8px gutter on
     * either side. The variable also reaches the sheet through the portal, which
     * renders inside this subtree. Both are `md:`-only, so the mobile sheet keeps
     * its own overlay width and the grid keeps its full bleed.
     */
    <div
      style={
        { '--tp-assistant-width': `${assistantWidth}px` } as React.CSSProperties
      }
      className={cn(
        'app-container flex h-full min-h-0 flex-col gap-1',
        // Sliding the padding looks right when the panel opens, but lags the
        // cursor while dragging.
        !isResizingAssistant && 'transition-[padding] duration-300',
        isAssistantOpen
          ? 'md:pl-[calc(var(--tp-assistant-width)+1rem)]'
          : 'md:pl-0',
      )}
    >
      <TabularPlaybookHeader
        selectedRows={selectedRows}
        selectedCells={selectedCells}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onDeleteSelected={handleDeleteSelected}
        onSelectedCellsChange={handleSelectedCellsChange}
        onRefreshCellData={handleRefreshCellData}
        onFlagSelectedCells={handleFlagSelectedCells}
        documentCount={documents.length}
        textWrapping={textWrapping}
        onTextWrappingChange={setTextWrapping}
        onToggleAssistant={handleToggleAssistant}
        isAssistantOpen={isAssistantOpen}
        getExportData={() => tabularPlaybookRef.current?.getExportData?.()}
        playbookName={playbookName}
        playbookDescription={isNewPlaybook ? '' : undefined}
        playbookClient={isNewPlaybook ? '' : undefined}
        playbookId={tabularPlaybookId}
        saveStatus={autosave.status}
        lastSavedAt={autosave.lastSavedAt}
        playbookLastSaved={isNewPlaybook ? '' : undefined}
        visibleCount={visibleRuleCount}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        draftCount={draftCount}
        draftsOnly={draftsOnly}
        onDraftsOnlyChange={setDraftsOnly}
        onStartRuleReview={handleStartRuleReview}
        onApproveSelectedRules={handleApproveSelectedRules}
        selectedDraftCount={selectedDraftCount}
      />
      <div className="min-h-0 w-full flex-1 p-2">
        <div className="border-dt-line-tertiary bg-dt-bg-primary text-dt-fg-primary relative h-full overflow-hidden rounded border">
          <div className="h-full">
            <TabularPlaybook
              ref={tabularPlaybookRef}
              onSelectedRowsChange={handleSelectedRowsChange}
              onSelectedCellsChange={handleSelectedCellsChange}
              textWrapping={textWrapping}
              onDocumentsUpdate={handleDocumentsUpdate}
              onContentChange={autosave.markChanged}
              startEmpty={isNewPlaybook}
              draftsOnly={draftsOnly}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery('')}
              onVisibleCountChange={setVisibleRuleCount}
              onReviewSummaryChange={setReview}
            />
          </div>
        </div>
      </div>

      {/* Playbook assistant — same sheet chrome as Playbook Studio. */}
      <div
        ref={setPortalContainer}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-40 overflow-hidden [transform:translateZ(0)] md:bottom-2 md:left-2 md:right-2 md:top-[calc(var(--header-height,3rem)+0.5rem)] md:rounded-b-xl"
      />

      <Sheet
        open={isAssistantOpen}
        onOpenChange={setIsAssistantOpen}
        modal={isMobile}
      >
        <SheetContent
          id="case-details-panel"
          side="left"
          showOverlay={isMobile}
          showCloseButton={false}
          container={portalContainer}
          aria-describedby={undefined}
          className={cn(
            'gap-0 p-0 sm:max-w-md',
            // `md:max-w-none` releases the `sm:max-w-md` cap so the panel can be
            // dragged past 448px.
            'md:border-foreground/10 md:inset-y-0 md:left-0 md:w-[var(--tp-assistant-width)] md:max-w-none md:overflow-hidden md:rounded-r-2xl md:border md:border-l-0',
            !animationsEnabled && '[--tw-animation-duration:0s]',
            // The sheet transitions every property, width included, which would
            // trail the pointer through a drag.
            isResizingAssistant && 'transition-none',
          )}
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
          <SheetTitle className="sr-only">Playbook agent</SheetTitle>
          <PlaybookAssistantPanel
            playbookName={playbookName}
            generation={generation}
            onGeneratePlaybook={runGeneration}
            onCancelGeneration={cancelGeneration}
          />
          {/* Mobile opens the sheet over the grid, where there is nothing to
              trade width against. */}
          {!isMobile && (
            <PanelResizeHandle
              label="Resize agent panel"
              width={assistantWidth}
              minWidth={ASSISTANT_MIN_WIDTH}
              maxWidth={assistantMaxWidth}
              onResize={setAssistantWidth}
              onResizeStart={() => setIsResizingAssistant(true)}
              onResizeEnd={() => setIsResizingAssistant(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
