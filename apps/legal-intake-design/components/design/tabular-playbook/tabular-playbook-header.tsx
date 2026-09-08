'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactElement,
} from 'react';
import { toast } from 'sonner';
import { cn } from '@repo/ui/lib/utils';
import { useRouter } from '@/i18n/navigation';
import {
  Archive,
  ArchiveRestore,
  Share2,
  Download,
  Check,
  X,
  Edit3,
  Trash2,
  ChevronDown,
  MoreHorizontal,
  Flag,
  CheckCircle,
  Columns,
  RefreshCw,
  PanelLeft,
  AlignJustify,
  ArrowRightToLine,
  Search,
} from '@repo/ui/icons';
import { Button } from '@/components/design/foundations/components/button';
import { Input } from '@/components/design/foundations/components/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/design/foundations/components/input-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui/components/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/design/foundations/components/dropdown-menu';
import {
  Badge,
  BadgeButton,
} from '@/components/design/foundations/components/badge';
import { DeleteConfirmationModal } from '@/components/design/tabular-playbook/components/DeleteConfirmationModal';
import { SaveStatusIndicator } from '@/components/design/tabular-playbook/components/SaveStatusIndicator';
import {
  setPlaybookArchived,
  useIsPlaybookArchived,
} from '@/components/design/tabular-playbook/tabular-playbook-archive';
import type { PlaybookSaveStatus } from '@/components/design/tabular-playbook/utils/usePlaybookAutosave';
import {
  DEMO_TABULAR_PLAYBOOK_NAME,
  TABULAR_PLAYBOOK_CLIENTS,
  UNASSIGNED_CLIENT,
} from './tabular-playbook-data';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/design/foundations/components/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/design/foundations/components/select';
import { Textarea } from '@/components/design/foundations/components/textarea';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/design/foundations/components/toggle-group';
import { Field, FieldLabel } from '@repo/ui/components/field';
import { ShareCaseDialog } from '@/components/cases/share-case-dialog';

/**
 * The two halves of the header's view control, drawn as a thumb riding a track.
 * The foundation Toggle paints its pressed state with the primary fill, which
 * beside the search box makes a black square the loudest thing in the toolbar —
 * too much weight for a line height preference. Sunk into a track instead, the
 * selected half is the raised one, which is quiet enough to sit next to the
 * playbook's actions without competing with them.
 *
 * The raised surface is the sliding thumb behind these, so the halves
 * themselves stay transparent and only their text colour marks the selection.
 */
const VIEW_TOGGLE_ITEM =
  'text-muted-foreground hover:text-foreground data-[state=on]:bg-transparent data-[state=on]:text-foreground relative z-10 size-7 rounded-full';

/**
 * Wraps a header action trigger in a tooltip only when `enabled` (i.e. the
 * button has collapsed to icon-only below the header's `@md` container width).
 * When the label is visible the tooltip would just repeat it, so the child
 * renders unwrapped. Mirrors the case header's `MaybeTooltip`.
 */
function HeaderActionTooltip({
  enabled,
  label,
  children,
}: {
  enabled: boolean;
  label: string;
  children: ReactElement;
}) {
  if (!enabled) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

interface Project {
  id: number;
  name: string;
  description: string;
  /** Client the playbook runs for. Empty when none is assigned. */
  client: string;
  documentCount: number;
  lastModified: string;
  team: string[];
}

interface TabularPlaybookHeaderProps {
  selectedRows?: Set<string>;
  selectedCells?: Set<string>;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onDeleteSelected?: () => void;
  onSelectedCellsChange?: (cells: Set<string>) => void;
  onRefreshCellData?: (cells: string[]) => void;
  onFlagSelectedCells?: (cells: string[]) => void;
  documentCount?: number;
  /** Rules left after the filters, which the count reports against the total. */
  visibleCount?: number;
  /** Narrows the grid to rules containing this text. */
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  textWrapping?: boolean;
  onTextWrappingChange?: (wrapping: boolean) => void;
  onToggleAssistant?: () => void;
  isAssistantOpen?: boolean;
  getExportData?: () => { documents: any[]; columns: any[] } | undefined;
  /** Title shown in the header. Defaults to the seeded demo playbook. */
  playbookName?: string;
  /** Blank for a playbook the user just created, which has no summary yet. */
  playbookDescription?: string;
  /** Blank for a playbook the user just created, which has no client yet. */
  playbookClient?: string;
  /** Used to build the share link. */
  playbookId?: string;
  /** Autosave state, shown next to the rule count. */
  saveStatus?: PlaybookSaveStatus;
  lastSavedAt?: Date | null;
  /** Blank for a playbook the user just created, which has never been saved. */
  playbookLastSaved?: string;
  /** Rules the agent has written or rewritten that nobody has approved yet. */
  draftCount?: number;
  /** Whether the grid is currently narrowed to those drafts. */
  draftsOnly?: boolean;
  onDraftsOnlyChange?: (draftsOnly: boolean) => void;
  /** Opens the review stepper on the first draft. */
  onStartRuleReview?: () => void;
  /** Signs off every draft among the selected rows. */
  onApproveSelectedRules?: () => void;
  /** How many of the selected rows are drafts, so the action can hide itself. */
  selectedDraftCount?: number;
}

// Mock project data - should match the third project from ProjectHistoryView
const defaultProject: Project = {
  id: 3,
  name: DEMO_TABULAR_PLAYBOOK_NAME,
  description:
    'Provider-side negotiation positions, fallbacks, and walk-away triggers for Pylon commercial contracts',
  client: 'Pylon Technologies',
  documentCount: 0,
  lastModified: '3 days ago',
  team: ['Robert Johnson', 'Amanda Foster', 'Carlos Mendez'],
};

export default function TabularPlaybookHeader({
  selectedRows = new Set(),
  selectedCells = new Set(),
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onSelectedCellsChange,
  onRefreshCellData,
  onFlagSelectedCells,
  documentCount = 0,
  visibleCount,
  searchQuery = '',
  onSearchQueryChange,
  textWrapping = false,
  onTextWrappingChange,
  onToggleAssistant,
  isAssistantOpen = false,
  getExportData: _getExportData,
  playbookName,
  playbookDescription,
  playbookClient,
  playbookId,
  saveStatus = 'idle',
  lastSavedAt = null,
  playbookLastSaved,
  draftCount = 0,
  draftsOnly = false,
  onDraftsOnlyChange,
  onStartRuleReview,
  onApproveSelectedRules,
  selectedDraftCount = 0,
}: TabularPlaybookHeaderProps) {
  const [currentProject, setCurrentProject] = useState<Project>(() => ({
    ...defaultProject,
    name: playbookName ?? defaultProject.name,
    description: playbookDescription ?? defaultProject.description,
    client: playbookClient ?? defaultProject.client,
    lastModified: playbookLastSaved ?? defaultProject.lastModified,
  }));
  const router = useRouter();
  const isArchived = useIsPlaybookArchived(playbookId);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] =
    useState<boolean>(false);
  const [editProjectName, setEditProjectName] = useState<string>('');
  const [editProjectDescription, setEditProjectDescription] =
    useState<string>('');
  const [editProjectClient, setEditProjectClient] = useState<string>('');
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] =
    useState<boolean>(false);

  // Header action labels collapse to icon-only below the header's `@md`
  // container width; tooltips are only useful in that collapsed state. A hidden
  // sentinel mirrors the same breakpoint so a portaled tooltip can track the
  // real state (it can't read the `@container` itself).
  const headerActionsRef = useRef<HTMLDivElement>(null);
  const headerSentinelRef = useRef<HTMLSpanElement>(null);
  const [headerActionsIconOnly, setHeaderActionsIconOnly] = useState(false);
  useEffect(() => {
    const el = headerActionsRef.current;
    const sentinel = headerSentinelRef.current;
    if (!el || !sentinel) return;
    const check = () => {
      setHeaderActionsIconOnly(
        window.getComputedStyle(sentinel).display === 'none',
      );
    };
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleEditProjectClick = useCallback(() => {
    setEditProjectName(currentProject.name);
    setEditProjectDescription(currentProject.description);
    setEditProjectClient(currentProject.client);
    setIsEditProjectModalOpen(true);
  }, [currentProject.name, currentProject.description, currentProject.client]);

  const handleCancelEdit = () => {
    setEditProjectName('');
    setEditProjectDescription('');
    setEditProjectClient('');
    setIsEditProjectModalOpen(false);
  };

  const handleSaveProject = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editProjectName.trim()) return;

    setCurrentProject((prev) => ({
      ...prev,
      name: editProjectName,
      description: editProjectDescription,
      client: editProjectClient,
    }));
    handleCancelEdit();
  };

  /*
   * Archiving from inside the playbook closes the workspace: the playbook is no
   * longer one of the ones being worked on, so it goes back to the index, where
   * the Archived tab is. As on the index there is no confirmation — the toast
   * carries the way back.
   */
  const handleArchivePlaybook = useCallback(() => {
    if (!playbookId) return;
    setPlaybookArchived(playbookId, true);
    toast(`"${currentProject.name}" archived`, {
      action: {
        label: 'Undo',
        onClick: () => setPlaybookArchived(playbookId, false),
      },
    });
    router.push('/admin/tabular-playbook');
  }, [currentProject.name, playbookId, router]);

  const handleUnarchivePlaybook = useCallback(() => {
    if (!playbookId) return;
    setPlaybookArchived(playbookId, false);
    toast(`"${currentProject.name}" restored`);
  }, [currentProject.name, playbookId]);

  const handleExportClick = () => {
    // TODO: Wire up export. The options dialog has been removed; the grid still
    // exposes the rows and columns through `getExportData` on its ref.

    /*
     * Drafts don't block the export — a negotiation doesn't wait for a review
     * queue — but they go out with it, so the export says so and offers the way
     * to clear them.
     */
    if (draftCount > 0) {
      toast(`Exported with ${draftCountLabel}`, {
        description:
          'Draft rules are included as the agent wrote them, without a lawyer’s approval.',
        action: onStartRuleReview
          ? { label: 'Review', onClick: onStartRuleReview }
          : undefined,
      });
    }
  };

  const handleShareClick = () => {
    setIsShareModalOpen(true);
  };

  // Cell bulk action handlers
  const onSelectedCellsChangeRef = useRef(onSelectedCellsChange);
  useEffect(() => {
    onSelectedCellsChangeRef.current = onSelectedCellsChange;
  }, [onSelectedCellsChange]);

  const handleCellDeSelectAll = useCallback(() => {
    if (onSelectedCellsChangeRef.current) {
      onSelectedCellsChangeRef.current(new Set());
    }
  }, []);

  const handleCellRefreshData = () => {
    if (onRefreshCellData) {
      onRefreshCellData(Array.from(selectedCells));
    }
    handleCellDeSelectAll();
  };

  const handleCellVerifySelected = () => {
    // TODO: Implement cell verification functionality
    console.log('Verifying selected cells:', Array.from(selectedCells));
    handleCellDeSelectAll();
  };

  const handleCellFlagSelected = () => {
    if (onFlagSelectedCells) {
      onFlagSelectedCells(Array.from(selectedCells));
    }
    handleCellDeSelectAll();
  };

  const handleCellSelectColumns = () => {
    // TODO: Implement column selection functionality
    console.log('Selecting columns for:', Array.from(selectedCells));
    handleCellDeSelectAll();
  };

  const handleBulkDeleteClick = () => {
    setIsBulkDeleteModalOpen(true);
  };

  const handleBulkDeleteConfirm = () => {
    onDeleteSelected?.();
    setIsBulkDeleteModalOpen(false);
  };

  const handleSelectAllClick = () => {
    onSelectAll?.();
  };

  const handleDeselectAllClick = () => {
    onDeselectAll?.();
  };

  const handleRefreshDocumentData = () => {
    // Trigger refresh for selected documents
    // Refresh document data for selected rows
    // TODO: Implement actual refresh logic
    // This would typically involve re-fetching or re-analyzing the selected documents
  };

  /*
   * Filtered, the count says what is on screen and what is being kept back —
   * otherwise a playbook of 37 rules showing 3 of them reads as a playbook
   * that has lost 34.
   */
  const isFiltered =
    visibleCount !== undefined && visibleCount !== documentCount;
  const ruleCountLabel = isFiltered
    ? `${visibleCount} of ${documentCount} rules`
    : `${documentCount} ${documentCount === 1 ? 'rule' : 'rules'}`;
  const draftCountLabel = `${draftCount} ${draftCount === 1 ? 'rule' : 'rules'} in draft`;
  const assistantToggleLabel = isAssistantOpen ? 'Hide agent' : 'Show agent';

  return (
    <TooltipProvider delayDuration={300}>
      {/*
       * No rule along the bottom: the grid sits in its own bordered card a few
       * pixels below, and a border here stacked a third hairline into that gap.
       * The case and Playbook Studio bars carry none either.
       */}
      <div className="@container addin-header-safe bg-background relative z-20 flex h-14 shrink-0 items-center gap-3 px-4">
        {/* Leads the header because the assistant docks on the left. */}
        <HeaderActionTooltip
          enabled={headerActionsIconOnly}
          label={assistantToggleLabel}
        >
          <Button
            variant="ghost"
            size="sm"
            className="@max-md:size-8 @max-md:px-0 -ml-1.5 shrink-0 gap-1.5"
            onClick={onToggleAssistant}
            aria-expanded={isAssistantOpen}
            aria-controls="case-details-panel"
            aria-label={assistantToggleLabel}
          >
            <PanelLeft aria-hidden="true" className="size-4" />
            <span className="@md:inline hidden whitespace-nowrap">
              {assistantToggleLabel}
            </span>
          </Button>
        </HeaderActionTooltip>

        {/* Clipped rather than left to spill: the pieces in here are all
            nowrap, so without it the last of them paints over the search box
            once the header runs out of room. */}
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          <span className="text-foreground truncate text-sm font-semibold">
            {currentProject.name}
          </span>
          {/* An archived playbook is still readable and editable; the marker is
              there so nobody works in one without noticing. */}
          {isArchived && (
            <Badge variant="secondary" className="shrink-0">
              Archived
            </Badge>
          )}
          <span className="text-muted-foreground @md:inline hidden shrink-0 whitespace-nowrap text-xs">
            {ruleCountLabel}
          </span>
          {/*
           * The review backlog, sitting with the rule count because that is
           * what it qualifies. It doubles as the filter: the count is only
           * useful if it can show you which rules it is counting.
           */}
          {draftCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <BadgeButton
                  variant="warning"
                  aria-pressed={draftsOnly}
                  onClick={() => onDraftsOnlyChange?.(!draftsOnly)}
                  className={cn(
                    'shrink-0',
                    // With the filter on, the grid is showing a subset of the
                    // playbook; the chip has to look switched on or the missing
                    // rules read as missing rules.
                    draftsOnly && 'ring-warning/50 ring-2',
                  )}
                >
                  {draftCountLabel}
                </BadgeButton>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {draftsOnly ? 'Show all rules' : 'Show only draft rules'}
              </TooltipContent>
            </Tooltip>
          )}
          {/* Autosave outranks the rule count, so it survives the narrow
              header; the separator is a pseudo-element to keep it tied to a
              status that may not be showing anything yet. */}
          <SaveStatusIndicator
            status={saveStatus}
            lastSavedAt={lastSavedAt}
            idleLabel={currentProject.lastModified}
            className="@md:before:mr-2 @md:before:content-['·']"
          />
        </div>

        <div
          ref={headerActionsRef}
          className="flex shrink-0 items-center gap-1"
        >
          {/* Mirrors the label breakpoint: hidden (display:none) exactly when
              the button labels collapse, so `headerActionsIconOnly` tracks the
              real state. */}
          <span
            ref={headerSentinelRef}
            aria-hidden="true"
            className="@md:block hidden"
          />

          {/*
           * Filters the grid as it is typed rather than jumping between hits:
           * a playbook is read a rule at a time, so the useful answer to "what
           * do we say about indemnity" is the rules that say it. The count
           * beside the title reports what survived.
           */}
          <InputGroup className="@2xl:w-52 h-8 w-36 min-w-24 shrink py-0">
            <InputGroupAddon>
              <Search className="text-muted-foreground size-4" />
            </InputGroupAddon>
            <InputGroupInput
              // Without this the field claims its default 20-character width
              // and pushes the clear button out past the group's border.
              className="min-w-0"
              value={searchQuery}
              placeholder="Search rules"
              aria-label="Search rules"
              onChange={(event) => onSearchQueryChange?.(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Escape' || searchQuery === '') return;
                /*
                 * Escape belongs to the search while there is a search to
                 * drop. The grid listens for it on the document to close its
                 * panels, which React's own listener shares, so only the
                 * immediate form keeps the key from reaching it.
                 */
                event.preventDefault();
                event.nativeEvent.stopImmediatePropagation();
                onSearchQueryChange?.('');
              }}
            />
            {searchQuery !== '' && (
              <InputGroupAddon align="inline-end">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Clear search"
                  onClick={() => onSearchQueryChange?.('')}
                  // Sized down to sit inside the field rather than beside it.
                  className="text-muted-foreground -mr-1 size-6"
                >
                  <X className="size-3.5" />
                </Button>
              </InputGroupAddon>
            )}
          </InputGroup>

          {/*
           * How much of a cell is shown, as the library's own segmented
           * control rather than a hand-rolled pill: the two states were a pair
           * of unlabelled buttons with no focus ring and a sliding fill
           * positioned from inline styles.
           */}
          <ToggleGroup
            type="single"
            variant="default"
            size="icon-sm"
            value={textWrapping ? 'wrapped' : 'single'}
            // Radix hands back '' when the pressed item is pressed again,
            // which would leave the grid in neither state.
            onValueChange={(value) => {
              if (value) onTextWrappingChange?.(value === 'wrapped');
            }}
            // 4px inside a group, 8px between them: the field and the density
            // control are two controls, not one.
            className="bg-muted relative ml-1 gap-0.5 rounded-full p-0.5"
          >
            {/*
             * The thumb, travelling between the two halves rather than
             * blinking out of one and into the other: the distance is one
             * half plus the gap between them.
             */}
            <span
              aria-hidden="true"
              className={cn(
                'bg-background pointer-events-none absolute left-0.5 top-0.5 size-7 rounded-full shadow-sm transition-transform duration-200 ease-in-out motion-reduce:transition-none',
                textWrapping && 'translate-x-[calc(100%+2px)]',
              )}
            />
            {/*
             * The tooltip takes a wrapper rather than the item itself: handed
             * the item, it spreads its own `data-state` (the tooltip's
             * open/closed) over the item's pressed state, and the selected
             * half of the control stops looking selected.
             */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <ToggleGroupItem
                    value="single"
                    aria-label="Single-line cells"
                    className={VIEW_TOGGLE_ITEM}
                  >
                    <ArrowRightToLine className="size-3.5" />
                  </ToggleGroupItem>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">Single-line cells</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <ToggleGroupItem
                    value="wrapped"
                    aria-label="Wrapped text"
                    className={VIEW_TOGGLE_ITEM}
                  >
                    <AlignJustify className="size-3.5" />
                  </ToggleGroupItem>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">Wrapped text</TooltipContent>
            </Tooltip>
          </ToggleGroup>

          {/* Splits what changes the view from what acts on the playbook. */}
          <div aria-hidden="true" className="bg-border mx-1 h-5 w-px" />

          {/* The way into the review queue, alongside the playbook's own
              actions rather than inside them: with drafts waiting it is the
              most likely thing to be doing in the header. */}
          {draftCount > 0 && (
            <HeaderActionTooltip
              enabled={headerActionsIconOnly}
              label="Review draft rules"
            >
              <Button
                variant="outline"
                size="sm"
                className="@max-md:size-8 @max-md:px-0 shrink-0 gap-1.5"
                onClick={onStartRuleReview}
                aria-label="Review draft rules"
              >
                <CheckCircle aria-hidden="true" className="size-4" />
                <span className="@md:inline hidden whitespace-nowrap">
                  Review
                </span>
              </Button>
            </HeaderActionTooltip>
          )}

          {/* Cell actions are bulk-only: a single selected cell is handled in
              the grid itself, where clicking it opens its analysis panel. */}
          {selectedCells.size > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  {selectedCells.size} cells selected
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleCellRefreshData}>
                  <RefreshCw className="size-4" />
                  Refresh cell data
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCellVerifySelected}>
                  <CheckCircle className="size-4" />
                  Verify selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCellFlagSelected}>
                  <Flag className="size-4" />
                  Flag selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCellSelectColumns}>
                  <Columns className="size-4" />
                  Select columns
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleCellDeSelectAll}>
                  <X className="size-4" />
                  Deselect all cells
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : selectedRows.size > 0 ? (
            // Document Bulk Actions Dropdown (when cells not selected but rows are)
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  {selectedRows.size === 1
                    ? '1 rule selected'
                    : `${selectedRows.size} rules selected`}
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* Sign-off leads the menu when there is any to give: it is the
                    reason a lawyer selects a run of rules in the first place. */}
                {selectedDraftCount > 0 && (
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        onApproveSelectedRules?.();
                        handleDeselectAllClick();
                      }}
                    >
                      <CheckCircle className="size-4" />
                      {selectedDraftCount === 1
                        ? 'Approve rule'
                        : `Approve ${selectedDraftCount} rules`}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleRefreshDocumentData}>
                  <RefreshCw className="size-4" />
                  Refresh data
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportClick}>
                  <Download className="size-4" />
                  Export selected
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={
                    selectedRows.size === documentCount
                      ? handleDeselectAllClick
                      : handleSelectAllClick
                  }
                >
                  <Check className="size-4" />
                  {selectedRows.size === documentCount
                    ? 'Deselect all'
                    : 'Select all'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleBulkDeleteClick}
                >
                  <Trash2 className="size-4" />
                  Delete selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          {/* Playbook actions - only when there is no bulk selection, since one
              swaps this slot for the bulk actions menu. */}
          {selectedRows.size === 0 && selectedCells.size <= 1 && (
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Playbook actions"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">Playbook actions</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleShareClick}>
                  <Share2 className="size-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportClick}>
                  <Download className="size-4" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEditProjectClick}>
                  <Edit3 className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isArchived ? (
                  <DropdownMenuItem onClick={handleUnarchivePlaybook}>
                    <ArchiveRestore className="size-4" />
                    Unarchive
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handleArchivePlaybook}>
                    <Archive className="size-4" />
                    Archive
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Bulk Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        itemName={`${selectedRows.size} position${selectedRows.size === 1 ? '' : 's'}`}
        itemType="positions"
      />

      {/* Share Modal - the same roster dialog cases and Playbook Studio use. */}
      <ShareCaseDialog
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        title="Share playbook"
        description={[
          'Share this playbook with people on your team so they can view and edit it.',
          // Drafts are shared, so whoever opens it should know some of what
          // they are reading has not been through a lawyer yet.
          draftCount > 0 &&
            `${draftCount === 1 ? '1 rule is' : `${draftCount} rules are`} still in draft and will be shared as such.`,
        ]
          .filter(Boolean)
          .join(' ')}
        resourceLabel="playbook"
        shareLink={
          playbookId
            ? `https://app.moritz.legal/playbooks/${playbookId}`
            : undefined
        }
      />

      {/* Edit Playbook Modal - same shape and fields as the create dialog on
          the index, so editing a playbook reads as the inverse of making one. */}
      <Dialog
        open={isEditProjectModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelEdit();
          }
        }}
      >
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Edit Playbook</DialogTitle>
            <DialogDescription>
              Update the name, client and description for this playbook.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProject}>
            <DialogBody className="space-y-5">
              <Field>
                <FieldLabel htmlFor="edit-playbook-name">
                  Name <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="edit-playbook-name"
                  placeholder="e.g., Vendor Contracts Analysis"
                  value={editProjectName}
                  onChange={(e) => setEditProjectName(e.target.value)}
                  required
                  autoFocus
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-playbook-client">Client</FieldLabel>
                <Select
                  value={editProjectClient}
                  onValueChange={(value) =>
                    setEditProjectClient(
                      value === UNASSIGNED_CLIENT ? '' : value,
                    )
                  }
                >
                  <SelectTrigger id="edit-playbook-client" className="w-full">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Radix reserves the empty string, so clearing the field
                        goes through a sentinel value. */}
                    <SelectItem value={UNASSIGNED_CLIENT}>
                      Unassigned
                    </SelectItem>
                    <SelectSeparator />
                    {TABULAR_PLAYBOOK_CLIENTS.map((client) => (
                      <SelectItem key={client} value={client}>
                        {client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-playbook-description">
                  Description
                </FieldLabel>
                <Textarea
                  id="edit-playbook-description"
                  placeholder="Describe the purpose and scope of this playbook..."
                  value={editProjectDescription}
                  onChange={(e) => setEditProjectDescription(e.target.value)}
                  rows={3}
                  className="[&_textarea]:resize-none"
                />
              </Field>
            </DialogBody>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={!editProjectName.trim()}>
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
