import { H3, Muted } from '@/components/design/design-system/typography';
import { LawFirmsTable } from '@/components/design/law-firms/law-firms-table';

export default function AdminLawFirmsPage() {
  return (
    <div className="space-y-6">
      <header>
        <H3 asChild>
          <h1>Law firms</h1>
        </H3>
        <Muted>Manage the law firms on the platform.</Muted>
      </header>
      <LawFirmsTable />
    </div>
  );
}
