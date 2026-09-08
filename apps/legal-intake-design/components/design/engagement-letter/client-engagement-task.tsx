'use client';

import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { ArrowRight } from '@repo/ui/icons';
import { useClientEngagement } from './engagement-letter-context';

export function ClientEngagementTask() {
  const { enabled, isPending, openSigning } = useClientEngagement();

  if (!enabled || !isPending) return null;

  return (
    <section aria-label="Account setup">
      <Card className="overflow-hidden py-0 shadow-sm">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:p-6">
          <SignatureMark />
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="font-semibold">Review your Engagement Letter</h3>
            <p className="text-muted-foreground text-sm leading-6">
              Sign your company&rsquo;s terms before submitting your first case.
            </p>
          </div>
          <Button onClick={openSigning} className="group shrink-0">
            Review and sign
            <ArrowRight
              data-icon="inline-end"
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

function SignatureMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 24"
      fill="none"
      className="text-foreground mz-animate-draw h-7 w-10 shrink-0 self-start [--mz-draw:96]"
      style={{ animationDelay: '0s', animationDuration: '4s' }}
    >
      <path
        d="M3 17.5c4.2-1.4 6.3-5.1 7.2-8.7.4-1.8.3-3.8-.8-3.8-1.6 0-2.1 4.8-1.6 8.2.4 2.8 1.7 5.2 3.4 5.2 2.1 0 3.2-4.7 4.7-4.7 1.2 0 .5 3.6 2 3.6 1.6 0 2.2-3.2 3.7-3.2 1.3 0 1 2.7 2.5 2.7 1.2 0 2.3-.8 4.9-2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 21c7-1.2 14.1-1.2 23 0"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
