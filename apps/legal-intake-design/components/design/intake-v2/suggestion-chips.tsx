'use client';

import { useId, type CSSProperties } from 'react';
import { cn } from '@repo/ui/lib/utils';
import { Chip } from '@/components/design/foundations/components/chip';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  tourTarget,
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
  /** A `data-tour` target for the group, when the tour points at it. */
  tourTarget?: string;
  style?: CSSProperties;
}) {
  const groupId = useId();

  if (chips.length === 0) return null;
  const locked = selectedValue !== undefined;

  return (
    <div className={cn('flex flex-col gap-2', className)} style={style}>
      {label ? (
        <span className="text-muted-foreground text-xs">{label}</span>
      ) : null}
      <div role="group" data-tour={tourTarget} className="flex flex-wrap gap-2">
        {chips.map((chip, index) => {
          const isSelected = chip.value === selectedValue;
          const hintId = chip.hint ? `${groupId}-${chip.id}` : undefined;

          const pill = (
            <Chip
              key={chip.id}
              type="button"
              variant="outline"
              size="sm"
              disabled={locked && !isSelected}
              aria-pressed={isSelected || undefined}
              {...(hintId ? { 'aria-describedby': hintId } : {})}
              className={cn(
                'max-lg:h-11',
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

          if (!chip.hint) return pill;

          return (
            /*
             * `contents` so the wrapper leaves no box behind: the pill stays a
             * direct flex item of the row and the chip sets that have no hints
             * lay out byte-for-byte as they did before any of this. The
             * `sr-only` sibling is absolutely positioned and takes no space.
             */
            <span key={chip.id} className="contents">
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>{pill}</TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[15rem]">
                  {chip.hint}
                </TooltipContent>
              </Tooltip>
              {/*
               * The same words again, for everyone the tooltip cannot reach.
               *
               * A Radix tooltip opens on hover and on keyboard focus and on
               * neither of those on a touch screen, which is the device a
               * founder is most likely to be holding when they cannot tell
               * which of six practice areas is theirs. `aria-describedby`
               * against a visually hidden copy means the hint is part of the
               * button's description at all times, so a screen reader reads
               * it after the label whether or not the bubble ever opens.
               *
               * Radix points `aria-describedby` at its own content while the
               * tooltip is open; the text is identical either way, so the
               * handover is invisible.
               */}
              <span id={hintId} className="sr-only">
                {chip.hint}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
