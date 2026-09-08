'use client';

import { Check, Download, FilePlus2, UserPen, Wand2 } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { Badge } from '@/components/design/foundations/components/badge';
import { Button } from '@/components/design/design-system/button';
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/design/foundations/components/attachment';
import { Spinner } from '@/components/design/foundations/components/spinner';
import { DocumentFileIcon } from '@/components/design/documents/document-version-row';
import { FormattedDate } from '@/components/formatted-date';
import { PanelSection } from '@/components/cases/case-detail-primitives';
import { allThingsToFix, type ThingToFix } from './review-data';
import type { WorkSubmission } from './review-data';

/**
 * The drafting agent's pass over a failed round, in the rail beside the rounds
 * it belongs to. It sits here rather than in the main column so the verdict
 * keeps that space to itself: the findings are read on the left, and the draft
 * answering them is picked up on the right and carried into the form.
 */
export function DraftRevisionSection({
  submission,
  onAdopt,
  onDownload,
}: {
  /** The failed round the revision answers. */
  submission: WorkSubmission;
  /** Carry the revised draft over to the next submission. */
  onAdopt: (fileName: string) => void;
  onDownload: (fileName: string) => void;
}) {
  const { revision, revisionState } = submission;

  if (revisionState === 'drafting') {
    return (
      <PanelSection title="Revised draft">
        <div className="border-field flex items-start gap-3 rounded-xl border p-3">
          <Spinner aria-label="Drafting agent working" className="mt-0.5" />
          <div className="min-w-0">
            <div className="text-foreground text-sm">
              Working on QA&apos;s findings
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Round {submission.round} did not pass, so the findings went back
              to the drafting agent. The revised draft will land here.
            </p>
          </div>
        </div>
      </PanelSection>
    );
  }

  if (!revision) return null;

  const findings = submission.feedback
    ? allThingsToFix(submission.feedback)
    : [];
  const byId = new Map<string, ThingToFix>(
    findings.map((fix) => [fix.id, fix]),
  );

  return (
    <PanelSection
      title="Revised draft"
      action={
        <Badge variant="accent">
          <Wand2 data-icon="inline-start" />
          Round {submission.round}
        </Badge>
      }
    >
      <div className="space-y-3">
        <p className="text-muted-foreground text-xs leading-relaxed">
          {revision.summary}
        </p>

        <Attachment className="w-full" state="done">
          <AttachmentMedia>
            <DocumentFileIcon name={revision.fileName} />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{revision.fileName}</AttachmentTitle>
            <AttachmentDescription>
              Moritz drafting ·{' '}
              <FormattedDate
                date={revision.createdAt}
                options={{
                  day: 'numeric',
                  month: 'short',
                  hour: 'numeric',
                  minute: '2-digit',
                }}
              />
            </AttachmentDescription>
          </AttachmentContent>
        </Attachment>

        <ul className="border-field divide-border/70 divide-y rounded-xl border">
          {revision.attempts.map((attempt) => {
            const fix = byId.get(attempt.fixId);
            const addressed = attempt.outcome === 'ADDRESSED';
            return (
              <li
                key={attempt.fixId}
                className="flex items-start gap-2.5 p-2.5"
              >
                <span
                  className={cn(
                    'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full',
                    addressed
                      ? 'bg-green-500/15 text-green-700'
                      : 'bg-amber-500/15 text-amber-700',
                  )}
                >
                  {addressed ? (
                    <Check className="size-3" aria-hidden="true" />
                  ) : (
                    <UserPen className="size-3" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-foreground text-xs leading-relaxed">
                    {fix ? findingLabel(fix) : attempt.fixId}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {addressed ? attempt.note : `Over to you — ${attempt.note}`}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onAdopt(revision.fileName)}>
            <FilePlus2 data-icon="inline-start" />
            Use for my submission
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDownload(revision.fileName)}
          >
            <Download data-icon="inline-start" />
            Download
          </Button>
        </div>

        <p className="text-muted-foreground text-xs leading-relaxed">
          Read it before you resubmit — it is the agent&apos;s reading of QA,
          and the work going to the client is still yours.
        </p>
      </div>
    </PanelSection>
  );
}

/** A short handle for a finding, so an outcome row says which one it is about. */
function findingLabel(fix: ThingToFix): string {
  switch (fix.type) {
    case 'REWRITE':
      return `Rewrite: “${truncate(fix.currentText)}”`;
    case 'MISSING_REFERENCE':
      return `Missing reference: “${truncate(fix.currentText)}”`;
    case 'GENERIC':
      return truncate(fix.description, 90);
  }
}

function truncate(text: string, max = 56): string {
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()}…`;
}
