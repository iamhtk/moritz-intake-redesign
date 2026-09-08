'use client';

import { ChevronLeft, ChevronRight, Check } from '@repo/ui/icons';

import { Badge } from '@/components/design/foundations/components/badge';
import { Button } from '@/components/design/foundations/components/button';

import type { RowDetailField } from '../row-details-panel';

/**
 * The review stepper: one draft rule at a time, with the agent's work laid out
 * to be read top to bottom and a single sign-off at the end. It exists because
 * approving from the grid means reading a rule through a row of truncated
 * cells — fine for a spot check, useless for a batch of twelve.
 */
export function RuleReviewPanel({
  ruleName,
  fields,
  changedKeys,
  position,
  queueLength,
  placeholder = '—',
  isNewRule,
  onApprove,
  onNext,
  onPrevious,
}: {
  ruleName: string;
  fields: RowDetailField[];
  /** Columns a re-run rewrote. Empty for a rule the agent wrote from scratch. */
  changedKeys: ReadonlySet<string>;
  /** 1-based place in the draft queue. */
  position: number;
  queueLength: number;
  placeholder?: string;
  isNewRule: boolean;
  onApprove: () => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  return (
    <div className="bg-dt-bg-primary flex min-h-full flex-col">
      <div className="space-y-4 p-4 pb-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-dt-fg-tertiary text-xs font-medium">
              Rule {position} of {queueLength}
            </span>
            {queueLength > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Previous draft"
                  onClick={onPrevious}
                  className="size-6 p-0"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Next draft"
                  onClick={onNext}
                  className="size-6 p-0"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>

          <h3 className="text-dt-fg-primary text-sm font-semibold leading-snug">
            {ruleName}
          </h3>

          <p className="text-dt-fg-secondary text-xs">
            {isNewRule
              ? 'New rule drafted by the playbook agent. It stays out of the shared playbook until you approve it.'
              : `The playbook agent rewrote ${changedKeys.size} ${changedKeys.size === 1 ? 'field' : 'fields'} on this rule, so it is back in draft.`}
          </p>
        </div>

        <div className="space-y-5">
          {fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <h4 className="text-dt-fg-primary text-sm font-semibold">
                  {field.label}
                </h4>
                {changedKeys.has(field.key) && (
                  <Badge variant="warning">Updated</Badge>
                )}
              </div>
              {field.badges && field.badges.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {field.badges.map((badge, index) => (
                    <Badge key={index} variant={badge.variant}>
                      {badge.label}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-dt-fg-primary whitespace-pre-line text-sm leading-relaxed">
                  {field.value.trim() || (
                    <span className="text-dt-fg-tertiary select-none">
                      {placeholder}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/*
       * Sticky so the sign-off is reachable from anywhere in a long rule, and
       * `mt-auto` so it sits at the bottom of a short one rather than floating
       * halfway up the panel.
       */}
      <div className="border-dt-line-tertiary bg-dt-bg-primary sticky bottom-0 mt-auto flex items-center gap-2 border-t p-3">
        <Button size="sm" onClick={onApprove} className="flex-1">
          <Check className="size-4" />
          {queueLength > 1 ? 'Approve and next' : 'Approve rule'}
        </Button>
        {queueLength > 1 && (
          <Button variant="outline" size="sm" onClick={onNext}>
            Skip
          </Button>
        )}
      </div>
    </div>
  );
}

export default RuleReviewPanel;
