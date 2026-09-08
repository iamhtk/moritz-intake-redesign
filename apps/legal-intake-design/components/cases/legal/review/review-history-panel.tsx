'use client';

import { toast } from 'sonner';
import {
  Check,
  CornerDownRight,
  Paperclip,
  TriangleAlert,
  Wand2,
} from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { Badge } from '@/components/design/foundations/components/badge';
import { Spinner } from '@/components/design/foundations/components/spinner';
import { FormattedDate } from '@/components/formatted-date';
import {
  PanelEmpty,
  PanelSection,
} from '@/components/cases/case-detail-primitives';
import { DraftRevisionSection } from './draft-revision-card';
import { forwardedUpdatesForCase, type WorkSubmission } from './review-data';
import type { ReviewWorkspaceState } from './use-review-workspace';

/**
 * The rail beside the review: the revised draft waiting on the newest round,
 * every round of work on this case and the verdict it came back with, and
 * whatever the intake agent forwarded from the client conversation. Between them
 * they are the lawyer's record of the case — they are not in the client thread,
 * so this is the only place it accumulates.
 */
export function ReviewHistoryPanel({
  caseId,
  workspace,
  onAdoptRevision,
}: {
  caseId: string;
  workspace: ReviewWorkspaceState;
  /** Carry a revised draft over to the submission form in the main column. */
  onAdoptRevision: (fileName: string) => void;
}) {
  const updates = forwardedUpdatesForCase(caseId);
  const rounds = [...workspace.submissions].reverse();
  // A revision answers the newest round, and only a failed one has one.
  const revisionRound = workspace.latest?.revisionState
    ? workspace.latest
    : null;

  return (
    <div className="mz-animate-step space-y-8">
      {/*
       * The revised draft leads the rail: the verdict in the main column says
       * what is wrong, and this is the document that answers it, so it is the
       * thing to act on before reading back through earlier rounds.
       */}
      {revisionRound ? (
        <DraftRevisionSection
          submission={revisionRound}
          onAdopt={onAdoptRevision}
          onDownload={(fileName) =>
            toast.success(`Downloading ${fileName}`, {
              description:
                'File delivery is simulated in the Design Playground.',
            })
          }
        />
      ) : null}

      <PanelSection
        title="Submissions"
        action={
          rounds.length > 0 ? (
            <span className="text-muted-foreground text-xs tabular-nums">
              {rounds.length}
            </span>
          ) : undefined
        }
      >
        {rounds.length === 0 ? (
          <PanelEmpty>
            Nothing submitted yet. Each round you send, and the verdict it comes
            back with, is kept here.
          </PanelEmpty>
        ) : (
          <ul className="space-y-2">
            {rounds.map((submission) => (
              <li key={submission.id}>
                <RoundRow
                  submission={submission}
                  selected={workspace.active?.id === submission.id}
                  onSelect={() => workspace.selectSubmission(submission.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </PanelSection>

      <PanelSection title="From the case">
        {updates.length === 0 ? (
          <PanelEmpty>
            When the client sends something that changes the work, Moritz
            forwards it here.
          </PanelEmpty>
        ) : (
          <ul className="space-y-3">
            {updates.map((update) => (
              <li
                key={update.id}
                className="border-field space-y-1.5 rounded-xl border p-3"
              >
                <div className="flex items-start gap-2">
                  <CornerDownRight
                    aria-hidden="true"
                    className="text-muted-foreground mt-0.5 size-3.5 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-foreground text-sm font-medium">
                      {update.title}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Forwarded{' '}
                      <FormattedDate
                        date={update.forwardedAt}
                        options={{
                          day: 'numeric',
                          month: 'short',
                          hour: 'numeric',
                          minute: '2-digit',
                        }}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {update.summary}
                </p>
                {update.fileNames.map((name) => (
                  <div
                    key={name}
                    className="text-foreground flex items-center gap-1.5 text-xs"
                  >
                    <Paperclip
                      aria-hidden="true"
                      className="text-muted-foreground size-3 shrink-0"
                    />
                    <span className="truncate">{name}</span>
                  </div>
                ))}
              </li>
            ))}
          </ul>
        )}
      </PanelSection>
    </div>
  );
}

function RoundRow({
  submission,
  selected,
  onSelect,
}: {
  submission: WorkSubmission;
  selected: boolean;
  onSelect: () => void;
}) {
  const passed = submission.feedback?.verdict === 'PASSED';
  const reviewing = submission.state === 'reviewing';

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      className={cn(
        'focus-visible:outline-ring w-full rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
        selected
          ? 'border-foreground/20 bg-muted/50'
          : 'border-field hover:bg-muted/30',
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-foreground text-sm font-medium">
          Submission {submission.round}
        </span>
        <span className="ml-auto shrink-0">
          {reviewing ? (
            <Badge variant="info">
              <Spinner data-icon="inline-start" />
              In review
            </Badge>
          ) : passed ? (
            <Badge variant="success">
              <Check data-icon="inline-start" />
              Passed
            </Badge>
          ) : (
            <Badge variant="destructive">
              <TriangleAlert data-icon="inline-start" />
              Failed
            </Badge>
          )}
        </span>
      </div>
      <div className="text-muted-foreground mt-0.5 text-xs">
        <FormattedDate
          date={submission.submittedAt}
          options={{
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit',
          }}
        />
      </div>
      <div className="text-muted-foreground mt-1 truncate text-xs">
        {submission.fileName}
      </div>
      {/* A failed round does not end at the verdict, so the row says where the
          revision got to. */}
      {submission.revisionState ? (
        <div className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-xs">
          <Wand2 aria-hidden="true" className="size-3 shrink-0" />
          {submission.revisionState === 'drafting'
            ? 'Moritz is drafting the fixes'
            : 'Revised draft ready'}
        </div>
      ) : null}
    </button>
  );
}
