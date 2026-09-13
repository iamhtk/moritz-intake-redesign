import { Badge } from '@/components/design/foundations/components/badge';
import { caseStatusLabels as labels } from '@/lib/cases/status-labels';
import type { LegalCaseStatus } from '@/lib/types';

const variantByStatus: Record<
  LegalCaseStatus,
  'warning' | 'info' | 'success' | 'secondary'
> = {
  READY_FOR_SUBMISSION_REVIEW: 'warning',
  READY_FOR_ASSIGNMENT: 'info',
  READY_FOR_CLAIM: 'secondary',
  IN_PROGRESS: 'info',
  CLOSED: 'secondary',
};

export default function CaseStatusBadge({
  status,
}: {
  status: LegalCaseStatus;
}) {
  return <Badge variant={variantByStatus[status]}>{labels[status]}</Badge>;
}

/*
 * The labels themselves now live in `lib/cases/status-labels.ts` so that Ask
 * Nora's grounding block can read them without importing a React component into
 * an API route. Re-exported here because every existing caller imports them
 * from this module, and one source of truth is the whole point.
 */
export { labels as caseStatusLabels };
