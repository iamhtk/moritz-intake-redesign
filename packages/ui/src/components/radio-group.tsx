'use client';

import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

import { cn } from '@repo/ui/lib/utils';

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('grid gap-3', className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        'border-field bg-background text-primary-foreground shadow-xs group peer relative aspect-square size-4 shrink-0 cursor-pointer rounded-full border outline-none transition-[color,box-shadow]',
        // Hover (unchecked, enabled): deepen the resting border.
        'not-disabled:not-data-[state=checked]:hover:border-foreground/30',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'data-[state=checked]:bg-primary data-[state=checked]:border-primary',
        'aria-invalid:border-error aria-invalid:ring-error/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {/* Faint preview dot shown on hover while unchecked and enabled. */}
      <span
        aria-hidden
        className="group-[[data-state=unchecked]:hover:not(:disabled)]:bg-foreground/15 pointer-events-none absolute inset-0 m-auto size-1.5 rounded-full bg-transparent transition-colors"
      />
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-full items-center justify-center"
      >
        <span className="size-1.5 rounded-full bg-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
