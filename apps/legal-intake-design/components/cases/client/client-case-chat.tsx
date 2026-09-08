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
 * Client case conversation — the shared {@link CaseChat} configured for the
 * client's perspective (own messages are the `client` actor).
 */
export function ClientCaseChat({
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
      currentUserActor="client"
      placeholder="Message the Moritz support team…"
      emptyState="No messages yet. Your conversation will appear here."
      onUploadDocuments={onUploadDocuments}
    />
  );
}
