'use client';

import { Button } from '@/components/design/design-system/button';
import { getAnswerDisplay, resolveCopy } from '../intake-config';
import type {
  FileMeta,
  IntakeAnswers,
  IntakeAnswerValue,
  QuestionDef,
} from '../intake-types';
import { ChatMessage } from '../chat/chat-message';
import { DocumentUploadZone } from './document-upload-zone';
import { IntakeFormField } from './intake-form-field';

type GapQuestionTurnProps = {
  question: QuestionDef;
  answers: IntakeAnswers;
  /** How many required fields (including this one) are still missing. */
  remaining: number;
  extracting: boolean;
  extractionError: string | null;
  onChange: (key: string, value: IntakeAnswerValue | undefined) => void;
  /** Commit the current value and move to the next gap. */
  onCommit: () => void;
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onDismissError: () => void;
};

function asFileMeta(value: IntakeAnswerValue | undefined): FileMeta[] {
  return Array.isArray(value) ? (value as FileMeta[]) : [];
}

/**
 * A single missing-required field asked conversationally: Moritz poses the
 * question as an assistant turn and the pre-filled control sits just below it.
 * Selecting an option commits and advances immediately; free-text/date/upload
 * fields confirm with Continue. One of these shows at a time, so gaps surface
 * one after another like a chat rather than a wall of cards.
 */
export function GapQuestionTurn({
  question,
  answers,
  remaining,
  extracting,
  extractionError,
  onChange,
  onCommit,
  onAddFiles,
  onRemoveFile,
  onDismissError,
}: GapQuestionTurnProps) {
  const header = resolveCopy(question.header, answers) ?? question.reviewLabel;
  const helper = resolveCopy(question.helper, answers);
  const isAutoAdvance = question.ui === 'card-grid' || question.ui === 'chips';
  const hasValue =
    getAnswerDisplay({ [question.id]: question }, question.id, answers) !==
    null;

  const handleChange = (key: string, value: IntakeAnswerValue | undefined) => {
    onChange(key, value);
    if (isAutoAdvance && key === question.id && value) onCommit();
  };

  return (
    <div className="mz-animate-step space-y-3">
      <div className="space-y-1">
        <ChatMessage role="assistant">{header}</ChatMessage>
        {helper ? (
          <p className="text-muted-foreground max-w-[95%] pl-10 text-sm">
            {helper}
          </p>
        ) : null}
        {remaining > 1 ? (
          <p className="text-muted-foreground pl-10 text-xs tabular-nums">
            {remaining} required details to confirm
          </p>
        ) : null}
      </div>

      <div className="space-y-3 pl-10">
        {question.ui === 'upload' ? (
          <DocumentUploadZone
            files={asFileMeta(answers[question.id])}
            extracting={extracting}
            extractionError={extractionError}
            onAddFiles={onAddFiles}
            onRemove={onRemoveFile}
            onDismissError={onDismissError}
          />
        ) : (
          <IntakeFormField
            question={question}
            answers={answers}
            onChange={handleChange}
            hideHeader
          />
        )}

        {isAutoAdvance ? null : (
          <div className="flex justify-start">
            <Button type="button" onClick={onCommit} disabled={!hasValue}>
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
