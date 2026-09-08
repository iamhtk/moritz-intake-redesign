'use client';

import * as React from 'react';
import { ChevronDownIcon } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/design/foundations/components/dropdown-menu';

type Option = { value: string; label: string };

type Props = {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
};

/**
 * Multi-select styled to match the Foundation Select (layered surface + chevron)
 * but built on the Radix Foundation DropdownMenu so it works inside a modal
 * dialog — unlike the Base UI Combobox, whose popup portals to `document.body`
 * and is blocked by the dialog's `pointer-events: none` / focus trap.
 */
export function SpecialtySelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
}: Props) {
  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const summary = options
    .filter((o) => value.includes(o.value))
    .map((o) => o.label)
    .join(', ');

  return (
    <DropdownMenu>
      {/* Layered "optical" surface mirroring the Foundation SelectTrigger. */}
      <span
        data-slot="control"
        className={cn(
          'relative isolate block w-full rounded-[0.5rem]',
          'before:bg-background before:absolute before:inset-px before:-z-10 before:rounded-[calc(0.5rem_-_1px)] before:shadow',
          'focus-within:after:ring-primary after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:ring-inset after:ring-transparent focus-within:after:ring-2',
          '[&:hover>button:not(:disabled)]:border-field-strong',
        )}
      >
        <DropdownMenuTrigger
          className={cn(
            'border-field relative flex w-full appearance-none items-center justify-between gap-2 whitespace-nowrap rounded-[0.5rem] border bg-transparent',
            'px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:px-[calc(--spacing(3)-1px)] sm:py-[calc(--spacing(1.5)-1px)]',
            'text-foreground text-base sm:text-sm',
            'cursor-pointer outline-none focus:outline-none',
            "[&_svg:not([class*='text-'])]:text-muted-foreground [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
          )}
        >
          <span
            className={cn(
              'line-clamp-1 text-left',
              summary ? 'text-foreground' : 'text-field-placeholder',
            )}
          >
            {summary || placeholder}
          </span>
          <ChevronDownIcon className="opacity-50" />
        </DropdownMenuTrigger>
      </span>
      <DropdownMenuContent
        align="start"
        className="w-(--radix-dropdown-menu-trigger-width) max-h-72"
      >
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={value.includes(option.value)}
            onCheckedChange={() => toggle(option.value)}
            onSelect={(e) => e.preventDefault()}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
