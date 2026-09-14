'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/design/foundations/components/collapsible';
import type { Brief, BriefField } from '@/lib/intake/brief';
import { BriefFieldRow } from './brief-field-row';
import type { FieldReceipt } from './use-brief';

/** The bar's width, from the percentage the panel already shows. */
function barWidth(pct: number): string {
  return `${Math.min(100, Math.max(0, pct))}%`;
}

/**
 * The brief: a document, not a card.
 *
 * No border, no rounded corners, no fill. It sits on the page, and the only
 * lines on it are hairlines between fields. The chat is separated from it by a
 * single vertical rule, which the parent owns.
 *
 * Green appears here and nowhere else in the flow. The brief argues that green
 * has to earn its place, and a bar that only moves when the client has actually
 * agreed to something is the one place it does.
 */
export function BriefColumn({
  brief,
  hints,
  receipts,
  progress,
  notice,
  afterFields,
  footer,
  readOnly = false,
  foldFields = false,
  showProgress = true,
  savedAt = null,
  titlePending = false,
  askingKey = null,
  preparedWith = null,
  onConfirm,
  onEdit,
  onUndo,
  onOpenSource,
}: {
  brief: Brief;
  hints: Record<string, string>;
  /** Keyed by field: what the client just did, for as long as it is on screen. */
  receipts: Record<string, FieldReceipt>;
  progress: {
    confirmed: number;
    filled: number;
    total: number;
    percent: number;
  };
  /**
   * When the brief was last written to storage, or `null` if it has not been
   * (item 3).
   *
   * The opening screen promises that everything is saved as they go, and this
   * is the only place that promise is ever kept in front of them. Passed as the
   * timestamp rather than as a rendered string because the element is keyed on
   * it: React reuses a node whose key has not changed, so a same-text line
   * would sit there from the first save onwards without ever re-announcing, and
   * the animation would run exactly once.
   */
  savedAt?: number | null;
  /**
   * The field key the last turn said it was asking about, or `null` (item 4).
   *
   * One key, not a set, which is the firing rule made structural: there is no
   * way to express "two rows are being asked about" through this prop, because
   * two questions in one turn is a thing the conversation is told not to do and
   * a thing the panel should not be able to show.
   */
  askingKey?: string | null;
  /** Who the brief was prepared with, and when. Signed at the foot (item 14). */
  preparedWith?: { name: string; timestamp: string } | null;
  /**
   * The recap is out writing the case name (item 16).
   *
   * Named as work in progress rather than left as the generic fallback
   * heading. Between the last required answer and the recap coming back, the
   * panel is headed "Your case brief" while something is in fact happening to
   * it, and a client who has just finished answering has no way to tell the
   * difference between a name being written and nothing at all.
   */
  titlePending?: boolean;
  /**
   * Between the heading and the fields: the forced pass on the review phase,
   * the confirmation once the case is sent.
   *
   * It sits above the rows rather than below them because in both phases it is
   * the thing the client is meant to read first — what is still being asked of
   * them, or what has just happened.
   */
  notice?: ReactNode;
  /**
   * Below the last field, above the sticky footer: the one human face shown
   * while the brief is still being filled in (Decision 21).
   *
   * It goes after the rows rather than before them because the rows are what
   * the client is working on. A face above them would be the first thing on the
   * panel and would read as a promotion; at the end of the document it reads as
   * a signature, which is what it is.
   */
  afterFields?: ReactNode;
  /** Anchored to the bottom of the column: the quote line, or how this works. */
  footer?: ReactNode;
  /** A sent brief is a record. No Accept, no pencil, no Undo. */
  readOnly?: boolean;
  /**
   * Fold the field rows behind one line (§3's progressive disclosure).
   *
   * Separate from `readOnly` although today they are set from the same
   * phase, because they are different claims: `readOnly` is about whether the
   * brief can still be changed, this is about whether it is the thing on the
   * screen. On the confirmation it is not — the client has just read every
   * one of these rows on the review screen and confirmed them one at a time,
   * and repeating the whole document underneath the receipt is what made that
   * screen 2265px tall. It stays one click away because it is the record, and
   * a record you cannot open is a claim.
   */
  foldFields?: boolean;
  /**
   * The bar is a gate being worked towards, so it goes once the gate is
   * behind the client. A full green bar over a submitted case is decoration.
   */
  showProgress?: boolean;
  onConfirm: (key: string) => void;
  onEdit: (key: string, value: string) => void;
  onUndo: (key: string) => void;
  onOpenSource: (field: BriefField) => void;
}) {
  const t = useTranslations('intake.brief');
  const [fieldsOpen, setFieldsOpen] = useState(false);

  const fieldRows = (
    <div className="mt-2 flex flex-col">
      {brief.fields.map((field) => {
        const receipt = receipts[field.key];
        return (
          <BriefFieldRow
            key={field.key}
            field={field}
            hint={hints[field.key]}
            {...(receipt ? { receipt } : {})}
            /*
             * Item 4, and the two halves of "it clears": the question moving
             * on is `askingKey` changing, and the field filling is the value
             * check. A row that has just been answered must not still be
             * marked as the one being waited on, even for the render before
             * the next turn arrives.
             */
            asking={field.key === askingKey && field.value === null}
            readOnly={readOnly}
            onConfirm={() => onConfirm(field.key)}
            onEdit={(value) => onEdit(field.key, value)}
            onUndo={() => onUndo(field.key)}
            onOpenSource={() => onOpenSource(field)}
          />
        );
      })}
    </div>
  );

  /*
   * The file note signature (item 14).
   *
   * "Prepared with", not "prepared by", and the name is the client's. That is
   * the one-word version of the whole argument of this panel: the brief is not
   * something done to them and handed over for approval, it is a document they
   * co-wrote and can still change. A file note signed by Moritz would quietly
   * undo every Accept and Edit control above it.
   *
   * Cormorant Garamond, italic and muted, at the smallest step on the scale,
   * because a signature is not content. It is the mark at the bottom of a page
   * that tells you the page is a real document — so when the page folds away,
   * the signature folds with it.
   */
  const signature = preparedWith ? (
    <p className="text-muted-foreground mt-6 font-serif text-[13px] italic">
      {t('preparedWith', {
        name: preparedWith.name,
        timestamp: preparedWith.timestamp,
      })}
    </p>
  ) : null;

  return (
    <section aria-label={t('title')} className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-3">
        {/*
         * Hidden below `lg`, where the collapsible summary bar above the panel
         * is already carrying the case name. Two copies of the same heading,
         * one directly above the other, is what stacking them produced.
         */}
        {/*
         * The case name, or the work that is producing it (item 16).
         *
         * The shimmer is the same utility the chat's wait marker uses, so the
         * two places Moritz is busy look like the same thing happening rather
         * than two unrelated treatments. `aria-live` on the heading itself
         * would re-announce the whole panel label, so the pending state is a
         * plain swap and the reply in the chat is what announces it.
         */}
        <h2 className="text-foreground font-serif text-[25px] font-medium tracking-[-0.01em] max-lg:hidden">
          {brief.title ?? (
            <span className={titlePending ? 'shimmer' : undefined}>
              {titlePending ? t('writingNotes') : t('title')}
            </span>
          )}
        </h2>

        {showProgress ? (
          <>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-muted-foreground text-xs">
                {t('label')}
              </span>
              {/*
               * A percentage, not "3 / 5".
               *
               * The fraction was the more precise readout and the less useful
               * one. A brief has five rows and the fifth is optional, so the
               * number a client needs is how close they are to being able to
               * send — and Send opens at `SEND_THRESHOLD_PERCENT`, which is a
               * percentage. "80%" and "Send" now describe the same moment in
               * the same units; "4 / 5" left the client to work out that the
               * missing one did not count.
               */}
              <span className="text-muted-foreground font-mono text-[11.5px] tabular-nums">
                {t('percentDone', { percent: progress.percent })}
              </span>
            </div>

            <div
              className="bg-muted h-[3px] w-full overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={progress.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('progressLabel')}
            >
              {/*
               * The one green in the intake (L12).
               *
               * Everywhere else that had it now uses ink weight instead — the
               * brief row's done mark, the confidence label, the receipt, the
               * all-confirmed notice. It stays here because this is the only
               * place where green means exactly one thing (how much of your
               * brief you have checked), because a bar is a quantity rather than
               * a judgement, and because a grey fill on a grey track is the one
               * case where the greyscale version genuinely reads worse: at 3px
               * the two tones collapse and the bar stops being readable as a
               * measure at a glance.
               *
               * Green is no longer unique to this bar: the tick, the High
               * reading and the receipt's verb all use it now, under one
               * meaning (settled and good). `colour-restraint.test.ts` caps it
               * rather than pinning it to this file — the rule being enforced
               * is one meaning, not one location.
               */}
              <div
                className="bg-success h-full rounded-full transition-[width] duration-[550ms] ease-out motion-reduce:transition-none"
                style={{ width: barWidth(progress.percent) }}
              />
            </div>
          </>
        ) : null}
      </div>

      {notice ? <div className="mt-6">{notice}</div> : null}

      {foldFields ? (
        /*
         * ⭐ The whole brief, behind one line.
         *
         * `Collapsible` rather than a `line-clamp` like the recap paragraph
         * above it, and the difference is the point: there is no useful first
         * line of a field list. Half a row is not a preview of a document, it
         * is a document that looks broken. This block either is on the screen
         * or is not, which is exactly the shape Radix's primitive has.
         *
         * The whole row is the trigger, not the word on the end of it. "Show"
         * is 34px wide and the row is the width of the panel; making the
         * client aim at the word would be a smaller target than the thing it
         * is attached to.
         */
        <Collapsible
          open={fieldsOpen}
          onOpenChange={setFieldsOpen}
          className="mt-6 flex flex-col"
        >
          <CollapsibleTrigger className="border-border text-muted-foreground hover:text-foreground focus-visible:ring-ring -mx-1 flex items-center justify-between gap-3 rounded-[0.5rem] border-t px-1 pt-3 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2">
            <span>{t('foldedFields', { count: brief.fields.length })}</span>
            <span className="flex shrink-0 items-center gap-1.5 underline underline-offset-4">
              {t(fieldsOpen ? 'foldedHide' : 'foldedShow')}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {fieldRows}
            {signature}
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <>
          {fieldRows}

          {/*
           * The autosave, acknowledged under the document it saved (item 3).
           *
           * The height is reserved whether or not there is anything to say, so
           * the line appearing and going never nudges the rows above it or the
           * face below. That is the whole reason this is an always-mounted box
           * with a fading child rather than a conditional render: the brief is
           * a document the client is reading, and something shifting under
           * their eyes every few seconds is worse than no acknowledgement at
           * all.
           *
           * Keyed on the timestamp, which is what replays the fade.
           * `role="status"` rather than an `aria-live` region on the whole
           * panel, so a screen reader hears "Saved just now" and not the brief
           * again.
           *
           * Only in the unfolded branch: `savedAt` is `null` on every phase
           * that folds, because a submitted case is not being saved to the
           * client's own browser any more.
           */}
          <div className="h-5 shrink-0" aria-hidden={savedAt === null}>
            {savedAt === null ? null : (
              <p
                key={savedAt}
                role="status"
                className="text-muted-foreground mz-animate-saved pt-1.5 text-[11.5px]"
              >
                {t('saved')}
              </p>
            )}
          </div>

          {signature}
        </>
      )}

      {afterFields ? <div className="mt-7">{afterFields}</div> : null}

      {/*
       * The action, pinned to the bottom of the column.
       *
       * It used to sit at the end of the document on `mt-auto`, which is fine
       * while the brief is short and wrong the moment it is not. On the sent
       * state the confirmation, the description list, the lawyer row and the
       * read-only fields stack up well past a laptop viewport, so "Go to case"
       * and the sentence about the quote both ended up below the fold on a 14in
       * MacBook and on a 27in monitor alike. Sticky fixes it at every height
       * instead of at one.
       *
       * `-mx-*` with matching padding makes the bar span the full width of the
       * scrolling pane rather than just the text column, so rows scroll behind
       * an opaque edge instead of colliding with floating text. `mt-auto` stays:
       * on a brief short enough to fit, the bar sits at the bottom of the
       * column as before rather than halfway up it.
       *
       * `-bottom-8` rather than `bottom-0`, which is worth writing down. Sticky
       * offsets resolve against the scroll container's padding box, and the
       * pane carries `py-8`, so pinning at zero left a 32px window underneath
       * the bar where the next field row slid past in full view. Hanging the
       * bar into that padding and paying it back as its own bottom padding
       * makes the edge opaque the whole way down.
       *
       * `pb-13` (52px) rather than a bare 32px, and the extra 20px is not
       * arbitrary: it is what puts the Send button's bottom edge on the same
       * line as the composer's bottom edge in the pane opposite.
       *
       * The two panes both carry `py-8`, so their content boxes end together —
       * but the left one is not the composer. Below it sits the
       * `beneathComposer` row (the *Talk to a person* exit, ~20px), so the
       * composer's own box ends 52px above the pane's bottom rather than 32px,
       * and a button padded to 36px sat visibly below the thing it should have
       * been level with.
       *
       * A measured constant rather than a `ResizeObserver` across the two
       * panes, because the number is deterministic and the coupling is worth
       * fewer moving parts than it would cost to track. The trade is named
       * here: if the row beneath the composer grows a second line, this is the
       * value that has to follow it.
       */}
      {footer ? (
        <div className="bg-background pb-13 sticky -bottom-8 -mx-4 mt-auto px-4 pt-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="border-border border-t pt-4">{footer}</div>
        </div>
      ) : null}
    </section>
  );
}
