'use client';

import * as React from 'react';

import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';

/**
 * The primary actions for a chat surface, sitting directly above its composer.
 *
 * Readers who are not looking for controls do not find them in composer
 * chrome — a paperclip or a button in a side panel goes unseen — so these are
 * as wide as the composer and half again as tall, split evenly across the row.
 */
function ComposerActions({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="composer-actions"
      className={cn('flex w-full items-stretch gap-2', className)}
      {...props}
    />
  );
}

/** One action in a {@link ComposerActions} row. Shares the row width evenly. */
function ComposerAction({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="composer-action"
      size="xl"
      className={cn('min-w-0 flex-1', className)}
      {...props}
    />
  );
}

export { ComposerActions, ComposerAction };
