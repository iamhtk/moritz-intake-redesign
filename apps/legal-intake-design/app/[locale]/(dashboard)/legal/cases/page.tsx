import type { Metadata } from 'next';
import CasesTable from '@/components/cases/cases-table';
import { H3, Muted } from '@/components/design/design-system/typography';
import { getCasesForRole } from '@/lib/mocks/cases';

export const metadata: Metadata = { title: 'Cases' };

export default function LegalCasesPage() {
  const cases = getCasesForRole('LEGAL').filter(
    (c) => c.status !== 'READY_FOR_CLAIM',
  );
  return (
    <div className="space-y-6">
      <header>
        <H3 asChild>
          <h1>Your cases</h1>
        </H3>
        <Muted>Active and closed cases assigned to your firm.</Muted>
      </header>
      <CasesTable
        cases={cases}
        basePath="/legal/cases"
        showCustomer
        showQuoteAmount
      />
    </div>
  );
}
