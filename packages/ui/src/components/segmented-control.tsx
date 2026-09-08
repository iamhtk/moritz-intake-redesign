'use client';

import * as React from 'react';
import { cn } from '@repo/ui/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface SegmentedControlOption {
  value: string;
  label: string;
  icon?: LucideIcon;
  href?: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onValueChange?: (value: string) => void;
  className?: string;
  LinkComponent?: React.ComponentType<{
    href: string;
    className?: string;
    children: React.ReactNode;
  }>;
}

function SegmentedControl({
  options,
  value,
  onValueChange,
  className,
  LinkComponent,
}: SegmentedControlProps) {
  return (
    <div
      className={cn(
        'bg-muted inline-flex items-center gap-1 rounded-lg p-1',
        className,
      )}
      role="tablist"
    >
      {options.map((option) => {
        const isActive = value === option.value;
        const Icon = option.icon;
        const baseClassName = cn(
          'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all cursor-pointer',
          'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          isActive
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        );

        const content = (
          <>
            {Icon && <Icon className="size-4" />}
            <span>{option.label}</span>
          </>
        );

        if (option.href && LinkComponent) {
          return (
            <LinkComponent
              key={option.value}
              href={option.href}
              className={baseClassName}
            >
              {content}
            </LinkComponent>
          );
        }

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onValueChange?.(option.value)}
            className={baseClassName}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

export { SegmentedControl, type SegmentedControlOption };
