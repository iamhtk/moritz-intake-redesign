'use client';

import { getAnswerDisplay, resolveCopy } from '../intake-config';
import type { AnswerKey, IntakeAnswers, QuestionDef } from '../intake-types';

type AnsweredCardProps = {
  /** Consecutive answered question keys, rendered as one grouped card. */
  keys: AnswerKey[];
  answers: IntakeAnswers;
  questions: Record<string, QuestionDef>;
};

/**
 * A run of answered questions collapsed into a single bordered card, mirroring
 * Claude Cowork's AskUserQuestion summary: each row shows the question header
 * (bold) and the captured answer (muted). Editing happens in the docked Sheet.
 */
export function AnsweredCard({ keys, answers, questions }: AnsweredCardProps) {
  const rows = keys
    .map((key) => {
      const question = questions[key];
      if (!question) return null;
      const value = getAnswerDisplay(questions, key, answers);
      if (!value) return null;
      return {
        key,
        header: resolveCopy(question.header, answers) ?? '',
        value,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (rows.length === 0) return null;

  return (
    <div className="bg-muted/40 max-w-[95%] space-y-3 rounded-2xl border px-4 py-3">
      {rows.map((row) => (
        <div key={row.key} className="space-y-0.5">
          <p className="text-foreground text-sm font-semibold">{row.header}</p>
          <p className="text-muted-foreground text-sm">{row.value}</p>
        </div>
      ))}
    </div>
  );
}
