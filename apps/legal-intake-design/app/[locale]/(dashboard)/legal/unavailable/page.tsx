import type { Metadata } from 'next';
import { ShieldOff } from '@repo/ui/icons';
import { Card, CardContent } from '@/components/design/design-system/card';
import { Button } from '@/components/design/design-system/button';
import { Link } from '@/i18n/navigation';
import { H4, Muted } from '@/components/design/design-system/typography';

export const metadata: Metadata = { title: 'Unavailable' };

export default function UnavailablePage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <ShieldOff className="text-muted-foreground h-12 w-12" />
          <H4 asChild>
            <h1>Firm not yet activated</h1>
          </H4>
          <Muted>
            Your firm&apos;s account is being reviewed. We&apos;ll email you
            when you&apos;re ready to start claiming cases.
          </Muted>
          <Button asChild variant="outline">
            <Link href="/user">Update your details</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
