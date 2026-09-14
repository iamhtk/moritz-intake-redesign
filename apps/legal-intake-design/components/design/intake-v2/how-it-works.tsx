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
 * THE SAME FOUR WORDS THE REST OF THE CASE USES.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The card this replaces had three steps — *Your words / Your brief / Your
 * quote* — and three things wrong with it.
 *
 * 1. **"Your words" and "Your brief" are one step.** Talking and watching the
 *    brief fill in are the same few minutes described twice.
 * 2. **It stopped at the quote.** Lawyer and Document — the two things the
 *    client is actually paying for — were not on it. The brief this answers
 *    puts it plainly: *"a quote to pay, a lawyer appears, a document
 *    arrives."*
 * 3. **It gave the wrong turnaround.** It promised a quote in a quarter of
 *    the time the rest of the product does. Moritz's own figure is 24 hours;
 *    the card said four, and nothing else anywhere said four.
 *
 * And it did not match the journey rail, which names the case in four words —
 * Brief, Quote, Lawyer, Document — from the first reply to delivery. Two
 * different "how it works" stories on adjacent screens is complaint #2
 * (*"people do not understand the steps, or where they are in them"*) caused
 * rather than answered.
 *
 * So the card is the vocabulary and the rail is the tracker. The titles here
 * are read out of `intake.journey.step.*` — the rail's own key — which is the
 * only way to make "the same four words" a fact about the code rather than a
 * note somebody has to remember when they edit one of them.
 *
 * **The rail itself never appears on this screen.** Not at the start, and not
 * on the first keystroke either. An earlier version slid it in as the client
 * began typing and folded this card away underneath it; it read as the page
 * snatching the explanation back mid-sentence, and it put a progress tracker
 * on a case that had not been sent. Nothing has started here, so there is no
 * position to report. See the `phase === 'start'` return in `intake-v2.tsx`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE SHORT SENTENCE A STEP, AND AN HONEST "WHEN".
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Each step gets one plain line and no more. The first draft gave every step
 * two or three sentences with the reassurances folded in, and four rows of
 * that is a page of copy standing between a client and a composer they have
 * not typed into yet. Anything that needs saying twice is said somewhere it
 * is already being said: the rail carries *"nothing is charged until you
 * accept"*, and the trust line under this one carries the credentials.
 *
 * The "when" column is honest rather than decorative:
 *
 * - *A few minutes* on Brief — it is the client's own typing.
 * - *Within 24 hours* on Quote — Moritz's own published figure, and the same
 *   number `intake.journey.note.quote` gives the rail.
 * - *When you accept* on Lawyer — assignment follows payment, which is the
 *   real order.
 * - *No estimate* on Document. The flow's existing rule, already written on
 *   the confirmation: *"Only the quote has a time on it. We would rather
 *   leave the rest without an estimate than guess at one."* Where a
 *   competitor prints a number nobody can stand behind, two words are the
 *   more premium answer.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT IS DELIBERATELY NOT IN HERE.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **No numbers.** No `01/02/03`, no "step 2 of 4", no percentage. The rail
 * carries no count for the reason written at the top of `journey-rail.tsx`,
 * and a card that numbers the same four steps teaches a vocabulary the
 * tracker then refuses to speak. The dots and the line are the sequence.
 *
 * **No icons beyond the shield on the trust line, and no boxes inside the
 * card.** One surface, one tint, type and hairlines for everything else.
 *
 * **One colour, and it is the token.** `bg-mz-gold` — flat `#fbf6ed` —
 * rather than `bg-mz-gradient-gold`, which this card used to wear. The
 * gradient's bottom stop is `#f1f0dd`, one of the four off-palette ambers the
 * brand audit picked out (`#e8a952`, `#c0703d`, `#a17436`, `#f1f0dd`), so a
 * card whose whole rule is "one colour" was quietly shipping two and a half.
 * Flat cream is also the better surface for a list twice as tall as the old
 * one: a vertical wash reads as depth on a short block and as a stain on a
 * long one.
 *
 * **Three dead variants are gone.** This file shipped four treatments at once
 * — a gold panel, an editorial list, a centred stepper and the gold editorial
 * that won — on the explicit understanding, in its own header, that the
 * losers "come out again" (audit item 66). They never did. They are out now;
 * the argument each of them made is in git.
 */

/**
 * The one row that carries a face.
 *
 * Quote, and nothing else. It was Quote and Lawyer while each row had a
 * written "who" beside it — the same face twice said *the person who priced
 * it is the person who takes it*, which is a real thing to say. With the who
 * column gone (see the right-hand block below) a second unlabelled face says
 * nothing: two photographs down one edge read either as two different people
 * or as decoration, and this card has no decoration in it.
 *
 * Quote keeps it because that is the row where a client is waiting on a
 * stranger, and a stranger with a face is the difference between a firm and a
 * queue. Brief and Document are the client, so a photograph on either would
 * be a stock human being used as punctuation.
 */
const FACE_STEPS: readonly JourneyStepId[] = ['quote'];

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
    <span className="text-muted-foreground block text-xs font-medium uppercase tracking-[0.14em]">
      {t('howItWorks.title')}
    </span>
  );
}

/**
 * A step's mark, and the line down to the next one.
 *
 * Same grammar as the rail — a small round mark and a hairline — because
 * these are the marks the client will be reading down the left of the page
 * for the rest of the case, and the card only works as the tracker's first
 * frame if it is drawn in the tracker's hand.
 *
 * **Brief is filled, the other three are hollow**, and this is the one place
 * the card's marks differ from the rail's on purpose. The rail draws its
 * current step as a *ring*, because a filled mark there sits in a column that
 * also contains green ticks and would read as "done" — the "did my case
 * actually submit?" confusion redrawn as a circle. Nothing on this card can
 * ever be done: it exists only before the case has been sent, so a fill here
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
 * 22px, which is about the smallest a real headshot survives: this is a
 * person, not an icon, and the point of it is that the client can see they
 * are one.
 *
 * **It follows the matter type.** `leadForMatter` is the same lookup the
 * lawyer note, the confirmation and the case handoff all use, so the person
 * here is the person who appears everywhere else in the flow for this kind of
 * matter. Before the client has said what the matter is — which, on this
 * screen, is nearly always — it returns the default lead for unclassified
 * work rather than guessing.
 *
 * **Not the note's rotation.** `intake-lawyer-note.tsx` cycles the roster
 * while the matter is unknown, which is right for a block whose whole subject
 * is one human being. Two rows of this card cycling in peripheral vision
 * beside a composer would be movement for its own sake, and the card's
 * subject is the process rather than the person.
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
      <AvatarFallback className="bg-primary/10 text-foreground text-xs font-medium tracking-wide">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

export function HowItWorksCard({
  matterId,
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
    <section
      className={cn(
        'bg-mz-gold border-foreground/10 tall:px-6 tall:py-5 taller:px-8 taller:py-6 rounded-2xl border px-5 py-4',
        className,
      )}
      style={style}
    >
      <Eyebrow />

      {/*
       * No gap on the list, and the breathing room is padding inside each row
       * instead. A `gap` would break the hairline into three separate dashes
       * between four dots, which is the thing that makes a stepper look
       * broken — the rail solves it the same way, for the same reason.
       */}
      <ol className="tall:mt-4 mt-3 flex flex-col">
        {JOURNEY_STEPS.map((step, index) => {
          const here = index === 0;
          const face = lawyer !== null && FACE_STEPS.includes(step);
          const connected = index < JOURNEY_STEPS.length - 1;

          return (
            <li key={step} className="flex gap-3">
              <StepMark here={here} connected={connected} />

              <div
                className={cn(
                  'flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-start sm:gap-5',
                  connected && 'tall:pb-4 pb-3.5',
                )}
              >
                <div className="min-w-0 flex-1">
                  {/*
                   * The rail's own word for this step, read from the rail's
                   * own copy. Not a `howItWorks.*` title, because "the same
                   * four words" has to be one key with one place to edit it,
                   * or the card and the tracker drift.
                   */}
                  <p className="text-foreground font-serif text-base font-semibold leading-tight tracking-tight">
                    {t(`journey.step.${step}`)}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    {t(`howItWorks.description.${step}`)}
                  </p>
                  {/*
                   * Under Brief only, and tiny. The dot already says it; this
                   * is for the client who reads the card as four unfamiliar
                   * words and wants to know which one is now.
                   */}
                  {here ? (
                    <p className="text-muted-foreground mt-1 text-xs leading-snug">
                      {t('howItWorks.youAreHere')}
                    </p>
                  ) : null}
                </div>

                {/*
                 * ⭐ When, and nothing else. There used to be a "who" here
                 * and it could not be made to say anything true.
                 *
                 * The column began as three lines — a name, a practice area
                 * and a time — which read as a second, denser card crammed
                 * into the margin of the first. Cutting it to two did not fix
                 * it, because the problem was never the line count. It was
                 * that the "who" had no consistent question behind it.
                 *
                 * Ask *who does the work* and the answer is You, Lawyer,
                 * Lawyer, Lawyer. Ask *who closes the step* and it is You,
                 * You, Lawyer, You. Quote is the row that exposes it: the
                 * rail splits that step into four rows and three of them are
                 * the client's — `sent`, `quote`, `paid` — which is why
                 * `JOURNEY_STAGES` calls it "the only part of the pipeline
                 * the client drives". Labelling it *a lawyer*, as this did,
                 * contradicted the tracker it is supposed to introduce.
                 *
                 * The case is not four owners. It is a handoff that
                 * alternates, and Quote and Document have the same shape —
                 * somebody else works, then it comes back to you.
                 *
                 * It was also saying everything twice. Every sentence on the
                 * left already names its who: "**Tell us** what happened",
                 * "**A lawyer** reads it", "**they** take over", "**They**
                 * write it and **send you**". A column restating the
                 * sentence an inch to its right is the most expensive kind of
                 * copy to keep, and it was most of what made this edge feel
                 * crowded.
                 *
                 * So: one muted line, the time, which is the only thing on
                 * this row the sentence does not already say.
                 *
                 * A fixed 22px box on every row rather than only the one with
                 * a face in it, so the four times sit on one line down the
                 * edge instead of the Quote row dropping two pixels for its
                 * avatar.
                 *
                 * The width is sized for the Quote row, which is the only one
                 * carrying a face: 22px of avatar and its gap come out of the
                 * same track the time has to fit in, and at 8.5rem *Within 24
                 * hours* lost by about three pixels and broke to two lines.
                 * A two-line label in a one-line box centres itself against
                 * the other three and lines up with none of them — the single
                 * visible defect on this card. `whitespace-nowrap` makes the
                 * break impossible rather than unlikely, `text-right` keeps
                 * the ragged edge off the card's margin if a longer string
                 * ever lands here, and the extra 1rem comes out of
                 * descriptions that are a short sentence each.
                 */}
                <div className="flex h-[22px] shrink-0 items-center gap-2 sm:w-[9.5rem] sm:justify-end">
                  {face ? (
                    <LawyerFace
                      id={lawyer.id}
                      name={lawyer.name}
                      initials={lawyer.initials}
                      imageUrl={lawyer.imageUrl}
                    />
                  ) : null}
                  <span className="text-muted-foreground whitespace-nowrap text-xs leading-snug sm:text-right">
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
       * would make the card a stack of three sections instead of a list with
       * a footer.
       *
       * The sentence is Moritz's own, from the brief: *"Our agents do the
       * first pass. Our lawyers finish it."* The video plan's version was "AI
       * does 80%, a named human does 20%", which is a good framing and a
       * number nobody has measured — a percentage is the most falsifiable
       * shape a claim can take. Their words say the same thing as a division
       * of labour, which is the part that is true.
       *
       * In the serif and not the sans, because it is the card's closing line
       * rather than a fifth step, and the serif is how this flow marks an
       * aside (see the file note in `brief-column.tsx`).
       */}
      <div className="border-foreground/10 tall:mt-4 tall:pt-3.5 mt-3 border-t pt-3">
        <p className="text-foreground/75 font-serif text-sm italic leading-relaxed">
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
  );
}
