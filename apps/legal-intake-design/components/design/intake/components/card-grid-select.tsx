'use client';

import { Card } from '@/components/design/design-system/card';
import { Check } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import type { QuestionOption } from '../intake-types';

type CardGridSelectProps = {
  options: readonly QuestionOption[];
  value?: string;
  columns?: 2 | 3 | 4;
  onSelect: (value: string) => void;
};

const COLUMN_CLASSES: Record<2 | 3 | 4, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

/**
 * Large tap-target cards for single-select triage questions (e.g. the matter
 * intent or sub-type). Each card shows an icon, label, and an optional
 * one-line description.
 */
export function CardGridSelect({
  options,
  value,
  columns = 2,
  onSelect,
}: CardGridSelectProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-3', COLUMN_CLASSES[columns])}>
      {options.map((option) => {
        const Icon = option.icon;
        const selected = value === option.value;
        return (
          <Card
            key={option.value}
            role="button"
            tabIndex={0}
            aria-pressed={selected}
            onClick={() => onSelect(option.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect(option.value);
              }
            }}
            className={cn(
              'relative cursor-pointer gap-2 px-4 py-4 shadow-none transition-colors',
              'hover:border-primary/60 hover:bg-accent/50',
              'focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
              selected && 'border-primary bg-primary/5',
            )}
          >
            {selected ? (
              <span className="bg-primary text-primary-foreground absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full">
                <Check aria-hidden="true" className="h-3 w-3" />
              </span>
            ) : null}
            {Icon ? (
              <Icon
                aria-hidden="true"
                className={cn(
                  'h-5 w-5',
                  selected ? 'text-primary' : 'text-muted-foreground',
                )}
              />
            ) : null}
            <div className="text-sm font-medium">{option.label}</div>
            {option.description ? (
              <p className="text-muted-foreground text-sm leading-snug">
                {option.description}
              </p>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
