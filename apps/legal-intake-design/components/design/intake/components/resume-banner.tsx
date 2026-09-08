'use client';

import { Button } from '@/components/design/design-system/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/design/design-system/card';
import { History } from '@repo/ui/icons';

type ResumeBannerProps = {
  onResume: () => void;
  onStartFresh: () => void;
};

/** Shown on entry when a saved draft exists. */
export function ResumeBanner({ onResume, onStartFresh }: ResumeBannerProps) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-16">
      <Card>
        <CardHeader>
          <div className="bg-primary/10 text-primary mb-2 flex h-10 w-10 items-center justify-center rounded-full">
            <History aria-hidden="true" className="h-5 w-5" />
          </div>
          <CardTitle>Pick up where you left off?</CardTitle>
          <CardDescription>
            We saved your answers from last time. You can continue or start a
            new intake.
          </CardDescription>
        </CardHeader>
        <CardContent />
        <CardFooter className="gap-2">
          <Button type="button" onClick={onResume}>
            Continue
          </Button>
          <Button type="button" variant="outline" onClick={onStartFresh}>
            Start fresh
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
