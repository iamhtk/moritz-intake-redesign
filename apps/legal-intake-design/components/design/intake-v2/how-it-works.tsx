'use client';

import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@repo/ui/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/design/foundations/components/avatar';
import { AVATAR_FRAMING } from '@/components/design/homepage-v2/legal-team';
import type { MatterId } from '@/components/design/new-case/intake-types';
import { leadForMatter } from '@/components/design/new-case/lawyers';
import { TrustStrip } from '@/components/shared/trust-strip';
import { JOURNEY_STEPS, type JourneyStepId } from '@/lib/intake/journey';

/**
 * How this works, on the screen before anything has been said.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS IS THE RAIL'S STARTING POSITION, NOT A BROCHURE.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The card this replaces had three steps — *Your words / Your brief / Your
 * quote* — and each of the three things wrong with it was the same thing:
 * it was written as marketing copy for a screen, rather than as the first
 * frame of the tracker the client is about to spend the whole case reading.
 *
 * 1. **"Your words" and "Your brief" are one step.** Talking and watching the
 *    brief fill in are not two things that happen in sequence, they are the
 *    same few minutes described twice. Splitting them bought a third column
 *    and cost the client a step.
 * 2. **It stopped at the quote.** Lawyer and Document — the two things the
 *    client is actually paying for — were not on it at all. The brief this
 *    answers puts it plainly: *"a quote to pay, a lawyer appears, a document
 *    arrives."* A card that ends at the price describes the transaction and
 *    leaves out the work.
 * 3. **It said four hours.** Moritz's own figure, everywhere else in this
 *    product and on their case pages, is 24.
 *
 * And it did not match the rail. `journey-rail.tsx` names the case in four
 * words — Brief, Quote, Lawyer, Document — from the first reply to delivery.
 * Two different "how it works" stories on adjacent screens is complaint #2
 * (*"people do not understand the steps, or where they are in them"*) caused
 * rather than answered.
 *
 * **So: the same four words as the rail, vertical, and each step says who does
 * it and when.** The titles are read out of `intake.journey.step.*` rather
 * than out of a `howItWorks` copy block of their own, which is the only way to
 * make "the same four words" structurally true instead of a thing somebody has
 * to remember when they edit one of them.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE "WHEN" COLUMN IS HONEST, NOT DECORATIVE.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Three of the four have a real answer and the fourth says so:
 *
 * - *Now · a few minutes* on Brief — it is the client's own typing.
 * - *Within 24 hours* on Quote — Moritz's own published figure, and the same
 *   number `intake.journey.note.quote` gives the rail.
 * - *When you accept* on Lawyer — assignment follows payment, which is the
 *   real order and the one the confirmation already states.
 * - *No estimate* on Document, with the reason attached. This is the flow's
 *   existing rule, written on the confirmation: *"Only the quote has a time on
 *   it. We would rather leave the rest without an estimate than guess at one."*
 *   Saying it out loud where a competitor would print a fake number is more
 *   premium than the number, not less.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT IS DELIBERATELY NOT IN HERE.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **No numbers.** No `01/02/03`, no "step 2 of 4", no percentage. The rail
 * carries no count for the reason written at the top of `journey-rail.tsx`,
 * and a card that numbers the same four steps teaches a vocabulary the tracker
 * then refuses to speak. The dots and the line are the sequence.
 *
 * **No icons beyond the shield on the trust line, and no boxes inside the
 * card.** One surface, one tint, type and hairlines for everything else.
 *
 * **One colour, and it is the token.** `bg-mz-gold` — flat `#fbf6ed` — rather
 * than `bg-mz-gradient-gold`, which this card used to wear. The gradient's
 * bottom stop is `#f1f0dd`, one of the four off-palette ambers the brand audit
 * picked out (`#e8a952`, `#c0703d`, `#a17436`, `#f1f0dd`), so a card whose
 * whole rule is "one colour" was quietly shipping two and a half. Flat cream
 * is also the better surface for a list that is now twice as tall: a vertical
 * wash reads as depth on a short block and as a stain on a long one.
 *
 * **Three dead variants are gone.** This file shipped four treatments at once
 * — a gold panel, an editorial list, a centred stepper and the gold editorial
 * that won — on the explicit understanding, in its own header, that the losers
 * "come out again" (audit item 66). They never did. They are out now; the
 * argument each of them made is in git.
 */

/**
 * The two rows that carry a face.
 *
 * Quote and Lawyer, and nothing else. Brief is the client and Document is the
 * client again, so a photograph on either would be a stock human being used as
 * punctuation — which is the one thing this flow's whole treatment of real
 * lawyers is written against.
 */
const FACE_STEPS: readonly JourneyStepId[] = ['quote', 'lawyer'];

/**
 * The label above the card.
 *
 * Same type treatment as `SectionEyebrow` in `lawyer-showcase.tsx` (11px,
 * medium, uppercase, `tracking-[0.14em]`) so the two read as one system. Not
 * imported from it because that one is centred and takes no `className`.
 */
function Eyebrow() {
  const t = useTranslations('intake');

  return (
    <span className="text-muted-foreground block text-[11px] font-medium uppercase tracking-[0.14em]">
      {t('howItWorks.title')}
    </span>
  );
}

/**
 * A step's mark, and the line down to the next one.
 *
 * Same grammar as the rail — a small round mark and a hairline — because the
 * client is about to watch these exact marks move down the left of the page,
 * and the card only works as the tracker's first frame if it is drawn in the
 * tracker's own hand.
 *
 * **Brief is filled, the other three are hollow**, and this is the one place
 * the card's marks differ from the rail's on purpose. The rail draws its
 * current step as a *ring*, because a filled mark there sits in a column that
 * also contains green ticks and would read as "done" — the "did my case
 * actually submit?" confusion redrawn as a circle. Nothing on this card can
 * ever be done: it exists only before the first word is typed, so a fill here
 * can only mean the one thing it is meant to mean, which is *start here*.
 */
function StepMark({ here, connected }: { here: boolean; connected: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="flex shrink-0 flex-col items-center gap-1 pt-[5px]"
    >
      <span
        className={cn(
          'size-2.5 shrink-0 rounded-full border',
          here ? 'border-foreground bg-foreground' : 'border-foreground/25',
        )}
      />
      {connected ? <span className="bg-foreground/15 w-px flex-1" /> : null}
    </div>
  );
}

/**
 * The face beside Quote and Lawyer.
 *
 * 22px, which is half the note's avatar below and about the smallest a real
 * headshot survives: this is a person, not an icon, and the point of it is
 * that the client can see they are one.
 *
 * **It follows the matter type.** `leadForMatter` is the same lookup the
 * lawyer note, the confirmation and the case handoff all use, so the person
 * who appears here is the person who appears everywhere else in the flow for
 * this kind of matter. Before the client has said what the matter is —
 * which, on this screen, is nearly always — it returns the default lead for
 * unclassified work rather than guessing.
 *
 * **Not the note's rotation.** `intake-lawyer-note.tsx` cycles the roster
 * while the matter is unknown, and that is right for a block whose whole
 * subject is one human being. Two rows of this card would be cycling in
 * peripheral vision beside a composer with a cursor in it, and the card's
 * subject is the process, not the person.
 *
 * `overflow-hidden` is load-bearing, not tidying: `AVATAR_FRAMING` crops these
 * headshots with a `scale`, and the foundation `Avatar` root deliberately does
 * not clip (see `intake-lawyer-note.tsx` for the face that spilled over its
 * own name).
 */
function LawyerFace({
  name,
  initials,
  imageUrl,
  id,
}: {
  name: string;
  initials: string;
  imageUrl: string;
  id: string;
}) {
  return (
    <Avatar
      className={cn(
        'size-[22px] shrink-0 overflow-hidden',
        imageUrl ? 'border-border/60 border' : 'ring-primary/20 ring-1',
      )}
    >
      <AvatarImage
        src={imageUrl}
        alt={name}
        className={AVATAR_FRAMING[id] ?? 'object-cover'}
      />
      {/*
       * The employment lead has no headshot by design (see `lawyers.ts`), and
       * a monogram is the answer rather than a grey disc. Rendered
       * unconditionally: an empty `src` resolves to `error` without a request,
       * and leaving the image out entirely is what used to leave Radix's root
       * thinking a photograph was still up, blanking the fallback.
       */}
      <AvatarFallback className="bg-primary/10 text-foreground text-[9px] font-medium tracking-wide">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * How long the card takes to get out of the way.
 *
 * Exported because the caller has to know: the card collapses in CSS and is
 * then unmounted in React, and an unmount that lands early cuts the animation
 * off mid-fade while one that lands late leaves an empty flex gap under the
 * suggestion chips. One number, read by both halves. See the handoff note
 * below and `phase === 'start'` in `intake-v2.tsx`.
 */
export const HANDOFF_MS = 500;

export function HowItWorksCard({
  matterId,
  leaving = false,
  className,
  style,
}: {
  /**
   * The matter as resolved from the brief's own `matter-type` field, or
   * `undefined` before the client has said what this is.
   *
   * Same prop and same source as `IntakeLawyerNote` a few inches below —
   * `matterOf(brief)`, never `brief.matterId`, which is pinned to `contract`
   * for the life of every brief. Two faces on one screen disagreeing about who
   * handles this matter would be worse than either of them being wrong alone.
   */
  matterId: MatterId | undefined;
  /**
   * ⭐ The card is on its way out, because the rail has taken over.
   *
   * ───────────────────────────────────────────────────────────────────────────
   * THE CARD BECOMES THE RAIL.
   * ───────────────────────────────────────────────────────────────────────────
   *
   * The moment the client types a character or drops a file, the same four
   * words appear in the left rail with Brief active and this card folds away
   * underneath them. The explanation *turns into* the tracker: same words,
   * same dots, same line, so the client reads the shape once on the opening
   * screen and then spends the rest of the case watching it move.
   *
   * Two rules make it safe rather than clever:
   *
   * 1. **The rail is in place before the card is gone.** The opening screen
   *    reserves the rail's column from first paint and fills it the instant
   *    the client begins; only then does this start folding. There is never a
   *    frame with neither, which would read as the page losing something.
   * 2. **`prefers-reduced-motion` gets a plain swap.** `motion-reduce:` drops
   *    the transition here and `globals.css` drops the rail's entrance
   *    keyframe, so the card is simply not there on the next render and the
   *    rail simply is.
   *
   * A collapsing grid row rather than a height animation: `grid-rows-[1fr]` to
   * `grid-rows-[0fr]` over an `overflow-hidden` child is the one way to
   * animate to a content-derived height without measuring it, and measuring
   * this card would mean a `ResizeObserver` on the opening screen — the exact
   * thing `journey-rail.tsx` tore out.
   */
  leaving?: boolean;
  className?: string;
  /**
   * For the caller's entrance animation.
   *
   * Nothing inside this card animates on load. The screen takes one cascade
   * and this is a single block in it; see `ENTRANCE_STAGGER_MS` in
   * `lib/entrance.ts` for why the per-row stagger this used to have was
   * removed.
   */
  style?: CSSProperties;
}) {
  const t = useTranslations('intake');
  const lawyer = leadForMatter(matterId);

  return (
    /*
     * Three wrappers, and each one is load-bearing.
     *
     * The outer carries the caller's entrance, and it has to be a different
     * element from the one that fades out: `mz-animate-step` is declared with
     * `animation-fill-mode: both`, so its final keyframe keeps `opacity: 1`
     * pinned on whatever element it is applied to, and a class setting
     * `opacity-0` on that same element would simply lose. The middle one owns
     * the collapse and the fade. The inner is the `overflow-hidden` the grid
     * row needs to clip against.
     */
    <div className={className} style={style}>
      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none',
          leaving
            ? 'pointer-events-none grid-rows-[0fr] opacity-0'
            : 'grid-rows-[1fr] opacity-100',
        )}
        aria-hidden={leaving || undefined}
      >
        <div className="overflow-hidden">
          <section className="bg-mz-gold border-foreground/10 tall:px-6 tall:py-5 taller:px-8 taller:py-6 rounded-2xl border px-5 py-4">
            <Eyebrow />

            {/*
             * No gap on the list, and the breathing room is padding inside
             * each row instead. A `gap` would break the hairline into three
             * separate dashes between four dots, which is the thing that
             * makes a stepper look broken — the rail solves it the same way,
             * for the same reason.
             */}
            <ol className="tall:mt-4 mt-3 flex flex-col">
              {JOURNEY_STEPS.map((step, index) => {
                const here = index === 0;
                const face = lawyer !== null && FACE_STEPS.includes(step);
                const connected = index < JOURNEY_STEPS.length - 1;

                return (
                  <li key={step} className="flex gap-3">
                    <StepMark here={here} connected={connected} />

                    {/*
                     * Who and when sit beside the description on anything wider than
                     * a phone and underneath it below that. Right-aligned in a fixed
                     * column so the four "when" answers form a readable second
                     * column rather than four ragged tails, and capped at 10.5rem
                     * because "No estimate. We would rather not guess." is a
                     * sentence and would otherwise take a third of the row.
                     */}
                    <div
                      className={cn(
                        'flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-5',
                        connected && 'tall:pb-4 pb-3.5',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        {/*
                         * The rail's own word for this step, read from the rail's own
                         * copy. Not a `howItWorks.*` title, because "the same four
                         * words" has to be a fact about the code rather than a note
                         * in a doc: one key, one place to edit it, and the card and
                         * the tracker cannot drift apart.
                         */}
                        <p className="text-foreground font-serif text-[15px] font-semibold leading-tight tracking-tight">
                          {t(`journey.step.${step}`)}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                          {t(`howItWorks.description.${step}`)}
                        </p>
                        {/*
                         * Under Brief only, and tiny. The dot already says it; this
                         * is for the client who reads the card as a list of four
                         * unfamiliar words and wants to know which one is now.
                         */}
                        {here ? (
                          <p className="text-muted-foreground/70 mt-1 text-[11px] leading-snug">
                            {t('howItWorks.youAreHere')}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 flex-col gap-0.5 sm:w-[10.5rem] sm:items-end sm:text-right">
                        <div className="flex items-center gap-1.5 sm:flex-row-reverse">
                          {face ? (
                            <LawyerFace
                              id={lawyer.id}
                              name={lawyer.name}
                              initials={lawyer.initials}
                              imageUrl={lawyer.imageUrl}
                            />
                          ) : null}
                          {/*
                           * On Quote the person is named, because that is the row
                           * where a real human being reads the brief and puts a
                           * price on it, and a name with a practice area beside it
                           * is the difference between a firm and a queue.
                           *
                           * On Lawyer the same face returns under *your lawyer*
                           * rather than under the name again. The continuity is the
                           * point of the row — the person who read it is the person
                           * who takes it — and repeating the name would read as two
                           * separate claims about an assignment that has not
                           * happened yet.
                           *
                           * The practice area is the roster's own `title`, not a
                           * shortened version of it. Same string the lawyer note
                           * shows a few inches below, so the two cannot disagree
                           * about what this person does.
                           */}
                          <span className="text-foreground text-[11px] font-medium leading-snug">
                            {step === 'quote' && face
                              ? lawyer.name
                              : t(`howItWorks.who.${step}`)}
                          </span>
                        </div>
                        {step === 'quote' && face ? (
                          <span className="text-muted-foreground text-[10.5px] leading-snug">
                            {lawyer.title}
                          </span>
                        ) : null}
                        <span className="text-muted-foreground/80 text-[10.5px] leading-snug">
                          {t(`howItWorks.when.${step}`)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            {/*
             * The division of labour and the credentials, under one rule.
             *
             * Both answer the same question — a client who has read the four steps
             * and is deciding whether to paste a dispute is asking "and then what"
             * about the process, not about two separate topics. A second hairline
             * would make the card a stack of three sections instead of a list with a
             * footer.
             *
             * The sentence is Moritz's own, from the brief: *"Our agents do the first
             * pass. Our lawyers finish it."* The video plan's version of this was
             * "AI does 80%, a named human does 20%", which is a good framing and a
             * number nobody has measured — a percentage is the most falsifiable
             * shape a claim can take. Their words say the same thing as a division
             * of labour, which is the part that is true.
             *
             * In the serif and not the sans, because it is the card's closing line
             * rather than a fifth step, and the serif is how this flow marks an
             * aside (see the file note in `brief-column.tsx`).
             */}
            <div className="border-foreground/10 tall:mt-4 tall:pt-3.5 mt-3 border-t pt-3">
              <p className="text-foreground/75 font-serif text-[13px] italic leading-relaxed">
                {t('howItWorks.footer')}
              </p>
              {/*
               * The credentials, last and tight against the line above.
               *
               * They were a loose row under the composer, which had the better
               * adjacency — that is the moment a contract is handed over — and no
               * home. As the second line of the card's footer they are part of the
               * same small paragraph, and the spacing has to say so. See
               * `trust-strip.tsx` for why the treatment changes with the surface.
               */}
              <TrustStrip surface="gold" className="tall:mt-2 mt-1.5" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
