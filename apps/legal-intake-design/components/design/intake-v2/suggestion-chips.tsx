'use client';

import type { CSSProperties } from 'react';
import { cn } from '@repo/ui/lib/utils';
import { Chip } from '@/components/design/foundations/components/chip';
import type { SuggestionChip } from '@/components/design/new-case/intake-types';

/**
 * Ready-made answers, offered as a shortcut and never as a gate.
 *
 * Once one is picked the row stays put: the chosen chip fills in solid and the
 * rest lock. That is how the live intake behaved, and it matters, because the
 * chips are part of the transcript. Clearing them would leave a question in the
 * conversation with no visible sign of what was answered.
 *
 * Typing something else instead always works, and always did.
 */
export function SuggestionChips({
  chips,
  label,
  selectedValue,
  onSelect,
  className,
  style,
}: {
  chips: readonly SuggestionChip[];
  /** Quiet lead-in, for places where the chips are an offer rather than a reply. */
  label?: string;
  /** The chip already chosen. Locks the row and fills this one in. */
  selectedValue?: string;
  onSelect: (chip: SuggestionChip) => void;
  /**
   * For the caller's entrance animation.
   *
   * The chips used to carry `mz-animate-step` individually, which was fine
   * while this row was the only thing on the page that moved and wrong once the
   * whole screen took one cascading entrance: an animating chip inside an
   * animating block compounds two transforms. The entrance is the block's now,
   * so the caller sets it and can place this row in its own cascade.
   */
  className?: string;
  style?: CSSProperties;
}) {
  if (chips.length === 0) return null;
  const locked = selectedValue !== undefined;

  return (
    <div className={cn('flex flex-col gap-2', className)} style={style}>
      {label ? (
        <span className="text-muted-foreground text-xs">{label}</span>
      ) : null}
      <div role="group" className="flex flex-wrap gap-2">
        {chips.map((chip, index) => {
          const isSelected = chip.value === selectedValue;
          return (
            <Chip
              key={chip.id}
              type="button"
              variant="outline"
              size="sm"
              disabled={locked && !isSelected}
              aria-pressed={isSelected || undefined}
              className={cn(
                isSelected &&
                  'border-primary bg-primary text-primary-foreground not-disabled:hover:bg-primary',
                locked && 'cursor-default',
              )}
              style={{ animationDelay: `${index * 60}ms` }}
              onClick={() => {
                if (locked) return;
                onSelect(chip);
              }}
            >
              {chip.label}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}
