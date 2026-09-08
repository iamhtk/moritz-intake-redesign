import { Badge } from '@/components/design/foundations/components/badge';
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

const labels: Record<LegalCaseStatus, string> = {
  READY_FOR_SUBMISSION_REVIEW: 'Awaiting review',
  READY_FOR_ASSIGNMENT: 'Ready for assignment',
  READY_FOR_CLAIM: 'Ready for claim',
  IN_PROGRESS: 'In progress',
  CLOSED: 'Closed',
};

export default function CaseStatusBadge({
  status,
}: {
  status: LegalCaseStatus;
}) {
  return <Badge variant={variantByStatus[status]}>{labels[status]}</Badge>;
}

export { labels as caseStatusLabels };
