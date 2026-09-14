'use client';

import { useRef } from 'react';
import { buttonVariants } from '@/components/design/foundations/components/button';
import {
  Alert,
  AlertAction,
  AlertCancel,
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
  onLeaveSent,
  reason,
  reference,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onSaveDraft: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  /** Leave a case that has already been sent. Only used by `reason: 'sent'`. */
  onLeaveSent?: () => void;
  /**
   * Why the dialog is shown — tunes the copy, and for `sent` the controls too.
   *
   * `sent` exists because leaving *is* worth confirming after submission and
   * "Save as draft or delete?" is the wrong question to confirm it with. See
   * the note above the component.
   */
  reason: 'navigate' | 'restart' | 'sent';
  /** The case's reference, so the sent dialog can name what it is leaving. */
  reference?: string;
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

  /*
   * A sent case is a different question, so it gets a different dialog.
   *
   * Leaving was previously unconfirmed once the case had gone, on the sound
   * reasoning that there is no draft to save — but the effect was that Home
   * behaved one way mid-intake and another way afterwards, with nothing on
   * screen explaining the difference. A control that sometimes asks and
   * sometimes does not is one the client cannot predict, and the moment they
   * are least sure of themselves is the moment just after they submitted
   * something.
   *
   * So it always asks, and what it asks is true in both states. Offering
   * "Delete case" here would be the serious version of the same mistake:
   * the case is with the firm, this browser cannot delete it, and a button
   * saying otherwise on the screen that just said "Case sent" would undo the
   * one reassurance that screen exists to give.
   */
  if (reason === 'sent') {
    return (
      <Alert open={open} onOpenChange={handleOpenChange}>
        <AlertContent size="md">
          <AlertHeader>
            <AlertTitle>Leave this case?</AlertTitle>
            <AlertDescription>
              {reference
                ? `Your case is with us as ${reference}. Nothing here is lost — you can open it any time from Your cases.`
                : 'Your case is with us. Nothing here is lost — you can open it any time from Your cases.'}
            </AlertDescription>
          </AlertHeader>
          <AlertFooter>
            <AlertCancel onClick={() => runAction(onCancel)}>Stay</AlertCancel>
            <AlertAction onClick={() => runAction(onLeaveSent ?? onCancel)}>
              Go home
            </AlertAction>
          </AlertFooter>
        </AlertContent>
      </Alert>
    );
  }

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
