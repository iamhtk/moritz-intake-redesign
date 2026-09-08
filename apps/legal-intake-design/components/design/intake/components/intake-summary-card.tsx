'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@/components/design/design-system/button';
import type {
  IntakeAnswers,
  IntakeAnswerValue,
  QuestionDef,
} from '../intake-types';
import { MATTER_REGISTRY, type MatterId } from '../matter-registry';
import {
  MATTER_TYPE_OPTIONS,
  isAnsweredKey,
  isRequiredKey,
  visibleQuestionKeys,
} from '../question-flow';
import { ChipSelect } from './chip-select';
import { SummaryFieldRow } from './summary-field-row';

type IntakeSummaryCardProps = {
  matterId: MatterId;
  answers: IntakeAnswers;
  /** Keys whose value came from the dump / parse (for the subtle tag). */
  prefilledKeys: ReadonlySet<string>;
  extracting: boolean;
  extractionError: string | null;
  onMatterChange: (id: MatterId) => void;
  onChange: (key: string, value: IntakeAnswerValue | undefined) => void;
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onDismissError: () => void;
  onSubmit: () => void;
};

/**
 * The "here's your matter" recap for the smart-dump intake. Moritz introduces it
 * conversationally (the intro copy lives in the chat transcript, not here), so
 * this surface stays lightweight: matter type as chips, then a single low-chrome
 * list of captured details — confirmed values read as a plain recap, with only
 * the field being edited (or a missing required one) lightly highlighted.
 * Optional gaps hide behind a disclosure. One Send CTA unlocks once every
 * required field is satisfied.
 */
export function IntakeSummaryCard({
  matterId,
  answers,
  prefilledKeys,
  extracting,
  extractionError,
  onMatterChange,
  onChange,
  onAddFiles,
  onRemoveFile,
  onDismissError,
  onSubmit,
}: IntakeSummaryCardProps) {
  const [showOptional, setShowOptional] = useState(false);
  const definition = MATTER_REGISTRY[matterId];

  const { coreFields, optionalFields, requiredRemaining } = useMemo(() => {
    const keys = visibleQuestionKeys(definition, answers);
    const core: { key: string; question: QuestionDef }[] = [];
    const optional: { key: string; question: QuestionDef }[] = [];
    let remaining = 0;
    for (const key of keys) {
      const question = definition.questions[key];
      if (!question) continue;
      const answered = isAnsweredKey(definition, key, answers);
      const required = isRequiredKey(definition, key, answers);
      if (required && !answered) remaining += 1;
      if (answered || required) core.push({ key, question });
      else optional.push({ key, question });
    }
    return {
      coreFields: core,
      optionalFields: optional,
      requiredRemaining: remaining,
    };
  }, [definition, answers]);

  const ready = requiredRemaining === 0;

  return (
    <div className="mz-animate-step space-y-4">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Matter type
        </p>
        <ChipSelect
          options={MATTER_TYPE_OPTIONS}
          value={matterId}
          onSelect={(value) => onMatterChange(value as MatterId)}
        />
      </div>

      <div className="divide-border/70 border-field divide-y rounded-xl border px-4">
        {coreFields.map(({ key, question }) => (
          <SummaryFieldRow
            key={key}
            question={question}
            answers={answers}
            fromDescription={prefilledKeys.has(key)}
            extracting={extracting}
            extractionError={extractionError}
            onAddFiles={onAddFiles}
            onRemoveFile={onRemoveFile}
            onDismissError={onDismissError}
            onChange={onChange}
          />
        ))}
      </div>

      {optionalFields.length > 0 ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowOptional((value) => !value)}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm"
          >
            <ChevronDown
              aria-hidden="true"
              className={cn(
                'size-4 transition-transform',
                showOptional && 'rotate-180',
              )}
            />
            {showOptional
              ? 'Hide optional details'
              : `Add optional details (${optionalFields.length})`}
          </button>
          {showOptional ? (
            <div className="divide-border/70 border-field divide-y rounded-xl border px-4">
              {optionalFields.map(({ key, question }) => (
                <SummaryFieldRow
                  key={key}
                  question={question}
                  answers={answers}
                  fromDescription={prefilledKeys.has(key)}
                  extracting={extracting}
                  extractionError={extractionError}
                  onAddFiles={onAddFiles}
                  onRemoveFile={onRemoveFile}
                  onDismissError={onDismissError}
                  onChange={onChange}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-end pt-1">
        <Button type="button" onClick={onSubmit} disabled={!ready}>
          Send to Moritz
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </div>
  );
}
