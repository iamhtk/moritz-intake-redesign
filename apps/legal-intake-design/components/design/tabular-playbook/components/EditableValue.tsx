'use client';

import { useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';

import { Badge } from '@/components/design/foundations/components/badge';
import { Button } from '@/components/design/foundations/components/button';
import { cn } from '@repo/ui/lib/utils';

import { CellEditInput } from './CellEditInput';
import type { CellBadgeVariant } from '../utils/badgeVariants';

/**
 * A cell's value as the side panels show it: read as text or chips, click to
 * edit in place, Save or Discard to finish. Both panels use it so that editing
 * a rule's name behaves exactly like editing any other answer — the panel is
 * where a rule is written, and the grid stays a place to read it.
 */
export function EditableValue({
  value,
  badges,
  badgeSize,
  emptyLabel,
  editLabel,
  columnType = 'verbatim',
  columnKey,
  enumOptions = [],
  strikethrough = false,
  startEditing = false,
  onSave,
  onEditingChange,
}: {
  value: string;
  /** Chips to show in place of the text, for enum and yes/no columns. */
  badges?: { label: string; variant: CellBadgeVariant }[] | null;
  badgeSize?: 'lg';
  /** Stands in for a value the column has nothing in yet. */
  emptyLabel: string;
  /** Names the value for screen readers, e.g. "Edit Severity". */
  editLabel: string;
  columnType?: string;
  columnKey?: string;
  enumOptions?: string[];
  /** The value has been flagged incorrect, so it reads as struck through. */
  strikethrough?: boolean;
  /** Opens straight into the editor, for a field that has yet to be filled. */
  startEditing?: boolean;
  /** Commits an edit. Omit to leave the value read-only. */
  onSave?: (value: string) => void;
  /** Lets the surrounding panel react, e.g. to fold away a history list. */
  onEditingChange?: (isEditing: boolean) => void;
}) {
  const canEdit = onSave !== undefined;
  /** Non-null while editing, holding the uncommitted draft. */
  const [draft, setDraft] = useState<string | null>(
    startEditing && canEdit ? value : null,
  );
  const hasContent = value.trim() !== '';

  const openEditor = () => {
    setDraft(value);
    onEditingChange?.(true);
  };

  const closeEditor = () => {
    setDraft(null);
    onEditingChange?.(false);
  };

  const saveDraft = () => {
    if (draft === null) return;
    onSave?.(draft);
    closeEditor();
  };

  if (draft !== null) {
    return (
      <div
        className="space-y-2"
        /*
         * Escape belongs to the editor: the grid also listens for it to close
         * the panel, which would take the draft with it. React's root container
         * is the document, so the grid's listener sits on the same node as
         * React's own and only the immediate form of the call keeps the key
         * from reaching it.
         */
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return;
          event.stopPropagation();
          event.nativeEvent.stopImmediatePropagation();
        }}
      >
        <CellEditInput
          columnType={columnType}
          columnKey={columnKey}
          enumOptions={enumOptions}
          value={draft}
          onChange={setDraft}
          onSave={saveDraft}
          onCancel={closeEditor}
          showActions={false}
        />
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={closeEditor}>
            Discard
          </Button>
          <Button size="sm" onClick={saveDraft}>
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      {...(canEdit
        ? {
            role: 'button' as const,
            tabIndex: 0,
            'aria-label': editLabel,
            onClick: openEditor,
            onKeyDown: (event: ReactKeyboardEvent) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              openEditor();
            },
          }
        : {})}
      className={cn(
        'text-sm leading-relaxed',
        // Without a card there is no surface to tint, so a flagged value is
        // called out on the text itself.
        strikethrough ? 'text-destructive line-through' : 'text-dt-fg-primary',
        /*
         * No edit button: the value itself is the control, so hovering has to
         * make that obvious. One treatment only — a filled surface, no outline
         * on top of it — and it bleeds into the panel's padding so the text
         * stays put at rest.
         */
        canEdit &&
          'hover:bg-dt-bg-tertiary focus-visible:outline-ring focus-visible:outline-solid -mx-1.5 cursor-pointer rounded-md px-1.5 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-0',
      )}
    >
      {hasContent && badges && badges.length > 0 ? (
        // Enum and yes-no values are chips in the grid and in the history
        // below; the panel would be the odd one out as text.
        <span className="flex flex-wrap items-center gap-1">
          {badges.map((badge) => (
            <Badge key={badge.label} size={badgeSize} variant={badge.variant}>
              <span className={cn(strikethrough && 'line-through')}>
                {badge.label}
              </span>
            </Badge>
          ))}
        </span>
      ) : hasContent ? (
        <span className="whitespace-pre-line">{value}</span>
      ) : (
        <span className="text-dt-fg-tertiary">{emptyLabel}</span>
      )}
    </div>
  );
}

export default EditableValue;
