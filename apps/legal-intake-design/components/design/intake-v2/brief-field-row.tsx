'use client';

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, Check, ChevronDown, Pencil } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@/components/design/foundations/components/button';
import { fieldState, type BriefField } from '@/lib/intake/brief';
import type { FieldReceipt } from './use-brief';
import { fieldConfidence, type ConfidenceLevel } from '@/lib/intake/confidence';
import { BriefValue } from './brief-value';
import { describeWhen, msUntilChange } from '@/lib/intake/relative-time';
import { useJustTurnedTrue, useValueLanded } from './use-landed';

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
  landed,
}: {
  ticked: boolean;
  needsEye: boolean;
  /**
   * Whether the tick arrived *just now* (#9).
   *
   * Passed in rather than observed here so one hook watches the row's whole
   * confirmation rather than this mark watching its own prop: the value's
   * arrival and the tick's draw are one event and have to be timed against
   * each other, not raced.
   */
  landed: boolean;
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
   * a confirmed row, the tick on the "Accepted" receipt, and the client's own
   * confirmation. Those are not three meanings, they are three views of one,
   * so the repetition reinforces rather than dilutes.
   *
   * The mark and the reading beside it carry the same hue, from two different
   * weights of it. A mark is a graphic and only has to clear 3:1, so it can
   * wear the brand swatch itself at 18px; a word has to clear 4.5:1 and the
   * swatches do not, so the reading wears the darkened `-ink` variant instead.
   * Same colour, same meaning, two tokens because the bars are different —
   * see `LEVEL_STYLE` below and the `-ink` block in `globals.css`.
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
        className={cn(
          'bg-success text-background flex size-[18px] shrink-0 items-center justify-center rounded-full',
          landed && 'mz-animate-confirm-fill',
        )}
      >
        {/*
         * #9. The disc scales up from the ring it replaces and the tick draws
         * inside it, 300ms, on the spring. The two are separate animations
         * because the stroke needs something to be drawn *on* before it
         * starts — see the pair of keyframes in `globals.css`.
         *
         * `key` on the icon so the draw replays if a client unconfirms and
         * reconfirms a row. Without it React keeps the same element, the
         * animation has already run to completion on it, and the second
         * confirmation is silent.
         */}
        <Check
          key={landed ? 'drawn' : 'still'}
          className={cn('size-2.5', landed && 'mz-animate-confirm-tick')}
          strokeWidth={3}
        />
      </span>
    );
  }

  if (needsEye) {
    return (
      <span
        aria-hidden="true"
        className="border-warning bg-background ring-warning/10 flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 ring-4"
      >
        {/*
         * #10. The dot breathes, slowly, until the row is confirmed.
         *
         * On the inner dot rather than the ring, which is the difference
         * between "this one needs you" and a panel that throbs. The ring and
         * its halo hold still, so the row's outline is stable and only the
         * 6px centre changes opacity — visible when you look at the row,
         * invisible when you are reading the one above it.
         *
         * This is one of the three things sharing the single looping
         * animation §6 allows (with the rail's halo and Moritz reading), and
         * they all breathe at the same 3s so a screen with two of them on it
         * reads as one pulse rather than two clocks.
         */}
        <span className="bg-warning mz-animate-breathe size-1.5 rounded-full" />
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
 * The three readings, as the traffic light they describe.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS WAS GREY FOR ONE RELEASE, AND GREY WAS THE WRONG FIX.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The ramp started as green / amber / red, and the accessibility pass took the
 * colour out — correctly diagnosing that as *text* on white the brand swatches
 * all fail WCAG AA (`success` 2.66:1, `warning-strong` 3.73:1, `destructive`
 * 3.57:1, against 4.5:1) and concluding that a hue scale whose every step is
 * unreadable is three shades of grey with extra steps.
 *
 * The diagnosis was right and the remedy was too blunt. It treated "this green
 * is too light to read" as "this column should not be coloured", and those are
 * different problems with different answers. What the column lost is the
 * reason it existed: the reading is an **ordered three-step scale**, which is
 * the one job a traffic light does better than words, and a panel of identical
 * grey makes the client read all eight rows to find the one that wants them.
 * That is the scanning cost the whole brief panel is built to remove.
 *
 * So the ramp is back, in a weight that can be read: `--success-ink`,
 * `--warning-ink` and `--destructive-ink`, each darkened in oklab from the
 * brand swatch it belongs to. Same hues, same palette, no new colour — see
 * the block above them in `globals.css` for the recipe and the measurements.
 * All three clear 4.5:1 on white and on the gold tint.
 *
 * **The words stay.** "High", "Medium" and "Check this" are still spelled out
 * beside the percentage, so the scale is never carried by hue alone and a
 * client who cannot separate the three sees the same information the rest do.
 * The colour is a second channel on top of a complete first one, which is the
 * only form of colour-coding that is not a barrier.
 *
 * The marks keep their own hue (see `StatusMark`), and the two agree: an amber
 * ring beside an amber reading is one statement made twice, not two.
 */
const LEVEL_STYLE: Record<ConfidenceLevel, string> = {
  high: 'text-success-ink',
  medium: 'text-warning-ink',
  low: 'text-destructive-ink',
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
  cascadeIndex,
  pointedAt = null,
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
  /**
   * This row's place in a document's cascade (#11).
   *
   * `undefined` for a value that arrived on its own, which is the ordinary
   * case: one answer, one arrival, no stagger. A number only when a single
   * document answered several fields at once, and then it is the row's index
   * *within that set* rather than within the panel — a read that fills rows
   * 2, 5 and 9 should look like three things happening in order, not like
   * rows 2, 5 and 9 of a longer sequence with gaps in it.
   */
  cascadeIndex?: number;
  /**
   * The press count of "Review and send" while this row was the blocker (#74).
   *
   * `null` for every row that is not the current target. A *number* rather
   * than a boolean so a second press on the same row re-fires: the row
   * scrolls itself into view, takes focus and pulses, and the button stays
   * pressable, because a control that refuses and will not say why is the
   * version people report as broken.
   */
  pointedAt?: number | null;
  onConfirm: () => void;
  onEdit: (value: string) => void;
  onUndo: () => void;
  onOpenSource: () => void;
}) {
  const t = useTranslations('intake.brief');
  const state = fieldState(field);
  const reading = fieldConfidence(field);
  const isEmpty = field.value === null;

  /*
   * The two moments this row animates on (#7, #9).
   *
   * Both are transitions rather than states, and both are deliberately blind
   * to their own first render — see `use-landed.ts` for why a restored draft
   * must not replay every tick it has ever drawn.
   */
  const valueLanded = useValueLanded(field.value ?? undefined);
  const tickLanded = useJustTurnedTrue(field.confirmed);

  /*
   * #74. Bring the row to the client rather than leaving them to find it.
   *
   * Scroll, then focus. Both, because they answer different questions: the
   * scroll is what a sighted client needs to see where the button sent them,
   * and the focus is the only thing that moves a screen-reader or
   * keyboard-only client at all. A scroll on its own leaves them exactly
   * where they were with no idea anything happened.
   *
   * `block: 'center'` rather than `'nearest'`: a row that is technically on
   * screen but two pixels above the fold satisfies `nearest` and is not where
   * anybody is looking.
   */
  const rowRef = useRef<HTMLDivElement>(null);
  const [pulsing, setPulsing] = useState(false);
  useEffect(() => {
    if (pointedAt === null) return;
    const row = rowRef.current;
    if (!row) return;

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    row.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'center',
    });
    row.focus({ preventScroll: true });

    /*
     * Off, then on next frame. Setting an already-set class is not a new
     * animation — the browser has run it to completion on this element and
     * will not run it again — so a second press would scroll here and then
     * sit still. One frame with the class absent is what makes the next one
     * a new animation rather than the same finished one.
     */
    if (reduced) return;
    setPulsing(false);
    const frame = window.requestAnimationFrame(() => setPulsing(true));
    return () => window.cancelAnimationFrame(frame);
  }, [pointedAt]);

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
      ref={rowRef}
      /*
       * Focusable only as a target, never in the tab order (#74). The row is
       * not a control and must not become a tab stop between the value above
       * it and the Accept button inside it; `-1` is what lets the button send
       * focus here without adding a step to everybody's keyboard journey.
       */
      tabIndex={-1}
      /*
       * The pulse ends itself rather than being timed out from above, which
       * is what keeps `intake-v2.tsx` free of the anonymous `setTimeout`
       * `prototype-control.test.ts` rejects. Guarded on the target, because
       * `animationend` bubbles and this row also contains a tick that draws
       * and a value that arrives.
       */
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setPulsing(false);
      }}
      className={cn(
        'border-border relative flex flex-col gap-1 border-b py-4 last:border-b-0 focus-visible:outline-none',
        pulsing && 'mz-animate-pulse-row',
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
          <StatusMark
            ticked={field.confirmed}
            needsEye={showConfirm}
            landed={tickLanded}
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
              <span className="text-muted-foreground text-xs font-normal">
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
          <span className="text-success-ink flex shrink-0 items-baseline gap-1.5 text-xs">
            {t('confidence.userConfirmed')}
            {/*
             * The score dropped its `opacity-70`. At 70% of an already-muted
             * grey the percentage measured 1.93:1 against white — the lowest
             * contrast anywhere in the flow, on a number the whole provenance
             * argument rests on. It is quieter than the word beside it because
             * it is mono and tabular, which is enough.
             */}
            <span className="font-mono tabular-nums">100%</span>
          </span>
        ) : reading ? (
          <span
            className={cn(
              'flex shrink-0 items-baseline gap-1.5 text-xs',
              LEVEL_STYLE[reading.level],
            )}
          >
            {t(`confidence.${reading.level}`)}
            <span className="font-mono tabular-nums">{reading.score}%</span>
          </span>
        ) : asking ? (
          /*
           * In the confidence slot, because that is the slot that answers "what
           * is the state of this row". While a row is being asked about, the
           * honest state is not "not yet", it is that this is the one Moritz is
           * waiting on. Foreground rather than muted: it is the only row on the
           * panel with anything being asked of it.
           */
          <span className="text-foreground shrink-0 text-xs">
            {t('askingNow')}
          </span>
        ) : (
          <span className="text-muted-foreground shrink-0 text-xs">
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
                  className="max-lg:h-11"
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
                  className="max-lg:h-11"
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
            /*
             * #7 and #11. The value slides 8px in from the left and settles
             * on the spring — from the left because that is the side the
             * conversation that produced it is on.
             *
             * `key` on the arrival so a corrected value replays it: without
             * one, React reuses the element, the animation has already
             * finished on it, and the second value simply swaps in. With a
             * cascade index the same arrival is delayed by its position, so a
             * document that answered four rows fills them in order (#11).
             */
            key={valueLanded ? `landed-${field.value}` : 'settled'}
            className={cn(
              VALUE_ROW,
              valueLanded &&
                (cascadeIndex === undefined
                  ? 'mz-animate-arrive'
                  : 'mz-animate-cascade'),
            )}
            {...(valueLanded && cascadeIndex !== undefined
              ? {
                  style: {
                    '--mz-cascade-index': cascadeIndex,
                  } as CSSProperties,
                }
              : {})}
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
                    <span data-tour="brief-row-actions" className="contents">
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
                        className="max-lg:h-11"
                        onClick={onConfirm}
                      >
                        <Check data-icon="inline-start" aria-hidden="true" />
                        {t('accept')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="max-lg:h-11"
                        onClick={openEditor}
                      >
                        <Pencil data-icon="inline-start" aria-hidden="true" />
                        {t('edit')}
                      </Button>
                    </span>
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
                      className="max-lg:h-11"
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
                  data-tour="brief-source"
                  onClick={onOpenSource}
                  className="text-muted-foreground hover:text-foreground focus-visible:outline-ring focus-visible:outline-solid mz-tap relative inline-flex min-w-0 items-center gap-1 text-left text-xs outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
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
                    className="text-muted-foreground hover:text-foreground focus-visible:outline-ring focus-visible:outline-solid mz-tap relative inline-flex shrink-0 items-center rounded-[0.5rem] outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
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
              <span className="text-muted-foreground text-xs">
                {t('sourceFromConversation')}
              </span>
            )}
            {field.sourceQuote ? (
              <blockquote className="border-border text-muted-foreground border-l-2 pl-2.5 text-xs italic">
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
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  {t('sourcePassageLabel', { where: field.sourceNote ?? '' })}
                </p>
                <p className="font-mono text-xs leading-relaxed">
                  {field.sourcePassage!.before ? (
                    <span className="text-muted-foreground whitespace-pre-line">
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
                    <span className="text-muted-foreground whitespace-pre-line">
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
              <p className="text-muted-foreground text-xs leading-relaxed">
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
    <span className="bg-muted flex h-9 items-center gap-1.5 rounded-full px-2.5 text-xs sm:h-7">
      {/*
       * Green, and only on the tick.
       *
       * "Accepted" is the same fact as the green tick at the head of the row —
       * this is settled and the client is behind it — so it carries the same
       * mark. The word used to carry the colour too, and on this pill's
       * `bg-muted` ground that measured 2.37:1: the lowest-contrast text on
       * the row was the one word stating the outcome. The tick keeps the green
       * (a graphic, 3:1, which it clears); the verb goes to ink and holds its
       * emphasis with `font-medium` instead. Who and when stay muted grey:
       * they are the record around the fact, not the fact.
       */}
      <span className="text-foreground flex items-center gap-1 font-medium">
        <Check
          aria-hidden="true"
          className="text-success size-3"
          strokeWidth={2.5}
        />
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
        className="text-foreground focus-visible:outline-ring focus-visible:outline-solid mz-tap relative cursor-pointer outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
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
