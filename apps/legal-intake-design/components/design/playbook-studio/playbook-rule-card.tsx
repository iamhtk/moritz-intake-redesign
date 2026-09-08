'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
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
  BookOpen,
  ChevronDown,
  ChevronUp,
  Copy,
  GripVertical,
  MoreHorizontal,
  Plus,
  Trash2,
} from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui/components/tooltip';

import { Button } from '@/components/design/design-system/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/design/foundations/components/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/design/foundations/components/collapsible';
import { Badge } from '@/components/design/foundations/components/badge';

import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { InlineField } from './inline-field';
import type {
  PlaybookFallback,
  PlaybookRule,
  PlaybookRuleSeverity,
} from './playbook-studio-data';

const MAX_FALLBACKS = 5;

/** Maps a clause severity onto a tinted Badge variant. */
const SEVERITY_VARIANT: Record<
  PlaybookRuleSeverity,
  'destructive' | 'warning' | 'secondary'
> = {
  Material: 'destructive',
  Standard: 'warning',
  'Nice-to-have': 'secondary',
};

/**
 * Long-form reference fields carried over from the MSA playbook structure.
 * Rendered as removable sections below the position ladder and offered for
 * re-adding via the "Add detail" menu once removed.
 */
type ReferenceFieldKey =
  | 'benefit'
  | 'rationale'
  | 'precedent'
  | 'standardSummary'
  | 'walkAwayTrigger';

const REFERENCE_FIELDS: {
  key: ReferenceFieldKey;
  label: string;
  placeholder: string;
}[] = [
  {
    key: 'benefit',
    label: 'Benefit',
    placeholder: 'why this preferred position matters to us',
  },
  {
    key: 'rationale',
    label: 'Rationale',
    placeholder: 'reasoning behind the position ladder',
  },
  {
    key: 'precedent',
    label: 'Precedent',
    placeholder: 'prior deals or guidance supporting this position',
  },
  {
    key: 'standardSummary',
    label: 'Standard MSA / Guideline Summary',
    placeholder: 'summary of the standard clause or guideline',
  },
  {
    key: 'walkAwayTrigger',
    label: 'Walk-away trigger',
    placeholder: 'the point at which we walk away rather than concede',
  },
];

/** Labels the fallback tier using the MSA vocabulary (Round 2 → Last). */
function fallbackLabel(index: number, total: number): string {
  if (index === 0) return 'Round 2 Fallback';
  if (index === total - 1) return 'Last Fallback';
  return `Fallback ${index + 1}`;
}

interface PositionItem {
  id: string;
  position: string;
}

interface SortablePositionGroupProps {
  item: PositionItem;
  posIndex: number;
  onPositionChange: (value: string) => void;
  onRemove?: () => void;
}

function SortablePositionGroup({
  item,
  posIndex,
  onPositionChange,
  onRemove,
}: SortablePositionGroupProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: transition || undefined,
  };

  const isPreferred = posIndex === 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group/pos bg-card border-field relative rounded-lg border border-l-[3px] py-2.5 pl-1',
        isPreferred ? 'border-l-success' : 'border-l-warning',
        onRemove ? 'pr-10' : 'pr-3',
        isDragging && 'opacity-50',
      )}
    >
      {onRemove && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          title="Remove position"
          aria-label="Remove position"
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive absolute right-2 top-2 z-10 opacity-0 transition-opacity focus-visible:opacity-100 group-hover/pos:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </Button>
      )}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              {...attributes}
              {...listeners}
              aria-label="Drag to reorder position"
              className="text-muted-foreground hover:bg-foreground/5 flex h-7 w-6 shrink-0 cursor-grab items-center justify-center rounded active:cursor-grabbing"
            >
              <GripVertical className="size-3.5" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">Drag to reorder</TooltipContent>
        </Tooltip>

        <div className="min-w-0 flex-1">
          <InlineField
            label="Position"
            value={item.position}
            onChange={onPositionChange}
            placeholder={`describe ${
              isPreferred
                ? 'the ideal contract language'
                : 'acceptable alternative language'
            }`}
          />
        </div>
      </div>
    </div>
  );
}

interface PlaybookRuleCardProps {
  rule: PlaybookRule;
  index: number;
  onUpdate: (value: PlaybookRule) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  dragHandleProps?: Record<string, unknown>;
}

export function PlaybookRuleCard({
  rule,
  onUpdate,
  onDelete,
  onDuplicate,
  isCollapsed = false,
  onToggleCollapse,
  dragHandleProps,
}: PlaybookRuleCardProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [guidanceVisible, setGuidanceVisible] = useState(
    rule.guidanceNote !== undefined,
  );
  const hasGuidanceNote = rule.guidanceNote !== undefined;

  // Reveal the guidance section when a note appears after mount (e.g. added by a
  // parent update); the initial `guidanceVisible` is only computed once.
  useEffect(() => {
    if (rule.guidanceNote !== undefined) setGuidanceVisible(true);
  }, [rule.guidanceNote]);

  const positionSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const nextIdRef = useRef(0);
  const [positionIds, setPositionIds] = useState<string[]>(() =>
    Array.from(
      { length: 1 + rule.fallbacks.length },
      () => `pos-${nextIdRef.current++}`,
    ),
  );

  useEffect(() => {
    const expectedLength = 1 + rule.fallbacks.length;
    setPositionIds((prev) => {
      if (prev.length === expectedLength) return prev;
      if (expectedLength > prev.length) {
        return [
          ...prev,
          ...Array.from(
            { length: expectedLength - prev.length },
            () => `pos-${nextIdRef.current++}`,
          ),
        ];
      }
      return prev.slice(0, expectedLength);
    });
  }, [rule.fallbacks.length]);

  const positions = useMemo<PositionItem[]>(
    () => [
      {
        id: positionIds[0] ?? 'pos-preferred',
        position: rule.preferredPosition,
      },
      ...rule.fallbacks.map((fallback, i) => ({
        id: positionIds[i + 1] ?? `pos-fb-${i}`,
        position: fallback.position,
      })),
    ],
    [positionIds, rule.preferredPosition, rule.fallbacks],
  );

  const updateRule = useCallback(
    (updates: Partial<PlaybookRule>) => onUpdate({ ...rule, ...updates }),
    [onUpdate, rule],
  );

  const setReferenceField = useCallback(
    (key: ReferenceFieldKey, value: string) =>
      onUpdate({ ...rule, [key]: value }),
    [onUpdate, rule],
  );

  const removeReferenceField = useCallback(
    (key: ReferenceFieldKey) => {
      const next = { ...rule };
      delete next[key];
      onUpdate(next);
    },
    [onUpdate, rule],
  );

  const missingReferenceFields = REFERENCE_FIELDS.filter(
    (field) => rule[field.key] === undefined,
  );

  const handlePositionDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = positions.findIndex((p) => p.id === active.id);
      const newIndex = positions.findIndex((p) => p.id === over.id);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reordered = arrayMove(positions, oldIndex, newIndex);
      setPositionIds(arrayMove([...positionIds], oldIndex, newIndex));

      const [newPreferred, ...rest] = reordered;
      onUpdate({
        ...rule,
        preferredPosition: newPreferred?.position ?? '',
        fallbacks: rest.map((p) => ({ position: p.position })),
      });
    },
    [positions, positionIds, rule, onUpdate],
  );

  const addFallback = () => {
    if (rule.fallbacks.length >= MAX_FALLBACKS) return;
    updateRule({ fallbacks: [...rule.fallbacks, { position: '' }] });
  };

  const removeFallback = (posIndex: number) => {
    const remaining = [...positions];
    remaining.splice(posIndex, 1);
    setPositionIds((prev) => prev.filter((_, i) => i !== posIndex));
    const [newPreferred, ...rest] = remaining;
    onUpdate({
      ...rule,
      preferredPosition: newPreferred?.position ?? '',
      fallbacks: rest.map((p) => ({ position: p.position })),
    });
  };

  const showGuidance = guidanceVisible && hasGuidanceNote;

  const renderPosition = (posIndex: number) => {
    const item = positions[posIndex];
    if (!item) return null;
    const isPreferred = posIndex === 0;
    const fallbackIndex = posIndex - 1;

    const updateFallback = (patch: Partial<PlaybookFallback>) => {
      const current = rule.fallbacks[fallbackIndex];
      if (!current) return;
      const next = [...rule.fallbacks];
      next[fallbackIndex] = { ...current, ...patch };
      onUpdate({ ...rule, fallbacks: next });
    };

    return (
      <SortablePositionGroup
        key={item.id}
        item={item}
        posIndex={posIndex}
        onPositionChange={(value) =>
          isPreferred
            ? onUpdate({ ...rule, preferredPosition: value })
            : updateFallback({ position: value })
        }
        onRemove={!isPreferred ? () => removeFallback(posIndex) : undefined}
      />
    );
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Collapsible
        open={!isCollapsed}
        onOpenChange={() => onToggleCollapse?.()}
      >
        <div className="group/rule bg-card border-field hover:border-foreground/20 relative overflow-hidden rounded-2xl border shadow transition-colors">
          {/* Header */}
          <div className="flex items-center gap-1.5 px-3 py-2.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  {...dragHandleProps}
                  aria-label="Drag to reorder rule"
                  className="text-muted-foreground hover:bg-muted flex cursor-grab items-center justify-center rounded p-0.5 transition-colors active:cursor-grabbing"
                >
                  <GripVertical className="size-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">Drag to reorder</TooltipContent>
            </Tooltip>

            <InlineField
              value={rule.title}
              onChange={(value) => onUpdate({ ...rule, title: value })}
              placeholder="Untitled rule"
              className="max-w-[600px] truncate text-sm font-semibold"
              editableProps={{
                'data-playbook-rule-title': 'true',
                onClick: (event) => event.stopPropagation(),
              }}
            />

            {rule.severity && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant={SEVERITY_VARIANT[rule.severity]}
                    className="shrink-0"
                  >
                    {rule.severity}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Severity discipline: triage Material clauses first.
                </TooltipContent>
              </Tooltip>
            )}
            {rule.category && (
              <span className="text-muted-foreground hidden shrink-0 text-xs sm:inline">
                {rule.category}
              </span>
            )}

            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="h-6 flex-1 cursor-pointer"
                aria-label={isCollapsed ? 'Expand rule' : 'Collapse rule'}
              />
            </CollapsibleTrigger>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsDeleteOpen(true)}
              title="Delete rule"
              aria-label="Delete rule"
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0 opacity-0 transition-opacity focus-visible:opacity-100 group-hover/rule:opacity-100"
            >
              <Trash2 className="size-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0"
                  aria-label="Rule actions"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {!hasGuidanceNote && (
                  <DropdownMenuItem
                    onClick={() => {
                      updateRule({ guidanceNote: '' });
                      setGuidanceVisible(true);
                    }}
                  >
                    <BookOpen className="size-4" />
                    Add guidance note
                  </DropdownMenuItem>
                )}
                {onDuplicate && (
                  <DropdownMenuItem onClick={onDuplicate}>
                    <Copy className="size-4" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setIsDeleteOpen(true)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
                aria-label={isCollapsed ? 'Expand rule' : 'Collapse rule'}
              >
                {isCollapsed ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronUp className="size-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>

          {/* Expanded content */}
          <CollapsibleContent>
            <div className="border-t px-3 py-3 text-sm leading-relaxed">
              <DndContext
                sensors={positionSensors}
                collisionDetection={closestCenter}
                onDragEnd={handlePositionDragEnd}
              >
                <SortableContext
                  items={positions.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-5">
                    <section className="space-y-2">
                      <h3 className="text-success text-xs font-semibold uppercase tracking-wide">
                        First Position
                      </h3>
                      {renderPosition(0)}
                    </section>
                    {rule.fallbacks.map((_, fbIdx) => (
                      <section
                        key={positionIds[fbIdx + 1] ?? fbIdx}
                        className="space-y-2"
                      >
                        <h3 className="text-warning text-xs font-semibold uppercase tracking-wide">
                          {fallbackLabel(fbIdx, rule.fallbacks.length)}
                        </h3>
                        {renderPosition(fbIdx + 1)}
                      </section>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {REFERENCE_FIELDS.filter(
                (field) => rule[field.key] !== undefined,
              ).map((field) => (
                <section key={field.key} className="space-y-2 pt-4">
                  <h3 className="text-foreground text-xs font-semibold uppercase tracking-wide">
                    {field.label}
                  </h3>
                  <div className="group/ref bg-muted/40 border-field relative rounded-lg border py-2 pl-3 pr-10">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeReferenceField(field.key)}
                      title={`Remove ${field.label.toLowerCase()}`}
                      aria-label={`Remove ${field.label.toLowerCase()}`}
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive absolute right-2 top-2 z-10 opacity-0 transition-opacity focus-visible:opacity-100 group-hover/ref:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                    <InlineField
                      multiline
                      value={rule[field.key] ?? ''}
                      onChange={(value) => setReferenceField(field.key, value)}
                      placeholder={field.placeholder}
                    />
                  </div>
                </section>
              ))}

              {showGuidance && (
                <section className="space-y-2 pt-4">
                  <h3 className="text-foreground text-xs font-semibold uppercase tracking-wide">
                    Guidance note
                  </h3>
                  <div className="group/gn bg-muted/40 border-field relative rounded-lg border py-2 pl-3 pr-10">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setGuidanceVisible(false);
                        const next = { ...rule };
                        delete next.guidanceNote;
                        onUpdate(next);
                      }}
                      title="Remove guidance note"
                      aria-label="Remove guidance note"
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive absolute right-2 top-2 z-10 opacity-0 transition-opacity focus-visible:opacity-100 group-hover/gn:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                    <InlineField
                      multiline
                      value={rule.guidanceNote ?? ''}
                      onChange={(value) => updateRule({ guidanceNote: value })}
                      placeholder="write internal guidance for reviewers"
                    />
                  </div>
                </section>
              )}

              {(rule.fallbacks.length < MAX_FALLBACKS ||
                missingReferenceFields.length > 0 ||
                (!guidanceVisible && !hasGuidanceNote)) && (
                <div className="flex flex-wrap gap-2 pl-2 pt-3">
                  {rule.fallbacks.length < MAX_FALLBACKS && (
                    <Button variant="outline" size="sm" onClick={addFallback}>
                      <Plus className="size-3.5" />
                      {rule.fallbacks.length === 0
                        ? 'Add fallback position'
                        : 'Add another fallback'}
                    </Button>
                  )}
                  {(missingReferenceFields.length > 0 ||
                    (!guidanceVisible && !hasGuidanceNote)) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="size-3.5" />
                          Add detail
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-64">
                        {missingReferenceFields.map((field) => (
                          <DropdownMenuItem
                            key={field.key}
                            onClick={() => setReferenceField(field.key, '')}
                          >
                            <BookOpen className="size-4" />
                            {field.label}
                          </DropdownMenuItem>
                        ))}
                        {!guidanceVisible && !hasGuidanceNote && (
                          <DropdownMenuItem
                            onClick={() => {
                              updateRule({ guidanceNote: '' });
                              setGuidanceVisible(true);
                            }}
                          >
                            <BookOpen className="size-4" />
                            Guidance note
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={onDelete}
        itemName={rule.title || 'Untitled rule'}
        itemType="rule"
      />
    </TooltipProvider>
  );
}
