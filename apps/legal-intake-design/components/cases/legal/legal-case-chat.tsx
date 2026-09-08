'use client';

import { CaseChat } from '@/components/cases/case-chat';
import type { Document, Message } from '@/lib/types';

type Props = {
  caseId: string;
  messages: Message[];
  currentUserId: string;
  onUploadDocuments?: (fileNames: string[]) => Document[];
};

/**
 * Legal case conversation — the shared {@link CaseChat} configured for counsel's
 * perspective (own messages are the `legal` actor).
 */
export function LegalCaseChat({
  caseId,
  messages,
  currentUserId,
  onUploadDocuments,
}: Props) {
  return (
    <CaseChat
      caseId={caseId}
      messages={messages}
      currentUserId={currentUserId}
      currentUserActor="legal"
      placeholder="Reply to the client…"
      emptyState="No messages yet. The conversation with the client will appear here."
      onUploadDocuments={onUploadDocuments}
    />
  );
}
