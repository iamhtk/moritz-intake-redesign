'use client';

import { Check } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { DOCUMENTS_KEY, RECAP_KEY } from './intake-types';
import {
  type AnswersMap,
  type IntakeFile,
  type MatterId,
} from './intake-types';
import { orderedQuestions } from './script';

type StepState = 'complete' | 'active' | 'skipped' | 'upcoming';

/**
 * Live "case brief" the assistant fills in as the conversation progresses.
 * A slim progress summary sits above a connected vertical timeline: each step
 * reads as complete (filled check), active (the awaited question), or upcoming
 * (quiet placeholder), with the connector tracing how far we've come. Before a
 * matter is chosen, only the matter-type step shows.
 */
type BriefStep = {
  key: string;
  label: string;
  state: StepState;
};

export function IntakeBriefPanel({
  matterId,
  answers,
  files,
  currentKey,
  submitted = false,
}: {
  matterId?: MatterId;
  answers: AnswersMap;
  files: IntakeFile[];
  currentKey: string;
  submitted?: boolean;
}) {
  const rows = orderedQuestions(matterId, answers).filter(
    (q) => q.key !== RECAP_KEY,
  );

  const isFilled = (key: string): boolean => {
    if (key === DOCUMENTS_KEY) return files.length > 0;
    const value = answers[key];
    return value !== undefined && value !== '';
  };

  const activeIndex = rows.findIndex((q) => q.key === currentKey);

  const questionSteps: BriefStep[] = rows.map((q, i) => {
    const filled = isFilled(q.key);
    const active = i === activeIndex && !filled;
    // Anything left unanswered once we've moved past it (or past all questions,
    // e.g. at the recap) reads as skipped rather than still upcoming.
    const passed = activeIndex === -1 || i < activeIndex;
    let state: StepState;
    if (filled) state = 'complete';
    else if (active) state = 'active';
    else if (passed) state = 'skipped';
    else state = 'upcoming';
    return {
      key: q.key,
      label: q.reviewLabel,
      state,
    };
  });

  // Closing, informational step: once the case is submitted we connect the
  // client with a lawyer. Shown alongside the real question steps (only after a
  // matter is picked) and stays "upcoming" until submission completes it.
  const lawyerStep: BriefStep = {
    key: 'lawyer-match',
    label: 'Your lawyer',
    state: submitted ? 'complete' : 'upcoming',
  };

  const steps: BriefStep[] = matterId
    ? [...questionSteps, lawyerStep]
    : questionSteps;

  const filledCount = steps.filter((s) => s.state === 'complete').length;
  const totalCount = steps.length;
  const progress = totalCount === 0 ? 0 : filledCount / totalCount;
  const questionsComplete =
    questionSteps.length > 0 &&
    questionSteps.every((s) => s.state === 'complete');

  return (
    <div className="flex w-full flex-col gap-7">
      <section className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.18em]">
            Case brief
          </span>
          <span className="text-muted-foreground/80 text-xs tabular-nums">
            {filledCount}
            <span className="text-muted-foreground/40"> / {totalCount}</span>
          </span>
        </div>
        <div
          className="bg-muted h-1 overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={filledCount}
          aria-valuemin={0}
          aria-valuemax={totalCount}
        >
          <div
            className="bg-success h-full rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {submitted
            ? 'Submitted — we’re connecting you with a lawyer.'
            : questionsComplete
              ? 'Everything captured — submit whenever you’re ready.'
              : filledCount > 0
                ? 'Filling this in as we talk.'
                : 'I’ll capture the details here as we chat.'}
        </p>
      </section>

      <ol className="flex flex-col">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center self-stretch">
                <StepDot state={step.state} />
                {!isLast ? (
                  <span
                    className={cn(
                      'my-1 w-px flex-1 rounded-full',
                      step.state === 'complete' ? 'bg-success/30' : 'bg-border',
                    )}
                  />
                ) : null}
              </div>
              <div
                className={cn(
                  'flex min-w-0 flex-1 items-center pb-6',
                  isLast && 'pb-0',
                )}
              >
                <p
                  className={cn(
                    'text-sm font-medium leading-snug',
                    step.state === 'upcoming' || step.state === 'skipped'
                      ? 'text-muted-foreground'
                      : 'text-foreground',
                  )}
                >
                  {step.label}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepDot({ state }: { state: StepState }) {
  if (state === 'complete') {
    return (
      <span
        aria-hidden="true"
        className="bg-success flex size-[18px] shrink-0 items-center justify-center rounded-full text-white"
      >
        <Check className="size-2.5" strokeWidth={3} />
      </span>
    );
  }
  if (state === 'active') {
    return (
      <span
        aria-hidden="true"
        className="border-mz-gray-130 bg-background ring-mz-gray-130/10 flex size-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] ring-4"
      >
        <span className="bg-mz-gray-130 size-1.5 rounded-full" />
      </span>
    );
  }
  if (state === 'skipped') {
    return (
      <span
        aria-hidden="true"
        className="border-border/70 bg-background size-[18px] shrink-0 rounded-full border border-dashed"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="border-border bg-background size-[18px] shrink-0 rounded-full border"
    />
  );
}
