'use client';

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft,
  ChevronsDownUp,
  ChevronsUpDown,
  Edit3,
  MoreHorizontal,
  PanelRight,
  Plus,
  Share2,
  Trash2,
} from '@repo/ui/icons';

import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/design/design-system/button';
import { Input } from '@/components/design/design-system/input';
import { Textarea } from '@/components/design/design-system/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/design/foundations/components/dropdown-menu';
import { Muted } from '@/components/design/design-system/typography';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/design/foundations/components/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui/components/tooltip';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@repo/ui/lib/utils';

import { ShareCaseDialog } from '@/components/cases/share-case-dialog';

import { DeleteConfirmDialog } from './delete-confirm-dialog';
import {
  ACTION_CARDS,
  PlaybookAssistantPanel,
} from './playbook-assistant-panel';
import {
  IDLE_GENERATION,
  demoGeneratedRules,
  type GenerationState,
} from './playbook-generation-data';
import { PlaybookRuleCard } from './playbook-rule-card';
import {
  createEmptyRule,
  deletePlaybook,
  getPlaybook,
  updatePlaybook,
  type PlaybookRule,
  type PlaybookStudioPlaybook,
} from './playbook-studio-data';

const randomSuffix = () => Math.random().toString(36).slice(2, 8);

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

interface SortableRuleProps {
  rule: PlaybookRule;
  index: number;
  onUpdate: (value: PlaybookRule) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  animateReveal?: boolean;
}

function SortableRule({
  rule,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
  isCollapsed,
  onToggleCollapse,
  animateReveal,
}: SortableRuleProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: transition || undefined,
    opacity: isDragging ? 0 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} data-rule-id={rule.id}>
      <PlaybookRuleCard
        rule={rule}
        index={index}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        dragHandleProps={{ ...attributes, ...listeners }}
        animateReveal={animateReveal}
      />
    </div>
  );
}

interface PlaybookEditorProps {
  basePath: string;
  playbookId: string;
  isNew?: boolean;
}

export function PlaybookEditor({
  basePath,
  playbookId,
  isNew = false,
}: PlaybookEditorProps) {
  const router = useRouter();
  // Playbooks live in localStorage (unavailable during SSR). Gate on mount so
  // the server render and first client render match; only then resolve the
  // playbook, avoiding a hydration mismatch for user-created IDs.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const initialPlaybook = useMemo<PlaybookStudioPlaybook | undefined>(
    () => (mounted ? getPlaybook(playbookId) : undefined),
    [playbookId, mounted],
  );

  if (!mounted) {
    return <div className="h-[calc(100dvh-12rem)]" aria-hidden />;
  }

  if (!initialPlaybook) {
    return (
      <div className="flex h-[calc(100dvh-12rem)] flex-col items-center justify-center gap-4 text-center">
        <div>
          <h1 className="text-foreground text-lg font-medium">
            Playbook not found
          </h1>
          <Muted>This playbook may have been deleted.</Muted>
        </div>
        <Button variant="outline" onClick={() => router.push(basePath)}>
          <ArrowLeft data-icon="inline-start" aria-hidden />
          Back to playbooks
        </Button>
      </div>
    );
  }

  return (
    <PlaybookEditorInner
      basePath={basePath}
      isNew={isNew}
      initialPlaybook={initialPlaybook}
    />
  );
}

interface PlaybookEditorInnerProps {
  basePath: string;
  isNew: boolean;
  initialPlaybook: PlaybookStudioPlaybook;
}

function PlaybookEditorInner({
  basePath,
  isNew,
  initialPlaybook,
}: PlaybookEditorInnerProps) {
  const router = useRouter();

  const [name, setName] = useState(initialPlaybook.name);
  const [description, setDescription] = useState(initialPlaybook.description);
  const [rules, setRules] = useState<PlaybookRule[]>(initialPlaybook.rules);
  const [collapsedRules, setCollapsedRules] = useState<Set<string>>(
    () => new Set(initialPlaybook.rules.map((rule) => rule.id)),
  );
  const [viewMode, setViewMode] = useState<'collapsed' | 'expanded'>(
    'collapsed',
  );
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(true);
  const [assistantAction, setAssistantAction] = useState<string | undefined>(
    undefined,
  );
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );
  const [animationsEnabled, setAnimationsEnabled] = useState(false);
  const [generation, setGeneration] =
    useState<GenerationState>(IDLE_GENERATION);
  const [generatedRuleIds, setGeneratedRuleIds] = useState<Set<string>>(
    () => new Set(),
  );
  // Bumped for each generation run (and on unmount) so an in-flight stream can
  // detect it has been superseded/cancelled and bail out before setting state.
  const generationRunRef = useRef(0);
  const isMobile = useIsMobile();
  const [renameOpen, setRenameOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const initialStateRef = useRef({
    name: initialPlaybook.name,
    description: initialPlaybook.description,
    rules: JSON.stringify(initialPlaybook.rules),
  });

  const hasUnsavedChanges = useMemo(
    () =>
      name !== initialStateRef.current.name ||
      description !== initialStateRef.current.description ||
      JSON.stringify(rules) !== initialStateRef.current.rules,
    [name, description, rules],
  );

  // Autosave: debounce 1.5s after the last edit, then persist to the store.
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    if (!hasUnsavedChanges) return;
    autoSaveTimeoutRef.current = setTimeout(() => {
      updatePlaybook({
        ...initialPlaybook,
        name,
        description,
        rules,
        updatedLabel: 'Just now',
      });
      initialStateRef.current = {
        name,
        description,
        rules: JSON.stringify(rules),
      };
    }, 1500);
    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [name, description, rules, hasUnsavedChanges, initialPlaybook]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeDragRule = activeDragId
    ? rules.find((rule) => rule.id === activeDragId)
    : undefined;

  const handleDragStart = (event: DragStartEvent) =>
    setActiveDragId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setRules((current) => {
      const oldIndex = current.findIndex((rule) => rule.id === active.id);
      const newIndex = current.findIndex((rule) => rule.id === over.id);
      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const focusRuleTitle = (ruleId: string) => {
    setTimeout(() => {
      const element = document.querySelector(`[data-rule-id="${ruleId}"]`);
      if (!element) return;
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const titleInput = element.querySelector<HTMLElement>(
        '[data-playbook-rule-title]',
      );
      if (titleInput) setTimeout(() => titleInput.click(), 300);
    }, 50);
  };

  // Scrolls the freshly-appended generated card into view without focusing it.
  const scrollToRule = (ruleId: string) => {
    requestAnimationFrame(() => {
      document
        .querySelector(`[data-rule-id="${ruleId}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  // Cancel any in-flight generation stream when the editor unmounts so pending
  // timers don't set state on an unmounted component.
  useEffect(() => () => void (generationRunRef.current += 1), []);

  /**
   * Simulates the assistant reading the uploaded document and building the
   * playbook: streams `demoGeneratedRules` into the list card-by-card, revealing
   * each rule's fallbacks and guidance note in turn. Purely cosmetic timing —
   * the shared `generation` state keeps the chat panel in sync.
   */
  const runGeneration = (documentName: string | undefined) => {
    const runId = (generationRunRef.current += 1);
    const cancelled = () => generationRunRef.current !== runId;
    const delay = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));
    const total = demoGeneratedRules.length;

    void (async () => {
      setGeneratedRuleIds(new Set());
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

        setGeneration((prev) => ({
          ...prev,
          builtRules: index,
          currentRuleTitle: template.title,
        }));
        setGeneratedRuleIds((prev) => new Set(prev).add(id));
        setRules((prev) => [
          ...prev,
          {
            id,
            title: template.title,
            preferredPosition: template.preferredPosition,
            preferredLanguage: template.preferredLanguage,
            preferredComment: template.preferredComment,
            fallbacks: [],
          },
        ]);
        scrollToRule(id);
        await delay(550);
        if (cancelled()) return;

        for (const fallback of template.fallbacks) {
          setRules((prev) =>
            prev.map((rule) =>
              rule.id === id
                ? { ...rule, fallbacks: [...rule.fallbacks, { ...fallback }] }
                : rule,
            ),
          );
          await delay(400);
          if (cancelled()) return;
        }

        if (template.guidanceNote !== undefined) {
          setRules((prev) =>
            prev.map((rule) =>
              rule.id === id
                ? { ...rule, guidanceNote: template.guidanceNote }
                : rule,
            ),
          );
          await delay(320);
          if (cancelled()) return;
        }

        setGeneration((prev) => ({ ...prev, builtRules: index + 1 }));
        await delay(260);
      }

      if (cancelled()) return;
      setGeneration((prev) => ({
        ...prev,
        phase: 'done',
        currentRuleTitle: undefined,
      }));
    })();
  };

  // Stops an in-flight generation: bumping the run token makes the streaming
  // loop bail at its next checkpoint. Keeps whatever rules were already built —
  // shows the completed summary if any landed, otherwise clears the activity.
  const cancelGeneration = () => {
    generationRunRef.current += 1;
    setGeneration((prev) => {
      if (prev.phase === 'idle' || prev.phase === 'done') return prev;
      return prev.builtRules > 0
        ? { ...prev, phase: 'done', currentRuleTitle: undefined }
        : IDLE_GENERATION;
    });
  };

  const handleAddRule = () => {
    const newRule = createEmptyRule();
    setRules((prev) => [...prev, newRule]);
    setCollapsedRules((prev) => {
      const next = new Set(prev);
      next.delete(newRule.id);
      return next;
    });
    focusRuleTitle(newRule.id);
  };

  const handleDuplicateRule = (rule: PlaybookRule, index: number) => {
    const duplicate: PlaybookRule = {
      ...rule,
      id: `rule-${Date.now()}-${randomSuffix()}`,
      title: rule.title ? `${rule.title} (copy)` : '',
      fallbacks: rule.fallbacks.map((fallback) => ({ ...fallback })),
    };
    setRules((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, duplicate);
      return next;
    });
    setCollapsedRules((prev) => {
      const next = new Set(prev);
      next.delete(duplicate.id);
      return next;
    });
  };

  const handleToggleAll = (collapse: boolean) => {
    if (collapse) {
      setCollapsedRules(new Set(rules.map((rule) => rule.id)));
      setViewMode('collapsed');
    } else {
      setCollapsedRules(new Set());
      setViewMode('expanded');
    }
  };

  const openAssistant = (action?: string) => {
    setAssistantAction(action);
    setIsAssistantOpen(true);
  };

  const toggleAssistant = () => {
    setAssistantAction(undefined);
    setIsAssistantOpen((open) => !open);
  };

  // New playbooks open the assistant immediately so authors can generate rules.
  useLayoutEffect(() => {
    if (isNew) setIsAssistantOpen(true);
  }, [isNew]);

  // Enable slide/shift animations only after the first paint so the initial
  // render is instant (no slide), while later manual toggles still animate.
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimationsEnabled(true));
    return () => cancelAnimationFrame(id);
  }, []);

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

  const navigateBack = () => router.push(basePath);

  const persistNow = (next: Partial<PlaybookStudioPlaybook>) => {
    updatePlaybook({
      ...initialPlaybook,
      name,
      description,
      rules,
      updatedLabel: 'Just now',
      ...next,
    });
  };

  const openRename = () => {
    setEditName(name);
    setEditDescription(description);
    setRenameOpen(true);
  };

  const saveRename = () => {
    const trimmed = editName.trim();
    setName(trimmed);
    setDescription(editDescription);
    persistNow({ name: trimmed, description: editDescription });
    initialStateRef.current = {
      name: trimmed,
      description: editDescription,
      rules: JSON.stringify(rules),
    };
    setRenameOpen(false);
  };

  const ruleCountLabel = `${rules.length} ${rules.length === 1 ? 'rule' : 'rules'}`;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'flex h-[calc(100dvh-9rem)] flex-col transition-[padding] duration-300 ease-out',
          isAssistantOpen ? 'md:pr-[456px]' : 'md:pr-0',
        )}
      >
        {/* Header */}
        <div className="@container bg-background/80 supports-[backdrop-filter]:bg-background/68 relative z-20 -mx-4 -mt-6 flex h-14 shrink-0 items-center gap-3 px-4 backdrop-blur-[8px] backdrop-saturate-[1.25] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="text-foreground truncate text-sm font-semibold">
              {name || 'Untitled playbook'}
            </span>
            <span className="text-muted-foreground @md:inline hidden shrink-0 whitespace-nowrap text-xs">
              {ruleCountLabel}
            </span>
          </div>

          <div
            ref={headerActionsRef}
            className="flex shrink-0 items-center gap-0.5"
          >
            {/* Mirrors the label breakpoint: hidden (display:none) exactly when
                the button labels collapse, so `headerActionsIconOnly` tracks the
                real state. */}
            <span
              ref={headerSentinelRef}
              aria-hidden="true"
              className="@md:block hidden"
            />

            <HeaderActionTooltip
              enabled={headerActionsIconOnly}
              label="Add rule"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddRule}
                aria-label="Add rule"
                className="@max-md:size-8 @max-md:px-0 gap-1.5"
              >
                <Plus className="size-4" />
                <span className="@md:inline hidden">Add rule</span>
              </Button>
            </HeaderActionTooltip>

            {rules.length > 0 && (
              <HeaderActionTooltip
                enabled={headerActionsIconOnly}
                label={viewMode === 'collapsed' ? 'Expand all' : 'Collapse all'}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleAll(viewMode === 'expanded')}
                  aria-label={
                    viewMode === 'collapsed' ? 'Expand all' : 'Collapse all'
                  }
                  className="@max-md:size-8 @max-md:px-0 gap-1.5"
                >
                  {viewMode === 'collapsed' ? (
                    <ChevronsUpDown className="size-4" />
                  ) : (
                    <ChevronsDownUp className="size-4" />
                  )}
                  <span className="@md:inline hidden">
                    {viewMode === 'collapsed' ? 'Expand all' : 'Collapse all'}
                  </span>
                </Button>
              </HeaderActionTooltip>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0"
                  aria-label="Playbook actions"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={openRename}>
                  <Edit3 className="size-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsShareOpen(true)}>
                  <Share2 className="size-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setIsDeleteOpen(true)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0"
                  onClick={toggleAssistant}
                  aria-expanded={isAssistantOpen}
                  aria-controls="case-details-panel"
                  aria-label={isAssistantOpen ? 'Hide agent' : 'Show agent'}
                >
                  <PanelRight aria-hidden="true" className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isAssistantOpen ? 'Hide agent' : 'Show agent'}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Rule list */}
        <div className="min-h-0 flex-1 overflow-y-auto pb-4 pt-6">
          <div className="mx-auto max-w-4xl space-y-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setActiveDragId(null)}
            >
              <SortableContext
                items={rules.map((rule) => rule.id)}
                strategy={verticalListSortingStrategy}
              >
                {rules.map((rule, index) => (
                  <SortableRule
                    key={rule.id}
                    rule={rule}
                    index={index}
                    onUpdate={(value) =>
                      setRules((prev) =>
                        prev.map((item) =>
                          item.id === rule.id ? value : item,
                        ),
                      )
                    }
                    onDelete={() =>
                      setRules((prev) =>
                        prev.filter((item) => item.id !== rule.id),
                      )
                    }
                    onDuplicate={() => handleDuplicateRule(rule, index)}
                    isCollapsed={collapsedRules.has(rule.id)}
                    onToggleCollapse={() =>
                      setCollapsedRules((prev) => {
                        const next = new Set(prev);
                        if (next.has(rule.id)) next.delete(rule.id);
                        else next.add(rule.id);
                        return next;
                      })
                    }
                    animateReveal={generatedRuleIds.has(rule.id)}
                  />
                ))}
              </SortableContext>
              <DragOverlay dropAnimation={null}>
                {activeDragRule ? (
                  <PlaybookRuleCard
                    rule={activeDragRule}
                    index={0}
                    onUpdate={() => {}}
                    onDelete={() => {}}
                    onDuplicate={() => {}}
                    isCollapsed={collapsedRules.has(activeDragRule.id)}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>

            {rules.length === 0 && (
              <div className="border-field flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center">
                <h2 className="text-foreground mb-1 text-base font-medium">
                  {isNew
                    ? 'Create your playbook'
                    : 'Add rules to your playbook'}
                </h2>
                <Muted className="mb-6 max-w-sm">
                  Use the agent to generate rules from documents, or add them
                  manually.
                </Muted>

                <div className="w-full max-w-xl">
                  <div className="grid grid-cols-1 gap-2 text-left sm:grid-cols-2">
                    {ACTION_CARDS.slice(0, 4).map((action) => {
                      const ActionIcon = action.icon;
                      return (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => openAssistant(action.id)}
                          className="border-field bg-card hover:border-field-strong hover:bg-muted/50 flex items-start gap-2.5 rounded-xl border px-3 py-3 text-left transition-colors"
                        >
                          <ActionIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-foreground text-sm font-medium">
                              {action.label}
                            </div>
                            <div className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                              {action.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {ACTION_CARDS[4] && (
                    <button
                      type="button"
                      onClick={() => openAssistant(ACTION_CARDS[4]!.id)}
                      className="border-field bg-card hover:border-field-strong hover:bg-muted/50 mt-2 flex w-full items-start gap-2.5 rounded-xl border px-3 py-3 text-left transition-colors"
                    >
                      {(() => {
                        const ActionIcon = ACTION_CARDS[4]!.icon;
                        return (
                          <ActionIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                        );
                      })()}
                      <div className="min-w-0">
                        <div className="text-foreground text-sm font-medium">
                          {ACTION_CARDS[4]!.label}
                        </div>
                        <div className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                          {ACTION_CARDS[4]!.description}
                        </div>
                      </div>
                    </button>
                  )}

                  <div className="mt-4">
                    <Button variant="outline" onClick={handleAddRule}>
                      <Plus data-icon="inline-start" aria-hidden />
                      Add rule manually
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Playbook assistant, docked right in the case-details card chrome. */}
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
          side="right"
          showOverlay={isMobile}
          showCloseButton={false}
          container={portalContainer}
          aria-describedby={undefined}
          className={cn(
            'gap-0 p-0 sm:max-w-md',
            'md:border-foreground/10 md:inset-y-0 md:right-0 md:w-[440px] md:overflow-hidden md:rounded-l-2xl md:border md:border-r-0',
            !animationsEnabled && '[--tw-animation-duration:0s]',
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
            playbookName={name}
            isNewPlaybook={isNew}
            initialAction={assistantAction}
            generation={generation}
            onGeneratePlaybook={runGeneration}
            onCancelGeneration={cancelGeneration}
          />
        </SheetContent>
      </Sheet>

      {/* Rename / edit details dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Edit playbook</DialogTitle>
            <DialogDescription>
              Update your playbook name and description.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="playbook-editor-name"
                className="text-foreground text-sm font-medium"
              >
                Playbook name
              </label>
              <Input
                id="playbook-editor-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                placeholder="e.g. NDA - Recipient Favorable"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="playbook-editor-description"
                className="text-foreground text-sm font-medium"
              >
                Description
              </label>
              <Textarea
                id="playbook-editor-description"
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                placeholder="Describe the purpose and scope of this playbook…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRename} disabled={!editName.trim()}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={() => {
          deletePlaybook(initialPlaybook.id);
          navigateBack();
        }}
        itemName={name || 'Untitled playbook'}
        itemType="playbook"
      />

      <ShareCaseDialog
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        title="Share playbook"
        description="Share this playbook with people on your team so they can view and edit it."
        resourceLabel="playbook"
        shareLink={`https://app.moritz.legal/playbooks/${initialPlaybook.id}`}
      />
    </TooltipProvider>
  );
}
