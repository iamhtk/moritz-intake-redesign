'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

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
  Alert,
  AlertContent,
  AlertDescription,
  AlertFooter,
  AlertHeader,
  AlertTitle,
} from '@/components/design/foundations/components/alert';
import { buttonVariants } from '@/components/design/foundations/components/button';
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
import { cn } from '@repo/ui/lib/utils';

import { ShareCaseDialog } from '@/components/cases/share-case-dialog';

import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { PlaybookRuleCard } from './playbook-rule-card';
import {
  createEmptyRule,
  deletePlaybook,
  getPlaybook,
  updatePlaybook,
  type PlaybookRule,
  type PlaybookStudioPlaybook,
} from './playbook-studio-data';

function formatTimeAgo(date: Date): string {
  const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

const randomSuffix = () => Math.random().toString(36).slice(2, 8);

interface SortableRuleProps {
  rule: PlaybookRule;
  index: number;
  onUpdate: (value: PlaybookRule) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

function SortableRule({
  rule,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
  isCollapsed,
  onToggleCollapse,
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
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [, setTick] = useState(0);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [namingBeforeLeave, setNamingBeforeLeave] = useState(false);
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

  // Autosave: debounce 1.5s after the last edit, then persist to the store and
  // refresh the "last saved" indicator.
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
      setLastSaved(new Date());
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

  // Refresh the "X ago" label periodically.
  useEffect(() => {
    const interval = setInterval(() => setTick((value) => value + 1), 30000);
    return () => clearInterval(interval);
  }, []);

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

  const navigateBack = () => router.push(basePath);

  const handleBack = () => {
    const trimmed = name.trim();
    if (isNew && !trimmed && rules.length === 0) {
      setIsDiscardOpen(true);
      return;
    }
    if ((!trimmed || trimmed === 'Untitled playbook') && rules.length > 0) {
      setEditName('');
      setEditDescription(description);
      setNamingBeforeLeave(true);
      setRenameOpen(true);
      return;
    }
    navigateBack();
  };

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
    setNamingBeforeLeave(false);
    setEditName(name);
    setEditDescription(description);
    setRenameOpen(true);
  };

  const saveRename = () => {
    const trimmed = editName.trim();
    setName(trimmed);
    setDescription(editDescription);
    persistNow({ name: trimmed, description: editDescription });
    setLastSaved(new Date());
    initialStateRef.current = {
      name: trimmed,
      description: editDescription,
      rules: JSON.stringify(rules),
    };
    setRenameOpen(false);
    if (namingBeforeLeave) {
      setNamingBeforeLeave(false);
      navigateBack();
    }
  };

  const ruleCountLabel = `${rules.length} ${rules.length === 1 ? 'rule' : 'rules'}`;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-[calc(100dvh-9rem)] flex-col">
        {/* Sub-header */}
        <div className="flex shrink-0 items-center justify-between gap-3 pb-3">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleBack}
              aria-label="Back to playbooks"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <span className="text-foreground truncate text-sm font-semibold">
              {name || 'Untitled playbook'}
            </span>
            <span className="text-muted-foreground whitespace-nowrap text-xs">
              {ruleCountLabel}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Playbook actions"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
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
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-muted-foreground hidden whitespace-nowrap text-sm sm:inline">
                Last saved {formatTimeAgo(lastSaved)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end">
              {lastSaved.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              ,{' '}
              {lastSaved.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Control bar */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 pb-3">
          <Button variant="outline" size="sm" onClick={handleAddRule}>
            <Plus className="size-3.5" />
            Add rule
          </Button>
          {rules.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleAll(viewMode === 'expanded')}
            >
              {viewMode === 'collapsed' ? (
                <ChevronsUpDown className="size-3.5" />
              ) : (
                <ChevronsDownUp className="size-3.5" />
              )}
              {viewMode === 'collapsed' ? 'Expand all' : 'Collapse all'}
            </Button>
          )}
          <span className="text-muted-foreground ml-auto text-xs">
            Layered position structure
          </span>
        </div>

        {/* Rule list */}
        <div className="min-h-0 flex-1 overflow-y-auto py-4">
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
              <div className="border-field flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
                <h2 className="text-foreground mb-1 text-base font-medium">
                  {isNew
                    ? 'Create your playbook'
                    : 'Add rules to your playbook'}
                </h2>
                <Muted className="mb-4 max-w-sm">
                  Each rule captures a preferred position, optional fallbacks,
                  and reviewer guidance.
                </Muted>
                <Button onClick={handleAddRule}>
                  <Plus data-icon="inline-start" aria-hidden />
                  Add rule
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rename / name-before-leave dialog */}
      <Dialog
        open={renameOpen}
        onOpenChange={(open) => {
          setRenameOpen(open);
          if (!open) setNamingBeforeLeave(false);
        }}
      >
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>
              {namingBeforeLeave ? 'Name your playbook' : 'Edit playbook'}
            </DialogTitle>
            <DialogDescription>
              {namingBeforeLeave
                ? 'Give your playbook a name before leaving.'
                : 'Update your playbook name and description.'}
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
            <Button
              variant="outline"
              onClick={() => {
                setRenameOpen(false);
                setNamingBeforeLeave(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveRename} disabled={!editName.trim()}>
              {namingBeforeLeave ? 'Save & leave' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discard empty new playbook */}
      <Alert open={isDiscardOpen} onOpenChange={setIsDiscardOpen}>
        <AlertContent>
          <AlertHeader>
            <AlertTitle>Discard this playbook?</AlertTitle>
            <AlertDescription>
              This empty playbook hasn&rsquo;t been named or given any rules. It
              will be removed.
            </AlertDescription>
          </AlertHeader>
          <AlertFooter>
            <button
              type="button"
              className={cn(buttonVariants({ variant: 'outline' }))}
              onClick={() => setIsDiscardOpen(false)}
            >
              Keep editing
            </button>
            <button
              type="button"
              className={cn(buttonVariants({ variant: 'destructive' }))}
              onClick={() => {
                deletePlaybook(initialPlaybook.id);
                setIsDiscardOpen(false);
                navigateBack();
              }}
            >
              Discard
            </button>
          </AlertFooter>
        </AlertContent>
      </Alert>

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
