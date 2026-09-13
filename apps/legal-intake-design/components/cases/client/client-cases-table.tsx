'use client';

import CasesTable from '@/components/cases/cases-table';
import { useCasesWithSubmission } from '@/lib/mocks/submitted-cases';
import type { LegalCase } from '@/lib/types';

/**
 * "Your cases", with the case this browser submitted showing what was sent.
 *
 * A thin client boundary so the page itself stays a server component: the
 * submission lives in localStorage (there is no backend here), and the only
 * thing that has to move to the client is the overlay.
 */
export function ClientCasesTable({ cases }: { cases: LegalCase[] }) {
  const withSubmission = useCasesWithSubmission(cases);

  return (
    <CasesTable
      cases={withSubmission}
      basePath="/client/cases"
      showQuoteAmount
      showCounsel
    />
  );
}
