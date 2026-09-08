'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { raisePortalNotification } from '@/lib/mocks/portal-notifications';
import type { LegalCase } from '@/lib/types';
import {
  feedbackForRound,
  loadReviewWorkspace,
  revisionFor,
  saveReviewWorkspace,
  seedReviewWorkspace,
  type QaFeedback,
  type ReviewWorkspace,
  type WorkSubmission,
} from './review-data';

/** How long the QA agent is made to think, so the reviewing state is readable. */
const QA_LATENCY_MS = 2200;

/** How long the drafting agent takes over a failed round. */
const DRAFTING_LATENCY_MS = 2600;

/**
 * The lawyer's submit-and-review loop for one case. Submissions and the verdicts
 * against them persist per case, so the history Marius asked for survives a
 * reload; which round is on screen is ephemeral, because that is a reading
 * position rather than a fact about the case.
 */
export function useReviewWorkspace(legalCase: LegalCase) {
  const caseId = legalCase.id;
  const [workspace, setWorkspace] = useState<ReviewWorkspace>(() =>
    seedReviewWorkspace(caseId),
  );
  const [hydrated, setHydrated] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setWorkspace(loadReviewWorkspace(caseId));
    setHydrated(true);
  }, [caseId]);

  useEffect(() => {
    if (!hydrated) return;
    saveReviewWorkspace(workspace);
  }, [hydrated, workspace]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    },
    [],
  );

  const submissions = workspace.submissions;
  const latest = submissions[submissions.length - 1];
  // The newest round is what the lawyer is working on, so it is what they land
  // on; picking an earlier one from the history overrides that until they leave.
  const active =
    submissions.find((submission) => submission.id === selectedId) ?? latest;
  const isReviewing = latest?.state === 'reviewing';

  /**
   * The drafting agent's pass over a failed round. QA does not hand its findings
   * to the lawyer directly — they go here first, and what the lawyer receives is
   * a revised draft with most of the fixes already applied.
   */
  const runDrafting = useCallback(
    (submission: WorkSubmission, feedback: QaFeedback) => {
      const timer = setTimeout(() => {
        const revision = revisionFor(submission, feedback);
        setWorkspace((current) => ({
          ...current,
          submissions: current.submissions.map((item) =>
            item.id === submission.id
              ? { ...item, revisionState: 'ready' as const, revision }
              : item,
          ),
        }));

        raisePortalNotification('LEGAL', {
          id: `ntf_revision_${caseId}_${submission.round}`,
          type: 'DRAFT_REVISION_READY',
          title: 'Revised draft ready for you',
          content: revision.summary,
          read: false,
          createdAt: new Date().toISOString(),
          caseNumber: legalCase.caseNumber,
          caseTitle: legalCase.title,
          triggeredBy: { name: 'Moritz drafting', image: null },
          href: `/legal/cases/${caseId}?view=review`,
        });
      }, DRAFTING_LATENCY_MS);
      timers.current.push(timer);
    },
    [caseId, legalCase.caseNumber, legalCase.title],
  );

  /** The QA agent's pass over a submitted round, and what follows from it. */
  const runReview = useCallback(
    (submission: WorkSubmission) => {
      const timer = setTimeout(() => {
        const feedback = feedbackForRound(submission.round);
        const failed = feedback.verdict === 'FAILED';

        setWorkspace((current) => ({
          ...current,
          submissions: current.submissions.map((item) =>
            item.id === submission.id
              ? {
                  ...item,
                  state: 'complete' as const,
                  feedback,
                  ...(failed ? { revisionState: 'drafting' as const } : {}),
                }
              : item,
          ),
          // A passing round is the work product, so it goes on to the client and
          // the loop closes.
          delivered: failed
            ? current.delivered
            : { at: new Date().toISOString(), fileName: submission.fileName },
        }));

        raisePortalNotification('LEGAL', {
          id: `ntf_qa_${caseId}_${submission.round}`,
          type: 'QA_REVIEW_COMPLETE',
          title: failed
            ? 'QA found things to fix'
            : 'QA passed — work sent to the client',
          content: feedback.brief,
          read: false,
          createdAt: new Date().toISOString(),
          caseNumber: legalCase.caseNumber,
          caseTitle: legalCase.title,
          triggeredBy: { name: 'Moritz QA', image: null },
          href: `/legal/cases/${caseId}?view=review`,
        });

        if (failed) runDrafting(submission, feedback);
      }, QA_LATENCY_MS);
      timers.current.push(timer);
    },
    [caseId, legalCase.caseNumber, legalCase.title, runDrafting],
  );

  const submitWork = useCallback(
    (fileName: string, comment: string) => {
      const round = submissions.length + 1;
      const submission: WorkSubmission = {
        id: `sub_${caseId}_${round}`,
        round,
        submittedAt: new Date().toISOString(),
        fileName,
        comment,
        state: 'reviewing',
      };
      setWorkspace((current) => ({
        ...current,
        submissions: [...current.submissions, submission],
      }));
      setSelectedId(submission.id);
      runReview(submission);
    },
    [caseId, runReview, submissions.length],
  );

  // A reload drops the timers standing in for the agents, which would leave a
  // round stuck mid-flight. Pick the newest one back up where it left off.
  const resumed = useRef(false);
  useEffect(() => {
    if (!hydrated || resumed.current) return;
    resumed.current = true;

    const inFlight = workspace.submissions[workspace.submissions.length - 1];
    if (!inFlight) return;
    if (inFlight.state === 'reviewing') {
      runReview(inFlight);
    } else if (inFlight.revisionState === 'drafting' && inFlight.feedback) {
      runDrafting(inFlight, inFlight.feedback);
    }
  }, [hydrated, workspace.submissions, runDrafting, runReview]);

  return {
    submissions,
    active,
    latest,
    isReviewing,
    delivered: workspace.delivered,
    selectSubmission: setSelectedId,
    submitWork,
  };
}

export type ReviewWorkspaceState = ReturnType<typeof useReviewWorkspace>;
