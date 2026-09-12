import { IntakeV2 } from '@/components/design/intake-v2/intake-v2';

interface PageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Client intake. The redesign renders unconditionally — no `useSimplifiedMatterIntake`
 * flag, no engagement-letter gate (Decision 28). Reviewers have used this
 * playground before at the same address, so stale flag state in a browser must
 * not be able to show them the old form.
 */
export default async function ClientNewCasePage({ params }: PageProps) {
  await params;

  return (
    <div className="h-full">
      <IntakeV2 />
    </div>
  );
}
