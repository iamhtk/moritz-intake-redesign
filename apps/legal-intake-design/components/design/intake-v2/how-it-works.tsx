'use client';

import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@repo/ui/lib/utils';
import { TrustStrip } from '@/components/shared/trust-strip';

/**
 * The three steps on the opening screen, in three treatments (temporary).
 *
 * The block this replaces was deliberately quiet: an eyebrow and three muted
 * one-liners with a mono numeral, argued for on the grounds that it is
 * reference material rather than a pitch (see `brief-outline.tsx`). Read on the
 * page it is the flattest thing on a screen whose whole job is to make a law
 * firm feel worth talking to, and it is also the only block answering the
 * question the client actually has, which is what happens after they press
 * send. Quiet was the wrong call for the one paragraph that earns the click.
 *
 * All three of these ship at once, stacked and labelled, so the choice can be
 * made by looking at them rather than by reading a description of them. Two of
 * them come out again.
 *
 * What they share, and what is not up for choice:
 *
 * - **A scannable title per step.** Nobody reads three sentences before typing.
 *   "Your words / Your brief / Your quote" is the arc of the flow in three
 *   words, it is parallel, and it does not restate the sentence underneath it
 *   the way "Say it / Check it / Get a price" would.
 * - **The existing sentences, untouched.** The ask was the treatment.
 * - **No new colour.** The one fill used is `bg-mz-gradient-gold`, which is the
 *   brand's client path (see `onboarding-brand-panel.tsx`: grey is neutral,
 *   gold is client, sky is lawyer). This screen is the client path, so the
 *   panel is the brand answering a brand question rather than a tint picked to
 *   make a box stand out.
 * - **Serif for the numerals and titles.** The only other serif on this screen
 *   is the `h1`, which is where the premium of this page already lives.
 */

const STEPS = [
  { key: 'one', numeral: '01' },
  { key: 'two', numeral: '02' },
  { key: 'three', numeral: '03' },
] as const;

/**
 * The label above each block.
 *
 * Same type treatment as `SectionEyebrow` in `lawyer-showcase.tsx` (11px,
 * medium, uppercase, `tracking-[0.14em]`) so the two read as one system. Not
 * imported from it because that one is centred and two of these three are not,
 * and it takes no `className`.
 */
function Eyebrow({ className }: { className?: string }) {
  const t = useTranslations('intake');

  return (
    <span
      className={cn(
        'text-muted-foreground block text-[11px] font-medium uppercase tracking-[0.14em]',
        className,
      )}
    >
      {t('howItWorks.title')}
    </span>
  );
}

/** Staggered entrance, so the three steps arrive as a sequence. */
function stepDelay(index: number) {
  return { animationDelay: `${index * 70}ms` };
}

/**
 * A: a gold panel, three across.
 *
 * The heaviest of the three, and the one that answers the brief most directly:
 * the composer and the drop zone above it are both bordered surfaces, so a
 * third surface here finishes a rhythm the page already has instead of
 * introducing one. Numerals sit in hairline rings joined by a rule that bleeds
 * through the grid gutter, which is what makes three columns read as one
 * sequence rather than three facts.
 */
export function HowItWorksPanel({ className }: { className?: string }) {
  const t = useTranslations('intake');

  return (
    <section
      className={cn(
        'bg-mz-gradient-gold border-border/70 rounded-2xl border px-6 py-6 sm:px-8 sm:py-7',
        className,
      )}
    >
      <Eyebrow />
      <ol className="mt-5 grid gap-6 sm:grid-cols-3 sm:gap-8">
        {STEPS.map((step, index) => (
          <li
            key={step.key}
            className="mz-animate-step"
            style={stepDelay(index)}
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="border-foreground/20 bg-background/70 text-foreground flex size-7 shrink-0 items-center justify-center rounded-full border font-serif text-[13px] leading-none"
              >
                {index + 1}
              </span>
              {/*
               * The rule to the next numeral. `-mr-8` is the grid's own gutter,
               * so the line crosses it and lands on the next ring rather than
               * stopping short and reading as a stray dash.
               */}
              {index < STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="bg-foreground/15 hidden h-px flex-1 sm:-mr-8 sm:block"
                />
              ) : null}
            </div>
            <p className="text-foreground mt-3.5 font-serif text-[15px] leading-none">
              {t(`howItWorks.${step.key}Title`)}
            </p>
            <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
              {t(`howItWorks.${step.key}`)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * B: an editorial list, no surface.
 *
 * Keeps the vertical reading order of the block it replaces and buys its
 * presence from type instead of chrome: the numeral is set large in the serif
 * and held back to a fifth of the foreground, so it reads as a folio rather
 * than as a bullet. Hairlines between the rows and nothing else. The quietest
 * way to be more than it was.
 */
export function HowItWorksEditorial({ className }: { className?: string }) {
  const t = useTranslations('intake');

  return (
    <section className={className}>
      <Eyebrow />
      <ol className="divide-border/70 border-border/70 mt-4 divide-y border-y">
        {STEPS.map((step, index) => (
          <li
            key={step.key}
            className="mz-animate-step flex items-baseline gap-5 py-4"
            style={stepDelay(index)}
          >
            <span
              aria-hidden="true"
              className="text-foreground/20 w-9 shrink-0 font-serif text-2xl tabular-nums leading-none"
            >
              {step.numeral}
            </span>
            <div className="min-w-0">
              <p className="text-foreground text-[13.5px] font-medium">
                {t(`howItWorks.${step.key}Title`)}
              </p>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                {t(`howItWorks.${step.key}`)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * C: a connected stepper, centred.
 *
 * The only one of the three that says the process has an end: two filled nodes
 * and a hollow one, on a single continuous hairline. It is the same grammar as
 * the five-step progress list on the case page
 * (`client-case-timeline.tsx`), turned on its side, so a client who submits
 * meets a shape they have already read. Centred under the serif heading, and
 * with no surface of its own.
 */
export function HowItWorksStepper({ className }: { className?: string }) {
  const t = useTranslations('intake');

  return (
    <section className={cn('flex flex-col items-center', className)}>
      <Eyebrow />
      <ol className="mt-5 grid w-full gap-6 sm:grid-cols-3 sm:gap-8">
        {STEPS.map((step, index) => {
          const isLast = index === STEPS.length - 1;

          return (
            <li
              key={step.key}
              className="mz-animate-step flex flex-col items-center text-center"
              style={stepDelay(index)}
            >
              {/*
               * Half a rule each side of the node, each bleeding half the
               * gutter (`-ml-4`/`-mr-4` against `gap-8`), so the three cells
               * draw one unbroken line. Suppressed at the ends, and on a phone
               * where the grid is a single column and a horizontal rule would
               * connect nothing.
               */}
              <div className="relative flex h-3 w-full items-center justify-center">
                {index > 0 ? (
                  <span
                    aria-hidden="true"
                    className="bg-foreground/15 absolute left-0 top-1/2 hidden h-px w-1/2 -translate-y-1/2 sm:-ml-4 sm:block"
                  />
                ) : null}
                {!isLast ? (
                  <span
                    aria-hidden="true"
                    className="bg-foreground/15 absolute right-0 top-1/2 hidden h-px w-1/2 -translate-y-1/2 sm:-mr-4 sm:block"
                  />
                ) : null}
                {/*
                 * Hollow for the last one. The quote is the thing that has not
                 * happened yet, and an open node is how every stepper in the
                 * product says so.
                 */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'relative rounded-full',
                    isLast
                      ? 'border-foreground/40 bg-background size-3 border'
                      : 'bg-foreground/70 size-2.5',
                  )}
                />
              </div>
              <p className="text-foreground mt-3 font-serif text-[15px] leading-none">
                {t(`howItWorks.${step.key}Title`)}
              </p>
              <p className="text-muted-foreground mt-1.5 max-w-[16rem] text-xs leading-relaxed">
                {t(`howItWorks.${step.key}`)}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * E: the editorial list, on the gold panel.
 *
 * B's typography inside A's surface, and worth trying for one reason that is
 * not a compromise: the brand gradient runs `180deg`, white to `#fbf6ed` to
 * `#f1f0dd`, and an editorial list runs top to bottom too. So the wash deepens
 * along the reading direction and the heaviest tint lands on the last step,
 * which is the fixed quote. That is the only part of this block a client
 * actually cares about, and the gradient puts the weight there for free.
 *
 * Three things are deliberately not B's:
 *
 * 1. **The rules and the border are foreground alpha, not the `border` token.**
 *    A token hairline sits on a changing background value here: near white at
 *    the top of the panel, warm beige at the bottom. Held at a fixed alpha over
 *    the foreground, every rule carries the same weight down the block instead
 *    of the top ones reading stronger than the bottom ones.
 * 2. **The numerals are warm ink, not grey at 20%.** `text-foreground/20` is a
 *    cool grey, and cool grey over warm beige is the pairing that reads dirty
 *    rather than delicate. Mixing the foreground toward the panel's own gold
 *    puts the folio *in* the wash instead of on top of it. The 30% is the knob:
 *    lower is more delicate, higher holds up better against the deep end.
 *    Derived from brand tokens through `color-mix`, which this codebase already
 *    uses for exactly this kind of blend (see `button.tsx`), so it is not an
 *    off-palette colour invented for one block.
 * 3. **No `border-y` on the list.** B needed it because it had no container;
 *    here the panel's own edge is the boundary, and keeping both would draw two
 *    lines where the design has one.
 *
 * **The type, set the way this platform sets it.** The serif is Cormorant
 * Garamond, and `globals.css` does not treat it as a face you can drop in at
 * any size: it records that with the grayscale antialiasing here the serif
 * "reads too thin, especially at the small UI sizes these headings are actually
 * used at", and so pushes the small in-use steps to 600 while leaving the large
 * display steps at 500 for elegance. Both halves of that rule are applied.
 *
 * - **Titles: serif, 16px, 600.** They cannot simply take `font-serif` at the
 *   13.5px the sans version used. The same file rebalances its own serif and
 *   sans peers at 30px to 26px and 20px to 17px, which puts the serif about
 *   1.15x the nominal size of a sans that matches it optically: Cormorant has a
 *   much smaller x-height than Inter, so equal numbers do not read as equal
 *   text. 16px at 600 is the peer of 13.5px at 500. `tracking-tight` follows
 *   every other serif on this screen, including the `h1` above it.
 * - **Numerals: 500, not 600.** A folio held back in colour is a display
 *   element, not a label, and the same rule keeps display steps lighter. At 600
 *   the figures stop being a watermark and start competing with the titles.
 * - **Sentences: still sans.** This is the part of "according to the platform"
 *   that is a restriction rather than a licence. Every serif in the repo is a
 *   heading, a display number, or one 13px italic aside; nothing sets body copy
 *   in it. Two lines of 12px Cormorant is exactly the thin, patchy small text
 *   the rule above exists to prevent, and the editorial pairing this block
 *   wants is a serif title over a sans sentence anyway.
 *
 * The open question is mass rather than detail. Three stacked rows make a tall
 * panel, and a tall tint is a much bigger colour commitment than a short wide
 * one: this stops being an accent and becomes a section. The serif titles push
 * that slightly further, because 16px over 12px is a taller row than 13.5px
 * over 12px was. Worth looking at next to the composer to see whether it
 * competes with it.
 */
export function HowItWorksGoldEditorial({
  className,
  style,
}: {
  className?: string;
  /**
   * For the caller's entrance animation.
   *
   * The rows used to animate in one at a time. That was a nice detail on its
   * own and it compounds badly inside an animating parent, so the whole screen
   * now takes one cascade and this panel is a single block in it. See
   * `ENTRANCE_STAGGER_MS` in `intake-v2.tsx`.
   */
  style?: CSSProperties;
}) {
  const t = useTranslations('intake');

  return (
    <section
      className={cn(
        'bg-mz-gradient-gold border-foreground/10 tall:px-6 tall:py-5 taller:px-8 taller:py-7 rounded-2xl border px-5 py-4',
        className,
      )}
      style={style}
    >
      <Eyebrow />
      {/*
       * The list lies down until there is room to stand it up.
       *
       * This screen has to fit the window, and a stacked list is about 140px
       * taller than the same three steps across a row: three lines of text
       * each, plus a row of padding each, against one block of two lines. The
       * vertical arrangement is the better read and it is what was chosen, so
       * it is what appears the moment the window can afford it, and the
       * horizontal one carries every screen that cannot.
       *
       * `tallest` rather than `taller`, because `taller` is already spending
       * its extra height on padding; standing this up needs its own headroom.
       * The rules only exist in the stacked arrangement: `divide-y` sets a top
       * border on every item after the first, which across three grid columns
       * would draw two short lines above the second and third steps rather
       * than anything meaningful.
       */}
      <ol className="tallest:divide-foreground/10 tallest:mt-4 tallest:block tallest:divide-y mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3">
        {STEPS.map((step) => (
          <li
            key={step.key}
            className="tallest:gap-5 tallest:py-3.5 tallest:first:pt-0 tallest:last:pb-0 flex items-baseline gap-4"
          >
            <span
              aria-hidden="true"
              className="tallest:w-9 tallest:text-2xl w-7 shrink-0 font-serif text-xl font-medium tabular-nums leading-none [color:color-mix(in_oklab,var(--foreground)_30%,var(--mz-gold))]"
            >
              {step.numeral}
            </span>
            <div className="min-w-0">
              <p className="text-foreground tallest:text-base font-serif text-[15px] font-semibold leading-tight tracking-tight">
                {t(`howItWorks.${step.key}Title`)}
              </p>
              <p className="text-muted-foreground tall:mt-1.5 mt-1 text-xs leading-relaxed">
                {t(`howItWorks.${step.key}`)}
              </p>
            </div>
          </li>
        ))}
      </ol>
      {/*
       * Who does which part of this, said once (V34).
       *
       * The video plan's version is "AI does 80%, a named human does 20%",
       * which is a good framing and a number we cannot stand behind — nobody
       * has measured it, and a percentage is the most falsifiable shape a claim
       * can take. This says the same thing as a division of labour instead,
       * which is the part that is actually true and the part the client cares
       * about: the machine writes things down, a person decides what they mean.
       *
       * Here rather than on the lawyer note below, because this is the only
       * block on the screen where both halves are already visible — steps one
       * and two are Moritz, step three is a lawyer. It reads as a caption on
       * the list it captions rather than as a new claim.
       *
       * Under the rule and in the muted size, because it is a summary of the
       * three steps above and not a fourth one.
       */}
      {/*
       * The terms under which the three steps happen: who does the work, and
       * what protects it while they do.
       *
       * Both under one rule rather than two, because they answer the same
       * question — a client who has read the steps and is deciding whether to
       * paste a dispute is asking "and then what" about the process, not about
       * two separate topics. A second hairline would make the panel a stack of
       * three sections instead of a list with a footer.
       */}
      <div className="border-foreground/10 tall:mt-3.5 tall:pt-3.5 mt-3 border-t pt-3">
        <p className="text-muted-foreground text-xs leading-relaxed">
          {t('howItWorks.division')}
        </p>
        {/*
         * The credentials, last.
         *
         * They were a loose row directly under the composer, which had the
         * better adjacency — that is the moment a contract is being handed over
         * — and no home: a four-item strip floating on white between the
         * composer and the suggestion chips, one more thing on a screen whose
         * problem is how many things are on it. Inside the panel they are the
         * closing line of the only block that explains the process, which is
         * the other honest place for them, and the move is close to free in
         * height because the row above the composer goes away with it. See
         * `trust-strip.tsx` for why the treatment changes with the surface.
         *
         * Tight against the line above rather than spaced off it. They were a
         * row of pills with a row's worth of margin, which made the footer read
         * as two blocks; as a second line of the same small type they are part
         * of the same paragraph, and the spacing has to say so.
         */}
        <TrustStrip surface="gold" className="tall:mt-2 mt-1.5" />
      </div>
    </section>
  );
}
