'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@repo/ui/lib/utils';
import { Chip } from '@/components/design/foundations/components/chip';
import { remainingQuestions } from '@/lib/intake/waiting-questions';

/**
 * The three tappable questions under the composer once the case has gone.
 *
 * See `lib/intake/waiting-questions.ts` for which three and why. This is only
 * the row: a quiet lead-in, the remaining chips, and nothing at all once they
 * have all been asked — because an empty invitation is worse than none, and the
 * composer is still there for anything else.
 *
 * Not `SuggestionChips`, and the divergence is one line of behaviour: that
 * component locks its whole row after one pick, which is correct for answering
 * a field and wrong for asking questions. Sharing the `Chip` rather than the
 * wrapper keeps the two rows looking identical while behaving differently.
 */
export function WaitingQuestions({
  asked,
  busy,
  onAsk,
  className,
}: {
  /** Ids already asked, so they stop being offered. */
  asked: readonly string[];
  /** True while a turn is in flight: a second question would be dropped. */
  busy: boolean;
  onAsk: (id: string, text: string) => void;
  className?: string;
}) {
  const t = useTranslations('intake.sent.ask');
  const remaining = remainingQuestions(asked);

  if (remaining.length === 0) return null;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="text-muted-foreground text-xs">{t('label')}</span>
      <div role="group" className="flex flex-wrap gap-2">
        {remaining.map((question, index) => {
          const text = t(`question.${question.id}`);
          return (
            <Chip
              key={question.id}
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              style={{ animationDelay: `${index * 60}ms` }}
              onClick={() => onAsk(question.id, text)}
            >
              {text}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}
