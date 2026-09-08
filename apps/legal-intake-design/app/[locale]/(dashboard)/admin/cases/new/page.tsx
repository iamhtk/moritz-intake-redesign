import { AdminCaseCreationSection } from '@/components/cases/admin-case-creation-section';
import { H3, Muted } from '@/components/design/design-system/typography';

export default function NewAdminCasePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <H3 asChild>
          <h1>Create a new case</h1>
        </H3>
        <Muted>
          Submit a case on behalf of a customer. We will publish it to claimable
          firms when ready.
        </Muted>
      </header>
      <AdminCaseCreationSection />
    </div>
  );
}
