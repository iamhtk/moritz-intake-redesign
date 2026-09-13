'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@repo/ui/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/design/foundations/components/avatar';
import { AVATAR_FRAMING } from '@/components/design/homepage-v2/legal-team';
import {
  INTAKE_NOTE_ROSTER,
  leadForMatter,
  practiceCopyKeyForMatter,
  type OnboardingLawyer,
} from '@/components/design/new-case/lawyers';
import type { MatterId } from '@/components/design/new-case/intake-types';
import { schoolOf } from '@/lib/intake/credentials';
import { TalkToAPerson } from './talk-to-a-person';

/**
 * One real person, on screen while the client is still typing (Decision 21).
 *
 * Garzai's words were that the human figures already in the flow are "the
 * direction to push further rather than abandon", and the only place they
 * appear today is after submission. By then the client has already decided
 * whether this felt like a form or like a firm.
 *
 * So: one face, one name, one sentence, from the same 15 real headshots the
 * onboarding panel and the confirmation use. The lead is chosen by matter type,
 * so a contract review shows the commercial counsel rather than a random
 * lawyer, which is the difference between a relevant person and a stock photo.
 *
 * **What it must not say (B, Decision 21).** Not "your lawyer", not "Amara will
 * handle this", not a shortlist about to be picked from. The real order is
 * quote, then payment, then assignment, and a face under the words "your
 * lawyer" would have the client waiting for a person and receiving an invoice,
 * which is the original complaint rebuilt in a nicer typeface. It names what
 * this person actually does next: reads the brief and prices the work.
 *
 * Deliberately not the rotating three-up `LawyerShowcase`. That belongs on the
 * confirmation, where the case is done and there is room to look around. Beside
 * a composer, three faces cross-fading is a carousel competing with the thing
 * the client is trying to write.
 *
 * **One face at a time, and it rotates until the matter is known.**
 *
 * Until the client says what this is, `leadForMatter` has nothing to go on and
 * returns the default lead, so every screen from the opening one onwards showed
 * the same person: the founding COO, on every intake, for as long as it took to
 * name a matter type. Eleven real lawyers and the flow only ever proved one of
 * them existed.
 *
 * So while the matter is unknown the note rotates the whole roster, one person
 * at a time. Never two, and this is not the showcase in a smaller box: the
 * point of the note is a single human being looked at, and a row of faces is a
 * logo wall made of people.
 *
 * The rotation is honest because the copy was already written for it: the note
 * says "a lawyer **like** {firstName} reads your brief", not that this person
 * will. What cannot survive rotation is the practice sentence, which ends "like
 * this one" and is keyed to the matter, so while rotating each lawyer gets
 * their own tagline instead and claims nothing about a matter nobody has stated.
 *
 * And then it stops. The moment the brief knows what kind of matter this is,
 * the rotation locks onto the person who actually leads it and the sentence
 * becomes the matter-specific one again. That transition is the feature: the
 * screen goes from "these are the people here" to "this is the one who reads
 * yours", which is exactly what the client has just learned.
 */

/**
 * Six seconds, slower than the homepage's five.
 *
 * That row is ambient social proof beside nothing in particular; this sits next
 * to a composer with a cursor in it. A face changing in peripheral vision is a
 * thing the eye chases, so the cadence has to be slow enough to read as
 * presence rather than as movement.
 */
const ROTATE_MS = 6000;
export function IntakeLawyerNote({
  matterId,
  askable = false,
  className,
  style,
}: {
  /**
   * The matter as resolved from the brief's own `matter-type` field, or
   * `undefined` before the client has said what this is.
   *
   * Deliberately NOT `brief.matterId`, which is pinned to `contract` for the
   * life of every brief and is why this face never used to change. Callers pass
   * `matterOf(brief)`; see `lib/intake/matter-of.ts`.
   */
  matterId: MatterId | undefined;
  /**
   * Show the *Ask {firstName} something* control under the note (G6).
   *
   * A flag rather than the old `onAsk` callback. The control used to own a
   * dialog and hand the message back for the caller to write into the
   * transcript; it now navigates to `/client/talk`, so there is nothing to hand
   * anywhere and nothing for a caller to implement.
   *
   * Still opt-in, for the reason the callback was optional: this note is also
   * used on surfaces where offering the exit is not appropriate, and a control
   * nobody asked for is worse than none.
   */
  askable?: boolean;
  className?: string;
  /**
   * For the caller's entrance animation, which is the page's not this
   * component's. The `reveal` on the inner block below is a different event: it
   * fires on every rotation, where this fires once on load.
   */
  style?: CSSProperties;
}) {
  const t = useTranslations('intake.human');

  /*
   * Rotating is the unsettled state, so it is keyed on the one fact that
   * settles it. `undefined` here means the brief has no `matter-type` value,
   * which is the same condition that makes `leadForMatter` fall back to the
   * default, so the two can never disagree about whether a lead is real.
   */
  const isSettled = matterId !== undefined;
  const rotating = useRotatingLawyer(!isSettled);
  const lawyer = isSettled ? leadForMatter(matterId) : rotating;

  if (!lawyer) return null;
  const firstName = lawyer.name.split(' ')[0] ?? lawyer.name;

  return (
    <div className={className} style={style}>
      {/*
       * Keyed on the person, so the block re-enters on every change.
       *
       * A cross-fade in a shared grid area is what the other rotations in this
       * app use, and it is the wrong tool for one item: it would mount eleven
       * copies of this text and hold the block at the tallest of them, leaving
       * a ragged gap under the shorter taglines. One element that restarts its
       * own entrance is lighter and tighter.
       *
       * `reveal` rather than `step`, which is the flow's usual entrance: step
       * lifts 8px, and on something that re-enters every six seconds beside a
       * composer that lift reads as a twitch. Reveal is opacity and a hair of
       * scale over 700ms, which is a face arriving rather than a thing moving.
       */}
      <div key={lawyer.id} className="mz-animate-reveal flex items-start gap-3">
        {/*
         * A monogram, not a missing photograph.
         *
         * The employment lead has no headshot on purpose (see `lawyers.ts`:
         * every image in the folder is already cast, and five of them are
         * clients, one of them the signed-in client's own face). But "no
         * photograph" and "a grey circle where everyone else has a face" are
         * different things, and the default fallback reads as the second: muted
         * text on muted fill, next to colleagues who are photographed, at the
         * moment the flow is trying to prove a real firm is behind it.
         *
         * So the photo-less case gets its own treatment rather than a
         * degradation of the photographed one. Full-strength foreground on the
         * brand tint with a solid ring, which is the same weight a headshot
         * carries, so it reads as a chosen mark. The photographed case keeps the
         * hairline border it had, because a photograph does not need help.
         *
         * The initials are `font-medium`, not semibold. They were 600, and this
         * is sans: the 600 step in this flow exists for Cormorant, which
         * `globals.css` records as reading too thin at small UI sizes under the
         * grayscale antialiasing here. Inter has no such problem, so a sans 600
         * was the production weight scale (400 and 500 only) broken for no
         * reason — and it is the tracked uppercase, not the weight, that gives
         * a monogram its presence.
         */}
        {/*
         * `overflow-hidden` is doing real work, not tidying.
         *
         * The foundation `Avatar` root deliberately does not clip: its comment
         * explains that the shape lives on the image and the fallback so a
         * corner `AvatarBadge` can sit proud of the edge. But `AVATAR_FRAMING`
         * crops these headshots with a `scale`, and an unclipped root lets that
         * scale paint outside the circle. Eric's frame is `scale-[2.2]`, the
         * most aggressive in the map, so his photograph spilled to roughly
         * twice the avatar and covered the name beside it. Everyone else is at
         * 1.3 or below, which is why only one face looked broken. The two other
         * places that use this map clip for the same reason.
         */}
        <Avatar
          className={cn(
            'size-10 shrink-0 overflow-hidden',
            lawyer.imageUrl
              ? 'border-border/60 border'
              : 'ring-primary/20 ring-1',
          )}
        >
          {/*
           * Rendered even for the lead with no headshot, and that is the fix
           * for a monogram that came and went.
           *
           * This used to be conditional, on the reasoning that pointing
           * `AvatarImage` at an empty string means a wasted request. It does
           * not — the primitive resolves an empty `src` to `error` without
           * asking for anything — and leaving it out cost the fallback instead:
           * the lead follows the matter type, so the avatar had usually shown a
           * photographed colleague first, and Radix's root keeps its
           * `loaded` status when the image child disappears. `AvatarFallback`
           * renders nothing while the root thinks an image is up, so an
           * employment matter got a blank circle where her initials belong.
           */}
          <AvatarImage
            src={lawyer.imageUrl}
            alt={lawyer.name}
            className={AVATAR_FRAMING[lawyer.id] ?? 'object-cover'}
          />
          <AvatarFallback className="bg-primary/10 text-foreground text-xs font-medium tracking-wide">
            {lawyer.initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          {/*
           * One line: the name set as display type, the practice beside it.
           *
           * The name carries the block, so it takes the serif at a size that
           * can actually hold it. 19px at 600 sits in the band the weight notes
           * in `globals.css` describe, where the display face needs the heavier
           * step to survive the grayscale antialiasing here.
           *
           * The practice sits beside rather than under, and drops the tracked
           * uppercase it had. Uppercase with letterspacing reads considerably
           * larger than its pixel size, which is why a 10px label was
           * competing with a 15px name; in sentence case at 11px next to 19px
           * of serif the hierarchy is unambiguous. Putting them on one line
           * also buys back about 16px of page height, which this screen needs.
           *
           * No `t()`. Both strings are the roster's own `name` and `title`, and
           * a comma was all the copy key ever added, so the join went into the
           * layout instead.
           */}
          <div className="flex flex-wrap items-baseline gap-x-2">
            <p className="text-foreground font-serif text-[19px] font-semibold leading-tight tracking-tight">
              {lawyer.name}
            </p>
            <span aria-hidden="true" className="text-foreground/25 text-xs">
              &middot;
            </span>
            <span className="text-muted-foreground text-[11px] leading-snug">
              {lawyer.title}
            </span>
            {/*
             * The credential, beside the name (V8, adapted — see
             * `lib/intake/credentials.ts`).
             *
             * The plan asked for years of experience here: "Senior Counsel
             * · 11 yrs exp.", three words that buy instant credibility. We do
             * not have that number for any of these eleven people, and they are
             * real people with real headshots, so inventing one would be a
             * worse thing to ship than the invented price this flow already
             * cut. The roster does hold where each of them trained, on all
             * eleven, already shown in the onboarding panel and on the homepage
             * team row. Same kind of claim, same three words, and true.
             *
             * Middle dots between all three items rather than only the first,
             * so the row reads as one spec line. `aria-hidden` on both: they are
             * punctuation, and a screen reader announcing "middle dot" between
             * a name and a job title is noise.
             */}
            <span aria-hidden="true" className="text-foreground/25 text-xs">
              &middot;
            </span>
            <span className="text-muted-foreground text-[11px] leading-snug">
              {schoolOf(lawyer.education)}
            </span>
          </div>
          {/*
           * What they actually do, and its connection to this matter (item 13).
           *
           * Keyed off the matter type rather than the practice area. The two
           * differ wherever several matters share one lawyer, and the sentence
           * ends "like this one", so area-keying had it claim a sub-type it had
           * no way of knowing: a tender response was told the lead mostly
           * handles franchise terms "like this one". `practiceCopyKeyForMatter`
           * is kept next to `areaForMatter` in `lawyers.ts` so the sentence
           * cannot drift into claiming a speciality this face does not have.
           */}
          {/*
           * Italic, and in the serif, which is this flow's existing treatment
           * for an aside: `brief-column.tsx` sets its file note the same way.
           * A line about what somebody does is not an instruction and not a
           * label, and the italic is what says so without adding a word.
           */}
          <p className="text-foreground/75 mt-2 font-serif text-[13px] italic leading-relaxed">
            {isSettled
              ? t(`practice.${practiceCopyKeyForMatter(matterId)}`, {
                  firstName,
                })
              : /*
                 * Their own tagline while the matter is unknown, not the
                 * `general` sentence. That one reads "{firstName} has run legal
                 * teams in house and reads the matters that do not fit a box",
                 * which is true of the default lead and is a fabricated
                 * biography for the other ten. A tagline is what this person
                 * actually is, and it claims nothing about a matter nobody has
                 * described yet.
                 */
                lawyer.tagline}
          </p>
          {/*
           * And the honesty rule, unchanged (B, Decision 21). A lawyer is not
           * what happens next, the quote is.
           */}
          {/*
           * Faintest and smallest of the four, which is the hierarchy the
           * block needs: who this is, what they do, and only then the
           * qualification. It is the one line here that exists to manage an
           * expectation rather than to introduce a person.
           */}
          <p className="text-muted-foreground mt-1.5 text-[11.5px] leading-relaxed">
            {t('note', { firstName })}
          </p>
          {/*
           * And a way to actually reach them (G6).
           *
           * T21 put a real face on the screen while the client is still typing,
           * which was the right move and left the obvious question unanswered:
           * the face was a card. A named human being on screen who cannot be
           * spoken to is a stock photo with a biography attached, and it is
           * worse than no face at all once the client works that out.
           *
           * The same dialog the composer's escape hatch opens, deliberately —
           * one implementation of what happens to the message. Only the label
           * differs: here it names them, because a client reading this block is
           * asking whether *this person* is reachable rather than whether
           * anybody is.
           *
           * Rendered only when the caller opts in with `askable`. The note is
           * also used on surfaces where the exit does not belong.
           */}
          {askable ? (
            <TalkToAPerson matterId={matterId} named className="mt-2" />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Which lawyer to show, cycling while `active`.
 *
 * Freezes on the first of the roster when rotation is off, which covers both a
 * reduced-motion client and the settled state: `active` goes false the moment
 * the matter is known, and the caller then ignores this and reads the real lead
 * instead. Returning the first rather than holding the last index is
 * deliberate, so a client who prefers no motion always sees the same curated
 * opening face rather than whichever one happened to be up.
 *
 * The interval is cleared and rebuilt when `active` changes, which is the whole
 * lifecycle: there is no pause, no resume and nothing to operate. It stops for
 * good once the brief knows what the matter is.
 */
function useRotatingLawyer(active: boolean): OnboardingLawyer | null {
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const rotating = active && !reducedMotion && INTAKE_NOTE_ROSTER.length > 1;

  useEffect(() => {
    if (!rotating) {
      setIndex(0);
      return;
    }
    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % INTAKE_NOTE_ROSTER.length);
    }, ROTATE_MS);
    return () => window.clearInterval(interval);
  }, [rotating]);

  return INTAKE_NOTE_ROSTER[index] ?? null;
}
