'use client';

import { useEffect, useState } from 'react';
import { Scale } from '@repo/ui/icons';
import { Subheading } from '@/components/design/foundations/components/heading';
import { Text } from '@/components/design/foundations/components/text';
import { GENERATION_STAGES } from '../mock-draft-generation';

type GeneratingScreenProps = {
  onComplete: () => void;
};

/**
 * Mock quote-prep screen. Steps through the canned status messages on a timer,
 * then calls `onComplete` to advance to the success screen.
 */
export function GeneratingScreen({ onComplete }: GeneratingScreenProps) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;

    GENERATION_STAGES.forEach((stage, index) => {
      elapsed += stage.durationMs;
      if (index < GENERATION_STAGES.length - 1) {
        timers.push(
          setTimeout(() => {
            if (!cancelled) setStageIndex(index + 1);
          }, elapsed),
        );
      } else {
        timers.push(
          setTimeout(() => {
            if (!cancelled) onComplete();
          }, elapsed),
        );
      }
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [onComplete]);

  const activeLabel = GENERATION_STAGES[stageIndex]?.label ?? 'Almost there…';

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full">
        <Scale aria-hidden="true" className="h-7 w-7 animate-pulse" />
      </div>
      <div className="space-y-2">
        <Subheading level={2}>{activeLabel}</Subheading>
        <Text>This usually takes under a minute. Hang tight.</Text>
      </div>
      <div className="flex gap-1.5">
        {GENERATION_STAGES.map((stage, index) => (
          <div
            key={stage.label}
            className={
              index <= stageIndex
                ? 'bg-primary h-1.5 w-8 rounded-full transition-colors'
                : 'bg-muted h-1.5 w-8 rounded-full transition-colors'
            }
          />
        ))}
      </div>
    </div>
  );
}
