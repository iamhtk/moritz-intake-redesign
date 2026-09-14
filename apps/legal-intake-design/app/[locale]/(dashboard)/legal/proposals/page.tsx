import type { Metadata } from 'next';
import CasesTable from '@/components/cases/cases-table';
import { H3, Muted } from '@/components/design/design-system/typography';
import { MOCK_CASES } from '@/lib/mocks/cases';

export const metadata: Metadata = { title: 'Proposals' };

export default function LegalProposalsPage() {
  const proposals = MOCK_CASES.filter((c) => c.status === 'READY_FOR_CLAIM');
  return (
    <div className="space-y-6">
      <header>
        <H3 asChild>
          <h1>Open proposals</h1>
        </H3>
        <Muted>Anonymised cases you can claim before the deadline.</Muted>
      </header>
      <CasesTable
        cases={proposals}
        basePath="/legal/proposals"
        proposalBasePath="/legal/proposals"
        allowedStatuses={['READY_FOR_CLAIM']}
      />
    </div>
  );
}
