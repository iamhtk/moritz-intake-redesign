import { HomepageHero } from './homepage-hero';
import { LegalTeam } from './legal-team';
import { QuickActions } from './quick-actions';
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
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-12 pb-10 pt-8 sm:gap-14 sm:pt-10">
        <div className="flex flex-col items-center gap-6">
          <HomepageHero name={userName} />
          <QuickActions />
        </div>
        <ClientEngagementTask />
        <LegalTeam />
      </div>
    </div>
  );
}
