'use client';

import { Button } from '@/components/design/design-system/button';
import { cn } from '@repo/ui/lib/utils';
import type { QuestionOption } from '../intake-types';

type ChipSelectProps = {
  options: readonly QuestionOption[];
  value?: string;
  onSelect: (value: string) => void;
};

/**
 * Horizontal row of single-select chips (urgency, value bands, yes/no, and
 * most sub-type questions). Selecting a chip that is already active clears it.
 */
export function ChipSelect({ options, value, onSelect }: ChipSelectProps) {
  return (
    <div role="group" className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            variant={selected ? 'default' : 'outline'}
            size="sm"
            aria-pressed={selected}
            className={cn('rounded-full', selected && 'border-primary')}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
