import { CountriesTable } from '@/components/admin/countries-table';
import { H3, Muted } from '@/components/design/design-system/typography';

export default function CountriesPage() {
  return (
    <div className="space-y-6">
      <header>
        <H3 asChild>
          <h1>Countries</h1>
        </H3>
        <Muted>
          Per-country settings for routing, billing, and auto-approval.
        </Muted>
      </header>
      <CountriesTable />
    </div>
  );
}
