'use client';

import { useTranslations } from 'next-intl';
import { Check } from '@repo/ui/icons';
import { Button } from '@/components/design/foundations/components/button';
import { capNames, joinNames } from '@/lib/intake/name-list';
import type { BriefField } from '@/lib/intake/brief';

/**
 * The forced pass (Decision 5, Decision 7).
 *
 * Every value Moritz read from a document or worked out for itself stays unsure
 * until the client stands behind it, and the review phase is where whatever is
 * left gets looked at. This is the one piece of friction the plan argues for
 * keeping: it is what stops a confidently wrong party name reaching a lawyer.
 *
 * Two states, and the quiet one matters as much as the loud one. Most cases
 * arrive here with one or two fields outstanding, so the clean case gets a
 * single sentence rather than an empty warning box, and the case with work left
 * names the fields instead of telling the client to go hunting for them.
 *
 * The confirm-all is not a skip. It confirms the values the client is looking
 * at, on the record, with a receipt on every row it touched — which is exactly
 * what tapping each one would have done.
 */
/**
 * How many fields to name before the sentence starts counting instead (L10).
 *
 * Three. Past that the sentence stops being read as a sentence, and the rows it
 * refers to are directly underneath it anyway.
 */
const NAMED_LIMIT = 3;

export function ReviewNotice({
  unconfirmed,
  onConfirmAll,
}: {
  unconfirmed: BriefField[];
  onConfirmAll: () => void;
}) {
  const t = useTranslations('intake.review');
  const { named, more } = capNames(
    unconfirmed.map((field) => field.label),
    NAMED_LIMIT,
  );

  if (unconfirmed.length === 0) {
    return (
      /*
       * Solid ink, matching the brief row's own done mark (L12, V3). Two
       * surfaces saying "this is settled" have to say it the same way, and
       * green is now spent entirely on the progress bar.
       */
      <p className="text-muted-foreground flex items-start gap-2 text-sm leading-relaxed">
        <span
          aria-hidden="true"
          className="bg-foreground text-background mt-[3px] flex size-[15px] shrink-0 items-center justify-center rounded-full"
        >
          <Check className="size-2" strokeWidth={3} />
        </span>
        {t('allConfirmed')}
      </p>
    );
  }

  return (
    /*
     * The warning colour at its quietest: a left rule and a tinted ground, no
     * border, no icon. The rows themselves already carry the warning mark, so a
     * second alarm up here would be the same information shouted twice.
     */
    <div
      role="status"
      className="border-warning bg-warning/[0.06] flex flex-col gap-2.5 border-l-2 py-3 pl-3.5 pr-3"
    >
      <p className="text-foreground text-sm font-medium">
        {t('heading', { count: unconfirmed.length })}
      </p>
      {/*
       * Three names, then the count of what is left (L10).
       *
       * This used to name every unconfirmed field. That is fine at two and a
       * wall at nine, and a wall in a notice is read as decoration rather than
       * as a list — which loses the one thing the sentence is for, which is
       * telling the client *which* rows want their eye.
       *
       * The overflow is stated rather than trailed off. "and 4 more" is a
       * smaller claim than three names and an ellipsis, and it is the only
       * version the client can tell is complete. The rows themselves are
       * directly below this and each carries its own mark, so the ones this
       * sentence does not name are not hidden — they are one glance away, which
       * is exactly the distance an overflow count should imply.
       */}
      <p className="text-muted-foreground text-sm leading-relaxed">
        {t('body', {
          count: unconfirmed.length,
          fields: joinNames(named),
          more,
        })}
      </p>
      {/*
       * The bulk confirm, and what it costs, in the same breath (L17).
       *
       * It is the only control in the flow that acts on several values at once,
       * so it is the only one where the client might reasonably hesitate over
       * how much they are committing to. The answer is: nothing they cannot
       * take back — every row keeps its Edit, and a confirmed row keeps an Undo
       * for as long as the receipt is on screen. Saying so is what makes the
       * one-tap version usable; without it the careful client confirms nine
       * rows one at a time for no benefit.
       */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onConfirmAll}
        >
          <Check data-icon="inline-start" aria-hidden="true" />
          {t('confirmAll', { count: unconfirmed.length })}
        </Button>
        <span className="text-muted-foreground text-xs">
          {t('confirmAllCost', { count: unconfirmed.length })}
        </span>
      </div>
    </div>
  );
}
