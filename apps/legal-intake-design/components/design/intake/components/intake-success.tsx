'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/design/design-system/button';
import { Card, CardContent } from '@/components/design/design-system/card';
import { Check } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { Link } from '@/i18n/navigation';
import { Heading } from '@/components/design/foundations/components/heading';
import { Text } from '@/components/design/foundations/components/text';
import { LawyerCard } from './lawyer-card';
import type { Lawyer } from '../intake-types';

type IntakeSuccessProps = {
  /** Case-type-matched lawyer shortlist to rotate through while quote pends. */
  shortlist: Lawyer[];
};

const ROTATE_MS = 6000;
const FADE_MS = 700;

/**
 * Post-submit confirmation. No lawyer is assigned yet — we prepare and email a
 * quote first, then assign a lawyer once payment clears. While that's pending
 * we rotate through a matter-matched shortlist so the client can see the kind
 * of lawyer who could take it on.
 */
export function IntakeSuccess({ shortlist }: IntakeSuccessProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (shortlist.length <= 1) return;
    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % shortlist.length);
    }, ROTATE_MS);
    return () => window.clearInterval(interval);
  }, [shortlist.length]);

  const hasShortlist = shortlist.length > 0;

  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-4 py-10 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="border-border text-foreground mz-animate-reveal flex size-12 items-center justify-center rounded-full border">
          <Check
            aria-hidden="true"
            className="mz-animate-check size-5"
            strokeWidth={1.75}
          />
        </span>
        <Heading level={2}>Your quote is on its way</Heading>
        <Text className="text-balance">
          We&apos;re reviewing your details and putting your quote together —
          we&apos;ll email it within 24 hours. Once you approve it and
          payment&apos;s in, we&apos;ll assign your lawyer.
        </Text>
      </div>

      {hasShortlist ? (
        <div className="space-y-2 text-left">
          {/* All cards share one grid cell so the container is sized to the
              tallest card and never reflows as we cross-fade between them. */}
          <div className="grid" style={{ gridTemplateAreas: '"stack"' }}>
            {shortlist.map((candidate, cardIndex) => (
              <div
                key={candidate.id}
                aria-hidden={cardIndex !== index}
                className={cn(
                  'transition-opacity ease-in-out',
                  cardIndex === index
                    ? 'opacity-100'
                    : 'pointer-events-none opacity-0',
                )}
                style={{
                  gridArea: 'stack',
                  transitionDuration: `${FADE_MS}ms`,
                }}
              >
                <LawyerCard
                  lawyer={candidate}
                  eyebrow="Lawyers who could take this on"
                />
              </div>
            ))}
          </div>
          {shortlist.length > 1 ? (
            <div className="flex justify-center gap-1.5" aria-hidden="true">
              {shortlist.map((candidate, dotIndex) => (
                <span
                  key={candidate.id}
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-colors',
                    dotIndex === index ? 'bg-primary' : 'bg-muted',
                  )}
                />
              ))}
            </div>
          ) : null}
          <p className="text-muted-foreground text-center text-xs">
            We&apos;ll assign one of our lawyers once your quote is paid.
          </p>
        </div>
      ) : null}

      <Card className="shadow-none">
        <CardContent className="text-muted-foreground text-sm">
          We&apos;ll email you as soon as your quote is ready.
        </CardContent>
      </Card>

      <Button asChild className="w-full">
        <Link href="/client/cases">Go to my cases</Link>
      </Button>
    </div>
  );
}
