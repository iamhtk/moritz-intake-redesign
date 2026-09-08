import { CaseCreationSection } from './case-creation-section';
import { IntakeEntry } from '@/components/design/intake/intake-entry';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ClientNewCasePage({ params }: PageProps) {
  await params;

  return (
    <div className="h-full">
      <IntakeEntry
        fallback={
          <div className="mx-auto flex w-full max-w-2xl flex-col py-4 lg:py-8">
            <CaseCreationSection />
          </div>
        }
      />
    </div>
  );
}
