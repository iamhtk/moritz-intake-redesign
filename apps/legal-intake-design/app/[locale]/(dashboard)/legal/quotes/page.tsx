import { QuoteRoundsTable } from '@/components/quotes/quote-rounds-table';
import { H3, Muted } from '@/components/design/design-system/typography';

export default function LegalQuotesPage() {
  return (
    <div className="space-y-6">
      <header>
        <H3 asChild>
          <h1>Quote rounds</h1>
        </H3>
        <Muted>
          Open auctions you&apos;ve been invited to and your bid history.
        </Muted>
      </header>
      <QuoteRoundsTable />
    </div>
  );
}
