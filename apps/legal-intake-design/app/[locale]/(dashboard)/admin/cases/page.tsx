import CasesTable from '@/components/cases/cases-table';
import { H3, Muted } from '@/components/design/design-system/typography';
import { MOCK_CASES } from '@/lib/mocks/cases';

export default function AdminCasesPage() {
  return (
    <div className="space-y-6">
      <header>
        <H3 asChild>
          <h1>Cases</h1>
        </H3>
        <Muted>
          All cases across the marketplace. Assign, claim, or jump into any
          record.
        </Muted>
      </header>
      <CasesTable
        cases={MOCK_CASES}
        basePath="/admin/cases"
        showCustomer
        showCompany
        showCounsel
        showQuoteAmount
      />
    </div>
  );
}
