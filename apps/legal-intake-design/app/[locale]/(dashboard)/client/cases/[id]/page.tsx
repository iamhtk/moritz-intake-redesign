import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCaseById } from '@/lib/mocks/cases';
import { getMessagesForCase } from '@/lib/mocks/messages';
import { MOCK_CLIENT_USER } from '@/lib/mocks/users';
import { ClientCaseShell } from '@/components/cases/client/client-case-shell';

/**
 * The matter's own name in the tab, not the word "Case".
 *
 * This is the page people keep several of open at once, so it is the one
 * where a generic title costs the most: six tabs reading "Case · Moritz" is
 * the same as six tabs reading nothing. Falls back to the id when the record
 * does not resolve — the page itself will 404, and a tab that says which
 * address failed is more use than one that says "Case".
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const legalCase = getCaseById(id);
  return { title: legalCase?.title ?? `Case ${id}` };
}

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
