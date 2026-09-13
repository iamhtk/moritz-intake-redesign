import { cn } from '@repo/ui/lib/utils';
import { ENTRANCE_CLASS, entrance } from '@/lib/entrance';
import { HomepageHero } from './homepage-hero';
import { LegalTeam } from './legal-team';
import { QuickActions } from './quick-actions';
import { Testimonials } from './testimonials';
import { ClientEngagementTask } from '@/components/design/engagement-letter/client-engagement-task';

type HomepageV2Props = {
  userName: string;
};

export function HomepageV2({ userName }: HomepageV2Props) {
  return (
    // Own the vertical scroll in a full-bleed container: the negative margins
    // cancel the surrounding `main`'s horizontal padding (re-added as `px-*`) so
    // the scrollbar sits flush at the far right (the card edge) rather than
    // tucked inside the content gutter, while the inner column stays centered.
    <div className="-mx-4 h-full overflow-y-auto px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {/*
       * The whole page is meant to fit the window, so the vertical rhythm is
       * written against the viewport's *height* rather than its width.
       *
       * Height-first, in the way the rest of the app is width-first: the base
       * values are the ones that have to survive a short laptop, and the
       * generous spacing is bought back with `tall:`/`taller:` height variants once there is
       * room for it. Writing it the other way round is how a page ends up
       * fitting on the designer's monitor and scrolling on a 13in MacBook.
       *
       * `min-h-full` gives the column at least the window's height so it has
       * leftover space to hand to the rail below. Critically it is a *minimum*,
       * not a height: it adds nothing when the content is already taller, so it
       * cannot itself be the reason the page scrolls.
       */}
      <div className="tall:gap-10 tall:pb-8 tall:pt-8 taller:gap-14 taller:pb-10 taller:pt-10 mx-auto flex min-h-full w-full max-w-3xl flex-col gap-7 pb-6 pt-6 sm:gap-8">
        {/*
         * One entrance for the whole page, cascading top to bottom.
         *
         * Defined in `lib/entrance.ts` and shared with the intake, so the two
         * screens a client moves between arrive the same way. Nothing inside
         * these blocks animates on load: the rotations in the lawyer row and
         * the travel on the testimonial rail are continuous behaviours rather
         * than entrances, and they run underneath their block's delay.
         *
         * The greeting and the quick actions are one block, not two. They are a
         * single lockup with their own `items-center gap-6`, and splitting them
         * across two beats of the cascade would pull them apart at exactly the
         * moment the page is trying to look composed.
         */}
        <div
          className={cn('flex flex-col items-center gap-6', ENTRANCE_CLASS)}
          style={entrance(0)}
        >
          <HomepageHero name={userName} />
          <QuickActions />
        </div>
        {/*
         * Index 1 whether or not it renders. This returns `null` unless the
         * engagement letter is enabled and pending, and numbering the blocks by
         * position rather than by visibility means the rest of the cascade does
         * not reshuffle when it is absent. The cost is one unused 70ms beat on
         * the common path, which reads as a slightly longer first gap rather
         * than as anything wrong.
         */}
        <ClientEngagementTask className={ENTRANCE_CLASS} style={entrance(1)} />
        <LegalTeam className={ENTRANCE_CLASS} style={entrance(2)} />
        {/*
         * Last, and deliberately a long way down.
         *
         * "Start a case" is the end of the page's argument, and social proof
         * crowding it competes with the button rather than supporting it. So
         * the rail is something a client meets after the call to action, not
         * beside it.
         *
         * `mt-auto` and nothing else, and the "nothing else" is the point.
         * It takes whatever height the column has left over and puts all of it
         * here, so the gap is as large as the window can afford and exactly
         * zero when it cannot afford any. An earlier version added a fixed
         * `pt-40` on top as a floor, which reads well on a big display and is
         * precisely how the page started scrolling on a laptop: a fixed floor
         * is height the layout has to find whether or not it has it.
         *
         * So the air here is the reward for a tall window rather than a cost
         * charged to every one. On a short screen the sections simply sit at
         * the column's own gap, which the height queries above have already
         * tightened.
         */}
        <Testimonials
          className={cn('mt-auto', ENTRANCE_CLASS)}
          style={entrance(3)}
        />
      </div>
    </div>
  );
}
