'use client';

import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useMemo,
} from 'react';
import { Button } from '@/components/design/foundations/components/button';
import { Checkbox } from '@/components/design/foundations/components/checkbox';
import { Badge } from '@/components/design/foundations/components/badge';
import { DeleteConfirmationModal } from '@/components/design/tabular-playbook/components/DeleteConfirmationModal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui/components/tooltip';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/design/foundations/components/empty';
import { Spinner } from '@/components/design/foundations/components/spinner';
import {
  Trash2,
  X,
  FileText,
  Flag,
  CircleCheck,
  AlertTriangle,
  GripVertical,
  Plus,
  Search,
} from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { AIReasoningModal } from './ai-reasoning-modal';
import { RowDetailsPanel, type RowDetailField } from './row-details-panel';
import {
  createEmptySeedColumns,
  seedColumns,
  seedDocuments,
} from './data/tabular-playbook-seed';
import { CellEditInput } from './components/CellEditInput';
import { getBadgeVariantForValue, getCellBadges } from './utils/badgeVariants';
import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import { RuleReviewPanel } from './components/RuleReviewPanel';
import type {
  CellRevision,
  CellState,
  ReviewSummary,
  RuleReview,
} from './types';
import {
  DEFAULT_COLUMN_WIDTHS,
  MIN_COLUMN_WIDTH,
  MAX_COLUMN_WIDTH,
} from './types';
import { ColumnResizeHandle } from './components/ColumnResizeHandle';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

// Simple document interface
interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: string;
}

// Simple column interface
interface Column {
  key: string;
  label: string;
  type: string;
  isLoading?: boolean;
  cellLoadingStates?: { [docId: string]: boolean };
  cellData?: { [docId: string]: string };
  width?: number; // Column width in pixels (for manual resize)
  enumOptions?: string[];
}

// Cell data interface
interface CellData {
  value: string;
  isEditing: boolean;
  originalValue?: string; // Stores AI-generated value when user modifies
  isModified?: boolean; // Flag for modified state
  /**
   * Every value the cell has held, oldest first, starting with the agent's
   * extraction. Written on the first edit — an untouched cell has no history
   * worth keeping.
   */
  revisions?: CellRevision[];
}

/** Stand-in identities for the playground, which has no signed-in user. */
const CURRENT_AUTHOR = 'You';
const EXTRACTION_AUTHOR = 'Playbook agent';

/** How long after a save the same author's next one folds into it. */
const REVISION_COLLAPSE_MS = 5 * 60 * 1000;
/** Cap on a cell's history. The extraction is kept whatever else is dropped. */
const MAX_REVISIONS = 10;
/**
 * Age given to the extraction when a cell's history is first written. The
 * playground has no real extraction run to date, so this matches the "3 days
 * ago" the header reports for the playbook's last save.
 */
const EXTRACTION_AGE_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Appends a value to a cell's history.
 *
 * Consecutive saves by the same author within a few minutes fold into one
 * entry: a typo fix is part of the edit that preceded it, not a revision of its
 * own, and listing each one turns the history into noise. When the cap is hit
 * the oldest *edits* go first — the extraction stays, since it is the one entry
 * that can't be reconstructed from the others.
 */
function appendRevision(
  revisions: CellRevision[],
  entry: CellRevision,
): CellRevision[] {
  const previous = revisions[revisions.length - 1];
  const collapses =
    previous !== undefined &&
    previous.author === entry.author &&
    entry.savedAt.getTime() - previous.savedAt.getTime() < REVISION_COLLAPSE_MS;

  const next = collapses
    ? [...revisions.slice(0, -1), { ...entry, id: previous.id }]
    : [...revisions, entry];

  if (next.length <= MAX_REVISIONS) return next;
  return [next[0]!, ...next.slice(next.length - (MAX_REVISIONS - 1))];
}

interface TabularPlaybookProps {
  onSelectedRowsChange?: (selectedRows: Set<string>) => void;
  onSelectedCellsChange?: (selectedCells: Set<string>) => void;
  textWrapping?: boolean;
  onColumnsUpdate?: (columns: Column[]) => void;
  onDocumentsUpdate?: (documents: Document[]) => void;
  /**
   * Fired the first time the playbook's contents change — an edited or reverted
   * cell, a deleted position, a reordered column, a flag, a re-run, or a
   * generated set of rules. View-only state (widths, selection, text wrapping)
   * deliberately doesn't count, so the workspace can prompt about work that
   * would actually be lost on leaving.
   */
  onContentChange?: () => void;
  /** Narrows the grid to the rules still waiting on review. */
  draftsOnly?: boolean;
  /** Narrows the grid to the rules whose text contains what was typed. */
  searchQuery?: string;
  /** Drops the search from the grid's own empty state. */
  onClearSearch?: () => void;
  /** Reports how many rules survive the filters, for the header's count. */
  onVisibleCountChange?: (count: number) => void;
  /** Reports the review backlog, so the header can count and offer it. */
  onReviewSummaryChange?: (summary: ReviewSummary) => void;
  /**
   * Opens with the column headers but no rules, for a playbook the user has just
   * created. The seeded Pylon positions are only for the demo playbooks.
   */
  startEmpty?: boolean;
}

/*
 * Cell keys index the selection sets and the cell-data / cell-state maps.
 *
 * Both halves can contain hyphens — documents are `pp-001` when seeded and
 * `rule-gen-<timestamp>-<n>` when produced by the assistant, and renaming a
 * column slugifies its label into a hyphenated key — so the previous
 * `${docId}-${colKey}` join could not be split back apart. Every consumer
 * guessed differently (first hyphen, second hyphen, first segment), which is
 * why range selection and cell refresh silently no-opped on generated rows.
 * The ASCII unit separator cannot occur in either half, so the join is
 * lossless and there is one way to take it apart.
 */
const CELL_KEY_SEPARATOR = '\u001f';

/** How long the simulated extraction/refresh spinners run for. */
const REFRESH_DURATION_MS = 1500;

/** Shown in place of a value the extraction did not produce. */
const EMPTY_CELL_PLACEHOLDER = '—';

/**
 * Stands in for a rule's name wherever prose needs one — the delete prompt, the
 * row's controls — while the Position cell is still blank. The grid itself
 * shows the empty-cell placeholder instead, as it does for any other gap.
 */
const UNNAMED_RULE_LABEL = 'this rule';

/** Width of the row-number / checkbox gutter (`w-12`), in pixels. */
const ROW_GUTTER_WIDTH = 48;

/** Rough character width at the grid's text size, for estimating overflow. */
const APPROX_CHAR_WIDTH_PX = 7;

/** Cell padding plus the drag handle a header label has to share its row with. */
const HEADER_CHROME_PX = 48;

const makeCellKey = (docId: string, colKey: string) =>
  `${docId}${CELL_KEY_SEPARATOR}${colKey}`;

/** Copy of `record` without `key`, or `record` itself when the key is absent. */
const omitKey = <T,>(record: Record<string, T>, key: string) => {
  if (!(key in record)) return record;
  const next = { ...record };
  delete next[key];
  return next;
};

/**
 * One cell's text, resolved the way the grid resolves it: an edit wins, then
 * the extracted value once it has landed, and a rule's name stands in for its
 * position cell until one is written. Shared with the search so a row is
 * matched on what it actually shows.
 */
const readCellValue = (
  docId: string,
  columnKey: string,
  cellData: { [cellKey: string]: CellData },
  column: Column | undefined,
  documentName: string,
): string => {
  const edited = cellData[makeCellKey(docId, columnKey)]?.value;
  if (edited) return edited;

  if (column) {
    // A cell still extracting shows a skeleton, not a value.
    const isLoading = column.cellLoadingStates?.[docId];
    if (isLoading === true || typeof isLoading === 'undefined') return '';
    return column.cellData?.[docId] ?? '';
  }

  if (columnKey === 'name') return documentName;
  return '';
};

const splitCellKey = (cellKey: string): { docId: string; colKey: string } => {
  const boundary = cellKey.indexOf(CELL_KEY_SEPARATOR);
  if (boundary === -1) return { docId: '', colKey: '' };
  return {
    docId: cellKey.slice(0, boundary),
    colKey: cellKey.slice(boundary + 1),
  };
};

// Sortable column header component for drag-and-drop reordering
interface SortableColumnHeaderProps {
  column: Column;
  children: React.ReactNode;
  isDragging?: boolean;
  columnWidth: number;
  onColumnResize?: (columnKey: string, newWidth: number) => void;
  disableResize?: boolean;
  /** Height of the scroll viewport, so the resize grip spans the whole column. */
  resizeHandleHeight?: number;
  /** Viewport the resize drag may scroll when it reaches an edge. */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

const SortableColumnHeader: React.FC<SortableColumnHeaderProps> = ({
  column,
  children,
  columnWidth,
  onColumnResize,
  disableResize,
  resizeHandleHeight,
  scrollContainerRef,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
    width: `${columnWidth}px`,
    minWidth: `${columnWidth}px`,
    overflow: 'visible', // Allow resize handles to extend beyond
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'border-dt-line-secondary bg-dt-bg-tertiary group relative flex items-center gap-1 truncate border-r py-2 pl-1 pr-2 text-sm font-medium',
        isDragging && 'ring-primary/20 shadow-lg ring-2',
      )}
    >
      {/*
       * Drag handle. Sits in flow ahead of the label rather than overlaying it,
       * and stays visible at rest so every column advertises that it can be
       * reordered. Narrow but full-height, to spend as little of the column's
       * width as possible while keeping a comfortable grab target.
       */}
      <div
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${column.label} column`}
        className="hover:bg-dt-bg-secondary flex h-6 w-4 shrink-0 cursor-grab items-center justify-center rounded active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="text-dt-fg-tertiary h-3.5 w-3.5" />
      </div>
      <div className="flex min-w-0 flex-1 items-center">{children}</div>
      {/* Resize handle */}
      {onColumnResize && (
        <ColumnResizeHandle
          columnKey={column.key}
          currentWidth={columnWidth}
          onResize={onColumnResize}
          disabled={disableResize}
          fullHeight
          tableHeight={resizeHandleHeight}
          scrollContainerRef={scrollContainerRef}
        />
      )}
    </div>
  );
};

export const TabularPlaybook = forwardRef<any, TabularPlaybookProps>(
  (
    {
      onSelectedRowsChange,
      onSelectedCellsChange,
      textWrapping = false,
      onColumnsUpdate,
      onDocumentsUpdate,
      onContentChange,
      startEmpty = false,
      draftsOnly = false,
      searchQuery = '',
      onClearSearch,
      onVisibleCountChange,
      onReviewSummaryChange,
    },
    ref,
  ) => {
    const { flags } = useDesignFlags();
    const [documents, setDocuments] = useState<Document[]>(() =>
      startEmpty ? [] : (seedDocuments as Document[]),
    );

    /*
     * The simulated extraction/refresh/generation flows all resolve on a timer.
     * Tracking them centrally means a reset or an unmount cancels work that is
     * still in flight, instead of letting it land on state that no longer
     * describes the same table.
     */
    const pendingTimersRef = useRef(new Set<ReturnType<typeof setTimeout>>());

    const registerTimer = useCallback(
      (timer: ReturnType<typeof setTimeout>) => {
        pendingTimersRef.current.add(timer);
        return timer;
      },
      [],
    );

    const cancelPendingTimers = useCallback(() => {
      pendingTimersRef.current.forEach(clearTimeout);
      pendingTimersRef.current.clear();
    }, []);

    useEffect(() => cancelPendingTimers, [cancelPendingTimers]);

    // Latest rows, readable from timer callbacks without stale-closing over them.
    const documentsRef = useRef(documents);
    useEffect(() => {
      documentsRef.current = documents;
    }, [documents]);

    // Keep a stable reference to the parent updater so we can safely trigger it
    const onDocumentsUpdateRef = useRef(onDocumentsUpdate);
    const suppressDocumentsUpdateRef = useRef(false);

    useEffect(() => {
      onDocumentsUpdateRef.current = onDocumentsUpdate;
    }, [onDocumentsUpdate]);

    /*
     * Held in a ref and announced through a stable callback, so the mutations
     * that report a change — several of which live on the imperative handle —
     * don't have to re-create themselves when the parent re-renders.
     */
    const onContentChangeRef = useRef(onContentChange);

    useEffect(() => {
      onContentChangeRef.current = onContentChange;
    }, [onContentChange]);

    const markContentChanged = useCallback(() => {
      onContentChangeRef.current?.();
    }, []);

    // Whenever documents change locally, inform the parent so filtering stays in sync
    useEffect(() => {
      if (suppressDocumentsUpdateRef.current) {
        suppressDocumentsUpdateRef.current = false;
        return;
      }
      if (onDocumentsUpdateRef.current) {
        onDocumentsUpdateRef.current(documents);
      }
    }, [documents]);

    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [columns] = useState<Column[]>([
      { key: 'name', label: 'Position', type: 'text' },
    ]);
    const [dataColumns, setDataColumns] = useState<Column[]>(() =>
      startEmpty
        ? (createEmptySeedColumns() as Column[])
        : (seedColumns as Column[]),
    );

    // Drag-and-drop sensors for column reordering
    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 8, // 8px movement required before drag starts
        },
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      }),
    );

    // Store ref to onColumnsUpdate callback
    const onColumnsUpdateRef = useRef(onColumnsUpdate);

    useEffect(() => {
      onColumnsUpdateRef.current = onColumnsUpdate;
    }, [onColumnsUpdate]);

    // Share the latest visible column set with the parent so filter options remain accurate
    useEffect(() => {
      if (!onColumnsUpdateRef.current) {
        return;
      }

      const mergedColumns = [...columns, ...dataColumns];
      const uniqueColumns: Column[] = [];
      const seenKeys = new Set<string>();

      for (const column of mergedColumns) {
        if (!seenKeys.has(column.key)) {
          uniqueColumns.push(column);
          seenKeys.add(column.key);
        }
      }

      onColumnsUpdateRef.current(uniqueColumns);
    }, [columns, dataColumns]);

    useEffect(() => {
      dataColumnsRef.current = dataColumns;
    }, [dataColumns]);

    const [cellData, setCellData] = useState<{ [key: string]: CellData }>({});
    const [selectedCell, setSelectedCell] = useState<string | null>(null);
    const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
    const [selectionRange, setSelectionRange] = useState<{
      startCell: string | null;
      endCell: string | null;
      cells: Set<string>;
    }>({ startCell: null, endCell: null, cells: new Set() });
    const [editingCell, setEditingCell] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState<string>('');
    const [editingOriginalValue, setEditingOriginalValue] =
      useState<string>(''); // Track original value before editing
    const [editingColumnInfo, setEditingColumnInfo] = useState<{
      type: string;
      enumOptions?: string[];
      key: string;
    } | null>(null); // Track column info for type-aware editing
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<Document | null>(
      null,
    );
    const [cellStates, setCellStates] = useState<Map<string, CellState>>(
      new Map(),
    );
    /*
     * Review records are only written for rules the agent has touched. The
     * seeded playbook is the lawyer's existing work, so an absent record reads
     * as approved rather than as an unreviewed backlog on first load.
     */
    const [ruleReviews, setRuleReviews] = useState<Record<string, RuleReview>>(
      {},
    );
    /** Cells holding a value the agent wrote that nobody has signed off yet. */
    const [proposedCells, setProposedCells] = useState<Set<string>>(new Set());
    /** The rule the review stepper is currently sitting on. */
    const [reviewFocusDocId, setReviewFocusDocId] = useState<string | null>(
      null,
    );

    /*
     * The review stage is a proposal, so it sits behind a playground flag. It
     * is gated on the way out rather than on the way in: with the flag off the
     * grid still records what the agent wrote, so turning it on mid-session
     * shows the drafts already sitting in the playbook instead of an empty
     * queue that only fills on the next run.
     */
    const isRuleReviewEnabled = flags.usePlaybookRuleReview === true;

    const isRuleDraft = useCallback(
      (docId: string) =>
        isRuleReviewEnabled && ruleReviews[docId]?.state === 'draft',
      [isRuleReviewEnabled, ruleReviews],
    );

    /** Draft rules in grid order, which is the order the stepper walks them. */
    const draftDocIds = useMemo(
      () => documents.filter((doc) => isRuleDraft(doc.id)).map((doc) => doc.id),
      [documents, isRuleDraft],
    );

    /*
     * Every whitespace-separated word has to appear somewhere in the row, so
     * narrowing a search is a matter of typing more of it rather than getting
     * the phrase exactly right.
     */
    const searchTerms = useMemo(
      () => searchQuery.toLowerCase().split(/\s+/).filter(Boolean),
      [searchQuery],
    );
    const isSearching = searchTerms.length > 0;

    const displayDocuments = useMemo(() => {
      const rules = draftsOnly
        ? documents.filter((doc) => isRuleDraft(doc.id))
        : documents;
      if (searchTerms.length === 0) return rules;

      return rules.filter((doc) => {
        // The whole row as one haystack: a rule is found by its name, its
        // category, a phrase in its fallback — whatever the reader remembers.
        const haystack = [
          readCellValue(doc.id, 'name', cellData, undefined, doc.name),
          ...dataColumns.map((column) =>
            readCellValue(doc.id, column.key, cellData, column, doc.name),
          ),
        ]
          .join(' ')
          .toLowerCase();
        return searchTerms.every((term) => haystack.includes(term));
      });
    }, [
      cellData,
      dataColumns,
      documents,
      draftsOnly,
      isRuleDraft,
      searchTerms,
    ]);

    const onVisibleCountChangeRef = useRef(onVisibleCountChange);
    onVisibleCountChangeRef.current = onVisibleCountChange;

    useEffect(() => {
      onVisibleCountChangeRef.current?.(displayDocuments.length);
    }, [displayDocuments.length]);

    const onReviewSummaryChangeRef = useRef(onReviewSummaryChange);

    useEffect(() => {
      onReviewSummaryChangeRef.current = onReviewSummaryChange;
    }, [onReviewSummaryChange]);

    useEffect(() => {
      onReviewSummaryChangeRef.current?.({
        total: documents.length,
        draftIds: draftDocIds,
      });
    }, [documents.length, draftDocIds]);
    // Seeded from the initial state so an empty playbook and a demo one agree.
    const dataColumnsRef = useRef<Column[]>(dataColumns);

    /*
     * Width a header needs to show its label in full, alongside the padding and
     * the drag handle that sit in the same cell. Acts as the floor for every
     * column so no header is clipped by its own width tier.
     */
    const widthForLabel = (label: string): number =>
      label.length * APPROX_CHAR_WIDTH_PX + HEADER_CHROME_PX;

    /*
     * Fallback for a column the schema didn't size (an ad-hoc one, where the
     * content is unknown). Enums hold short badge values; anything else is
     * assumed to be prose.
     */
    const getColumnWidthPixels = (column: Column): number => {
      if (column.width) {
        return column.width;
      }

      const tier =
        column.type === 'enum' || column.type === 'boolean'
          ? DEFAULT_COLUMN_WIDTHS.compact
          : DEFAULT_COLUMN_WIDTHS.default;

      return Math.max(tier, widthForLabel(column.label));
    };

    // State for tracking column widths (overrides default widths)
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
      {},
    );
    const [documentColumnWidth, setDocumentColumnWidth] = useState<number>(
      DEFAULT_COLUMN_WIDTHS.document,
    );

    // Handle column resize
    const handleColumnResize = useCallback(
      (columnKey: string, newWidth: number) => {
        setColumnWidths((prev) => ({
          ...prev,
          [columnKey]: Math.max(
            MIN_COLUMN_WIDTH,
            Math.min(MAX_COLUMN_WIDTH, newWidth),
          ),
        }));
      },
      [],
    );

    // Handle document column resize
    // Signature matches ColumnResizeHandle's `onResize` so it can be handed over
    // directly; an inline adapter would change identity every render and restart
    // the handle's drag loop mid-gesture.
    const handleDocumentColumnResize = useCallback(
      (_columnKey: string, newWidth: number) => {
        setDocumentColumnWidth(
          Math.max(MIN_COLUMN_WIDTH, Math.min(MAX_COLUMN_WIDTH, newWidth)),
        );
      },
      [],
    );

    /*
     * A width the user dragged wins outright, even if it clips the label — they
     * asked for it. Otherwise the schema tier applies, floored so the header
     * stays readable and capped at the resize limit.
     */
    const getEffectiveColumnWidth = useCallback(
      (column: Column): number => {
        const resized = columnWidths[column.key];
        if (resized) return resized;

        return Math.min(
          MAX_COLUMN_WIDTH,
          Math.max(getColumnWidthPixels(column), widthForLabel(column.label)),
        );
      },
      [columnWidths],
    );
    const [inlinePanelOpen, setInlinePanelOpen] = useState(false);
    const [inlinePanelData, setInlinePanelData] = useState<
      | {
          type: 'ai-analysis';
          // Common fields
          columnName: string;
          docId: string;
          columnKey: string;
          // AI Analysis fields
          cellValue?: string;
          columnType?: string; // Column type for type-aware editing
          enumOptions?: string[]; // Enum options if column type is enum-category
        }
      /**
       * Every column's value for one row. Only the row is stored: the values are
       * read at render time so the panel tracks edits made while it is open.
       */
      | {
          type: 'row-details';
          docId: string;
          /** Field to open straight into its editor, if any. */
          autoEditKey?: string;
        }
      /**
       * The review stepper. Holds the rule it is sitting on; the queue is read
       * from the draft list so approving one moves the panel along.
       */
      | { type: 'rule-review'; docId: string }
      | null
    >(null);
    const [isScrolled, setIsScrolled] = useState(false);

    const tableRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const inlinePanelRef = useRef<HTMLDivElement>(null);

    // The resize grips hang off the sticky header down over the rows, so a
    // column can be dragged from anywhere in it rather than just its header
    // cell. They track the scroll *viewport* rather than the full content
    // height: the grips are absolutely positioned inside the scroll container,
    // so anything taller invents empty scrollable space past the last row.
    // Because the header is sticky, a viewport-tall grip always covers exactly
    // the visible part of its column.
    const [resizeHandleHeight, setResizeHandleHeight] = useState(0);
    // How far the frozen column's shadow reaches down the viewport. It is cast
    // from the viewport rather than from the rows so that it stays under the
    // frozen column as the grid scrolls sideways, which leaves it free to run
    // past the last rule into empty space — a stray line down the table. So it
    // is cut off at whichever comes first: the bottom of the rows or of the
    // viewport.
    const [shadowHeight, setShadowHeight] = useState(0);
    const [rowsElement, setRowsElement] = useState<HTMLDivElement | null>(null);
    useEffect(() => {
      const scroller = scrollContainerRef.current;
      if (!scroller) return;
      const measure = () => {
        setResizeHandleHeight(scroller.clientHeight);
        const rowsBottom = rowsElement
          ? rowsElement.getBoundingClientRect().bottom -
            scroller.getBoundingClientRect().top
          : 0;
        setShadowHeight(
          Math.max(0, Math.min(scroller.clientHeight, rowsBottom)),
        );
      };
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(scroller);
      if (rowsElement) observer.observe(rowsElement);
      return () => observer.disconnect();
    }, [rowsElement]);

    // Auto-close AI panel when multiple cells are selected
    useEffect(() => {
      if (inlinePanelData?.type === 'rule-review') return;
      if (selectedCells.size > 1 && inlinePanelOpen) {
        setInlinePanelOpen(false);
        setSelectedCell(null);
      }
    }, [selectedCells.size, inlinePanelOpen, inlinePanelData?.type]);

    /*
     * The panel belongs to one cell, so it follows the selection: deselecting
     * that cell — by clicking away, clearing from the header, or landing on a
     * cell with nothing to analyse — closes the panel rather than leaving it
     * describing a cell the grid no longer highlights.
     */
    useEffect(() => {
      if (!inlinePanelOpen || !inlinePanelData) return;
      // The review stepper answers to the draft queue, not to the selection.
      if (inlinePanelData.type === 'rule-review') return;
      const panelCell = makeCellKey(
        inlinePanelData.docId,
        inlinePanelData.type === 'row-details'
          ? 'name'
          : inlinePanelData.columnKey,
      );
      // Mirrors how a cell decides it is highlighted.
      if (selectedCell === panelCell || selectedCells.has(panelCell)) return;
      setInlinePanelOpen(false);
    }, [inlinePanelOpen, inlinePanelData, selectedCell, selectedCells]);

    // Switching the review stage off in settings takes its panel with it.
    useEffect(() => {
      if (isRuleReviewEnabled || inlinePanelData?.type !== 'rule-review')
        return;
      setInlinePanelOpen(false);
      setReviewFocusDocId(null);
    }, [isRuleReviewEnabled, inlinePanelData?.type]);

    /*
     * Publish the cell selection so the header can offer its bulk actions.
     * This is driven off the selection itself rather than every call site, and
     * reaches the parent through a ref so a re-rendered parent handing down a
     * fresh callback can't feed the effect back into itself — the loop that
     * caused this sync to be switched off previously.
     */
    const onSelectedCellsChangeRef = useRef(onSelectedCellsChange);

    React.useEffect(() => {
      onSelectedCellsChangeRef.current = onSelectedCellsChange;
    }, [onSelectedCellsChange]);

    useEffect(() => {
      onSelectedCellsChangeRef.current?.(selectedCells);
    }, [selectedCells]);

    const closeInlinePanel = () => {
      setInlinePanelOpen(false);
      setSelectedCell(null);
      setSelectedCells(new Set());
      setSelectionRange({ startCell: null, endCell: null, cells: new Set() });
      setReviewFocusDocId(null);
    };

    // Handle document selection
    const handleSelectAll = (checked: boolean) => {
      if (checked) {
        const newSelectedRows = new Set(displayDocuments.map((doc) => doc.id));
        setSelectedRows(newSelectedRows);
        onSelectedRowsChange?.(newSelectedRows);
      } else {
        const newSelectedRows = new Set<string>();
        setSelectedRows(newSelectedRows);
        onSelectedRowsChange?.(newSelectedRows);
      }
    };

    const handleRowSelect = useCallback(
      (docId: string, checked: boolean) => {
        setSelectedRows((prev) => {
          const newSet = new Set(prev);
          if (checked) {
            newSet.add(docId);
          } else {
            newSet.delete(docId);
          }
          onSelectedRowsChange?.(newSet as Set<string>);
          return newSet;
        });

        // Don't clear individual cell selection - allow both row and cell selection
      },
      [onSelectedRowsChange],
    );

    /*
     * Cell state is keyed by cell, not owned by the row or column it belongs
     * to, so removing rows or columns has to sweep it explicitly. Left behind,
     * those entries resurface as ghost selections and stale flags the moment a
     * new row or column reuses an id.
     */
    const purgeCellState = useCallback(
      (matches: (parts: { docId: string; colKey: string }) => boolean) => {
        const drop = (cellKey: string) => matches(splitCellKey(cellKey));

        setCellData((prev) =>
          Object.fromEntries(
            Object.entries(prev).filter(([cellKey]) => !drop(cellKey)),
          ),
        );
        setCellStates((prev) => {
          const next = new Map(prev);
          prev.forEach((_, cellKey) => {
            if (drop(cellKey)) next.delete(cellKey);
          });
          return next;
        });
        setSelectedCells((prev) => {
          const next = new Set(prev);
          prev.forEach((cellKey) => {
            if (drop(cellKey)) next.delete(cellKey);
          });
          return next;
        });
        setSelectedCell((prev) => (prev && drop(prev) ? null : prev));
        setEditingCell((prev) => (prev && drop(prev) ? null : prev));
        setSelectionRange({ startCell: null, endCell: null, cells: new Set() });
        setProposedCells((prev) => {
          const next = new Set(prev);
          prev.forEach((cellKey) => {
            if (drop(cellKey)) next.delete(cellKey);
          });
          return next;
        });
      },
      [],
    );

    /*
     * Idempotent on purpose. The header clears the selection through the same
     * channel the grid publishes it on, so a no-op clear has to leave state
     * untouched — otherwise the two would bounce empty sets off each other.
     */
    const clearSelection = useCallback(() => {
      setSelectedCell((prev) => (prev === null ? prev : null));
      setSelectedCells((prev) => (prev.size === 0 ? prev : new Set()));
      setSelectionRange((prev) =>
        prev.startCell === null &&
        prev.endCell === null &&
        prev.cells.size === 0
          ? prev
          : { startCell: null, endCell: null, cells: new Set() },
      );
    }, []);

    /**
     * Empties the grid down to the given column set. Everything derived from
     * the previous contents — edits, flags, selection, sort, widths, the
     * reasoning panel and any in-flight simulated work — goes with it.
     */
    const resetGridState = useCallback(
      (nextColumns: Column[]) => {
        cancelPendingTimers();
        setDocuments([]);
        setDataColumns(nextColumns);
        dataColumnsRef.current = nextColumns;
        setSelectedRows(new Set());
        setSelectedCells(new Set());
        setSelectedCell(null);
        setSelectionRange({
          startCell: null,
          endCell: null,
          cells: new Set(),
        });
        setCellData({});
        setCellStates(new Map());
        setEditingCell(null);
        setColumnWidths({});
        setInlinePanelOpen(false);
        setRuleReviews({});
        setProposedCells(new Set());
        setReviewFocusDocId(null);
        onSelectedRowsChange?.(new Set());
        onSelectedCellsChange?.(new Set());
      },
      [cancelPendingTimers, onSelectedRowsChange, onSelectedCellsChange],
    );

    const handleDeleteDocument = useCallback(
      (docId: string) => {
        markContentChanged();
        setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
        setSelectedRows((prev) => {
          const newSet = new Set(prev);
          newSet.delete(docId);
          return newSet;
        });
        setDataColumns((prev) =>
          prev.map((col) => {
            return {
              ...col,
              cellData: omitKey(col.cellData ?? {}, docId),
              cellLoadingStates: omitKey(col.cellLoadingStates ?? {}, docId),
            };
          }),
        );
        purgeCellState((parts) => parts.docId === docId);
        setRuleReviews((prev) => omitKey(prev, docId));
        setInlinePanelOpen(false);
      },
      [markContentChanged, purgeCellState],
    );

    // Handle delete confirmation
    const handleDeleteClick = (doc: Document) => {
      setDocumentToDelete(doc);
      setDeleteModalOpen(true);
    };

    /**
     * Opens the row's panel, optionally straight into one field's editor.
     * `select` is for callers that aren't already a click on the position cell
     * — the panel follows the selection, so it needs the cell highlighted to
     * stay open.
     */
    const openRowDetails = useCallback(
      (docId: string, options?: { editKey?: string; select?: boolean }) => {
        if (options?.select) {
          const cellKey = makeCellKey(docId, 'name');
          setSelectedCell(cellKey);
          setSelectedCells(new Set([cellKey]));
          setSelectionRange({
            startCell: cellKey,
            endCell: null,
            cells: new Set([cellKey]),
          });
        }
        setInlinePanelData({
          type: 'row-details',
          docId,
          autoEditKey: options?.editKey,
        });
        setInlinePanelOpen(true);
      },
      [],
    );

    /*
     * Two manual rules added inside the same millisecond would otherwise share
     * an id, and with it every cell key on the row.
     */
    const manualRuleSeqRef = useRef(0);

    /**
     * Appends a blank rule and opens its panel with the cursor in the position
     * field, so a row the lawyer adds by hand starts where its name goes rather
     * than as an anonymous stripe at the bottom of the table. Rules written
     * here are the lawyer's own, so they skip review — the draft stage is for
     * the agent's proposals.
     */
    const handleAddRule = useCallback(() => {
      manualRuleSeqRef.current += 1;
      const doc = {
        id: `rule-manual-${Date.now()}-${manualRuleSeqRef.current}`,
        name: '',
        type: 'PLAYBOOK',
        size: 0,
        lastModified: new Date().toISOString().split('T')[0]!,
      } as Document;

      markContentChanged();
      setDocuments((prev) => [...prev, doc]);
      openRowDetails(doc.id, { editKey: 'name', select: true });

      requestAnimationFrame(() => {
        const scroller = scrollContainerRef.current;
        const row = scroller?.querySelector<HTMLElement>(
          `[data-row-id="${doc.id}"]`,
        );
        if (!scroller || !row) return;
        /*
         * Only as far as it takes to clear the add-rule strip, which is sticky
         * at the foot of the grid and would otherwise sit over the new row.
         * Jumping to the bottom outright moves a grid that was already showing
         * the row, which reads as the table lurching under the panel.
         */
        const strip = scroller.querySelector<HTMLElement>('[data-add-rule]');
        const shortfall =
          row.getBoundingClientRect().bottom +
          (strip?.offsetHeight ?? 0) -
          scroller.getBoundingClientRect().bottom;
        if (shortfall > 0) scroller.scrollTop += shortfall;
      });
    }, [markContentChanged, openRowDetails]);

    // Handle column drag-and-drop reordering
    const handleColumnDragEnd = useCallback(
      (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
          markContentChanged();
          setDataColumns((prev) => {
            const oldIndex = prev.findIndex((col) => col.key === active.id);
            const newIndex = prev.findIndex((col) => col.key === over.id);

            if (oldIndex === -1 || newIndex === -1) {
              return prev;
            }

            const reordered = arrayMove(prev, oldIndex, newIndex);
            dataColumnsRef.current = reordered;
            return reordered;
          });
        }
      },
      [markContentChanged],
    );

    // Confirm delete
    const confirmDelete = () => {
      if (documentToDelete) {
        handleDeleteDocument(documentToDelete.id);
        setDeleteModalOpen(false);
        setDocumentToDelete(null);
      }
    };

    // Cancel delete
    const cancelDelete = () => {
      setDeleteModalOpen(false);
      setDocumentToDelete(null);
    };

    const isCellProposed = useCallback(
      (cellKey: string) => isRuleReviewEnabled && proposedCells.has(cellKey),
      [isRuleReviewEnabled, proposedCells],
    );

    /** Columns of one rule that are still carrying an unreviewed agent value. */
    const proposedKeysForRule = useCallback(
      (docId: string) => {
        const keys = new Set<string>();
        proposedCells.forEach((cellKey) => {
          const parts = splitCellKey(cellKey);
          if (parts.docId === docId) keys.add(parts.colKey);
        });
        return keys;
      },
      [proposedCells],
    );

    /**
     * Writes values the agent has come up with for cells that already had one.
     * They land as proposals rather than as fact: each goes into the cell's
     * history under the agent's name, the cell is marked unreviewed, and the
     * rule it belongs to drops back to draft even if it was approved before.
     */
    const recordAgentProposals = useCallback(
      (cells: { docId: string; colKey: string; value: string }[]) => {
        if (cells.length === 0) return;

        setCellData((prev) => {
          const next = { ...prev };
          const savedAt = new Date();

          cells.forEach(({ docId, colKey, value }) => {
            const cellKey = makeCellKey(docId, colKey);
            const existing = next[cellKey];
            const previousValue =
              existing?.value ??
              dataColumnsRef.current.find((col) => col.key === colKey)
                ?.cellData?.[docId] ??
              '';
            const history =
              existing?.revisions ??
              (previousValue
                ? [
                    {
                      id: `${cellKey}-extraction`,
                      value: previousValue,
                      author: EXTRACTION_AUTHOR,
                      isExtraction: true,
                      savedAt: new Date(savedAt.getTime() - EXTRACTION_AGE_MS),
                    },
                  ]
                : []);

            next[cellKey] = {
              ...existing,
              value,
              isEditing: false,
              originalValue: existing?.originalValue ?? previousValue,
              // The agent's own value is not a lawyer's edit, so the modified
              // marker stays off — the draft state is what needs attention.
              isModified: false,
              revisions: appendRevision(history, {
                id: `${cellKey}-${savedAt.getTime()}`,
                value,
                author: EXTRACTION_AUTHOR,
                isProposal: true,
                savedAt,
              }),
            };
          });

          return next;
        });

        setProposedCells((prev) => {
          const next = new Set(prev);
          cells.forEach(({ docId, colKey }) =>
            next.add(makeCellKey(docId, colKey)),
          );
          return next;
        });
        setRuleReviews((prev) => {
          const next = { ...prev };
          cells.forEach(({ docId }) => {
            next[docId] = { state: 'draft' };
          });
          return next;
        });
      },
      [],
    );

    /** Records the lawyer's sign-off on whole rules. */
    const approveRules = useCallback(
      (docIds: Iterable<string>) => {
        const ids = new Set(
          [...docIds].filter((docId) => ruleReviews[docId]?.state === 'draft'),
        );
        if (ids.size === 0) return;

        markContentChanged();
        const approvedAt = new Date();
        setRuleReviews((prev) => {
          const next = { ...prev };
          ids.forEach((docId) => {
            next[docId] = {
              state: 'approved',
              approvedBy: CURRENT_AUTHOR,
              approvedAt,
            };
          });
          return next;
        });
        setProposedCells((prev) => {
          const next = new Set<string>();
          prev.forEach((cellKey) => {
            if (!ids.has(splitCellKey(cellKey).docId)) next.add(cellKey);
          });
          return next;
        });
      },
      [markContentChanged, ruleReviews],
    );

    /** Brings a rule into view without disturbing the selection. */
    const scrollRuleIntoView = (docId: string) => {
      requestAnimationFrame(() => {
        scrollContainerRef.current
          ?.querySelector(`[data-row-id="${docId}"]`)
          ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
    };

    const openRuleReview = useCallback((docId: string) => {
      setInlinePanelData({ type: 'rule-review', docId });
      setInlinePanelOpen(true);
      setReviewFocusDocId(docId);
      scrollRuleIntoView(docId);
    }, []);

    /**
     * Carries the stepper past a rule that has just left the queue, landing on
     * whichever draft took its place. Closes the panel once nothing is left,
     * which is how a completed batch ends.
     */
    const advanceReviewPast = useCallback(
      (approvedDocId: string) => {
        const remaining = draftDocIds.filter(
          (docId) => docId !== approvedDocId,
        );
        if (remaining.length === 0) {
          setInlinePanelOpen(false);
          setReviewFocusDocId(null);
          return;
        }

        const approvedIndex = draftDocIds.indexOf(approvedDocId);
        // The rules after it shift down one, so the same index is the next rule.
        const nextIndex =
          approvedIndex === -1 ? 0 : approvedIndex % remaining.length;
        openRuleReview(remaining[nextIndex]!);
      },
      [draftDocIds, openRuleReview],
    );

    /** Moves through the queue without deciding anything, wrapping at the ends. */
    const navigateReview = useCallback(
      (fromDocId: string, direction: 1 | -1) => {
        if (draftDocIds.length === 0) return;
        const fromIndex = Math.max(0, draftDocIds.indexOf(fromDocId));
        const nextIndex =
          (fromIndex + direction + draftDocIds.length) % draftDocIds.length;
        openRuleReview(draftDocIds[nextIndex]!);
      },
      [draftDocIds, openRuleReview],
    );

    // Expose bulk action methods to parent component
    useImperativeHandle(
      ref,
      () => ({
        selectAllRows: () => {
          const allDocumentIds = new Set(displayDocuments.map((doc) => doc.id));
          setSelectedRows(allDocumentIds);
          onSelectedRowsChange?.(allDocumentIds);
        },
        deselectAllRows: () => {
          setSelectedRows(new Set());
          onSelectedRowsChange?.(new Set());
        },
        deleteSelectedRows: () => {
          // Off the full list, not the visible one: with the draft filter on,
          // filtering `displayDocuments` would delete every rule the filter is
          // hiding along with the selected ones.
          const remainingDocuments = documents.filter(
            (doc) => !selectedRows.has(doc.id),
          );
          markContentChanged();
          setDocuments(remainingDocuments);
          setSelectedRows(new Set());
          onSelectedRowsChange?.(new Set());
          purgeCellState((parts) => selectedRows.has(parts.docId));
          setRuleReviews((prev) =>
            Object.fromEntries(
              Object.entries(prev).filter(
                ([docId]) => !selectedRows.has(docId),
              ),
            ),
          );
        },
        addDocuments: (newDocuments: Document[]) => {
          // Add documents with processing state
          const documentsWithProcessing = newDocuments.map((doc) => ({
            ...doc,
            isProcessing: true,
          })) as Document[];

          setDocuments((prev) => [...prev, ...documentsWithProcessing]);

          // Process each document individually with staggered timing
          documentsWithProcessing.forEach((doc) => {
            // Random processing time between 3-6 seconds
            const processingTime = 3000 + Math.random() * 3000;

            registerTimer(
              setTimeout(() => {
                setDocuments((prev) =>
                  prev.map((d) =>
                    d.id === doc.id ? { ...d, isProcessing: false } : d,
                  ),
                );
              }, processingTime),
            );
          });
        },
        clearDocuments: () => {
          resetGridState([]);
        },
        /**
         * Clears rows but keeps the playbook column headers so generation can
         * stream into an empty grid (Playbook Studio equivalent of starting
         * from a blank rule list while the schema stays put).
         */
        prepareForGeneration: () => {
          markContentChanged();
          resetGridState(createEmptySeedColumns() as Column[]);
        },
        /**
         * Appends a rule row with its Position title filled and every data cell
         * in the skeleton loading state, ready for progressive reveal.
         */
        appendGeneratingRow: (row: { id: string; name: string }) => {
          const doc = {
            id: row.id,
            name: row.name,
            type: 'PLAYBOOK',
            size: 100_000,
            lastModified: new Date().toISOString().split('T')[0]!,
          } as Document;

          setDocuments((prev) => [...prev, doc]);
          // Everything the agent writes arrives as a draft: the rule is the
          // agent's proposal until a lawyer has read it.
          setRuleReviews((prev) => ({ ...prev, [row.id]: { state: 'draft' } }));
          setDataColumns((prev) =>
            prev.map((col) => ({
              ...col,
              cellData: { ...col.cellData, [row.id]: '' },
              cellLoadingStates: {
                ...col.cellLoadingStates,
                [row.id]: true,
              },
            })),
          );

          // Keep the new row in view as the stream progresses.
          requestAnimationFrame(() => {
            const scroller = scrollContainerRef.current;
            if (scroller) {
              scroller.scrollTop = scroller.scrollHeight;
            }
          });
        },
        /** Fills one cell and clears its skeleton. */
        revealGeneratedCell: (
          docId: string,
          columnKey: string,
          value: string,
        ) => {
          setDataColumns((prev) =>
            prev.map((col) => {
              if (col.key !== columnKey) return col;
              return {
                ...col,
                cellData: { ...col.cellData, [docId]: value },
                cellLoadingStates: {
                  ...col.cellLoadingStates,
                  [docId]: false,
                },
              };
            }),
          );
        },
        /** Clears any remaining skeletons on a row (empty cells stay empty). */
        finishGeneratedRow: (docId: string) => {
          setDataColumns((prev) =>
            prev.map((col) => ({
              ...col,
              cellLoadingStates: {
                ...col.cellLoadingStates,
                [docId]: false,
              },
            })),
          );
        },
        refreshCellData: (cellKeys: string[]) => {
          // Group the requested cells by column so each column is rewritten once.
          const docIdsByColumn = new Map<string, Set<string>>();
          cellKeys.forEach((cellKey) => {
            const { docId, colKey } = splitCellKey(cellKey);
            if (!docId || !colKey || colKey === 'name') return;
            const docIds = docIdsByColumn.get(colKey) ?? new Set<string>();
            docIds.add(docId);
            docIdsByColumn.set(colKey, docIds);
          });
          if (docIdsByColumn.size === 0) return;
          markContentChanged();

          const setLoading = (loading: boolean, withValue: boolean) =>
            setDataColumns((prevColumns) =>
              prevColumns.map((col) => {
                const docIds = docIdsByColumn.get(col.key);
                if (!docIds) return col;

                const cellLoadingStates = { ...col.cellLoadingStates };
                const cellData = { ...col.cellData };
                docIds.forEach((docId) => {
                  cellLoadingStates[docId] = loading;
                  if (withValue) cellData[docId] = 'Updated data';
                });

                return { ...col, cellLoadingStates, cellData };
              }),
            );

          const proposals = [...docIdsByColumn].flatMap(([colKey, docIds]) =>
            [...docIds].map((docId) => ({
              docId,
              colKey,
              value: 'Updated data',
            })),
          );

          setLoading(true, false);
          registerTimer(
            setTimeout(() => {
              setLoading(false, true);
              /*
               * A re-run is the agent overwriting the lawyer's rule, so the
               * rules it touched go back to draft with the new cells marked.
               * Skipped entirely when the review stage is off, so a refresh
               * leaves the same trail it always did.
               */
              if (isRuleReviewEnabled) recordAgentProposals(proposals);
            }, REFRESH_DURATION_MS),
          );
        },
        /** Signs off the given rules on the lawyer's behalf. */
        approveRules: (docIds: string[]) => approveRules(docIds),
        approveSelectedRules: () => approveRules(selectedRows),
        /** Opens the review stepper on the first rule still in draft. */
        startRuleReview: () => {
          const first = draftDocIds[0];
          if (first) openRuleReview(first);
        },
        flagSelectedCells: (
          selectedCells: string[],
          state: CellState = 'incorrect',
        ) => {
          markContentChanged();
          // Flag selected cells with the specified state
          setCellStates((prev) => {
            const newCellStates = new Map(prev);
            selectedCells.forEach((cellKey) => {
              newCellStates.set(cellKey, state);
            });
            return newCellStates;
          });
        },
        deselectAllCells: clearSelection,
        getExportData: () => ({
          documents,
          columns: dataColumns,
        }),
      }),
      [
        approveRules,
        clearSelection,
        draftDocIds,
        isRuleReviewEnabled,
        markContentChanged,
        openRuleReview,
        purgeCellState,
        recordAgentProposals,
        registerTimer,
        resetGridState,
        displayDocuments,
        documents,
        selectedRows,
        onSelectedRowsChange,
        onSelectedCellsChange,
        dataColumns,
      ],
    );

    /*
     * Every painted cell resolves its value, so the column lookup is indexed
     * rather than scanned — the linear `find` ran once per cell, which is
     * ~500 scans of the column list on each render.
     */
    const columnByKey = useMemo(() => {
      const index = new Map<string, Column>();
      dataColumns.forEach((col) => index.set(col.key, col));
      return index;
    }, [dataColumns]);

    const documentById = useMemo(() => {
      const index = new Map<string, Document>();
      displayDocuments.forEach((doc) => index.set(doc.id, doc));
      return index;
    }, [displayDocuments]);

    const getCellValue = (docId: string, columnKey: string) =>
      readCellValue(
        docId,
        columnKey,
        cellData,
        columnByKey.get(columnKey),
        documentById.get(docId)?.name || '',
      );

    /**
     * Flattens one row into the position plus every data column, read live so
     * the panel reflects edits made while it is open. Enum and yes/no columns
     * carry badge variants so they keep the grid's colour coding.
     */
    const buildRowDetailFields = (docId: string): RowDetailField[] => [
      {
        key: 'name',
        label: columns[0]?.label ?? 'Position',
        value: getCellValue(docId, 'name'),
        columnType: 'verbatim',
      },
      ...dataColumns.map((column) => {
        const value = getCellValue(docId, column.key);

        return {
          key: column.key,
          label: column.label,
          value,
          columnType: column.type,
          enumOptions: column.enumOptions,
          badges: getCellBadges(value, column.type, column.key) ?? undefined,
        };
      }),
    ];

    // Set cell value
    const setCellValue = (
      docId: string,
      columnKey: string,
      value: string,
      isUserEdit = false,
      previousValue?: string,
    ) => {
      const cellKey = makeCellKey(docId, columnKey);
      setCellData((prev) => {
        const existing = prev[cellKey];
        // For first user edit, capture the original value from:
        // 1. Explicitly passed previousValue (most reliable)
        // 2. Existing cellData value
        // 3. Never fall back to the new value
        const originalToStore =
          isUserEdit && !existing?.isModified
            ? previousValue || existing?.value
            : existing?.originalValue;

        if (!isUserEdit) {
          return {
            ...prev,
            [cellKey]: {
              ...existing,
              value,
              isEditing: false,
              originalValue: originalToStore,
              isModified: existing?.isModified,
            },
          };
        }

        const savedAt = new Date();
        /*
         * The extraction only becomes an entry once there is something to
         * compare it against, so the first edit writes both: where the value
         * came from, then what the user made of it.
         */
        const history = existing?.revisions ?? [
          {
            id: `${cellKey}-extraction`,
            value: originalToStore ?? '',
            author: EXTRACTION_AUTHOR,
            isExtraction: true,
            savedAt: new Date(savedAt.getTime() - EXTRACTION_AGE_MS),
          },
        ];

        return {
          ...prev,
          [cellKey]: {
            value,
            isEditing: false,
            originalValue: originalToStore,
            isModified: true,
            revisions: appendRevision(history, {
              id: `${cellKey}-${savedAt.getTime()}`,
              value,
              author: CURRENT_AUTHOR,
              savedAt,
            }),
          },
        };
      });
    };

    /**
     * Puts an earlier value back. Restoring appends rather than rewinding, so
     * the history stays a record of what the cell has held — including the
     * decision to go back — and the newest entry is always what the grid shows.
     */
    const restoreCellRevision = (
      docId: string,
      columnKey: string,
      revisionId: string,
    ) => {
      const cellKey = makeCellKey(docId, columnKey);
      markContentChanged();
      setCellData((prev) => {
        const existing = prev[cellKey];
        const revision = existing?.revisions?.find((r) => r.id === revisionId);
        if (!existing || !revision) return prev;

        const savedAt = new Date();
        return {
          ...prev,
          [cellKey]: {
            ...existing,
            value: revision.value,
            isEditing: false,
            // Back at the extraction, the cell is no longer an edited one.
            isModified: revision.value !== existing.originalValue,
            revisions: appendRevision(existing.revisions ?? [], {
              id: `${cellKey}-${savedAt.getTime()}`,
              value: revision.value,
              author: CURRENT_AUTHOR,
              savedAt,
            }),
          },
        };
      });
    };

    // Helper function to parse cell key into row and column positions
    /*
     * Selection geometry runs off the *visual* grid, so both axes are indexed
     * against what the user actually sees: rows in their seeded order, columns
     * in their current (drag-reordered) order. Column index -1 is the sticky
     * Position column, which sits to the left of the data columns.
     */
    const rowIndexById = useMemo(() => {
      const index = new Map<string, number>();
      displayDocuments.forEach((doc, i) => index.set(doc.id, i));
      return index;
    }, [displayDocuments]);

    const colIndexByKey = useMemo(() => {
      const index = new Map<string, number>([['name', -1]]);
      dataColumns.forEach((col, i) => index.set(col.key, i));
      return index;
    }, [dataColumns]);

    const parseCellKey = useCallback(
      (cellKey: string) => {
        const { docId, colKey } = splitCellKey(cellKey);
        return {
          docId,
          colKey,
          rowIndex: rowIndexById.get(docId) ?? -1,
          colIndex: colIndexByKey.get(colKey) ?? -1,
        };
      },
      [rowIndexById, colIndexByKey],
    );

    const generateCellKey = makeCellKey;

    // Rectangular range between two cells, in visual order.
    const calculateSelectionRange = useCallback(
      (startCell: string, endCell: string) => {
        const start = parseCellKey(startCell);
        const end = parseCellKey(endCell);

        const cellsInRange = new Set<string>();
        if (start.rowIndex < 0 || end.rowIndex < 0) return cellsInRange;

        const minRow = Math.min(start.rowIndex, end.rowIndex);
        const maxRow = Math.max(start.rowIndex, end.rowIndex);
        const minCol = Math.min(start.colIndex, end.colIndex);
        const maxCol = Math.max(start.colIndex, end.colIndex);

        for (
          let row = minRow;
          row <= maxRow && row < displayDocuments.length;
          row++
        ) {
          const doc = displayDocuments[row];
          if (!doc) continue;
          for (let col = minCol; col <= maxCol; col++) {
            if (col === -1) {
              cellsInRange.add(generateCellKey(doc.id, 'name'));
            } else if (dataColumns[col]) {
              cellsInRange.add(generateCellKey(doc.id, dataColumns[col]!.key));
            }
          }
        }

        return cellsInRange;
      },
      [parseCellKey, displayDocuments, dataColumns],
    );

    /*
     * Outline around each contiguous block of selected cells: a cell draws an
     * edge only where its neighbour in that direction is unselected (or it is
     * at the grid boundary). Computed once per selection change into a lookup
     * rather than per cell during render — with a large range selected the
     * old per-cell version re-derived both indices for every painted cell.
     */
    const selectionBorderByKey = useMemo(() => {
      const borderByKey = new Map<string, string>();
      if (selectedCells.size === 0) return borderByKey;

      const edge = 'border-dt-line-outline';
      const lastRow = displayDocuments.length - 1;
      const lastCol = dataColumns.length - 1;

      const keyAt = (rowIndex: number, colIndex: number) => {
        const doc = displayDocuments[rowIndex];
        if (!doc) return null;
        if (colIndex === -1) return generateCellKey(doc.id, 'name');
        const column = dataColumns[colIndex];
        return column ? generateCellKey(doc.id, column.key) : null;
      };

      const isSelected = (rowIndex: number, colIndex: number) => {
        const neighbour = keyAt(rowIndex, colIndex);
        return neighbour !== null && selectedCells.has(neighbour);
      };

      selectedCells.forEach((cellKey) => {
        const { rowIndex, colIndex } = parseCellKey(cellKey);
        if (rowIndex < 0 || rowIndex > lastRow) return;
        if (colIndex < -1 || colIndex > lastCol) return;

        const borders: string[] = [];
        if (!isSelected(rowIndex - 1, colIndex))
          borders.push(`border-t-2 ${edge}`);
        if (!isSelected(rowIndex + 1, colIndex))
          borders.push(`border-b-2 ${edge}`);
        // The Position column is the grid's left edge, so it never has a
        // left-hand neighbour to merge with.
        if (colIndex === -1 || !isSelected(rowIndex, colIndex - 1))
          borders.push(`border-l-2 ${edge}`);
        if (!isSelected(rowIndex, colIndex + 1))
          borders.push(`border-r-2 ${edge}`);

        borderByKey.set(cellKey, borders.join(' '));
      });

      return borderByKey;
    }, [selectedCells, displayDocuments, dataColumns, parseCellKey]);

    const getSelectionBorderClasses = useCallback(
      (cellKey: string) => selectionBorderByKey.get(cellKey) ?? '',
      [selectionBorderByKey],
    );

    const isAllSelected =
      selectedRows.size === displayDocuments.length &&
      displayDocuments.length > 0;
    const isIndeterminate =
      selectedRows.size > 0 && selectedRows.size < displayDocuments.length;

    /*
     * Cells clip at the column width and the full value is otherwise only
     * reachable by opening the reasoning panel, so anything likely to overflow
     * carries its text as a native tooltip. Estimating from the column width
     * costs one comparison per cell — measuring each one for real would mean
     * laying out the whole grid, and a Radix tooltip per cell would mean ~500
     * of them mounted at once. Short values get no tooltip so hovering the
     * grid stays quiet.
     */
    const overflowTitle = useCallback(
      (value: string, columnWidth: number) => {
        if (!value) return undefined;
        const charsPerLine = Math.floor(columnWidth / APPROX_CHAR_WIDTH_PX);
        const visibleChars = textWrapping ? charsPerLine * 3 : charsPerLine;
        return value.length > visibleChars ? value : undefined;
      },
      [textWrapping],
    );

    /*
     * A shift-click means "extend the cell range", but the browser also reads it
     * as "extend the text selection" and paints a highlight across every cell in
     * between. Suppressing the default on mousedown keeps the range crisp while
     * leaving ordinary text selection inside a single cell intact.
     */
    const handleCellMouseDown = useCallback((event: React.MouseEvent) => {
      if (event.shiftKey) {
        event.preventDefault();
        window.getSelection()?.removeAllRanges();
      }
    }, []);

    // Handle cell click
    const handleCellClick = (
      docId: string,
      columnKey: string,
      event?: React.MouseEvent,
    ) => {
      const cellKey = makeCellKey(docId, columnKey);

      // Check if Shift key is held for contiguous selection
      if (event && event.shiftKey && selectionRange.startCell) {
        // Extend selection from start cell to this cell
        const cellsInRange = calculateSelectionRange(
          selectionRange.startCell,
          cellKey,
        );
        setSelectionRange((prev) => ({
          ...prev,
          endCell: cellKey,
          cells: cellsInRange,
        }));
        setSelectedCells(cellsInRange);
      } else if (event && (event.ctrlKey || event.metaKey)) {
        // Ctrl/Cmd + Click: Toggle individual cell selection
        setSelectedCells((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(cellKey)) {
            newSet.delete(cellKey);
          } else {
            newSet.add(cellKey);
          }
          return newSet;
        });
        setSelectedCell(cellKey);
        setSelectionRange({
          startCell: cellKey,
          endCell: null,
          cells: new Set(),
        });
      } else {
        // Regular click: Start new contiguous selection
        setSelectedCell(cellKey);
        setSelectedCells(new Set([cellKey]));
        setSelectionRange({
          startCell: cellKey,
          endCell: null,
          cells: new Set([cellKey]),
        });
      }

      // Get the cell value and document info
      const cellValue = getCellValue(docId, columnKey);
      const document = documents.find((doc) => doc.id === docId);
      const column = dataColumns.find((col) => col.key === columnKey);

      if (!document) return;

      if (columnKey === 'name') {
        // The position cell stands for the whole row, so it opens the row's
        // details rather than the analysis for a single answer.
        openRowDetails(docId);
        return;
      }

      if (column) {
        /*
         * Opens for an empty cell too: a column the extraction had nothing to say
         * about is exactly where someone wants to leave their own note, and the
         * panel is where the value can be written.
         */
        setInlinePanelData({
          type: 'ai-analysis',
          cellValue,
          columnName: column.label,
          docId,
          columnKey,
          columnType: column.type,
          enumOptions: (column as any).enumOptions || [],
        });
        setInlinePanelOpen(true);
      }
    };

    // Handle cell double click to edit
    const handleCellDoubleClick = (docId: string, columnKey: string) => {
      // The position is a rule's name, often a full sentence, and it is edited
      // in the row's panel rather than in a cell the width of one column.
      if (columnKey === 'name') {
        openRowDetails(docId, { editKey: 'name' });
        return;
      }

      const cellKey = makeCellKey(docId, columnKey);
      const currentValue = getCellValue(docId, columnKey) || '';
      setEditingCell(cellKey);
      setEditingValue(currentValue);
      setEditingOriginalValue(currentValue); // Capture original value before editing

      // Capture column info for type-aware editing
      const column = dataColumns.find((col) => col.key === columnKey);
      if (column) {
        setEditingColumnInfo({
          type: column.type,
          enumOptions: (column as any).enumOptions,
          key: column.key,
        });
      } else {
        // For document name column or unknown columns, use verbatim
        setEditingColumnInfo({ type: 'verbatim', key: columnKey });
      }

      setCellData((prev) => ({
        ...prev,
        [cellKey]: { ...prev[cellKey], isEditing: true } as CellData,
      }));
    };

    /*
     * Writes an edited value, wherever the edit came from — the in-grid editor
     * or the analysis panel. A flag describes the value that was flagged, so it
     * is dropped once that value is replaced.
     */
    const commitCellEdit = (
      docId: string,
      columnKey: string,
      nextValue: string,
      previousValue: string,
    ) => {
      // Saving an untouched editor is not a change to prompt about later.
      if (nextValue !== previousValue) markContentChanged();
      setCellValue(docId, columnKey, nextValue, true, previousValue);
      const cellKey = makeCellKey(docId, columnKey);
      /*
       * Rewriting a proposed value settles that cell — the words are the
       * lawyer's now. The rule stays in draft: sign-off is a decision about the
       * whole rule, not a side effect of typing in one of its cells.
       */
      setProposedCells((prev) => {
        if (!prev.has(cellKey)) return prev;
        const next = new Set(prev);
        next.delete(cellKey);
        return next;
      });
      const currentState = cellStates.get(cellKey);
      if (currentState && currentState !== 'unflagged') {
        setCellStates((prev) => {
          const newMap = new Map(prev);
          newMap.delete(cellKey);
          return newMap;
        });
      }
    };

    // Handle cell edit save
    const handleCellEditSave = (docId: string, columnKey: string) => {
      commitCellEdit(docId, columnKey, editingValue, editingOriginalValue);
      setEditingCell(null);
      setEditingValue('');
      setEditingOriginalValue('');
      setEditingColumnInfo(null);
    };

    // Handle cell edit cancel
    const handleCellEditCancel = () => {
      setEditingCell(null);
      setEditingValue('');
      setEditingOriginalValue('');
      setEditingColumnInfo(null);
    };

    // Helper to get cell state
    const getCellState = (cellKey: string): CellState => {
      return cellStates.get(cellKey) || 'unflagged';
    };

    // Helper to check if cell is modified by user
    const isCellModified = (cellKey: string): boolean => {
      return cellData[cellKey]?.isModified || false;
    };

    // Helper to get original cell value
    const getOriginalCellValue = (cellKey: string): string | undefined => {
      return cellData[cellKey]?.originalValue;
    };

    const getCellRevisions = (cellKey: string): CellRevision[] =>
      cellData[cellKey]?.revisions ?? [];

    /*
     * The document-level listeners below stay mounted for the life of the grid
     * and read the current edit through this ref, rather than re-binding every
     * time the draft value changes.
     */
    const commitEditRef = useRef<() => void>(() => {});
    const editingCellRef = useRef(editingCell);
    const inlinePanelOpenRef = useRef(inlinePanelOpen);
    const handleCellEditCancelRef = useRef(handleCellEditCancel);
    useEffect(() => {
      editingCellRef.current = editingCell;
      inlinePanelOpenRef.current = inlinePanelOpen;
      handleCellEditCancelRef.current = handleCellEditCancel;
      commitEditRef.current = () => {
        if (!editingCell) return;
        const { docId, colKey } = splitCellKey(editingCell);
        handleCellEditSave(docId, colKey);
      };
    });

    useEffect(() => {
      const isOutsideGrid = (target: EventTarget | null) =>
        !tableRef.current?.contains(target as Node);

      /*
       * The analysis panel, the layers it opens (citation hover cards, menus,
       * dialogs) and the source-document drawer are part of the same working
       * surface as the grid. Clicking in them must leave the cell selection
       * alone, because the selection is what keeps the panel open.
       */
      const isCompanionSurface = (target: EventTarget | null) => {
        if (inlinePanelRef.current?.contains(target as Node)) return true;
        return (
          target instanceof Element &&
          target.closest(
            '[data-radix-popper-content-wrapper], [data-tp-drawer], [role="dialog"], [role="alertdialog"]',
          ) !== null
        );
      };

      /*
       * A dropdown the cell editor opened is portalled out of the grid, so
       * picking from it looks like a click away. Committing there would write
       * the value the cell held before the choice was made — the pick lands
       * after this event — and close the editor on the way out.
       */
      const isEditorLayer = (target: EventTarget | null) =>
        target instanceof Element &&
        target.closest('[data-slot="select-content"]') !== null;

      // Clicking away commits the edit, matching spreadsheet behaviour —
      // previously the draft was dropped on the floor with no way back.
      const handlePointerDown = (event: MouseEvent) => {
        if (!isOutsideGrid(event.target)) return;
        if (isEditorLayer(event.target)) return;
        commitEditRef.current();
        if (event.ctrlKey || event.metaKey) return;
        if (isCompanionSurface(event.target)) return;
        clearSelection();
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Escape') return;
        // Escape unwinds one layer at a time: the open editor, then the
        // reasoning panel, then the selection.
        if (editingCellRef.current) {
          handleCellEditCancelRef.current();
        } else if (inlinePanelOpenRef.current) {
          setInlinePanelOpen(false);
        } else {
          clearSelection();
        }
      };

      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handlePointerDown);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [clearSelection]);

    // Handle scroll detection for document column drop shadow
    const isScrolledRef = useRef(false);
    useEffect(() => {
      let rafId: number | null = null;

      const handleScroll = () => {
        if (rafId) return; // Skip if already scheduled

        rafId = requestAnimationFrame(() => {
          rafId = null;
          if (scrollContainerRef.current) {
            const scrollLeft = scrollContainerRef.current.scrollLeft;
            const shouldBeScrolled = scrollLeft > 0;
            // Only update state if value actually changed
            if (shouldBeScrolled !== isScrolledRef.current) {
              isScrolledRef.current = shouldBeScrolled;
              setIsScrolled(shouldBeScrolled);
            }
          }
        });
      };

      const scrollElement = scrollContainerRef.current;
      if (scrollElement) {
        scrollElement.addEventListener('scroll', handleScroll, {
          passive: true,
        });
        return () => {
          scrollElement.removeEventListener('scroll', handleScroll);
          if (rafId) cancelAnimationFrame(rafId);
        };
      }
    }, []);

    // Handle wheel events for horizontal scrolling with mouse
    useEffect(() => {
      const handleWheel = (e: WheelEvent) => {
        const scrollElement = scrollContainerRef.current;
        if (!scrollElement) return;

        // Check if Shift is pressed - convert vertical scroll to horizontal
        if (e.shiftKey && e.deltaY !== 0) {
          e.preventDefault();
          scrollElement.scrollBy({
            left: e.deltaY,
            behavior: 'auto',
          });
        }
        // Otherwise, allow normal vertical scrolling
      };

      const scrollElement = scrollContainerRef.current;
      if (scrollElement) {
        scrollElement.addEventListener('wheel', handleWheel, {
          passive: false,
        });
        return () => scrollElement.removeEventListener('wheel', handleWheel);
      }
    }, []);

    return (
      <div className="bg-dt-bg-primary relative flex h-full">
        <div className="flex min-w-0 flex-1 transition-all duration-300">
          <div
            className={cn(
              'min-w-0 transition-all duration-300',
              inlinePanelOpen ? 'mr-96 flex-1' : 'flex-1',
            )}
          >
            <div className="flex h-full flex-col">
              {/* Excel-like Table */}
              <div
                className="relative flex min-h-0 flex-1 flex-col"
                ref={tableRef}
              >
                {/* Scrollable Container for both header and body */}
                <div
                  className={cn(
                    'tabular-playbook-scroll flex-1',
                    /*
                     * With no rules the empty state is all there is to look at,
                     * so it takes the room under the header and sits in the
                     * middle of it rather than tucked against the column
                     * labels. Only while empty: the rows rely on the plain
                     * block flow for their sticky columns and content widths.
                     */
                    displayDocuments.length === 0 && 'flex flex-col',
                  )}
                  ref={scrollContainerRef}
                >
                  {/* Sticky Header */}
                  <div
                    className="border-dt-line-secondary bg-dt-bg-primary sticky top-0 z-30 flex-shrink-0 border-b"
                    style={{ overflow: 'visible' }}
                  >
                    <div
                      className="flex min-w-fit"
                      style={{ overflow: 'visible' }}
                    >
                      {/* Sticky Checkbox Column */}
                      <div className="border-dt-line-secondary bg-dt-bg-tertiary sticky left-0 z-10 flex w-12 items-center justify-center border-r p-2">
                        <Checkbox
                          aria-label="Select all rules"
                          checked={
                            isIndeterminate ? 'indeterminate' : isAllSelected
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </div>

                      {/* Sticky Position Column */}
                      <div
                        className="border-dt-line-secondary bg-dt-bg-tertiary text-dt-fg-primary group relative sticky left-12 z-10 flex items-center truncate border-r p-2 text-sm font-medium"
                        style={{
                          width: `${documentColumnWidth}px`,
                          minWidth: `${documentColumnWidth}px`,
                          overflow: 'visible',
                          ...(dataColumns.length > 0 && isScrolled
                            ? {
                                boxShadow:
                                  '10px 0 15px -3px rgba(0, 0, 0, 0.06), 4px 0 6px -4px rgba(0, 0, 0, 0.06)',
                              }
                            : {}),
                        }}
                      >
                        <TooltipProvider>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <span className="flex-1 cursor-default truncate pr-2">
                                Position
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                              <p>Position</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {/* Document Column Resize Handle */}
                        <ColumnResizeHandle
                          columnKey="document"
                          currentWidth={documentColumnWidth}
                          onResize={handleDocumentColumnResize}
                          disabled={documents.length === 0}
                          fullHeight
                          tableHeight={resizeHandleHeight}
                          scrollContainerRef={scrollContainerRef}
                        />
                      </div>

                      {/* Data Columns with Drag-and-Drop Reordering */}
                      {dataColumns.length > 0 && (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleColumnDragEnd}
                          modifiers={[restrictToHorizontalAxis]}
                        >
                          <SortableContext
                            items={dataColumns.map((col) => col.key)}
                            strategy={horizontalListSortingStrategy}
                          >
                            {dataColumns.map((column) => {
                              const columnWidthValue =
                                getEffectiveColumnWidth(column);

                              return (
                                <SortableColumnHeader
                                  key={column.key}
                                  column={column}
                                  columnWidth={columnWidthValue}
                                  onColumnResize={handleColumnResize}
                                  disableResize={documents.length === 0}
                                  resizeHandleHeight={resizeHandleHeight}
                                  scrollContainerRef={scrollContainerRef}
                                >
                                  <TooltipProvider>
                                    <Tooltip delayDuration={300}>
                                      <TooltipTrigger asChild>
                                        <span className="flex-1 cursor-default truncate">
                                          {column.label}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="bottom"
                                        className="max-w-xs"
                                      >
                                        <p>{column.label}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </SortableColumnHeader>
                              );
                            })}
                          </SortableContext>
                        </DndContext>
                      )}
                    </div>
                  </div>

                  {/*
                   * One shadow down the whole position column rather than one
                   * per row, which would show a seam at every row border.
                   */}
                  {dataColumns.length > 0 && isScrolled && shadowHeight > 0 && (
                    <div
                      className="pointer-events-none absolute left-12 top-0 z-10"
                      style={{
                        width: `${documentColumnWidth}px`,
                        height: `${shadowHeight}px`,
                        boxShadow:
                          '10px 0 15px -3px rgba(0, 0, 0, 0.06), 4px 0 6px -4px rgba(0, 0, 0, 0.06)',
                      }}
                    />
                  )}

                  {/* Scrollable Content */}
                  {displayDocuments.length === 0 ? (
                    /*
                     * A playbook with nothing in it and a search that found
                     * nothing are different problems: one wants a rule
                     * written, the other wants the search taken back.
                     */
                    isSearching ? (
                      <Empty className="min-h-64 flex-1">
                        <EmptyHeader>
                          <EmptyMedia variant="ring">
                            <Search strokeWidth={1.75} />
                          </EmptyMedia>
                          <EmptyTitle>No rules match</EmptyTitle>
                          <EmptyDescription>
                            Nothing in this playbook contains “{searchQuery}”.
                          </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={onClearSearch}
                          >
                            Clear search
                          </Button>
                        </EmptyContent>
                      </Empty>
                    ) : (
                      <Empty className="min-h-64 flex-1">
                        <EmptyHeader>
                          <EmptyMedia variant="ring">
                            <FileText strokeWidth={1.75} />
                          </EmptyMedia>
                          <EmptyTitle>No rules yet</EmptyTitle>
                          <EmptyDescription>
                            Attach a document in the playbook agent to generate
                            rules, or write the first one yourself.
                          </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddRule}
                          >
                            <Plus className="size-4" />
                            New rule
                          </Button>
                        </EmptyContent>
                      </Empty>
                    )
                  ) : (
                    <div
                      className="relative w-full min-w-fit"
                      ref={setRowsElement}
                    >
                      {displayDocuments.map((doc, rowIndex) => {
                        /*
                         * Renaming a rule writes to the cell, not to the
                         * document, so anything that speaks the rule's name
                         * has to read it the way the grid does — otherwise the
                         * delete prompt and the row's controls keep quoting
                         * the name it was extracted under.
                         */
                        const rowLabel =
                          getCellValue(doc.id, 'name') ||
                          doc.name ||
                          UNNAMED_RULE_LABEL;

                        return (
                          <div
                            key={doc.id}
                            data-row-id={doc.id}
                            className={cn(
                              'border-dt-line-secondary group/row relative flex w-full border-b',
                              (selectedRows.has(doc.id) ||
                                reviewFocusDocId === doc.id) &&
                                'bg-dt-bg-tertiary',
                            )}
                          >
                            {/* Sticky Row Number/Checkbox Column */}
                            <div
                              className={cn(
                                'border-dt-line-secondary group-hover/row:bg-dt-bg-tertiary sticky left-0 z-20 grid w-12 place-items-center border-r transition-colors duration-150',
                                selectedRows.has(doc.id) ||
                                  reviewFocusDocId === doc.id
                                  ? 'bg-dt-bg-tertiary'
                                  : 'bg-dt-bg-primary',
                                /*
                                 * The draft rail. It rides the sticky gutter
                                 * rather than the row so it stays in view when the
                                 * grid is scrolled sideways, and reads down the
                                 * table as the shape of the review backlog.
                                 */
                                isRuleDraft(doc.id) &&
                                  'border-l-warning border-l-2',
                              )}
                            >
                              {/*
                               * The row number and its checkbox occupy the same
                               * grid cell and swap on hover in CSS. Driving this
                               * from React state meant every row the pointer
                               * crossed re-rendered all ~500 cells.
                               */}
                              <span
                                aria-hidden
                                className={cn(
                                  'text-dt-fg-secondary col-start-1 row-start-1 select-none text-xs font-medium transition-opacity group-hover/row:opacity-0',
                                  selectedRows.has(doc.id) && 'opacity-0',
                                )}
                              >
                                {rowIndex + 1}
                              </span>
                              <Checkbox
                                aria-label={`Select ${rowLabel}`}
                                checked={selectedRows.has(doc.id)}
                                onCheckedChange={(checked) =>
                                  handleRowSelect(doc.id, checked === true)
                                }
                                className={cn(
                                  'col-start-1 row-start-1 opacity-0 transition-opacity focus-visible:opacity-100 group-hover/row:opacity-100',
                                  selectedRows.has(doc.id) && 'opacity-100',
                                )}
                              />
                            </div>

                            {/* Sticky Position Column */}
                            <div
                              className={cn(
                                'border-dt-line-secondary group/cell relative sticky left-12 z-20 border-r',
                                // Opaque either way — it sits over the scrolled
                                // columns — but it has to take the selected row's
                                // fill like every other cell, or the row reads as
                                // half-selected.
                                selectedRows.has(doc.id) ||
                                  reviewFocusDocId === doc.id
                                  ? 'bg-dt-bg-tertiary'
                                  : 'bg-dt-bg-primary',
                              )}
                              style={{
                                width: `${documentColumnWidth}px`,
                                minWidth: `${documentColumnWidth}px`,
                              }}
                            >
                              {(() => {
                                const cellKey = makeCellKey(doc.id, 'name');
                                const isSelected =
                                  selectedCells.has(cellKey) ||
                                  selectedCell === cellKey;
                                const currentCellState = getCellState(cellKey);
                                const cellValue =
                                  getCellValue(doc.id, 'name') || doc.name;

                                return (
                                  <div
                                    className={cn(
                                      // `h-full` for the same reason as the data
                                      // cells: the fill and ring live here, so
                                      // they have to span the row's height rather
                                      // than this cell's own content.
                                      'group-hover/row:bg-dt-bg-tertiary group-hover/cell:bg-dt-bg-secondary relative h-full cursor-pointer border-2 border-transparent bg-clip-border p-1 transition-colors duration-150',
                                      textWrapping && 'min-h-[5rem]',
                                      isSelected &&
                                        (getSelectionBorderClasses(cellKey) ||
                                          'ring-dt-line-outline ring-2 ring-inset'),
                                      currentCellState === 'incorrect' &&
                                        `border-l-destructive bg-destructive/10 border-l-2 ${isSelected ? getSelectionBorderClasses(cellKey) || 'ring-dt-line-outline ring-2 ring-inset' : ''}`,
                                      currentCellState === 'at-risk' &&
                                        `border-l-warning bg-warning/10 border-l-2 ${isSelected ? getSelectionBorderClasses(cellKey) || 'ring-dt-line-outline ring-2 ring-inset' : ''}`,
                                      currentCellState === 'verified' &&
                                        `border-l-success bg-success/10 border-l-2 ${isSelected ? getSelectionBorderClasses(cellKey) || 'ring-dt-line-outline ring-2 ring-inset' : ''}`,
                                    )}
                                    onMouseDown={handleCellMouseDown}
                                    onClick={(e) =>
                                      handleCellClick(doc.id, 'name', e)
                                    }
                                    onDoubleClick={() =>
                                      handleCellDoubleClick(doc.id, 'name')
                                    }
                                  >
                                    <div
                                      className="flex min-w-0 items-center gap-1.5 px-1 py-0 text-sm"
                                      title={overflowTitle(
                                        cellValue,
                                        documentColumnWidth,
                                      )}
                                    >
                                      {(doc as any).isProcessing && (
                                        <Spinner className="text-dt-fg-secondary size-3.5" />
                                      )}
                                      {/*
                                       * Ahead of the name rather than after it:
                                       * the row's delete button appears on hover
                                       * over the cell's right edge, and a state
                                       * marker that disappears under it every
                                       * time the pointer crosses the row is
                                       * worse than one that costs a little of
                                       * the name.
                                       */}
                                      {isRuleDraft(doc.id) && (
                                        <Badge
                                          variant="warning"
                                          className="shrink-0 self-center"
                                        >
                                          Draft
                                        </Badge>
                                      )}
                                      <span
                                        className={cn(
                                          'min-w-0 flex-1 py-1',
                                          textWrapping
                                            ? 'line-clamp-3'
                                            : 'truncate',
                                          (doc as any).isProcessing &&
                                            'opacity-60',
                                          currentCellState === 'incorrect' &&
                                            'text-destructive line-through',
                                        )}
                                      >
                                        {cellValue || (
                                          <span className="text-dt-fg-tertiary select-none">
                                            {EMPTY_CELL_PLACEHOLDER}
                                          </span>
                                        )}
                                      </span>
                                      {currentCellState === 'incorrect' && (
                                        <Flag className="fill-destructive text-destructive h-3.5 w-3.5 flex-shrink-0 self-center" />
                                      )}
                                      {currentCellState === 'at-risk' && (
                                        <AlertTriangle className="text-warning h-3.5 w-3.5 flex-shrink-0 self-center" />
                                      )}
                                      {currentCellState === 'verified' && (
                                        <CircleCheck className="fill-success text-background h-3.5 w-3.5 flex-shrink-0 self-center" />
                                      )}
                                    </div>

                                    {/* Row delete, revealed on hover or keyboard focus */}
                                    {!(doc as any).isProcessing && (
                                      <div className="absolute right-1 top-1/2 z-10 -translate-y-1/2 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover/row:opacity-100">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          aria-label={`Delete ${rowLabel}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClick(doc);
                                          }}
                                          className="border-dt-line-secondary bg-dt-bg-primary text-dt-fg-secondary hover:bg-destructive/10 hover:text-destructive h-6 w-6 border p-0 shadow-sm"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Data Columns */}
                            {dataColumns.length > 0 &&
                              dataColumns.map((column) => {
                                const cellKey = makeCellKey(doc.id, column.key);
                                const isSelected =
                                  selectedCells.has(cellKey) ||
                                  selectedCell === cellKey;
                                const isEditing = editingCell === cellKey;
                                const isCellLoading =
                                  column.cellLoadingStates?.[doc.id] ?? false;
                                const currentCellState = getCellState(cellKey);
                                const cellValue = getCellValue(
                                  doc.id,
                                  column.key,
                                );
                                const displayValue = cellValue || '';
                                const cellColumnWidth =
                                  getEffectiveColumnWidth(column);

                                return (
                                  <div
                                    key={column.key}
                                    className={cn(
                                      'border-dt-line-secondary group/cell relative border-r',
                                      selectedRows.has(doc.id) ||
                                        reviewFocusDocId === doc.id
                                        ? 'bg-dt-bg-tertiary'
                                        : 'bg-dt-bg-primary',
                                      /*
                                       * An open editor is wider than a narrow
                                       * column — Severity is 128px and the
                                       * field carries a tick and a cross — so
                                       * it has to sit above the next column,
                                       * which otherwise paints over the
                                       * buttons and swallows the clicks.
                                       */
                                      isEditing && 'z-30',
                                    )}
                                    style={{
                                      width: `${cellColumnWidth}px`,
                                      minWidth: `${cellColumnWidth}px`,
                                    }}
                                  >
                                    <div
                                      className={cn(
                                        // `h-full`: this element carries the
                                        // hover fill and selection ring, so it has
                                        // to span the row rather than just its own
                                        // content — a badge is shorter than a line
                                        // of prose, which otherwise left the fill
                                        // short of the cell's bottom edge.
                                        'group-hover/row:bg-dt-bg-tertiary group-hover/cell:bg-dt-bg-secondary relative h-full cursor-pointer border-2 border-transparent bg-clip-border p-1 transition-colors duration-150',
                                        textWrapping && 'min-h-[5rem]',
                                        isSelected &&
                                          (getSelectionBorderClasses(cellKey) ||
                                            'ring-dt-line-outline ring-2 ring-inset'),
                                        isEditing && 'bg-dt-bg-primary',
                                        currentCellState === 'incorrect' &&
                                          `border-l-destructive bg-destructive/10 border-l-2 ${isSelected ? getSelectionBorderClasses(cellKey) || 'ring-dt-line-outline ring-2 ring-inset' : ''}`,
                                        currentCellState === 'at-risk' &&
                                          `border-l-warning bg-warning/10 border-l-2 ${isSelected ? getSelectionBorderClasses(cellKey) || 'ring-dt-line-outline ring-2 ring-inset' : ''}`,
                                        currentCellState === 'verified' &&
                                          `border-l-success bg-success/10 border-l-2 ${isSelected ? getSelectionBorderClasses(cellKey) || 'ring-dt-line-outline ring-2 ring-inset' : ''}`,
                                      )}
                                      onMouseDown={handleCellMouseDown}
                                      onClick={(e) =>
                                        !isCellLoading &&
                                        handleCellClick(doc.id, column.key, e)
                                      }
                                      onDoubleClick={() =>
                                        !isCellLoading &&
                                        handleCellDoubleClick(
                                          doc.id,
                                          column.key,
                                        )
                                      }
                                    >
                                      {isCellLoading ? (
                                        <div className="px-1 py-1">
                                          <div className="animate-pulse">
                                            <div className="from-muted via-mz-gray-20 to-muted h-4 w-3/4 animate-[shimmer_1.5s_ease-in-out_infinite] rounded bg-gradient-to-r bg-[length:200%_100%]"></div>
                                          </div>
                                        </div>
                                      ) : isEditing ? (
                                        <CellEditInput
                                          columnType={
                                            editingColumnInfo?.type ||
                                            column.type
                                          }
                                          value={editingValue}
                                          onChange={setEditingValue}
                                          onSave={() =>
                                            handleCellEditSave(
                                              doc.id,
                                              column.key,
                                            )
                                          }
                                          onCancel={handleCellEditCancel}
                                          enumOptions={
                                            editingColumnInfo?.enumOptions ||
                                            (column as any).enumOptions
                                          }
                                          columnKey={column.key}
                                          compact={true}
                                        />
                                      ) : (column.type === 'yes-no' ||
                                          column.type === 'enum') &&
                                        displayValue ? (
                                        <div className="flex min-w-0 flex-wrap items-center gap-1 px-1 py-1 text-sm">
                                          <Badge
                                            size="lg"
                                            variant={getBadgeVariantForValue(
                                              displayValue,
                                              column.type,
                                              column.key,
                                            )}
                                            className={cn(
                                              'min-w-0 overflow-hidden transition-opacity',
                                              textWrapping ? '' : 'truncate',
                                            )}
                                          >
                                            <span
                                              className={cn(
                                                textWrapping
                                                  ? 'line-clamp-3'
                                                  : 'block truncate',
                                                currentCellState ===
                                                  'incorrect' && 'line-through',
                                              )}
                                            >
                                              {displayValue}
                                            </span>
                                          </Badge>
                                          {currentCellState === 'incorrect' && (
                                            <Flag className="fill-destructive text-destructive h-3.5 w-3.5 flex-shrink-0 self-center" />
                                          )}
                                          {currentCellState === 'at-risk' && (
                                            <AlertTriangle className="text-warning h-3.5 w-3.5 flex-shrink-0 self-center" />
                                          )}
                                          {currentCellState === 'verified' && (
                                            <CircleCheck className="fill-success text-background h-3.5 w-3.5 flex-shrink-0 self-center" />
                                          )}
                                        </div>
                                      ) : (
                                        <div
                                          className="flex min-w-0 items-center gap-1.5 px-1 py-0 text-sm"
                                          title={overflowTitle(
                                            displayValue,
                                            cellColumnWidth,
                                          )}
                                        >
                                          <span
                                            className={cn(
                                              'min-w-0 flex-1 py-1',
                                              textWrapping
                                                ? 'line-clamp-3'
                                                : 'truncate',
                                              currentCellState ===
                                                'incorrect' &&
                                                'text-destructive line-through',
                                            )}
                                          >
                                            {displayValue || (
                                              <span className="text-dt-fg-tertiary select-none">
                                                {EMPTY_CELL_PLACEHOLDER}
                                              </span>
                                            )}
                                          </span>
                                          {currentCellState === 'incorrect' && (
                                            <Flag className="fill-destructive text-destructive h-3.5 w-3.5 flex-shrink-0 self-center" />
                                          )}
                                          {currentCellState === 'at-risk' && (
                                            <AlertTriangle className="text-warning h-3.5 w-3.5 flex-shrink-0 self-center" />
                                          )}
                                          {currentCellState === 'verified' && (
                                            <CircleCheck className="fill-success text-background h-3.5 w-3.5 flex-shrink-0 self-center" />
                                          )}
                                        </div>
                                      )}

                                      {/*
                                       * Marks the cells a re-run actually changed,
                                       * so a draft rule shows where to look rather
                                       * than asking for the whole row to be reread.
                                       */}
                                      {isCellProposed(cellKey) &&
                                        !isCellLoading && (
                                          <span
                                            title="Updated by the playbook agent — awaiting approval"
                                            className="bg-warning pointer-events-none absolute right-1 top-1 size-1.5 rounded-full"
                                          />
                                        )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        );
                      })}

                      {/*
                       * The add row, pinned to the foot of the scrollport so a
                       * playbook of forty rules doesn't have to be scrolled to
                       * the bottom to gain a forty-first. Only the sticky
                       * gutter carries the control; the rest of the strip is
                       * there to close the table off.
                       */}
                      {!draftsOnly && !isSearching && (
                        <div
                          data-add-rule
                          className="border-dt-line-secondary bg-dt-bg-primary sticky bottom-0 z-20 flex w-full border-b"
                        >
                          <button
                            type="button"
                            onClick={handleAddRule}
                            className="border-dt-line-secondary text-dt-fg-secondary hover:bg-dt-bg-tertiary hover:text-dt-fg-primary focus-visible:outline-ring focus-visible:outline-solid sticky left-0 z-10 flex shrink-0 items-center gap-2 border-r bg-inherit px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2"
                            style={{
                              width: `${documentColumnWidth + ROW_GUTTER_WIDTH}px`,
                            }}
                          >
                            <Plus className="size-4 shrink-0" />
                            New rule
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Inline Analysis Panel */}
          <div
            ref={inlinePanelRef}
            className={cn(
              'border-dt-line-tertiary bg-dt-bg-primary absolute right-0 top-0 z-40 flex h-full w-96 flex-col border-l transition-transform duration-300 ease-in-out',
              inlinePanelOpen ? 'translate-x-0 shadow-lg' : 'translate-x-full',
            )}
          >
            {inlinePanelData && (
              <>
                <div className="border-dt-line-tertiary flex items-center justify-between gap-2 border-b p-4">
                  <h2 className="text-dt-fg-primary truncate text-sm font-semibold">
                    {inlinePanelData.type === 'row-details'
                      ? 'Row details'
                      : inlinePanelData.type === 'rule-review'
                        ? 'Review draft rules'
                        : inlinePanelData.columnName}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Close panel"
                    onClick={closeInlinePanel}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {inlinePanelData.type === 'row-details' ? (
                    <RowDetailsPanel
                      /*
                       * Remounting per row drops any half-finished edit rather
                       * than carrying the draft over to the next rule, and lets
                       * a second open of the same row start in its editor.
                       */
                      key={`${inlinePanelData.docId}${inlinePanelData.autoEditKey ?? ''}`}
                      fields={buildRowDetailFields(inlinePanelData.docId)}
                      placeholder={EMPTY_CELL_PLACEHOLDER}
                      autoEditKey={inlinePanelData.autoEditKey}
                      isDraft={isRuleDraft(inlinePanelData.docId)}
                      changedKeys={proposedKeysForRule(inlinePanelData.docId)}
                      onApprove={() => approveRules([inlinePanelData.docId])}
                      onSaveField={(key, value) => {
                        commitCellEdit(
                          inlinePanelData.docId,
                          key,
                          value,
                          getCellValue(inlinePanelData.docId, key),
                        );
                      }}
                    />
                  ) : inlinePanelData.type === 'rule-review' ? (
                    <RuleReviewPanel
                      ruleName={getCellValue(inlinePanelData.docId, 'name')}
                      // The rule's name is the panel's heading, so listing the
                      // Position column again would only repeat it.
                      fields={buildRowDetailFields(
                        inlinePanelData.docId,
                      ).filter((field) => field.key !== 'name')}
                      changedKeys={proposedKeysForRule(inlinePanelData.docId)}
                      position={
                        Math.max(
                          0,
                          draftDocIds.indexOf(inlinePanelData.docId),
                        ) + 1
                      }
                      queueLength={draftDocIds.length}
                      placeholder={EMPTY_CELL_PLACEHOLDER}
                      isNewRule={
                        proposedKeysForRule(inlinePanelData.docId).size === 0
                      }
                      onApprove={() => {
                        const docId = inlinePanelData.docId;
                        approveRules([docId]);
                        advanceReviewPast(docId);
                      }}
                      onNext={() => navigateReview(inlinePanelData.docId, 1)}
                      onPrevious={() =>
                        navigateReview(inlinePanelData.docId, -1)
                      }
                    />
                  ) : (
                    <AIReasoningModal
                      /*
                       * Remounting per cell drops any half-finished edit rather
                       * than carrying the draft over to the next cell.
                       */
                      key={makeCellKey(
                        inlinePanelData.docId,
                        inlinePanelData.columnKey,
                      )}
                      isOpen={true}
                      onClose={closeInlinePanel}
                      /*
                       * Read live rather than from the snapshot taken when the
                       * panel opened, so an edit made here shows immediately.
                       */
                      cellValue={getCellValue(
                        inlinePanelData.docId,
                        inlinePanelData.columnKey,
                      )}
                      columnName={inlinePanelData.columnName}
                      columnType={inlinePanelData.columnType}
                      columnKey={inlinePanelData.columnKey}
                      enumOptions={inlinePanelData.enumOptions}
                      isLoading={
                        columnByKey.get(inlinePanelData.columnKey)
                          ?.cellLoadingStates?.[inlinePanelData.docId] ?? false
                      }
                      onSaveCellValue={(nextValue) => {
                        commitCellEdit(
                          inlinePanelData.docId,
                          inlinePanelData.columnKey,
                          nextValue,
                          getCellValue(
                            inlinePanelData.docId,
                            inlinePanelData.columnKey,
                          ),
                        );
                      }}
                      cellState={getCellState(
                        makeCellKey(
                          inlinePanelData.docId,
                          inlinePanelData.columnKey,
                        ),
                      )}
                      originalValue={getOriginalCellValue(
                        makeCellKey(
                          inlinePanelData.docId,
                          inlinePanelData.columnKey,
                        ),
                      )}
                      isModified={isCellModified(
                        makeCellKey(
                          inlinePanelData.docId,
                          inlinePanelData.columnKey,
                        ),
                      )}
                      revisions={getCellRevisions(
                        makeCellKey(
                          inlinePanelData.docId,
                          inlinePanelData.columnKey,
                        ),
                      )}
                      isDraftRule={isRuleDraft(inlinePanelData.docId)}
                      isProposedCell={isCellProposed(
                        makeCellKey(
                          inlinePanelData.docId,
                          inlinePanelData.columnKey,
                        ),
                      )}
                      onApproveRule={() =>
                        approveRules([inlinePanelData.docId])
                      }
                      onRestoreRevision={(revisionId) => {
                        restoreCellRevision(
                          inlinePanelData.docId,
                          inlinePanelData.columnKey,
                          revisionId,
                        );
                      }}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          itemName={
            documentToDelete
              ? getCellValue(documentToDelete.id, 'name') || UNNAMED_RULE_LABEL
              : ''
          }
          itemType="position"
        />
      </div>
    );
  },
);

TabularPlaybook.displayName = 'TabularPlaybook';

export default TabularPlaybook;
