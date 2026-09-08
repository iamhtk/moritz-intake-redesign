'use client';

import { Button } from '@/components/design/design-system/button';
import { Check, FileText, Pencil, RotateCcw } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { getAnswerDisplay } from '../intake-config';
import { getReviewKeys } from '../intake-engine';
import type {
  AnswerKey,
  FileMeta,
  IntakeAnswers,
  IntakePhase,
  MatterIntakeDefinition,
  QuestionDef,
} from '../intake-types';

type StageStatus = 'pending' | 'current' | 'complete';

type IntakeProgressPanelProps = {
  definition: MatterIntakeDefinition;
  answers: IntakeAnswers;
  phase: IntakePhase;
  /** Re-ask the question for a captured answer as a fresh chat turn. */
  onEditKey: (key: AnswerKey) => void;
  /** Clear the draft and restart the conversation. */
  onStartOver: () => void;
};

const STAGES: { id: string; label: string }[] = [
  { id: 'triage', label: 'The basics' },
  { id: 'details', label: 'The details' },
  { id: 'review', label: 'Review & send' },
  { id: 'quote', label: 'Get a quote' },
  { id: 'payment', label: 'Payment' },
  { id: 'assigned', label: 'Lawyer assigned' },
];

function isAnswered(key: AnswerKey, answers: IntakeAnswers): boolean {
  const value = answers[key];
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return value !== undefined && value !== null;
}

function getStageStatuses(
  definition: MatterIntakeDefinition,
  answers: IntakeAnswers,
  phase: IntakePhase,
): Record<string, StageStatus> {
  const triageDone = definition.triageKeys.every((key) =>
    isAnswered(key, answers),
  );
  const reviewReached =
    phase === 'review' || phase === 'generating' || phase === 'success';
  const submitted = phase === 'generating' || phase === 'success';

  return {
    triage: triageDone ? 'complete' : 'current',
    details: reviewReached ? 'complete' : triageDone ? 'current' : 'pending',
    review: submitted ? 'complete' : phase === 'review' ? 'current' : 'pending',
    // Post-submit: we prepare/send the quote, then payment, then assignment.
    // The mock flow has no payment/assignment screens, so those stay pending.
    quote: submitted ? 'current' : 'pending',
    payment: 'pending',
    assigned: 'pending',
  };
}

/**
 * Sheet body for the intake chat: a coarse stage checklist, then every
 * captured answer (with an edit affordance that re-asks it as a chat turn),
 * then attached document chips.
 */
export function IntakeProgressPanel({
  definition,
  answers,
  phase,
  onEditKey,
  onStartOver,
}: IntakeProgressPanelProps) {
  const { questions } = definition;
  const stages = getStageStatuses(definition, answers, phase);
  const reviewKeys = getReviewKeys(definition, answers).filter(
    (key) => getAnswerDisplay(questions, key, answers) !== null,
  );
  const documents = (answers.documents as FileMeta[] | undefined) ?? [];

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-foreground text-sm font-semibold">Progress</h3>
        <ol className="space-y-2">
          {STAGES.map((stage, index) => (
            <StageRow
              key={stage.id}
              label={stage.label}
              status={stages[stage.id] ?? 'pending'}
              index={index + 1}
            />
          ))}
        </ol>
      </section>

      <section className="space-y-3 border-t pt-4">
        <h3 className="text-foreground text-sm font-semibold">
          Captured so far
        </h3>
        {reviewKeys.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            Nothing captured yet — your answers will appear here.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {reviewKeys.map((key) => (
              <CapturedRow
                key={key}
                question={questions[key]}
                value={getAnswerDisplay(questions, key, answers) ?? ''}
                onEdit={() => onEditKey(key)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 border-t pt-4">
        <h3 className="text-foreground text-sm font-semibold">Documents</h3>
        {documents.length === 0 ? (
          <p className="text-muted-foreground text-xs">No files attached.</p>
        ) : (
          <ul className="space-y-2">
            {documents.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="bg-muted/50 flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <FileText
                  aria-hidden="true"
                  className="text-muted-foreground h-4 w-4 shrink-0"
                />
                <span className="truncate">{file.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-t pt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground gap-2"
          onClick={onStartOver}
        >
          <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
          Start over
        </Button>
      </section>
    </div>
  );
}

function StageRow({
  label,
  status,
  index,
}: {
  label: string;
  status: StageStatus;
  index: number;
}) {
  const isComplete = status === 'complete';
  const isCurrent = status === 'current';

  return (
    <li className="flex items-start gap-2.5 text-sm">
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
          isComplete && 'border-primary bg-primary text-primary-foreground',
          isCurrent && 'border-primary text-primary bg-primary/5',
          !isComplete && !isCurrent && 'border-input text-muted-foreground',
        )}
      >
        {isComplete ? <Check className="h-3 w-3" /> : index}
      </span>
      <span
        className={cn(
          'leading-5',
          isComplete && 'text-muted-foreground',
          isCurrent && 'text-foreground font-medium',
          !isComplete && !isCurrent && 'text-muted-foreground',
        )}
      >
        {label}
      </span>
    </li>
  );
}

function CapturedRow({
  question,
  value,
  onEdit,
}: {
  question: QuestionDef | undefined;
  value: string;
  onEdit: () => void;
}) {
  if (!question) return null;
  return (
    <li className="group space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs uppercase tracking-wide">
          {question.reviewLabel}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground h-6 w-6"
          onClick={onEdit}
          aria-label={`Edit ${question.reviewLabel}`}
        >
          <Pencil aria-hidden="true" className="h-3 w-3" />
        </Button>
      </div>
      <p className="text-foreground text-sm">{value}</p>
    </li>
  );
}
