import CaseConfirmation from '@/components/cases/case-confirmation';

interface PageProps {
  searchParams: Promise<{ caseId?: string | string[] }>;
}

export default async function ReceiptPage({ searchParams }: PageProps) {
  const { caseId } = await searchParams;
  const resolvedCaseId = typeof caseId === 'string' ? caseId.trim() : undefined;

  return (
    <div className="mx-auto flex min-h-full max-w-3xl items-center justify-center">
      <CaseConfirmation caseId={resolvedCaseId} />
    </div>
  );
}
