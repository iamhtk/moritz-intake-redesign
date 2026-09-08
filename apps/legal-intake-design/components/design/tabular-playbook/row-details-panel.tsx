'use client';

import { Check } from '@repo/ui/icons';

import { Badge } from '@/components/design/foundations/components/badge';
import { Button } from '@/components/design/foundations/components/button';

import { EditableValue } from './components/EditableValue';

export type RowDetailBadgeVariant =
  | 'accent'
  | 'success'
  | 'warning'
  | 'destructive';

export interface RowDetailField {
  key: string;
  label: string;
  /** Blank renders the placeholder rather than an empty card. */
  value: string;
  /**
   * When present the value renders as badges instead of text, so enum columns
   * keep the same colour coding they have in the grid.
   */
  badges?: { label: string; variant: RowDetailBadgeVariant }[];
  /** Picks the editor the field opens into — text, yes/no, or a list. */
  columnType?: string;
  enumOptions?: string[];
}

/**
 * Body of the row details side panel: every column's value for one row, stacked
 * as a label above plain text so long clause text stays readable in a narrow
 * panel. No cards — with a dozen fields the borders read as noise, so the
 * grouping is carried by spacing alone.
 *
 * Values are editable in place, the same way a single cell is edited from the
 * analysis panel. A rule is written in prose, and prose belongs in a panel
 * rather than in a table cell the width of a column.
 */
export function RowDetailsPanel({
  fields,
  placeholder = '—',
  onSaveField,
  autoEditKey,
  isDraft = false,
  changedKeys,
  onApprove,
}: {
  fields: RowDetailField[];
  placeholder?: string;
  /** Commits an edit. Omit to keep the panel read-only. */
  onSaveField?: (key: string, value: string) => void;
  /** Field to open straight into the editor — the name of a brand-new rule. */
  autoEditKey?: string;
  /** The rule is the agent's work and nobody has signed it off yet. */
  isDraft?: boolean;
  /** Columns a re-run rewrote. Empty for a rule drafted from scratch. */
  changedKeys?: ReadonlySet<string>;
  /** Signs the rule off from here. Omit to leave approval to the stepper. */
  onApprove?: () => void;
}) {
  const rewrittenCount = changedKeys?.size ?? 0;

  return (
    <div className="bg-dt-bg-primary flex min-h-full flex-col">
      <div className="p-4 pb-6">
        <div className="space-y-5">
          {/*
           * Opening a rule to read it is the same act as reviewing it, so a
           * draft says so here in the same words the review stepper uses.
           */}
          {isDraft && (
            <p className="text-dt-fg-secondary text-xs leading-relaxed">
              {rewrittenCount > 0
                ? `The playbook agent rewrote ${rewrittenCount} ${rewrittenCount === 1 ? 'field' : 'fields'} on this rule, so it is back in draft.`
                : 'New rule drafted by the playbook agent. It stays out of the shared playbook until you approve it.'}
            </p>
          )}

          {fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <h3 className="text-dt-fg-primary text-sm font-semibold">
                  {field.label}
                </h3>
                {/* Which of the values below the sign-off is actually for. */}
                {isDraft && changedKeys?.has(field.key) && (
                  <Badge variant="warning">Updated</Badge>
                )}
              </div>
              <EditableValue
                value={field.value}
                badges={field.badges}
                emptyLabel={placeholder}
                editLabel={`Edit ${field.label}`}
                columnType={field.columnType}
                columnKey={field.key}
                enumOptions={field.enumOptions}
                startEditing={field.key === autoEditKey}
                onSave={
                  onSaveField
                    ? (value) => onSaveField(field.key, value)
                    : undefined
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/*
       * The same sign-off bar the review stepper ends on: sticky so it is
       * reachable from anywhere in a long rule, `mt-auto` so it sits at the
       * bottom of a short one rather than floating halfway up the panel.
       */}
      {isDraft && onApprove && (
        <div className="border-dt-line-tertiary bg-dt-bg-primary sticky bottom-0 mt-auto flex items-center gap-2 border-t p-3">
          <Button size="sm" onClick={onApprove} className="flex-1">
            <Check className="size-4" />
            Approve rule
          </Button>
        </div>
      )}
    </div>
  );
}

export default RowDetailsPanel;
