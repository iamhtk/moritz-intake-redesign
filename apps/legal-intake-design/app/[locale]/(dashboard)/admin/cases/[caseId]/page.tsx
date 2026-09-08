import { notFound } from 'next/navigation';
import { getCaseById } from '@/lib/mocks/cases';
import { getMessagesForCase } from '@/lib/mocks/messages';
import { MOCK_ADMIN_USER } from '@/lib/mocks/users';
import { AdminCaseShell } from '@/components/cases/admin/admin-case-shell';

interface PageProps {
  params: Promise<{ caseId: string }>;
}

export default async function AdminCaseDetailPage({ params }: PageProps) {
  const { caseId } = await params;
  const legalCase = getCaseById(caseId);
  if (!legalCase) notFound();
  const messages = getMessagesForCase(legalCase.id);

  return (
    <AdminCaseShell
      legalCase={legalCase}
      messages={messages}
      currentUserId={MOCK_ADMIN_USER.id}
    />
  );
}
