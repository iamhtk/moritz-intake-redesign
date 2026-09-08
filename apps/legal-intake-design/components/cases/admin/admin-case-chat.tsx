'use client';

import { CaseChat } from '@/components/cases/case-chat';
import type { Message } from '@/lib/types';

type Props = {
  caseId: string;
  messages: Message[];
  currentUserId: string;
};

/**
 * Admin case conversation — the shared {@link CaseChat} configured for the
 * internal operator's perspective (own messages are the `admin`/Moritz actor).
 */
export function AdminCaseChat({ caseId, messages, currentUserId }: Props) {
  return (
    <CaseChat
      caseId={caseId}
      messages={messages}
      currentUserId={currentUserId}
      currentUserActor="admin"
      placeholder="Message the client and counsel…"
      emptyState="No messages yet. The conversation between the client and counsel will appear here."
    />
  );
}
