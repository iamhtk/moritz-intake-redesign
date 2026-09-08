import type { Document } from '@/lib/types';

import type { DraftHandoff } from './workspace-data';

/**
 * The approved draft, as a case file.
 *
 * Approval is the moment the draft stops being workspace-only, so the versions
 * ops sent join the case's Documents tab alongside everything the client and
 * counsel put there. Only the approved versions cross over — the workspace's
 * other documents and every version that was not chosen stay internal — and
 * they carry the `ai` actor, which files them under "From Moritz".
 */
export function handoffDocuments(handoff?: DraftHandoff): Document[] {
  if (!handoff) return [];

  return handoff.items.map((item) => ({
    id: `handoff-${item.versionId}`,
    familyId: `handoff-${item.documentId}`,
    version: Number(item.versionLabel.replace(/\D/g, '')) || 1,
    name: item.documentName,
    size: 0,
    mimeType: '',
    uploadedAt: handoff.approvedAt,
    uploadedBy: 'Moritz drafting service',
    uploaderActor: 'ai',
    docType: 'agreement',
    status: 'delivered',
    isDraft: false,
  }));
}
