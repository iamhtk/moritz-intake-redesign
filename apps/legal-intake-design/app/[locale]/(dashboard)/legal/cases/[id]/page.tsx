import { notFound } from 'next/navigation';
import { getCaseById } from '@/lib/mocks/cases';
import { getMessagesForCase } from '@/lib/mocks/messages';
import { MOCK_LEGAL_USER } from '@/lib/mocks/users';
import { LegalCaseShell } from '@/components/cases/legal/legal-case-shell';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LegalCaseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const legalCase = getCaseById(id);
  if (!legalCase) notFound();
  const messages = getMessagesForCase(legalCase.id);

  return (
    <LegalCaseShell
      legalCase={legalCase}
      messages={messages}
      currentUserId={MOCK_LEGAL_USER.id}
    />
  );
}
