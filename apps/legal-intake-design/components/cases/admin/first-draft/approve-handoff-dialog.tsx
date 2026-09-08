'use client';

import { useState } from 'react';
import { Send, TriangleAlert } from '@repo/ui/icons';
import { toast } from 'sonner';

import {
  Alert,
  AlertAction,
  AlertCancel,
  AlertBody,
  AlertContent,
  AlertDescription,
  AlertFooter,
  AlertHeader,
  AlertTitle,
} from '@/components/design/foundations/components/alert';
import { Button } from '@/components/design/foundations/components/button';
import { DocumentFileIcon } from '@/components/design/documents/document-version-row';
import type { ParticipantRef } from '@/lib/types';

import type { DraftDocument, DraftDocumentVersion } from './workspace-data';

/**
 * The point of no return: what leaves ops, at which version, and to whom. What
 * is on screen is what goes, spelled out rather than assumed, because after
 * this the lawyer works from this file and the drafting conversation stays
 * behind.
 */
export function ApproveHandoffDialog({
  document,
  version,
  lawyer,
  onApprove,
}: {
  document: DraftDocument;
  version: DraftDocumentVersion;
  lawyer: ParticipantRef | null;
  onApprove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const isLatest = version.version === document.versions.length;

  return (
    <Alert open={open} onOpenChange={setOpen}>
      <Button
        size="sm"
        disabled={!lawyer}
        title={
          lawyer
            ? undefined
            : 'Assign a lawyer to this case before handing over the draft.'
        }
        onClick={() => setOpen(true)}
      >
        {/* The confirmation is where the approval happens and where the whole
            consequence is spelled out, so the button only has to name the
            destination. */}
        <Send data-icon="inline-start" />
        Send to lawyer
      </Button>

      <AlertContent>
        <AlertHeader>
          <AlertTitle>
            Send v{version.version} to {lawyer?.name}?
          </AlertTitle>
          <AlertDescription>
            {lawyer?.name} gets v{version.version} of {document.name} in the
            case portal, and is notified. Your drafting conversation and every
            other version stay internal to ops.
          </AlertDescription>
        </AlertHeader>

        <AlertBody className="space-y-2">
          <div className="border-field flex items-center gap-2 rounded-lg border px-3 py-2.5">
            <DocumentFileIcon name={document.name} className="size-4" />
            <span className="text-foreground min-w-0 flex-1 truncate text-sm">
              {document.name}
            </span>
            <span className="text-muted-foreground shrink-0 text-xs">
              v{version.version}
              {isLatest ? ' · latest' : ' · earlier version'}
            </span>
          </div>

          {/* Sending an old version is a legitimate choice, but never an
              accidental one. */}
          {!isLatest ? (
            <p className="border-warning/30 bg-warning/10 text-foreground flex items-start gap-1.5 rounded-lg border px-3 py-2 text-xs">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              You are reading v{version.version}, but v
              {document.versions.length} is newer. Only v{version.version} will
              be sent.
            </p>
          ) : null}
        </AlertBody>

        <AlertFooter>
          <AlertCancel disabled={sending}>Cancel</AlertCancel>
          <AlertAction
            disabled={sending || !lawyer}
            onClick={(event) => {
              event.preventDefault();
              if (sending) return;
              setSending(true);
              onApprove();
              setSending(false);
              setOpen(false);
              toast.success(`First draft sent to ${lawyer?.name}`, {
                description: `${document.name} (v${version.version}) handed over. Portal notification sent.`,
              });
            }}
          >
            {sending ? 'Sending…' : `Send v${version.version}`}
          </AlertAction>
        </AlertFooter>
      </AlertContent>
    </Alert>
  );
}
