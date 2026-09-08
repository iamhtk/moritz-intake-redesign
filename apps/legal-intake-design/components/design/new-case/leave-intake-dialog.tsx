'use client';

import { useRef } from 'react';
import { buttonVariants } from '@/components/design/foundations/components/button';
import {
  Alert,
  AlertAction,
  AlertContent,
  AlertDescription,
  AlertFooter,
  AlertHeader,
  AlertTitle,
} from '@/components/design/foundations/components/alert';

/**
 * Confirmation shown when leaving (or restarting) a half-finished intake. Built
 * on the Foundation `Alert` (the design library's modal confirmation), like the
 * shared navigation guard — not a plain Dialog — so the surface, backdrop, and
 * action layout match the rest of the app. Dismissing (Escape / outside click)
 * is treated as cancel.
 */
export function LeaveIntakeDialog({
  open,
  onOpenChange,
  onSaveDraft,
  onDiscard,
  onCancel,
  reason,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onSaveDraft: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  /** Why the dialog is shown — tunes the copy for navigate vs. start-over. */
  reason: 'navigate' | 'restart';
}) {
  // Track button-driven closes so the dismiss handler does NOT also fire the
  // cancel logic (which would, e.g., clear a pending navigation we acted on).
  const explicitActionRef = useRef(false);

  const handleOpenChange = (next: boolean) => {
    if (!next && !explicitActionRef.current) onCancel();
    explicitActionRef.current = false;
    onOpenChange(next);
  };

  // AlertAction is a Radix Close, so it closes the alert itself; we just run the
  // action and flag the close as explicit.
  const runAction = (action: () => void) => {
    explicitActionRef.current = true;
    action();
  };

  const title = reason === 'restart' ? 'Start a new case?' : 'Leave this case?';
  const description =
    reason === 'restart'
      ? "You're in the middle of an intake. Save your progress as a draft so you can come back to it, or delete it and begin fresh."
      : "You're in the middle of an intake. Save your progress as a draft so you can return any time, or delete it before leaving.";

  return (
    <Alert open={open} onOpenChange={handleOpenChange}>
      <AlertContent size="md">
        <AlertHeader>
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{description}</AlertDescription>
        </AlertHeader>
        <AlertFooter>
          <AlertAction
            className={buttonVariants({ variant: 'destructive' })}
            onClick={() => runAction(onDiscard)}
          >
            Delete case
          </AlertAction>
          <AlertAction onClick={() => runAction(onSaveDraft)}>
            Save as draft
          </AlertAction>
        </AlertFooter>
      </AlertContent>
    </Alert>
  );
}
