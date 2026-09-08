import { notFound } from 'next/navigation';
import { getCaseById } from '@/lib/mocks/cases';
import { getMessagesForCase } from '@/lib/mocks/messages';
import { MOCK_CLIENT_USER } from '@/lib/mocks/users';
import { ClientCaseShell } from '@/components/cases/client/client-case-shell';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientCaseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const legalCase = getCaseById(id);
  if (!legalCase) notFound();
  const messages = getMessagesForCase(legalCase.id);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ClientCaseShell
        legalCase={legalCase}
        messages={messages}
        currentUserId={MOCK_CLIENT_USER.id}
      />
    </div>
  );
}
