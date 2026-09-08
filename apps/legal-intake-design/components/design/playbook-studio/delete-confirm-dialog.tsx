'use client';

import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertFooter,
  AlertHeader,
  AlertTitle,
} from '@/components/design/foundations/components/alert';
import { buttonVariants } from '@/components/design/foundations/components/button';
import { cn } from '@repo/ui/lib/utils';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  itemName: string;
  /** e.g. "rule" or "playbook"; used in the copy. */
  itemType: string;
}

/**
 * Destructive confirmation built on the Foundation Alert (dismissible). Replaces
 * the prototype's bespoke delete-confirmation modal. The action button closes
 * the dialog via `AlertCancel`'s underlying `DialogClose`, then runs `onConfirm`.
 */
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  itemName,
  itemType,
}: DeleteConfirmDialogProps) {
  return (
    <Alert open={open} onOpenChange={onOpenChange}>
      <AlertContent>
        <AlertHeader>
          <AlertTitle>Delete {itemType}?</AlertTitle>
          <AlertDescription>
            &ldquo;{itemName}&rdquo; will be permanently removed. This
            can&rsquo;t be undone.
          </AlertDescription>
        </AlertHeader>
        <AlertFooter>
          <button
            type="button"
            className={cn(buttonVariants({ variant: 'outline' }))}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={cn(buttonVariants({ variant: 'destructive' }))}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Delete
          </button>
        </AlertFooter>
      </AlertContent>
    </Alert>
  );
}
