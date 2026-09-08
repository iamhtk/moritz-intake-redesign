'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/design/design-system/button';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CornerDownLeft,
  Pencil,
  Sparkles,
} from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { resolveBool, resolveCopy } from '../intake-config';
import type {
  AnswerKey,
  FileMeta,
  IntakeAnswers,
  QuestionDef,
} from '../intake-types';
import { DateWithSkip } from './date-with-skip';
import { DocumentUploadZone } from './document-upload-zone';
import { GuidedDealSubflow } from './guided-deal-subflow';

type QuestionDockProps = {
  questions: Record<string, QuestionDef>;
  /** The active set's question keys; the dock pages through them. */
  setKeys: AnswerKey[];
  /** Index of the active question within `setKeys`. */
  index: number;
  /** Move the pager without committing an answer. */
  onIndexChange: (index: number) => void;
  answers: IntakeAnswers;
  aiEnabled: boolean;
  extracting: boolean;
  extractionError: string | null;
  onSelect: (value: string) => void;
  onConfirmMulti: (values: string[]) => void;
  onText: (value: string) => void;
  onContinue: () => void;
  onSkip: () => void;
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onDismissExtractionError: () => void;
  onDateChange: (value: string) => void;
  onNoDeadlineChange: (value: boolean) => void;
  onFocusComposer: () => void;
};

function isKeyAnswered(question: QuestionDef, answers: IntakeAnswers): boolean {
  const key = question.id;
  if (question.ui === 'upload') {
    const files = (answers[key] as FileMeta[] | undefined) ?? [];
    return files.length > 0;
  }
  if (question.ui === 'date') {
    const hasDate =
      typeof answers[key] === 'string' &&
      (answers[key] as string).trim().length > 0;
    const skipped = question.skipKey
      ? Boolean(answers[question.skipKey])
      : false;
    return hasDate || skipped;
  }
  const value = answers[key];
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return value !== undefined && value !== null;
}

/**
 * The active set of questions rendered as a docked panel pinned above the
 * composer, styled after Claude Cowork's AskUserQuestion widget: a bold prompt,
 * a `‹ N of M ›` pager to move within the set, numbered option rows with
 * keyboard navigation, a "Something else" row, and a Skip affordance for
 * optional questions. Non-list inputs (text/date/upload) render their controls
 * inline and are confirmed via the composer or a button.
 */
export function QuestionDock({
  questions,
  setKeys,
  index,
  onIndexChange,
  answers,
  aiEnabled,
  extracting,
  extractionError,
  onSelect,
  onConfirmMulti,
  onText,
  onContinue,
  onSkip,
  onAddFiles,
  onRemoveFile,
  onDismissExtractionError,
  onDateChange,
  onNoDeadlineChange,
  onFocusComposer,
}: QuestionDockProps) {
  const questionKey = setKeys[index];
  const question = questionKey ? questions[questionKey] : undefined;
  const options = useMemo(() => question?.options ?? [], [question]);

  const isLast = index >= setKeys.length - 1;
  const optional = question ? !resolveBool(question.required, answers) : true;
  const currentAnswered = question ? isKeyAnswered(question, answers) : false;
  const canGoNext = !isLast && (optional || currentAnswered);
  const showPager = setKeys.length > 1;

  const header = question ? resolveCopy(question.header, answers) : '';
  const helper = question ? resolveCopy(question.helper, answers) : undefined;
  const isSingleSelect =
    question?.ui === 'card-grid' || question?.ui === 'chips';
  const isMulti = question?.ui === 'multi-select';

  const dateValue =
    question?.ui === 'date'
      ? (answers[question.id] as string | undefined)
      : undefined;
  const noDeadline =
    question?.ui === 'date' && question.skipKey
      ? Boolean(answers[question.skipKey])
      : false;
  const uploadFiles = (answers.documents as FileMeta[] | undefined) ?? [];

  // Date / upload steps advance via "Continue"; block it on required steps
  // until a value exists so a required document can't be skipped.
  const canContinue =
    question?.ui === 'upload'
      ? uploadFiles.length > 0
      : question?.ui === 'date'
        ? Boolean(dateValue) || noDeadline
        : true;

  const [highlight, setHighlight] = useState(0);
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(
    () => (questionKey && (answers[questionKey] as string[] | undefined)) || [],
  );

  // When the active question changes (set advance or pager move), pre-select the
  // existing answer so paging back to an answered question shows the prior pick.
  useEffect(() => {
    const current = questionKey ? answers[questionKey] : undefined;
    const optionIndex = options.findIndex((o) => o.value === current);
    setHighlight(optionIndex >= 0 ? optionIndex : 0);
    setSelected(Array.isArray(current) ? (current as string[]) : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionKey]);

  const toggleMulti = (value: string) => {
    setSelected((current) =>
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    );
  };

  // Keyboard navigation for list questions, suppressed while the composer (or
  // any input) holds focus so typing still flows to the composer.
  useEffect(() => {
    if (!isSingleSelect && !isMulti) return;
    const handler = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') return;
      if (options.length === 0) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setHighlight((i) => (i + 1) % options.length);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlight((i) => (i - 1 + options.length) % options.length);
      } else if (/^[1-9]$/.test(event.key)) {
        const optionIndex = Number(event.key) - 1;
        if (optionIndex >= options.length) return;
        event.preventDefault();
        setHighlight(optionIndex);
        const option = options[optionIndex];
        if (!option) return;
        if (isMulti) toggleMulti(option.value);
        else onSelect(option.value);
      } else if (event.key === ' ' && isMulti) {
        event.preventDefault();
        const option = options[highlight];
        if (option) toggleMulti(option.value);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (isMulti) {
          onConfirmMulti(selected);
        } else {
          const option = options[highlight];
          if (option) onSelect(option.value);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    isSingleSelect,
    isMulti,
    options,
    highlight,
    selected,
    onSelect,
    onConfirmMulti,
  ]);

  const hint = useMemo(() => {
    if (isMulti) return 'Space to toggle · Enter to confirm · or type below';
    if (isSingleSelect)
      return '↑↓ to navigate · Enter to select · or type below';
    return 'Type your answer below';
  }, [isMulti, isSingleSelect]);

  if (!question || !questionKey) return null;

  return (
    <div className="bg-card rounded-2xl border shadow-sm">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="space-y-1">
          <p className="text-foreground text-sm font-semibold">{header}</p>
          {helper ? (
            <p className="text-muted-foreground text-xs">{helper}</p>
          ) : null}
        </div>
        {showPager ? (
          <div className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
            <button
              type="button"
              aria-label="Previous question"
              disabled={index === 0}
              onClick={() => onIndexChange(index - 1)}
              className="hover:text-foreground rounded-md p-1 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            </button>
            <span className="tabular-nums">
              {index + 1} of {setKeys.length}
            </span>
            <button
              type="button"
              aria-label="Next question"
              disabled={!canGoNext}
              onClick={() => onIndexChange(index + 1)}
              className="hover:text-foreground rounded-md p-1 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="space-y-1 px-2 py-3">
        {isSingleSelect || isMulti
          ? options.map((option, optionIndex) => {
              const isHighlighted = optionIndex === highlight;
              const isChecked = isMulti && selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onMouseEnter={() => setHighlight(optionIndex)}
                  onClick={() =>
                    isMulti ? toggleMulti(option.value) : onSelect(option.value)
                  }
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    isHighlighted ? 'bg-muted' : 'hover:bg-muted/60',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-medium',
                      isChecked
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input text-muted-foreground',
                    )}
                  >
                    {isChecked ? (
                      <Check aria-hidden="true" className="h-3.5 w-3.5" />
                    ) : (
                      optionIndex + 1
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-foreground block font-medium">
                      {option.label}
                    </span>
                    {option.description ? (
                      <span className="text-muted-foreground block text-xs">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                  {isHighlighted && !isMulti ? (
                    <CornerDownLeft
                      aria-hidden="true"
                      className="text-muted-foreground h-3.5 w-3.5 shrink-0"
                    />
                  ) : null}
                </button>
              );
            })
          : null}

        {question.ui === 'date' ? (
          <div className="px-1 py-1">
            <DateWithSkip
              id={`dock-${questionKey}`}
              date={dateValue}
              noDeadline={noDeadline}
              onDateChange={onDateChange}
              onNoDeadlineChange={onNoDeadlineChange}
            />
          </div>
        ) : null}

        {question.ui === 'upload' ? (
          <div className="px-1 py-1">
            <DocumentUploadZone
              files={uploadFiles}
              extracting={extracting}
              extractionError={extractionError}
              onAddFiles={onAddFiles}
              onRemove={onRemoveFile}
              onDismissError={onDismissExtractionError}
            />
          </div>
        ) : null}

        {(question.ui === 'text' || question.ui === 'textarea') &&
        question.suggestions ? (
          <div className="flex flex-wrap gap-2 px-1 py-1">
            {question.suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => onText(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        ) : null}

        {question.guidedDeal ? (
          <div className="px-1 py-1">
            <Button
              type="button"
              variant="link"
              className="text-muted-foreground h-auto p-0 text-sm"
              onClick={() => setGuidedOpen(true)}
            >
              Not sure how to describe it? We&apos;ll help →
            </Button>
            <GuidedDealSubflow
              open={guidedOpen}
              aiEnabled={aiEnabled}
              onOpenChange={setGuidedOpen}
              onComplete={(summary) => onText(summary)}
            />
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
        {isSingleSelect ? (
          <button
            type="button"
            onClick={onFocusComposer}
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 rounded-lg px-1 py-1 text-sm"
          >
            <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
            Something else
          </button>
        ) : (
          <span className="text-muted-foreground text-xs">{hint}</span>
        )}

        <div className="flex items-center gap-2">
          {isMulti ? (
            <Button
              type="button"
              size="sm"
              variant={selected.length > 0 ? 'default' : 'outline'}
              onClick={() => onConfirmMulti(selected)}
            >
              {selected.length > 0 ? `Done · ${selected.length}` : 'Done'}
            </Button>
          ) : null}
          {question.ui === 'date' || question.ui === 'upload' ? (
            <Button
              type="button"
              size="sm"
              disabled={!optional && !canContinue}
              onClick={onContinue}
            >
              Continue
            </Button>
          ) : null}
          {optional ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={onSkip}
            >
              Skip
            </Button>
          ) : null}
        </div>
      </div>

      {aiEnabled && (question.ui === 'text' || question.ui === 'textarea') ? (
        <p className="text-muted-foreground flex items-center gap-1 border-t px-4 py-2 text-xs">
          <Sparkles aria-hidden="true" className="h-3 w-3" />
          Type your answer in the box below.
        </p>
      ) : null}
    </div>
  );
}
