import type { Metadata } from 'next';
import { AlertCircle } from '@repo/ui/icons';
import { Card, CardContent } from '@/components/design/design-system/card';
import { Button } from '@/components/design/design-system/button';
import { Link } from '@/i18n/navigation';
import { H4, Muted } from '@/components/design/design-system/typography';

export const metadata: Metadata = { title: 'Payment cancelled' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PaymentCancelledPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <AlertCircle className="text-destructive h-12 w-12" />
          <H4 asChild>
            <h1>Payment cancelled</h1>
          </H4>
          <Muted>
            No charge was made. You can retry payment from the billing tab any
            time.
          </Muted>
          <Button asChild>
            <Link href={`/client/cases/${id}`}>Back to case</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
