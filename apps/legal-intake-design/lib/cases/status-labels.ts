/**
 * The words a case status is shown as, in one place.
 *
 * Lifted out of `components/cases/case-status-badge.tsx` (which still re-exports
 * it, so every existing importer is untouched) for one reason: Ask Nora's
 * grounding block needs these labels, and it is built inside an API route.
 * Importing a `.tsx` module that pulls in `Badge` just to read a string map
 * would drag React into a server route for nothing.
 *
 * Why the grounding block needs them at all: `notes/NOTE.md` §7 lists "the
 * prompt that disagreed with the screen about your own pipeline" among the
 * defects that only showed up when the real app was driven. Feeding the model
 * the raw enum — `READY_FOR_SUBMISSION_REVIEW` — invites it to invent its own
 * phrasing for a status the reader is simultaneously looking at on a badge.
 * Feeding it the badge's own label means Nora and the screen say the same words.
 */

import type { LegalCaseStatus } from '@/lib/types';

export const caseStatusLabels: Record<LegalCaseStatus, string> = {
  READY_FOR_SUBMISSION_REVIEW: 'Awaiting review',
  READY_FOR_ASSIGNMENT: 'Ready for assignment',
  READY_FOR_CLAIM: 'Ready for claim',
  IN_PROGRESS: 'In progress',
  CLOSED: 'Closed',
};
