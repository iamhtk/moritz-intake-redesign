'use client';

import { useTranslations } from 'next-intl';
import { UserRound } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { useNavigationGuard } from '@/components/navigation/navigation-guard-context';
import { useRouter } from '@/i18n/navigation';
import { leadForMatter } from '@/components/design/new-case/lawyers';
import type { MatterId } from '@/components/design/new-case/intake-types';

/**
 * The way out of the conversation, always on screen (V22, G6).
 *
 * Every product like this is built on the assumption that the client wants to
 * keep talking to it. Some of them do not: they have a question the flow is not
 * asking, or the matter is stranger than the brief has room for, or they simply
 * want a human being. Without a named way out, the only options are to abandon
 * the tab or to keep answering questions in the hope that a person appears at
 * the end, and the first of those is the one people actually take.
 *
 * So there is one control, in one place, in every phase. **One** is the whole
 * design: L20's finding is that a row of mode toggles hands a decision to
 * somebody with no basis for making it, and Alex should not be choosing between
 * "fast mode" and "careful mode" on their own employment dispute. This is not a
 * mode, it is an exit, and an exit is the one control that is allowed to be
 * permanent.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IT OPENS A SCREEN NOW, NOT A DIALOG.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This used to be a `Dialog` holding a textarea, one lawyer resolved from the
 * matter, and a send button that appended to the intake transcript. Three
 * things were wrong with that and they compounded:
 *
 * - **It sent the client back to the same chat.** The dialog closed and the
 *   conversation they had just opted out of was still there, with their
 *   message in it as one more bubble. The exit did not go anywhere.
 * - **The right-hand brief column stayed up.** Nothing on the exit fills in a
 *   brief, so half the screen was a panel about work the client had just
 *   stopped doing.
 * - **There was no choice of person.** One face, picked by the router, with the
 *   copy hedged to "a lawyer like {firstName}" because the client had not
 *   chosen them. A face you cannot pick is a photograph, which is the opposite
 *   of G6.
 *
 * So the control navigates to `/client/talk`, which is one centred column, a
 * roster with faces, and a record of what was sent. See `talk-screen.tsx`.
 *
 * **Through the navigation guard, not `router.push`.** An intake in progress is
 * registered dirty, and the guard is what turns leaving into a question rather
 * than a loss. The draft is saved to `localStorage` either way, so the honest
 * answer to the prompt is "yes, go" — but the client gets to be the one who
 * says it.
 *
 * **What it deliberately still does not do.** No phone number, no availability
 * calendar, no "typically replies in 2 minutes". This prototype has no
 * telephony and no rota, and a dialled number that rings nowhere is a worse
 * outcome than no number at all. The client can *ask* for a call in the
 * message, which costs us nothing to promise because a person reads it.
 */
export function TalkToAPerson({
  matterId,
  className,
  named = false,
}: {
  /**
   * The matter as resolved from the brief, or `undefined` before the client has
   * said what this is.
   *
   * Passed on as `?matter=` so the screen can mark the lawyer who fits. Not
   * used to *preselect* one — see `LawyerPicker` — and not used to name anybody
   * in this trigger beyond the first name below.
   */
  matterId: MatterId | undefined;
  className?: string;
  /**
   * Name the lawyer in the trigger instead of saying "a person" (G6).
   *
   * Two entry points, one destination, and the difference between them is what
   * the client is looking for at that moment. Under the composer the label is
   * *Talk to a person*, because someone reaching for it is stuck with the
   * software and does not care who answers. On the lawyer's own card it is
   * *Ask {firstName} something*, because someone reading a name and a face is
   * asking whether that specific person is reachable — which is the whole of
   * G6. A face on screen that cannot be spoken to is a stock photo with a
   * biography.
   */
  named?: boolean;
}) {
  const t = useTranslations('intake.person');
  const router = useRouter();
  const navigationGuard = useNavigationGuard();

  const lawyer = leadForMatter(matterId);
  const firstName = lawyer
    ? (lawyer.name.split(' ')[0] ?? lawyer.name)
    : undefined;

  const href = matterId ? `/client/talk?matter=${matterId}` : '/client/talk';

  /*
   * A button rather than a `Link`, because the guard has to get first refusal.
   * A real anchor would let a click through before the prompt could open, and
   * an anchor whose default is cancelled is a link that lies about where it
   * goes.
   */
  const go = () => {
    if (navigationGuard) navigationGuard.navigate(href);
    else router.push(href);
  };

  return (
    /*
     * A quiet text control rather than a filled button. It has to be findable
     * at the moment it is wanted and invisible the rest of the time: a solid
     * button next to the composer competes with Send, which is the one action
     * this screen exists for, and a permanent control styled as a call to
     * action reads as the flow suggesting the client give up.
     */
    <button
      type="button"
      onClick={go}
      className={cn(
        'text-muted-foreground hover:text-foreground focus-visible:ring-ring -mx-1 flex w-fit items-center gap-1.5 rounded-[0.5rem] px-1 py-0.5 text-[11.5px] transition-colors focus-visible:outline-none focus-visible:ring-2',
        className,
      )}
    >
      <UserRound aria-hidden="true" className="size-3" strokeWidth={2} />
      {named && firstName ? t('triggerNamed', { firstName }) : t('trigger')}
    </button>
  );
}
