import { WaitlistTable } from '@/components/admin/waitlist-table';
import { H3, Muted } from '@/components/design/design-system/typography';

export default function WaitlistPage() {
  return (
    <div className="space-y-6">
      <header>
        <H3 asChild>
          <h1>Waitlist</h1>
        </H3>
        <Muted>Prospective customers who have asked to join.</Muted>
      </header>
      <WaitlistTable />
    </div>
  );
}
