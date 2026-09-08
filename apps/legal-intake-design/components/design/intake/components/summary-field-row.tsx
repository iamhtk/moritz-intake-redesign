'use client';

import { useState } from 'react';
import { Pencil, Sparkles } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@/components/design/design-system/button';
import { getAnswerDisplay, resolveBool, resolveCopy } from '../intake-config';
import type {
  FileMeta,
  IntakeAnswers,
  IntakeAnswerValue,
  QuestionDef,
} from '../intake-types';
import { DocumentUploadZone } from './document-upload-zone';
import { IntakeFormField } from './intake-form-field';

type SummaryFieldRowProps = {
  question: QuestionDef;
  answers: IntakeAnswers;
  /** Whether the captured value was pulled from the dump (shows a subtle tag). */
  fromDescription?: boolean;
  /** Upload wiring (only used when `question.ui === 'upload'`). */
  extracting?: boolean;
  extractionError?: string | null;
  onAddFiles?: (files: File[]) => void;
  onRemoveFile?: (index: number) => void;
  onDismissError?: () => void;
  onChange: (key: string, value: IntakeAnswerValue | undefined) => void;
};

function asFileMeta(value: IntakeAnswerValue | undefined): FileMeta[] {
  return Array.isArray(value) ? (value as FileMeta[]) : [];
}

/**
 * One field in the matter summary. When it holds a value it renders as a
 * compact confirmed row (label + value + "from your description" tag + Edit);
 * when empty it renders expanded with the matching input. Required-and-empty
 * fields are forced open and highlighted so the client knows what's blocking
 * submission. Select inputs collapse back as soon as a choice is made.
 */
export function SummaryFieldRow({
  question,
  answers,
  fromDescription = false,
  extracting = false,
  extractionError = null,
  onAddFiles,
  onRemoveFile,
  onDismissError,
  onChange,
}: SummaryFieldRowProps) {
  const header = resolveCopy(question.header, answers) ?? question.reviewLabel;
  const display = getAnswerDisplay(
    { [question.id]: question },
    question.id,
    answers,
  );
  const required = resolveBool(question.required, answers);
  const hasValue = display !== null;
  const mustExpand = required && !hasValue;

  const [editing, setEditing] = useState(!hasValue);
  const expanded = editing || mustExpand;

  const isAutoCollapse = question.ui === 'card-grid' || question.ui === 'chips';

  const handleChange = (key: string, value: IntakeAnswerValue | undefined) => {
    onChange(key, value);
    if (isAutoCollapse && key === question.id && value) setEditing(false);
  };

  if (!expanded) {
    return (
      <div className="group/row flex items-start justify-between gap-3 py-2.5">
        <div className="min-w-0 space-y-0.5">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            {header}
          </p>
          <p className="text-foreground text-sm">{display}</p>
          {fromDescription ? (
            <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
              <Sparkles aria-hidden="true" className="size-3" />
              from your description
            </span>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground shrink-0 opacity-60 transition-opacity group-hover/row:opacity-100"
          onClick={() => setEditing(true)}
        >
          <Pencil aria-hidden="true" className="size-3.5" />
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'space-y-3 py-2.5',
        mustExpand && 'bg-primary/5 -mx-3 rounded-lg px-3',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-foreground text-sm font-medium">
          {header}
          {mustExpand ? (
            <span className="text-primary ml-2 text-xs font-normal">
              Required
            </span>
          ) : null}
        </p>
        {hasValue && !mustExpand ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setEditing(false)}
          >
            Done
          </Button>
        ) : null}
      </div>

      {question.ui === 'upload' ? (
        <DocumentUploadZone
          files={asFileMeta(answers[question.id])}
          extracting={extracting}
          extractionError={extractionError}
          onAddFiles={(files) => onAddFiles?.(files)}
          onRemove={(index) => onRemoveFile?.(index)}
          onDismissError={() => onDismissError?.()}
        />
      ) : (
        <IntakeFormField
          question={question}
          answers={answers}
          onChange={handleChange}
          hideHeader
        />
      )}
    </div>
  );
}
