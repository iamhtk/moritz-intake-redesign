'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import { ArrowLeft } from '@repo/ui/icons';
import { Button } from '@/components/design/design-system/button';
import { Heading } from '@/components/design/foundations/components/heading';
import { Text } from '@/components/design/foundations/components/text';

type IntakeQuestionScreenProps = {
  /** Identifies the active question; changing it replays the enter animation. */
  stepKey: string;
  stepIndex: number;
  stepCount: number;
  isFirst: boolean;
  isLast: boolean;
  title: string;
  helper?: string;
  optional: boolean;
  canContinue: boolean;
  /** Override the forward button label (e.g. "Save" when editing from review). */
  forwardLabel?: string;
  onBack: () => void;
  onContinue: () => void;
  children: ReactNode;
};

/**
 * Focused, Typeform-style single-question screen: a slim progress bar and Back
 * control up top, one prominent prompt, the supplied input, and a single
 * forward action. One question is on screen at a time to keep cognitive load
 * low. Grounded in the foundation `Heading`/`Text`/`Button` primitives.
 */
export function IntakeQuestionScreen({
  stepKey,
  stepIndex,
  stepCount,
  isFirst,
  isLast,
  title,
  helper,
  optional,
  canContinue,
  forwardLabel,
  onBack,
  onContinue,
  children,
}: IntakeQuestionScreenProps) {
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  // Move focus to the prompt on each new question (a11y: announce + orient).
  useEffect(() => {
    headingRef.current?.focus();
  }, [stepKey]);

  const progress = Math.min(
    100,
    Math.round(((stepIndex + 1) / Math.max(stepCount, 1)) * 100),
  );
  const resolvedForwardLabel =
    forwardLabel ??
    (isLast ? 'Review' : optional && !canContinue ? 'Skip' : 'Continue');

  return (
    <div className="mx-auto flex h-[calc(100dvh-7rem)] w-full max-w-xl flex-col px-4 py-6">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {isFirst ? (
            <span className="h-8" />
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground -ml-2"
              onClick={onBack}
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back
            </Button>
          )}
          <span className="text-muted-foreground ml-auto text-xs tabular-nums">
            Question {stepIndex + 1} of ~{stepCount}
          </span>
        </div>
        <div
          className="bg-muted h-1 w-full overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="bg-primary h-full rounded-full transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div
        key={stepKey}
        className="mz-animate-step flex flex-1 flex-col justify-center"
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Text className="text-xs font-medium uppercase tracking-wide">
              Moritz
            </Text>
            <Heading
              ref={headingRef}
              level={2}
              tabIndex={-1}
              className="outline-none"
            >
              {title}
            </Heading>
            {helper ? <Text className="text-balance">{helper}</Text> : null}
          </div>

          {children}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="button" onClick={onContinue} disabled={!canContinue}>
          {resolvedForwardLabel}
        </Button>
      </div>
    </div>
  );
}
