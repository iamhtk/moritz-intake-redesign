'use client';

import type { CSSProperties, HTMLAttributes } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@repo/ui/lib/utils';
import { TRUSTED_BY } from '@/lib/trust-indicators';
import { TESTIMONIALS, type Testimonial } from './testimonials-data';

/**
 * What clients say, as one continuous rail at the foot of the homepage.
 *
 * The section the page was missing. It has five real lawyers with real
 * credentials and no evidence that anyone was actually helped, and those are
 * different claims: a row of Harvard degrees is a claim about the firm, and
 * "got a contractor agreement in 2 hours for $500" is a claim about the person
 * reading it. Credentials cannot carry the second one.
 *
 * **A slideshow, not a carousel.** One unbroken right-to-left travel rather
 * than pages that swap: no dots, no state, nothing to operate. The track holds
 * every quote twice and the keyframe runs to `-50%`, so when it restarts the
 * second set is standing exactly where the first began and the loop has no
 * seam. Speed is set from the number of tiles rather than guessed, so adding a
 * seventh testimonial does not silently make the rail faster.
 *
 * It stops on hover and on focus (CSS, in `globals.css`), and under
 * `prefers-reduced-motion` the animation is dropped entirely and the rail
 * becomes a plain scrollable row, so the quotes past the fold stay reachable
 * instead of disappearing with the motion.
 */

/**
 * How long one tile takes to cross the rail.
 *
 * Eight seconds. The quotes run to six lines, and a testimonial that has to be
 * chased is worth less than no testimonial: the only reason this moves at all
 * is to show there is more than one. The loop is this times the number of
 * tiles, so six quotes is a 48 second cycle.
 */
const SECONDS_PER_TILE = 8;

export function Testimonials({
  className,
  style,
}: {
  className?: string;
  /** For the page's entrance animation; see `lib/entrance.ts`. */
  style?: CSSProperties;
}) {
  const t = useTranslations('dashboard.client.homepageV2.testimonials');

  return (
    <section
      className={cn(
        // Height-first, like the column it sits in: the page has to fit the
        // window, and this is the tallest section on it.
        'mz-marquee-host tall:gap-6 taller:gap-8 flex flex-col gap-4',
        className,
      )}
      style={style}
    >
      <div className="flex flex-col items-center gap-1.5">
        {/* The same eyebrow as "Your legal team" further up the page. */}
        <h2 className="text-muted-foreground text-center text-xs font-medium uppercase tracking-[0.16em]">
          {t('title')}
        </h2>
        {/*
         * The scale claim, audited from moritzlegal.com, as this section's
         * subtitle rather than as a trust bar of its own.
         *
         * It belongs to the rail: six quotes answer "has this worked for
         * anyone", and the number answers "for how many". Put at the top of the
         * page instead it would be a statistic arriving before anything had
         * earned it, and it would cost a row on a screen that has to fit the
         * window. Here it costs one line and frames what is underneath.
         */}
        <p className="text-foreground/70 text-center text-[11.5px]">
          {TRUSTED_BY.text}
        </p>
      </div>

      {/*
       * Masked at both edges, and held inside the page column.
       *
       * Not full-bleed. Every other section here lives in the same centred
       * `max-w-3xl` measure, and a rail that broke out of it inside a dashboard
       * shell with a sidebar would be the only thing on the page ignoring the
       * grid. The mask is what stops containment reading as a clipped box: the
       * tiles dissolve at the boundary instead of being cut at it, so the row
       * still reads as continuing past the frame. A gradient in `mask-image`
       * rather than two gradient overlays, because an overlay has to know what
       * colour is behind it and would be wrong the moment anything changed.
       */}
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <ul
          className="mz-animate-marquee flex w-max motion-reduce:overflow-x-auto"
          style={
            {
              '--mz-marquee-duration': `${TESTIMONIALS.length * SECONDS_PER_TILE}s`,
            } as CSSProperties
          }
        >
          {/*
           * Twice. The second set carries the loop and is hidden from
           * assistive tech, which reads the rail once and in order rather than
           * hearing all six quotes a second time.
           */}
          {[false, true].map((isDuplicate) =>
            TESTIMONIALS.map((item) => (
              <TestimonialTile
                key={`${item.id}${isDuplicate ? '-loop' : ''}`}
                testimonial={item}
                aria-hidden={isDuplicate || undefined}
              />
            )),
          )}
        </ul>
      </div>
    </section>
  );
}

/**
 * One tile.
 *
 * Deliberately not a bordered white card with the quote on top and a face
 * underneath, which is what every testimonial section looks like. Three
 * decisions carry it:
 *
 * 1. **The company comes first.** Mark and name at the top, in the page's own
 *    eyebrow treatment. The verifiable thing is the company, not the first
 *    name, so the company is the tile's headline and the person signs it at the
 *    bottom. It also gives the rail a rhythm of marks travelling past, which is
 *    a logo wall and a testimonial section in one object.
 * 2. **The quote is set in the serif.** Cormorant Garamond is the display face
 *    here and a pull quote is display copy, which is the one place body-sized
 *    serif is right rather than thin. 17px at 500: the weight notes in
 *    `globals.css` push small in-use serif to 600 for legibility, and the extra
 *    size over body copy buys that back while keeping a multi-line quote
 *    elegant rather than heavy. It was 18px until the page had to fit the
 *    window; the point below about the measure is what paid for the difference.
 * 3. **No border.** A fill and a radius, following the composer's attachment
 *    cards (`bg-muted/50`, transparent border). A train of outlined boxes
 *    sliding past reads as a strip of tickets; soft tiles read as a rail. The
 *    only hairlines on the tile are the logo frame and the short rule above the
 *    signature, both of which are doing a job.
 */
function TestimonialTile({
  testimonial,
  ...rest
}: {
  testimonial: Testimonial;
} & HTMLAttributes<HTMLLIElement>) {
  return (
    <li
      /*
       * Wide, and that is a height decision rather than a width one.
       *
       * The rail is the tallest thing on a page that has to fit the window, and
       * every tile is as tall as the longest quote in it. Hector's runs to 165
       * characters: at 20rem it wraps to six lines, at 26rem to four, which is
       * about 50px off the whole page for free. Past roughly 28rem the measure
       * starts reading as a paragraph rather than a quote, so this is the wide
       * end of what the type can carry rather than as wide as possible.
       */
      className="bg-muted/40 tall:gap-4 tall:p-5 mx-2 flex w-[23rem] shrink-0 flex-col gap-3 rounded-2xl p-4 sm:w-[26rem]"
      {...rest}
    >
      <div className="flex items-center gap-3">
        {/*
         * One frame for six very different marks. Two of these logos carry
         * their own coloured background, one is an orange silhouette and two
         * are line art on white; dropped in raw they read as a sticker sheet.
         * An identical rounded frame with a hairline and `object-contain`
         * normalises the shapes and lets the colour stay, which is the half
         * that does the convincing. Greyscaling somebody's logo would tidy the
         * palette by misrepresenting their brand.
         */}
        <span className="border-field bg-background flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
          {testimonial.logo ? (
            <img
              src={testimonial.logo}
              alt=""
              className="size-full object-contain p-1"
            />
          ) : (
            /*
             * Crafted publish no mark; see `testimonials-data.ts`. Their
             * initial in the serif, so the gap reads as a considered lockup
             * rather than a missing image.
             */
            <span className="text-foreground font-serif text-base font-semibold leading-none">
              {testimonial.company.slice(0, 1)}
            </span>
          )}
        </span>
        <span className="text-muted-foreground truncate text-[11px] font-medium uppercase tracking-[0.14em]">
          {testimonial.company}
        </span>
      </div>

      <p className="text-foreground tall:text-[17px] font-serif text-[16px] font-medium leading-snug tracking-[-0.01em]">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      <div className="mt-auto flex flex-col gap-2">
        {/* A short rule, not a full divider: it signs the quote off rather than
            cutting the tile in two. */}
        <span aria-hidden="true" className="bg-foreground/15 h-px w-8" />
        <p className="text-muted-foreground text-xs">
          {testimonial.name} &middot; {testimonial.role}
        </p>
      </div>
    </li>
  );
}
