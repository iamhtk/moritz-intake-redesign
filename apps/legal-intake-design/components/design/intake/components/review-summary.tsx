'use client';

import { Badge } from '@repo/ui/components/badge';
import { Button } from '@/components/design/design-system/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/design/design-system/card';
import { FileText, Pencil } from '@repo/ui/icons';
import { Heading } from '@/components/design/foundations/components/heading';
import { Text } from '@/components/design/foundations/components/text';
import { getAnswerDisplay } from '../intake-config';
import { getReviewKeys } from '../intake-engine';
import type {
  AnswerKey,
  FileMeta,
  IntakeAnswers,
  MatterIntakeDefinition,
} from '../intake-types';

type ReviewSummaryProps = {
  definition: MatterIntakeDefinition;
  answers: IntakeAnswers;
  summary: string;
  aiAssisted: boolean;
  exploring: boolean;
  onEditStep: (key: AnswerKey) => void;
  onSubmit: () => void;
  onSaveForLater: () => void;
};

/**
 * Confirm screen. Shows a scannable, inline-editable summary of every answer
 * plus uploaded file chips, with the submit CTA softened when the user is
 * "just exploring".
 */
export function ReviewSummary({
  definition,
  answers,
  summary,
  aiAssisted,
  exploring,
  onEditStep,
  onSubmit,
  onSaveForLater,
}: ReviewSummaryProps) {
  const { questions } = definition;
  const reviewKeys = getReviewKeys(definition, answers).filter(
    (key) => getAnswerDisplay(questions, key, answers) !== null,
  );
  const documents = (answers.documents as FileMeta[] | undefined) ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Heading level={2}>
          Here&apos;s what we&apos;ve got — anything to fix?
        </Heading>
        <Text>
          You can always add more later. Your lawyer will follow up if
          anything&apos;s missing.
        </Text>
      </div>

      {documents.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {documents.map((file, index) => (
            <Badge
              key={`${file.name}-${index}`}
              variant="secondary"
              className="gap-1.5 py-1"
            >
              <FileText aria-hidden="true" className="h-3 w-3" />
              {file.name}
            </Badge>
          ))}
        </div>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            Summary
            {aiAssisted ? (
              <Badge variant="secondary" className="text-xs font-normal">
                AI-assisted
              </Badge>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">{summary}</p>
          <dl className="divide-border divide-y">
            {reviewKeys.map((key) => (
              <div
                key={key}
                className="group flex items-start justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <dt className="text-muted-foreground text-xs">
                    {questions[key]?.reviewLabel}
                  </dt>
                  <dd className="text-sm">
                    {getAnswerDisplay(questions, key, answers)}
                  </dd>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground shrink-0"
                  onClick={() => onEditStep(key)}
                >
                  <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" className="flex-1" onClick={onSubmit}>
          {exploring ? 'Save this for later' : 'Looks good — send for a quote'}
        </Button>
        {!exploring ? (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onSaveForLater}
          >
            Save and come back later
          </Button>
        ) : null}
      </div>
    </div>
  );
}
