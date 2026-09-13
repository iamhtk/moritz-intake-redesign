'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@repo/ui/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/design/foundations/components/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/design/foundations/components/select';
import { AVATAR_FRAMING } from '@/components/design/homepage-v2/legal-team';
import { ONBOARDING_LAWYERS } from '@/components/design/onboarding/onboarding-lawyers';
import { schoolOf } from '@/lib/intake/credentials';

/**
 * Who the client wants to speak to, with faces (G6).
 *
 * The dialog this replaces showed **one** lawyer, resolved from the matter, and
 * described them as "a lawyer like {firstName}" — hedged, because the flow had
 * picked them and the client had not. That hedge was the honest reading of a
 * screen with no choice on it, and it also gave away the point of G6: a face
 * the client cannot choose is still a photograph on a page.
 *
 * So the roster is a real control, and the copy stops hedging. What the client
 * picks is what the message is addressed to.
 *
 * **Anyone-at-Moritz is first and is the default.** Two reasons, and the second
 * is the one that decided it. A client who does not know the names should not
 * have to learn five of them before they can ask for help — the exit exists for
 * somebody already out of patience, and making it a quiz is how you lose them
 * at the last step. And routing to a named individual is slower than routing to
 * whoever is free, so the default should not quietly cost the client time they
 * did not choose to spend.
 *
 * **A matter-relevant lead is marked rather than preselected.** When the intake
 * knows the matter it passes `suggestedId`, and that row gets a "fits your
 * matter" note. Preselecting it would be the same silent choice the old dialog
 * made, with the added problem that a client who never opens the dropdown would
 * never know a choice had been made for them.
 *
 * Faces come from `ONBOARDING_LAWYERS`, which is the roster with real headshots
 * and real `education` lines, and is the same list `leadForMatter` resolves
 * through — so the person offered here is the same person the intake and the
 * handoff card show. One roster, or the client is introduced to two firms.
 */

/** The value used for "no particular person". Not a lawyer id, so it cannot collide. */
export const ANY_LAWYER = 'any';

export function LawyerPicker({
  value,
  onChange,
  suggestedId,
  id,
  className,
}: {
  /** A roster id, or `ANY_LAWYER`. */
  value: string;
  onChange: (next: string) => void;
  /**
   * The lead the matter points at, when there is one. Marked in the list, never
   * selected on the client's behalf.
   */
  suggestedId?: string;
  id?: string;
  className?: string;
}) {
  const t = useTranslations('intake.person.picker');

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className={cn('h-auto w-full py-2', className)}>
        {/*
         * `SelectValue` renders the selected item's own children, so the
         * trigger shows the same avatar-and-name row as the list. That is what
         * keeps the closed state from being a bare name where the open state
         * had a face.
         */}
        <SelectValue placeholder={t('placeholder')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY_LAWYER}>
          <Row
            name={t('anyName')}
            detail={t('anyDetail')}
            initials="MZ"
            imageUrl=""
            lawyerId=""
          />
        </SelectItem>
        {ONBOARDING_LAWYERS.map((lawyer) => (
          <SelectItem key={lawyer.id} value={lawyer.id}>
            <Row
              name={lawyer.name}
              detail={
                suggestedId === lawyer.id
                  ? t('fitsYourMatter', { school: schoolOf(lawyer.education) })
                  : `${lawyer.title} · ${schoolOf(lawyer.education)}`
              }
              initials={lawyer.initials}
              imageUrl={lawyer.imageUrl}
              lawyerId={lawyer.id}
            />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * One row, used in the list and — through `SelectValue` — in the trigger.
 *
 * Deliberately one component for both. The trigger rendering its own shorter
 * version is how a picker ends up showing a face when open and a string when
 * closed, which reads as two different controls.
 *
 * **The colours invert on the highlighted row.** `SelectItem` applies
 * `focus:bg-primary focus:text-primary-foreground`, which handles a plain
 * text option: the item goes dark and the inherited text goes light. It could
 * not handle this one, because every line below sets its own colour —
 * `text-foreground` on the name, `text-muted-foreground` on the detail — and
 * an explicit colour beats an inherited one. So the highlighted row was black
 * text on a black fill, i.e. the one row the client was looking at was the one
 * they could not read.
 *
 * Fixed with `group-focus:` rather than by dropping the colours, because the
 * unhighlighted rows do need that hierarchy: the name is foreground and the
 * detail is muted, and flattening both to `inherit` would lose it. `SelectItem`
 * already carries `group`, and `SelectTrigger` deliberately does not — checked,
 * because if it did, the selected row would also turn white inside the closed
 * trigger, which has a light fill.
 */
function Row({
  name,
  detail,
  initials,
  imageUrl,
  lawyerId,
}: {
  name: string;
  detail: string;
  initials: string;
  imageUrl: string;
  lawyerId: string;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <Avatar
        className={cn(
          'size-7 shrink-0 overflow-hidden',
          imageUrl ? 'border-border/60 border' : 'ring-primary/20 ring-1',
        )}
      >
        <AvatarImage
          src={imageUrl}
          alt=""
          className={AVATAR_FRAMING[lawyerId] ?? 'object-cover'}
        />
        <AvatarFallback className="bg-primary/10 text-foreground group-focus:bg-primary-foreground/20 group-focus:text-primary-foreground text-[10px] font-medium tracking-wide">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="flex min-w-0 flex-col text-left">
        <span className="text-foreground group-focus:text-primary-foreground truncate text-[13px] font-medium">
          {name}
        </span>
        {/* 75% rather than the muted token, so the second line stays quieter
            than the first on the dark fill too. */}
        <span className="text-muted-foreground group-focus:text-primary-foreground/75 truncate text-[11px]">
          {detail}
        </span>
      </span>
    </span>
  );
}
