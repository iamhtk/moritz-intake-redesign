'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, Check, ChevronDown, Pencil } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@/components/design/foundations/components/button';
import { fieldState, type BriefField } from '@/lib/intake/brief';
import type { FieldReceipt } from './use-brief';
import { fieldConfidence, type ConfidenceLevel } from '@/lib/intake/confidence';
import { BriefValue } from './brief-value';
import { describeWhen, msUntilChange } from '@/lib/intake/relative-time';

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
  /*
   * Done is green, and the panel now reads as a traffic light on purpose.
   *
   * This reverses L12/V3, which had it as solid ink. That decision was taken
   * because green was doing four unrelated jobs at once — confirmed, high
   * confidence, accepted, all-done — and four meanings on one colour is a
   * counting failure rather than a palette. The fix chosen then was to spend
   * the colour nowhere.
   *
   * The direction now is the opposite: give green **one** meaning and use it
   * everywhere that meaning applies. It means *settled and good* — the tick on
   * a confirmed row, the High reading, the word "Accepted" on the receipt, and
   * the client's own confirmation. Those are not four meanings, they are four
   * views of one, so the repetition reinforces rather than dilutes. The
   * confidence ramp reads as the traffic light it always wanted to be: green,
   * amber, red.
   *
   * `text-background` rather than `text-success-foreground` for the check
   * itself: the foreground token is near-black, and a dark tick inside a
   * mid-green circle is the lowest-contrast thing on the row. White is what
   * makes it read at 18px.
   */
  if (ticked) {
    return (
      <span
        aria-hidden="true"
        className="bg-success text-background flex size-[18px] shrink-0 items-center justify-center rounded-full"
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
 * The three readings as a traffic light: green, amber, red.
 *
 * This went ink / muted-ink / amber for a while (L12), to keep green to one
 * use in the flow. It is a hue ramp again, because the reading is an ordered
 * three-step scale and hue is the channel people already read ordered
 * three-step scales in. Ink-versus-muted-ink asks the client to notice a
 * weight difference between two greys and then remember which way round it
 * goes; green-amber-red asks nothing.
 *
 * `warning-strong` rather than `warning` for the middle. The brand amber
 * (#e8a952) is a fill colour and is the weakest 11.5px text on the panel
 * against white; the token darkens it in `globals.css` without adding a second
 * amber to the palette. Low is `destructive` because a low reading is the one
 * the client should actually stop at.
 */
const LEVEL_STYLE: Record<ConfidenceLevel, string> = {
  high: 'text-success',
  medium: 'text-warning-strong',
  low: 'text-destructive',
};

/** Mark (18px) plus the gap beside it, so the value lines up under the label. */
const CONTENT_INDENT = 'ps-[1.75rem]';

/**
 * The value and its controls share one row, and that row is the same height in
 * every state.
 *
 * It used to stack: the value, then a full-width button under it, and an editor
 * that opened a textarea. Three states, three heights, so agreeing with one
 * field shoved every field below it down the panel while the client was reading
 * them. 30px is the tallest of the three things that can sit here — a line of
 * text, the input that replaces it, the buttons beside it — so all three fit
 * without the row ever resizing.
 */
const VALUE_ROW = 'min-h-[30px]';

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
  receipt,
  asking = false,
  startEditing = false,
  readOnly = false,
  onConfirm,
  onEdit,
  onUndo,
  onOpenSource,
}: {
  field: BriefField;
  hint?: string;
  /** Present only while what the client just did is still on screen. */
  receipt?: FieldReceipt;
  /**
   * This is the field the question on the left is about (item 4).
   *
   * The panel and the conversation were two surfaces with no visible link
   * between them: Moritz would ask about the notice period and the client had
   * to work out for themselves which of nine rows that was. One row is marked,
   * ever, and the caller owns that rule.
   */
  asking?: boolean;
  /** Opens straight into the editor. For the foundations gallery. */
  startEditing?: boolean;
  /**
   * The case has been sent, so the brief is a record rather than a form.
   *
   * Everything that made a row interactive goes: no Accept, no pencil, no Undo.
   * The value, where it came from and its quote all stay, because that is the
   * part a client will come back to this screen to re-read.
   */
  readOnly?: boolean;
  onConfirm: () => void;
  onEdit: (value: string) => void;
  onUndo: () => void;
  onOpenSource: () => void;
}) {
  const t = useTranslations('intake.brief');
  const state = fieldState(field);
  const reading = fieldConfidence(field);
  const isEmpty = field.value === null;

  /** Non-null while editing, holding the uncommitted draft. */
  const [draft, setDraft] = useState<string | null>(
    startEditing && !isEmpty ? field.value : null,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const editing = draft !== null;

  // Focused and fully selected on open, so the first keystroke replaces the
  // value. A client correcting a company name retypes it; they do not append
  // to the end of it.
  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  /*
   * Whether the document passage is open on this row (L3, L14).
   *
   * Row-local, and not lifted to the panel. Two rows open at once is a
   * legitimate thing for a client to want — checking a party name against a
   * date means reading both passages — and a single "which row is open" in the
   * parent would make them exclusive for no reason other than that the state
   * lived somewhere else.
   */
  const [sourceOpen, setSourceOpen] = useState(false);
  const passageId = useId();
  const hasPassage = field.sourcePassage !== null;

  const openEditor = () => setDraft(field.value ?? '');
  const closeEditor = () => setDraft(null);

  const saveDraft = () => {
    if (draft === null || draft.trim() === '') return;
    onEdit(draft);
    closeEditor();
  };

  // The client's own words need no provenance, and nothing to agree with.
  const fromClient = field.source === 'client';
  /*
   * Everything that is not the client's own words asks to be agreed with,
   * whatever it scored. The gate is provenance, in `isAutoApprovable`, and this
   * row just reflects what that decided: a field is either in, or it is asking.
   * No threshold here either — a second, looser copy of the rule living in the
   * view is how the two drift apart.
   */
  const showConfirm = !isEmpty && !field.confirmed && !readOnly;
  /*
   * Nothing pending, nothing to agree with: the client can still change their
   * mind, but on a finished brief that is the least important control on the
   * row and must not be the loudest thing on the panel.
   */
  const settled = !isEmpty && field.confirmed && !receipt && !readOnly;

  return (
    <div
      className={cn(
        'border-border relative flex flex-col gap-1 border-b py-4 last:border-b-0',
        /*
         * The rule that ties the question to the row (item 4).
         *
         * A pseudo-element in the panel's own left gutter rather than a real
         * `border-l`: the row already carries `border-border` for its hairline,
         * and a left border would mean fighting that shorthand for one side's
         * colour. Hanging it at `-left-3` also means the marked row does not
         * shift, indent, or reflow, which matters because this appears and
         * clears every turn while the client is reading.
         */
        asking &&
          'before:bg-foreground before:absolute before:inset-y-0 before:-left-3 before:w-0.5 before:content-[""]',
      )}
    >
      {/* `items-center` is what keeps the mark on the label's centre line. */}
      <div className="flex items-center justify-between gap-4">
        <span className="flex min-w-0 items-center gap-2.5">
          <StatusMark ticked={field.confirmed} needsEye={showConfirm} />
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

        {field.confirmedByClient ? (
          /*
           * The client agreed to it, so the model's reading is no longer the
           * most useful thing this slot can say.
           *
           * `confidence.ts` is emphatic that accepting a value does not make
           * the model more confident, and it is right — which is why the score
           * on the field is still untouched underneath this. What changed is
           * whose claim the row is reporting. "Inferred, 35%" is the model's
           * view of its own guess; once a human has read that guess and said
           * yes, the honest headline is that a person stands behind it, and a
           * person is not 35% sure of something they just confirmed.
           *
           * So 100% here is not a recomputed reading, it is a different
           * statement: fully confirmed, by the client, as of now. The reading
           * it replaces is still on the field for anyone who needs it.
           */
          <span className="text-success flex shrink-0 items-baseline gap-1.5 text-[11.5px]">
            {t('confidence.userConfirmed')}
            <span className="font-mono tabular-nums opacity-70">100%</span>
          </span>
        ) : reading ? (
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
        ) : asking ? (
          /*
           * In the confidence slot, because that is the slot that answers "what
           * is the state of this row". While a row is being asked about, the
           * honest state is not "not yet", it is that this is the one Moritz is
           * waiting on. Foreground rather than muted: it is the only row on the
           * panel with anything being asked of it.
           */
          <span className="text-foreground shrink-0 text-[11.5px]">
            {t('askingNow')}
          </span>
        ) : (
          <span className="text-muted-foreground shrink-0 text-[11.5px]">
            {t('stateWord.missing')}
          </span>
        )}
      </div>

      <div className={cn('flex flex-col gap-1', CONTENT_INDENT)}>
        {/*
         * Editing keeps the flex row: an input and two buttons on one line is
         * what flex is for, and there is no multi-line text to wrap.
         */}
        {editing ? (
          <div className={cn('flex items-center gap-2', VALUE_ROW)}>
            <input
              ref={inputRef}
              value={draft ?? ''}
              aria-label={t('editLabel', { field: field.label })}
              onChange={(event) => setDraft(event.target.value)}
              /*
               * Enter commits, Escape backs out. Escape is stopped here as
               * well: anything above this row that closes on Escape would
               * otherwise close and take the draft with it.
               */
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  saveDraft();
                  return;
                }
                if (event.key !== 'Escape') return;
                event.stopPropagation();
                event.nativeEvent.stopImmediatePropagation();
                closeEditor();
              }}
              // One line, at the height of the line of text it replaced. A
              // textarea here is what used to make the field grow.
              className="border-field text-foreground focus-visible:outline-ring focus-visible:outline-solid h-[30px] min-w-0 flex-1 rounded-[0.5rem] border bg-transparent px-2 text-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-0"
            />
            <span className="flex shrink-0 items-center gap-1.5">
              <>
                {/*
                 * `preventDefault` on mousedown keeps the caret where it is.
                 * Without it the button takes focus first, the input blurs,
                 * and the click lands on a control that has already gone.
                 */}
                <Button
                  type="button"
                  size="sm"
                  disabled={draft.trim() === ''}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={saveDraft}
                >
                  {t('save')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={closeEditor}
                >
                  {t('cancel')}
                </Button>
              </>
            </span>
          </div>
        ) : (
          /*
           * Every other state hands the value and the row's controls to
           * `BriefValue`, which sets the controls into the text's top-right and
           * lets the first line or two wrap around them. They used to be a
           * `shrink-0` flex sibling, which took half the column away from the
           * value for its whole height — see `brief-value.tsx`.
           */
          <BriefValue
            className={VALUE_ROW}
            value={
              state === 'missing'
                ? (hint ?? t('stateWord.missing'))
                : (field.value ?? '')
            }
            muted={state === 'missing'}
            {...(isEmpty || readOnly
              ? {}
              : {
                  controls: receipt ? (
                    <Receipt
                      receipt={receipt}
                      label={field.label}
                      onUndo={onUndo}
                    />
                  ) : showConfirm ? (
                    <>
                      {/*
                       * The solid variant, against Edit's outline. Agreeing with
                       * the value is the thing this row is asking for, and the two
                       * controls should not read as equally weighted alternatives.
                       * `--primary` is #141414, so the check and the label come
                       * back white through `text-primary-foreground`.
                       */}
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={onConfirm}
                      >
                        <Check data-icon="inline-start" aria-hidden="true" />
                        {t('accept')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={openEditor}
                      >
                        <Pencil data-icon="inline-start" aria-hidden="true" />
                        {t('edit')}
                      </Button>
                    </>
                  ) : settled ? (
                    /*
                     * Quieter than the pair above — ghost, so no fill and no
                     * outline — but on screen at all times. A control revealed by
                     * hovering is not there at all on a touch screen, and this is
                     * the only way back into a value the client has already agreed
                     * with.
                     *
                     * It says the word, and that is the L5 correction. This was
                     * icon-only: a bare pencil, in the slot where the two other
                     * occupants say Accept / Edit and Save / Cancel. Legora's rows
                     * are icon-only throughout and the decision here was explicitly
                     * *not* to follow that — words are clearer for someone doing
                     * this once, which is who this flow is for — so a lone
                     * unlabelled icon in the third state was our own rule broken in
                     * the one place nobody looked. Same slot, same position, same
                     * vocabulary in all three states; only the weight changes.
                     *
                     * `aria-label` stays, and is not redundant with the visible
                     * word: "Edit" alone does not say *what* is being edited, and a
                     * screen-reader user moving between nine rows of controls would
                     * hear the same word nine times.
                     */
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={t('editLabel', { field: field.label })}
                      onClick={openEditor}
                    >
                      <Pencil data-icon="inline-start" aria-hidden="true" />
                      {t('edit')}
                    </Button>
                  ) : null,
                })}
          />
        )}

        {/*
         * Where the value came from. A document source names the file and the
         * place in it, and now opens that place, so "check this" is something
         * the client can actually do rather than a thing they are told; the
         * quote sits under it behind a left rule, as a quotation rather than
         * more UI.
         */}
        {!fromClient && !isEmpty ? (
          <div className="mt-0.5 flex flex-col gap-1">
            {field.source === 'document' && field.sourceNote ? (
              /*
               * ─────────────────────────────────────────────────────────────
               * TWO CONTROLS, NOT ONE. THE CITATION OPENS THE DOCUMENT.
               * ─────────────────────────────────────────────────────────────
               *
               * This was a single button, and which of the two things it did
               * depended on whether the quote had been located:
               *
               *   onClick={hasPassage ? togglePassage : onOpenSource}
               *
               * So on every row that worked — a verified quote the locator
               * placed, which is the good case — clicking the citation expanded
               * three lines of text in place and never opened the document. The
               * viewer, the page it lands on and the highlight it paints were
               * all built and all sat one level further in, behind an *Open
               * document* link inside the disclosure. `onOpenSource` was
               * reachable from the citation only when the passage had failed.
               *
               * Which is the wrong way round. The citation names a place in a
               * file — "Read from offer-withdrawal.pdf, body of letter" — and a
               * reference to a place should go to the place. So the words open
               * the document at the highlighted passage, and the chevron keeps
               * the in-place preview for a client who wants to check the quote
               * without leaving the brief.
               *
               * Splitting them also fixes what the one button could not say:
               * `aria-expanded` belonged to the disclosure and the citation is
               * a link to somewhere else, and one element cannot honestly be
               * both.
               */
              <span className="inline-flex max-w-full items-center gap-1">
                <button
                  type="button"
                  onClick={onOpenSource}
                  className="text-muted-foreground hover:text-foreground focus-visible:outline-ring focus-visible:outline-solid inline-flex min-w-0 items-center gap-1 text-left text-[11.5px] outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <span className="decoration-border truncate underline underline-offset-2">
                    {t('sourceFromDocument', { where: field.sourceNote })}
                  </span>
                  {/*
                   * The arrow is back, and it is accurate again: this one does
                   * open a new context. It was turned into a chevron when the
                   * citation became a disclosure, which is the change being
                   * undone here.
                   */}
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-3 shrink-0"
                  />
                </button>

                {/*
                 * The in-place preview, still one click away and no longer in
                 * the way of the document. Only when there is a located passage
                 * to show: a chevron over nothing is the control that does
                 * nothing.
                 */}
                {hasPassage ? (
                  <button
                    type="button"
                    aria-expanded={sourceOpen}
                    {...(sourceOpen ? { 'aria-controls': passageId } : {})}
                    onClick={() => setSourceOpen((open) => !open)}
                    className="text-muted-foreground hover:text-foreground focus-visible:outline-ring focus-visible:outline-solid inline-flex shrink-0 items-center rounded-[0.5rem] outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <ChevronDown
                      aria-hidden="true"
                      className={cn(
                        'size-3 shrink-0 transition-transform duration-200 motion-reduce:transition-none',
                        sourceOpen && 'rotate-180',
                      )}
                    />
                    <span className="sr-only">
                      {t(sourceOpen ? 'sourceHide' : 'sourceShow')}
                    </span>
                  </button>
                ) : null}
              </span>
            ) : (
              <span className="text-muted-foreground text-[11.5px]">
                {t('sourceFromConversation')}
              </span>
            )}
            {field.sourceQuote ? (
              <blockquote className="border-border text-muted-foreground border-l-2 pl-2.5 text-[11.5px] italic">
                {field.sourceQuote}
              </blockquote>
            ) : null}
            {/*
             * The quote where it sits in the document (L3).
             *
             * Three verbatim slices of the contract's own text layer: the line
             * before, the line the value was read from, and the line after. The
             * middle one is set in full-strength ink against the two muted ones,
             * which is the whole mechanic — the client can see at a glance that
             * the quote was not lifted out of a sentence that went on to say the
             * opposite. That is the question a citation cannot answer on its own
             * and the only reason to show context at all.
             *
             * Plain text, no PDF viewer, no new dependency. `unpdf` already ran
             * server-side to verify the quote (T4a) and the passage is cut from
             * that output, so this is the document rather than a rendering of
             * it. Opening the actual file at the actual page is still the better
             * ending and still not built — see the `TODO(intake)` in
             * `intake-v2.tsx` — but the question "is this real" is now
             * answerable here, which is the question the confirm gate asks the
             * client to answer.
             *
             * Monospace, because it is a quotation from a document and the shift
             * in face is what stops three grey paragraphs reading as more UI
             * copy. `whitespace-pre-line` keeps the contract's own line breaks.
             */}
            {hasPassage && sourceOpen ? (
              <div
                id={passageId}
                className="border-border bg-muted/40 mz-animate-reveal mt-1 flex flex-col gap-1.5 rounded-[0.5rem] border p-2.5"
              >
                <p className="text-muted-foreground text-[10.5px] uppercase tracking-wide">
                  {t('sourcePassageLabel', { where: field.sourceNote ?? '' })}
                </p>
                <p className="font-mono text-[11px] leading-relaxed">
                  {field.sourcePassage!.before ? (
                    <span className="text-muted-foreground/70 whitespace-pre-line">
                      {`${field.sourcePassage!.before} `}
                    </span>
                  ) : null}
                  {/*
                   * `<mark>` rather than a styled span: this *is* a highlighted
                   * reference, and the element carries that meaning to a screen
                   * reader without a label having to say it. The fill is the
                   * brand tint at low opacity rather than the browser's yellow.
                   */}
                  <mark className="bg-primary/10 text-foreground whitespace-pre-line rounded-[0.5rem] px-1 py-0.5">
                    {field.sourcePassage!.match}
                  </mark>
                  {field.sourcePassage!.after ? (
                    <span className="text-muted-foreground/70 whitespace-pre-line">
                      {` ${field.sourcePassage!.after}`}
                    </span>
                  ) : null}
                </p>
                {/*
                 * The *Open document* button that used to sit here is gone: the
                 * citation above this block does exactly that now, three lines
                 * higher and before the client has to open anything. Two
                 * controls for one action, that close together, is how a panel
                 * stops being read.
                 */}
              </div>
            ) : null}
            {/*
             * Why this value is here, for the one kind of value where the
             * answer is not already on the row (L4).
             *
             * Only ever present on an `inferred` field — `applyFieldUpdates`
             * strips it from the other two, so this renders whenever it exists
             * rather than testing the source again. A client value needs no
             * explanation and a verified document value has the clause and the
             * exact words directly above, which are both stronger claims than a
             * paraphrase and would be weakened by having one beside them.
             *
             * Rendered as prose, not as a labelled field. Legora's version is
             * two columns, Answer and Reasoning, which is right for a lawyer
             * auditing a tool's output and wrong here: Alex is reading their own
             * case, and a second column would turn one readable line into a
             * form to compare. Same information, set as the aside it is.
             *
             * Not italic, deliberately, even though the quote above is. The
             * quote is italic because it is someone else's words; this is
             * Moritz's own, and the two have to be tellable apart on a row
             * where both can appear.
             */}
            {field.reasoning ? (
              <p className="text-muted-foreground text-[11.5px] leading-relaxed">
                {field.reasoning}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * What the client did, and when, in the slot the buttons were in.
 *
 * Accepting a value and changing it are different events, and a lawyer reading
 * the file later has to be able to tell them apart: "Accepted" means the
 * document and the client agree, "Edited" means they did not. The rest is the
 * receipt part — who, at what time — in muted grey, and an Undo in the plain
 * foreground colour, because it is a live control rather than part of the
 * record it sits inside.
 */
function Receipt({
  receipt,
  label,
  onUndo,
}: {
  receipt: FieldReceipt;
  label: string;
  onUndo: () => void;
}) {
  const t = useTranslations('intake.brief');
  /*
   * Ticked, because an unticked relative time is worse than an absolute one.
   *
   * A label rendered once reads "just now" for the rest of the afternoon, on
   * the row whose entire job is to record what the client did. The hook sleeps
   * until the next whole-minute boundary rather than polling, and stops for
   * good once the label has settled on a clock time — see `msUntilChange`.
   */
  const now = useNow(receipt.at);

  return (
    <span className="bg-muted flex h-9 items-center gap-1.5 rounded-full px-2.5 text-[11.5px] sm:h-7">
      {/*
       * Green, and only on the verb.
       *
       * "Accepted" is the same fact as the green tick at the head of the row —
       * this is settled and the client is behind it — so it takes the same
       * colour. The rest of the pill stays muted grey: who and when are the
       * record around the fact, not the fact, and colouring the whole pill
       * would make a green lozenge out of something that should read quietly.
       */}
      <span className="text-success flex items-center gap-1 font-medium">
        <Check aria-hidden="true" className="size-3" strokeWidth={2.5} />
        {t(`receipt.${receipt.kind}`)}
      </span>
      {/*
       * When, relative while that is the more useful answer (L11).
       *
       * It was always the clock time, and the clock was the weaker of the two
       * formats for this row. `use-brief.ts` resets `receipts` to `{}` on
       * hydration, so a receipt can only ever be from the session the client is
       * sitting in — and "14:32" for something they did ninety seconds ago is a
       * number they have to subtract from. The clock comes back once the
       * distance makes counting minutes worse than reading it, which is
       * reachable: this flow is built on the client going off to find a
       * contract and coming back.
       */}
      <span className="text-muted-foreground">
        {`\u00b7 ${t('receipt.by')} \u00b7 ${when(receipt.at, now, t)}`}
      </span>
      <button
        type="button"
        onClick={onUndo}
        aria-label={t('receipt.undoLabel', { field: label })}
        className="text-foreground focus-visible:outline-ring focus-visible:outline-solid cursor-pointer outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {t('receipt.undo')}
      </button>
    </span>
  );
}

/**
 * The receipt's timestamp, in words or on the clock (L11).
 *
 * Takes the translator rather than calling `useTranslations` itself, because it
 * is a formatter and not a component: the copy lives in `en.json` either way,
 * and a second hook call here would bind a second namespace that
 * `copy-keys.test.ts` would then have to know about.
 */
function when(
  at: number,
  now: number,
  t: (key: string, values?: Record<string, number>) => string,
): string {
  const described = describeWhen(at, now);
  if (described.kind === 'just-now') return t('receipt.justNow');
  if (described.kind === 'minutes') {
    return t('receipt.minutesAgo', { minutes: described.minutes });
  }
  return described.time;
}

/**
 * The current instant, re-read only when a relative label would actually change.
 *
 * A `setInterval` every second would be the obvious version and it would be
 * wrong twice over: it re-renders a brief row fifty-nine times for every time
 * the text changes, and it keeps doing so for the life of the page long after
 * the label has settled on a clock time and can never change again.
 *
 * So this schedules one timeout to the next whole-minute boundary, and
 * `msUntilChange` returning `null` is the signal to stop entirely. A receipt
 * more than an hour old costs nothing at all.
 */
function useNow(at: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const delay = msUntilChange(at, Date.now());
    if (delay === null) return;
    const timer = window.setTimeout(() => setNow(Date.now()), delay);
    return () => window.clearTimeout(timer);
    // `now` is a dependency on purpose: each tick schedules the next one, which
    // is what makes this a chain of exact timeouts rather than a poll.
  }, [at, now]);

  return now;
}
