import CasesTable from '@/components/cases/cases-table';
import { GatedNewCaseButton } from '@/components/design/engagement-letter/gated-new-case-button';
import { H3, Muted } from '@/components/design/design-system/typography';
import { getCasesForRole } from '@/lib/mocks/cases';

export default function ClientCasesPage() {
  const cases = getCasesForRole('NON_LEGAL');
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <H3 asChild>
            <h1>Your cases</h1>
          </H3>
          <Muted>
            Open issues, ongoing engagements, and recently closed cases.
          </Muted>
        </div>
        <GatedNewCaseButton label="New case" />
      </header>
      <CasesTable
        cases={cases}
        basePath="/client/cases"
        showQuoteAmount
        showCounsel
      />
    </div>
  );
}
