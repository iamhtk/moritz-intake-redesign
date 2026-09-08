'use client';

import { resolveBool, resolveCopy } from '../intake-config';
import type {
  FileMeta,
  IntakeAnswers,
  IntakeAnswerValue,
  QuestionDef,
} from '../intake-types';
import { CardGridSelect } from './card-grid-select';
import { ChipSelect } from './chip-select';
import { DateWithSkip } from './date-with-skip';
import { DocumentUploadZone } from './document-upload-zone';
import { MultiSelect } from './multi-select';
import { TextQuestion } from './text-question';

type IntakeFormFieldProps = {
  question: QuestionDef;
  answers: IntakeAnswers;
  onChange: (key: string, value: IntakeAnswerValue | undefined) => void;
  /** Hide the field's own label/helper (the screen renders the prompt). */
  hideHeader?: boolean;
};

function asString(value: IntakeAnswerValue | undefined): string {
  return typeof value === 'string' ? value : '';
}

function asStringArray(value: IntakeAnswerValue | undefined): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

function asFileMeta(value: IntakeAnswerValue | undefined): FileMeta[] {
  return Array.isArray(value) ? (value as FileMeta[]) : [];
}

/**
 * Renders a single matter question inline as a labelled form field, mapping the
 * question's `ui` to the existing intake input control. Used by the simplified
 * single-screen form, so every field is editable at once (no chat back-and-forth).
 */
export function IntakeFormField({
  question,
  answers,
  onChange,
  hideHeader = false,
}: IntakeFormFieldProps) {
  const { id, ui } = question;
  const header = resolveCopy(question.header, answers);
  const helper = resolveCopy(question.helper, answers);
  const optional = !resolveBool(question.required, answers);

  return (
    <div className="space-y-2">
      {hideHeader ? null : (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <label htmlFor={`field-${id}`} className="text-sm font-medium">
              {header}
            </label>
            {optional ? (
              <span className="text-muted-foreground text-xs">Optional</span>
            ) : null}
          </div>
          {helper ? (
            <p className="text-muted-foreground text-xs">{helper}</p>
          ) : null}
        </div>
      )}

      {ui === 'card-grid' ? (
        <CardGridSelect
          options={question.options ?? []}
          value={asString(answers[id]) || undefined}
          columns={question.columns}
          onSelect={(value) => onChange(id, value)}
        />
      ) : null}

      {ui === 'chips' ? (
        <ChipSelect
          options={question.options ?? []}
          value={asString(answers[id]) || undefined}
          onSelect={(value) => onChange(id, value)}
        />
      ) : null}

      {ui === 'multi-select' ? (
        <MultiSelect
          options={question.options ?? []}
          value={asStringArray(answers[id])}
          onChange={(values) => onChange(id, values)}
        />
      ) : null}

      {ui === 'text' || ui === 'textarea' ? (
        <TextQuestion
          id={`field-${id}`}
          value={asString(answers[id])}
          multiline={ui === 'textarea'}
          placeholder={question.placeholder}
          maxLength={question.maxLength}
          suggestions={question.suggestions}
          onChange={(value) => onChange(id, value)}
        />
      ) : null}

      {ui === 'date' ? (
        <DateWithSkip
          id={`field-${id}`}
          date={asString(answers[id]) || undefined}
          noDeadline={
            question.skipKey ? Boolean(answers[question.skipKey]) : false
          }
          onDateChange={(value) => onChange(id, value)}
          onNoDeadlineChange={(value) => {
            if (question.skipKey) onChange(question.skipKey, value);
          }}
        />
      ) : null}

      {ui === 'upload' ? (
        <DocumentUploadZone
          files={asFileMeta(answers[id])}
          extracting={false}
          extractionError={null}
          onAddFiles={(files) =>
            onChange(id, [
              ...asFileMeta(answers[id]),
              ...files.map((file) => ({
                name: file.name,
                size: file.size,
                type: file.type,
              })),
            ])
          }
          onRemove={(index) =>
            onChange(
              id,
              asFileMeta(answers[id]).filter((_, i) => i !== index),
            )
          }
          onDismissError={() => {}}
        />
      ) : null}
    </div>
  );
}
