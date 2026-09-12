'use client';

import { useTranslations } from 'next-intl';
import { Check } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@/components/design/foundations/components/button';
import { EditableValue } from '@/components/design/tabular-playbook/components/EditableValue';
import { fieldState, type BriefField } from '@/lib/intake/brief';
import { fieldConfidence, type ConfidenceLevel } from '@/lib/intake/confidence';

/**
 * The mark at the head of each row answers one question: is this in?
 *
 * Lifted from the brief panel this replaces, down to the 18px circle, the
 * 2.5-size check and its stroke weight, so a tick here is the same object it
 * was there. The one state their panel had no need for is "needs your eye",
 * which borrows the shape of their active dot in the warning colour rather than
 * inventing a new one.
 *
 * A tick means settled, whether Moritz's confidence was good enough to accept
 * the value or the client agreed to it. How much to trust a ticked value is the
 * percentage's job, so the two never say the same thing twice.
 */
function StatusMark({
  ticked,
  needsEye,
}: {
  ticked: boolean;
  needsEye: boolean;
}) {
  if (ticked) {
    return (
      <span
        aria-hidden="true"
        className="bg-success flex size-[18px] shrink-0 items-center justify-center rounded-full text-white"
      >
        <Check className="size-2.5" strokeWidth={3} />
      </span>
    );
  }

  if (needsEye) {
    return (
      <span
        aria-hidden="true"
        className="border-warning bg-background ring-warning/10 flex size-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] ring-4"
      >
        <span className="bg-warning size-1.5 rounded-full" />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="border-border bg-background size-[18px] shrink-0 rounded-full border"
    />
  );
}

/**
 * Green for what can be relied on, warning for the one case worth stopping at,
 * neutral for the middle. Medium is not a problem, so it does not shout.
 */
const LEVEL_STYLE: Record<ConfidenceLevel, string> = {
  high: 'text-success',
  medium: 'text-muted-foreground',
  low: 'text-warning',
};

/** Mark (18px) plus the gap beside it, so the value lines up under the label. */
const CONTENT_INDENT = 'ps-[1.75rem]';

/**
 * One line of the brief, as a line in a document rather than a card.
 *
 * Every filled field says where its value came from. A value the client typed
 * needs no explanation and gets none; anything Moritz worked out, or read from
 * a document, has to account for itself. A field that asks to be checked
 * without saying why is just nagging.
 */
export function BriefFieldRow({
  field,
  hint,
  onConfirm,
  onEdit,
}: {
  field: BriefField;
  hint?: string;
  onConfirm: () => void;
  onEdit: (value: string) => void;
}) {
  const t = useTranslations('intake.brief');
  const state = fieldState(field);
  const reading = fieldConfidence(field);
  const isEmpty = field.value === null;

  // The client's own words need no provenance, and nothing to agree with.
  const fromClient = field.source === 'client';
  // Only the values too shaky to accept ask for anything. Everything else is
  // already in, and can still be edited.
  const showConfirm = !field.confirmed && reading?.level === 'low';

  return (
    <div className="border-border flex flex-col gap-1 border-b py-4 last:border-b-0">
      {/* `items-center` is what keeps the mark on the label's centre line. */}
      <div className="flex items-center justify-between gap-4">
        <span className="flex min-w-0 items-center gap-2.5">
          <StatusMark
            ticked={field.confirmed}
            needsEye={reading?.level === 'low'}
          />
          {/*
           * Full foreground once there is something here, muted while the row
           * is still waiting, which is how their own panel graded its steps.
           */}
          <span
            className={cn(
              'flex items-baseline gap-1.5 text-xs font-medium',
              isEmpty ? 'text-muted-foreground' : 'text-foreground',
            )}
          >
            {field.label}
            {/*
             * Says why this row is not part of the count above it. Without it,
             * five rows over a total of four just looks like a bug.
             */}
            {!field.required && isEmpty ? (
              <span className="text-muted-foreground text-[11px] font-normal">
                {t('optional')}
              </span>
            ) : null}
          </span>
        </span>

        {reading ? (
          <span
            className={cn(
              'flex shrink-0 items-baseline gap-1.5 text-[11.5px]',
              LEVEL_STYLE[reading.level],
            )}
          >
            {t(`confidence.${reading.level}`)}
            <span className="font-mono tabular-nums opacity-70">
              {reading.score}%
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground shrink-0 text-[11.5px]">
            {t('stateWord.missing')}
          </span>
        )}
      </div>

      <div className={cn('flex flex-col gap-1', CONTENT_INDENT)}>
        {state === 'missing' ? (
          <p className="text-muted-foreground/70 text-sm">
            {hint ?? t('stateWord.missing')}
          </p>
        ) : (
          <div className="text-foreground text-sm">
            <EditableValue
              value={field.value ?? ''}
              emptyLabel={hint ?? t('stateWord.missing')}
              editLabel={t('editLabel', { field: field.label })}
              onSave={onEdit}
            />
          </div>
        )}

        {/*
         * Where the value came from. A document source names the file and the
         * place in it, so the client can go and look; the quote sits under it
         * behind a left rule, as a quotation rather than more UI.
         */}
        {!fromClient && !isEmpty ? (
          <div className="mt-0.5 flex flex-col gap-1">
            <span className="text-muted-foreground text-[11.5px]">
              {field.source === 'document' && field.sourceNote
                ? t('sourceFromDocument', { where: field.sourceNote })
                : t('sourceFromConversation')}
            </span>
            {field.sourceQuote ? (
              <blockquote className="border-border text-muted-foreground border-l-2 pl-2.5 text-[11.5px] italic">
                {field.sourceQuote}
              </blockquote>
            ) : null}
          </div>
        ) : null}

        {showConfirm ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onConfirm}
            className="mt-2 w-fit"
          >
            <Check aria-hidden="true" />
            {t('looksRight')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
