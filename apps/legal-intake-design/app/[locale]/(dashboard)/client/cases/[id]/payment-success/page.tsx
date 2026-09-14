import type { Metadata } from 'next';
import { CheckCircle } from '@repo/ui/icons';
import { Card, CardContent } from '@/components/design/design-system/card';
import { Button } from '@/components/design/design-system/button';
import { Link } from '@/i18n/navigation';
import { H4, Muted } from '@/components/design/design-system/typography';

export const metadata: Metadata = { title: 'Payment success' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PaymentSuccessPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <CheckCircle className="text-success h-12 w-12" />
          <H4 asChild>
            <h1>Payment received</h1>
          </H4>
          <Muted>
            Thanks — your payment was successful. The receipt will be emailed to
            you.
          </Muted>
          <Button asChild>
            <Link href={`/client/cases/${id}`}>Back to case</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
