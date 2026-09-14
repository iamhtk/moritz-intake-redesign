'use client';

import { useTranslations } from 'next-intl';
import { UserRound } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { useNavigationGuard } from '@/components/navigation/navigation-guard-context';
import { useRouter } from '@/i18n/navigation';
import { useTalkOverlay } from '@/components/design/talk/talk-overlay-context';
import type { OnboardingLawyer } from '@/components/design/new-case/lawyers';
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
 * IT OPENS OVER THE PAGE, AND SENDING IS WHAT NAVIGATES.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This has now been three things, and the third is the sum of the first two.
 *
 * It was a `Dialog` that appended the message to the intake transcript, which
 * was wrong because the exit did not go anywhere: the dialog closed and the
 * conversation the client had just opted out of was still there with their
 * message in it as one more bubble.
 *
 * Then it was a straight navigation to `/client/talk`, which fixed the
 * destination and broke the entrance. Pressing it took the page away *before
 * the client had written anything*, and on a dirty intake it did so behind a
 * "discard your changes?" prompt — so the control that exists for someone
 * already out of patience answered them with a warning dialog about work they
 * had not asked to abandon.
 *
 * Now: the click opens `TalkOverlay` over whatever is behind it, and **send**
 * navigates to `/client/talk`. Nothing moves until there is something on the
 * other end to look at, and a client who opens it to see what it is can close
 * it and be exactly where they were. The screen is unchanged and still owns
 * the record of what was sent; it is the moment of arrival that moved.
 *
 * The `router.push` fallback below is for surfaces with no provider around them
 * — the foundations gallery mounts these components bare — where the old
 * behaviour is better than a dead control.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT THE LABEL CLAIMS, AND WHEN.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Three labels, and the difference between them is how much the flow actually
 * knows:
 *
 * - **"Talk to a person"** under the composer. Somebody reaching for it there
 *   is stuck with the software and does not care who answers.
 * - **"Ask a human"** beside a face that is still rotating. `IntakeLawyerNote`
 *   cycles the whole roster until the brief knows what kind of matter this is,
 *   and this control used to read *Ask Daniel something* under every one of
 *   those eleven faces — because it resolved its own name from `matterId`,
 *   which is `undefined` at that point, so it printed the default lead's name
 *   beside somebody else's photograph. Naming a person the screen is not
 *   showing is worse than naming nobody.
 * - **"Ask Priya"** once the matter is settled. Then the flow does know: the
 *   face has stopped rotating, it is the employment lead, and the client can
 *   see the name they are pressing. This is also the only case that locks the
 *   overlay to one recipient — see `TalkOverlay` on why offering a roster
 *   after a named click is asking the same question twice.
 */
export function TalkToAPerson({
  matterId,
  lawyer,
  pinned = false,
  variant = 'quiet',
  className,
}: {
  /**
   * The matter as resolved from the brief, or `undefined` before the client has
   * said what this is.
   *
   * Passed on as `?matter=` so the screen can mark the lawyer who fits, and to
   * the overlay for the same reason. Not used to *resolve a name for this
   * label* any more — that was the bug — and not used to preselect anybody.
   */
  matterId: MatterId | undefined;
  /**
   * The person actually on screen beside this control, when there is one.
   *
   * The caller owns this rather than the control resolving it, because only the
   * caller knows which face is up: `IntakeLawyerNote` rotates through eleven of
   * them, and a lookup here can only ever produce the lead for `matterId`. That
   * mismatch is what put "Ask Daniel" under Aelita's photograph.
   */
  lawyer?: OnboardingLawyer | null;
  /**
   * Whether `lawyer` is the settled lead rather than a passing frame of a
   * rotation.
   *
   * The label names them only when this is true, and only then does the overlay
   * open locked to them. While the roster is still cycling the honest label is
   * *Ask a human*, because the next face is six seconds away.
   */
  pinned?: boolean;
  /**
   * How loud it is.
   *
   * `quiet` is the composer's: a text control that has to be findable at the
   * moment it is wanted and invisible the rest of the time, because a solid
   * button next to the composer competes with Send — the one action that screen
   * exists for — and a permanent call to action reads as the flow suggesting
   * the client give up.
   *
   * `icon-badge` is for the *named* control on a lawyer's own card, where the
   * opposite is true: it sits under a face, a name, a practice line and a
   * biography, and an 11.5px grey text link under all of that reads as a
   * caption rather than as the answer to "can I talk to this person?". A
   * filled black disc with a white figure in it carries at that size where a
   * 12px stroked outline does not, and the label stays typographic beside it
   * so the row still reads as a sentence rather than as chrome.
   *
   * A third variant put the icon *and* the label together in a solid black
   * pill. It was built alongside this one to be compared in place and then
   * cut: at this size a filled pill is the loudest object in a block whose
   * subject is a person, so it took the eye off the face and the name and
   * read as an advertisement sitting under a biography. The disc puts the
   * weight on the mark and leaves the words alone, which is the right balance
   * for a control that has to be *findable* rather than *pressed*.
   */
  variant?: 'quiet' | 'icon-badge';
  className?: string;
}) {
  const t = useTranslations('intake.person');
  const router = useRouter();
  const navigationGuard = useNavigationGuard();
  const overlay = useTalkOverlay();

  /*
   * Named only when the face has stopped moving. `pinned` without a `lawyer` is
   * not a state any caller can produce, but treating it as "not named" rather
   * than asserting keeps a future caller from printing "Ask undefined".
   */
  const named = pinned && lawyer ? lawyer : null;
  const firstName = named
    ? (named.name.split(' ')[0] ?? named.name)
    : undefined;

  const label = firstName
    ? t('triggerNamed', { firstName })
    : /*
       * "Ask a human" rather than "Talk to a person" wherever a face is beside
       * it, even an unnamed one. The two read the same on paper and land
       * differently in place: under a photograph, *ask* is a question about
       * that person and *talk to a person* is a complaint about the software.
       */
      lawyer
      ? t('triggerAnyone')
      : t('trigger');

  const open = () => {
    if (overlay) {
      overlay.openTalk({
        ...(matterId ? { matterId } : {}),
        ...(named ? { lawyerId: named.id } : {}),
      });
      return;
    }
    /*
     * No provider (the foundations gallery mounts these bare). Straight to the
     * screen, through the guard, which is exactly what this control used to do
     * everywhere.
     */
    const href = matterId ? `/client/talk?matter=${matterId}` : '/client/talk';
    if (navigationGuard) navigationGuard.navigate(href);
    else router.push(href);
  };

  if (variant === 'icon-badge') {
    return (
      <button
        type="button"
        onClick={open}
        className={cn(
          'text-foreground focus-visible:ring-ring mz-tap group relative -mx-1 flex w-fit items-center gap-2 rounded-full px-1 py-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2',
          className,
        )}
      >
        {/*
         * The disc is the whole variant: a filled mark carries at 18px where a
         * 12px stroked outline does not, and it is what stops this reading as a
         * caption under the biography above it.
         */}
        <span
          aria-hidden="true"
          className="bg-foreground text-background group-hover:bg-foreground/85 flex size-[18px] shrink-0 items-center justify-center rounded-full transition-colors"
        >
          <UserRound className="size-[11px]" strokeWidth={2.5} />
        </span>
        <span className="group-hover:underline">{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      data-tour="talk-to-a-person"
      onClick={open}
      className={cn(
        'text-muted-foreground hover:text-foreground focus-visible:ring-ring mz-tap relative -mx-1 flex w-fit items-center gap-1.5 rounded-[0.5rem] px-1 py-0.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2',
        className,
      )}
    >
      <UserRound aria-hidden="true" className="size-3" strokeWidth={2} />
      {label}
    </button>
  );
}
