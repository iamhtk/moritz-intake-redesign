'use client';

import { useEffect, useState } from 'react';
import { Download, Lock } from '@repo/ui/icons';
import { toast } from 'sonner';

import { FormattedDate } from '@/components/formatted-date';
import { Badge } from '@/components/design/foundations/components/badge';
import { Button } from '@/components/design/foundations/components/button';
import { DocumentFileIcon } from '@/components/design/documents/document-version-row';

import { loadWorkspace, type DraftHandoff } from './workspace-data';

/**
 * What crosses the line into the lawyer's view: the exact document versions ops
 * approved, and nothing else. The drafting conversation and every version that
 * was not chosen stay on the ops side of the case.
 */
export function useFirstDraftHandoff(caseId: string) {
  const [handoff, setHandoff] = useState<DraftHandoff>();

  useEffect(() => {
    setHandoff(loadWorkspace(caseId).handoff);
  }, [caseId]);

  return handoff;
}

export function FirstDraftHandoffNotice({
  handoff,
}: {
  handoff: DraftHandoff;
}) {
  return (
    <section className="border-field bg-card mb-6 rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="success">First draft handed off</Badge>
        <span className="text-muted-foreground text-xs">
          Approved by {handoff.approvedBy} ·{' '}
          <FormattedDate
            date={handoff.approvedAt}
            options={{
              day: 'numeric',
              month: 'short',
              hour: 'numeric',
              minute: '2-digit',
            }}
          />
        </span>
      </div>

      <ul className="mt-3 space-y-1">
        {handoff.items.map((item) => (
          <li
            key={item.versionId}
            className="border-field flex items-center gap-2 rounded-lg border px-3 py-2"
          >
            <DocumentFileIcon name={item.documentName} className="size-4" />
            <span className="text-foreground min-w-0 flex-1 truncate text-sm">
              {item.documentName}
            </span>
            <span className="text-muted-foreground shrink-0 text-xs">
              {item.versionLabel}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast.success(`Downloading ${item.documentName}`)}
            >
              <Download data-icon="inline-start" />
              Download
            </Button>
          </li>
        ))}
      </ul>

      <p className="text-muted-foreground mt-3 flex items-start gap-1.5 text-xs">
        <Lock className="mt-0.5 size-3.5 shrink-0" />
        These are the versions ops approved. The internal drafting conversation
        and any unselected documents are not shared.
      </p>
    </section>
  );
}
