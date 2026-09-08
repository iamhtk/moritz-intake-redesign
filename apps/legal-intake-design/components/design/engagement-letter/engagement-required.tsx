'use client';

import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { FileSignature } from '@repo/ui/icons';
import { Link } from '@/i18n/navigation';
import { useClientEngagement } from './engagement-letter-context';

export function EngagementRequired() {
  const { openSigning } = useClientEngagement();

  return (
    <div className="mx-auto flex h-full w-full max-w-lg items-center px-4 py-10">
      <Card className="w-full shadow-sm">
        <CardContent className="flex flex-col items-center gap-5 p-8 text-center">
          <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-2xl">
            <FileSignature aria-hidden="true" className="size-6" />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-semibold">
              Sign your Engagement Letter first
            </h1>
            <p className="text-muted-foreground text-sm leading-6">
              Your company must accept the account terms before anyone can
              submit a case. This only needs to be completed once.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={openSigning}>Review and sign</Button>
            <Button asChild variant="outline">
              <Link href="/client">Back to home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
