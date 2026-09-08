'use client';

import { Button } from '@/components/design/design-system/button';
import { Check } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import type { QuestionOption } from '../intake-types';

type MultiSelectProps = {
  options: readonly QuestionOption[];
  value?: string[];
  onChange: (value: string[]) => void;
};

/** Multi-select checklist for "must-haves" style questions. */
export function MultiSelect({ options, value, onChange }: MultiSelectProps) {
  const selected = value ?? [];

  const toggle = (optionValue: string) => {
    if (selected.includes(optionValue)) {
      onChange(selected.filter((v) => v !== optionValue));
    } else {
      onChange([...selected, optionValue]);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <Button
            key={option.value}
            type="button"
            variant="outline"
            aria-pressed={isSelected}
            className={cn(
              'h-auto justify-start gap-2 px-3 py-2.5 text-left font-normal',
              isSelected && 'border-primary bg-primary/5',
            )}
            onClick={() => toggle(option.value)}
          >
            <span
              className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border',
                isSelected
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-input',
              )}
            >
              {isSelected ? (
                <Check aria-hidden="true" className="h-3 w-3" />
              ) : null}
            </span>
            <span className="text-sm">{option.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
