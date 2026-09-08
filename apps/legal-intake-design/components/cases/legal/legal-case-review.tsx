'use client';

import { CircleCheck, ClipboardCheck, Send } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { Badge } from '@/components/design/foundations/components/badge';
import {
  Banner,
  BannerDescription,
  BannerTitle,
} from '@/components/design/foundations/components/banner';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/design/foundations/components/empty';
import { Spinner } from '@/components/design/foundations/components/spinner';
import { FormattedDate } from '@/components/formatted-date';
import {
  CasePanelToggle,
  caseTopBar,
} from '@/components/cases/case-header-primitives';
import { QaVerdict } from './review/qa-verdict';
import { SubmitWorkForm } from './review/submit-work-form';
import type { ReviewWorkspaceState } from './review/use-review-workspace';
import type { LegalCase } from '@/lib/types';

/**
 * Submitting work and reading the verdict, as a view of the case rather than a
 * screen of its own — the same move the drafting workspace makes on the admin
 * side. It takes the wide column because a rewrite has to show the text being
 * replaced next to the text to use, and that does not survive a 440px rail.
 */
export function LegalCaseReview({
  legalCase,
  workspace,
  attachedFileName,
  isPanelOpen,
  onTogglePanel,
}: {
  legalCase: LegalCase;
  workspace: ReviewWorkspaceState;
  /**
   * A revised draft the lawyer picked up from the Draft tab, pre-attached to the
   * next submission. It arrives from the shell because the document is handed
   * over in the rail while the form lives here.
   */
  attachedFileName?: string | null;
  isPanelOpen: boolean;
  onTogglePanel: () => void;
}) {
  const { active, latest, isReviewing, delivered, submissions } = workspace;
  // An earlier round is a record, so it is read rather than worked on; the form
  // only belongs under the newest one.
  const isViewingLatest = !active || active.id === latest?.id;
  const passed = latest?.feedback?.verdict === 'PASSED';

  return (
    <div className="@container flex min-h-0 flex-1 flex-col">
      <div className={caseTopBar}>
        <div className="flex min-w-0 shrink items-center gap-2">
          <ClipboardCheck
            aria-hidden="true"
            className="text-muted-foreground size-4 shrink-0"
          />
          <span className="text-foreground min-w-0 truncate text-sm font-medium">
            Submit work
          </span>
          {delivered ? (
            <Badge variant="success" className="@md:inline-flex hidden">
              <CircleCheck data-icon="inline-start" />
              Sent to client
            </Badge>
          ) : submissions.length > 0 ? (
            <Badge
              variant={isReviewing ? 'info' : passed ? 'success' : 'warning'}
              className="@md:inline-flex hidden"
            >
              {isReviewing ? 'In review' : `Round ${submissions.length}`}
            </Badge>
          ) : null}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <CasePanelToggle
            isPanelOpen={isPanelOpen}
            onTogglePanel={onTogglePanel}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-10 pt-4">
        <div className="mx-auto w-full max-w-3xl space-y-8">
          {delivered ? (
            <Banner variant="success">
              <CircleCheck />
              <BannerTitle>Work delivered to the client</BannerTitle>
              <BannerDescription>
                <p>
                  {delivered.fileName} passed QA and was posted into the case
                  conversation as a message from you on{' '}
                  <FormattedDate
                    date={delivered.at}
                    options={{
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                    }}
                  />
                  .
                </p>
              </BannerDescription>
            </Banner>
          ) : null}

          {isReviewing && isViewingLatest ? (
            <Banner>
              <Spinner aria-label="QA review running" />
              <BannerTitle>Checking your work</BannerTitle>
              <BannerDescription>
                Moritz QA is reading {latest?.fileName} against the standard
                checks and the client&apos;s approved positions. This usually
                takes a couple of minutes — you can leave this page.
              </BannerDescription>
            </Banner>
          ) : null}

          {active && active.state === 'complete' ? (
            <QaVerdict submission={active} />
          ) : null}

          {submissions.length === 0 ? (
            <Empty className="border-field rounded-2xl border py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Send />
                </EmptyMedia>
                <EmptyTitle>Nothing submitted yet</EmptyTitle>
                <EmptyDescription>
                  When your work on {legalCase.title} is ready, submit it here.
                  It is checked against the standard list before it reaches the
                  client, and you get the verdict back on this page.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}

          {/*
           * Nothing to submit once a round has passed — the work is with the
           * client, and another upload would have no verdict to come back to.
           */}
          {!delivered && !isReviewing && isViewingLatest ? (
            <div
              className={cn(
                submissions.length > 0 && 'border-border border-t pt-6',
              )}
            >
              <SubmitWorkForm
                // Remounted when a revision is picked up in the rail, so the
                // form takes that document as its starting attachment.
                key={attachedFileName ?? 'blank'}
                round={submissions.length + 1}
                attached={
                  attachedFileName ? { name: attachedFileName } : undefined
                }
                onSubmit={workspace.submitWork}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
