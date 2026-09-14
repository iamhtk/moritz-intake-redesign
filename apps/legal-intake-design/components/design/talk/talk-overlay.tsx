'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Send, UserRound } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/design/foundations/components/avatar';
import { Button } from '@/components/design/foundations/components/button';
import { Textarea } from '@/components/design/foundations/components/textarea';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import { AVATAR_FRAMING } from '@/components/design/homepage-v2/legal-team';
import {
  INTAKE_NOTE_ROSTER,
  lawyerById,
  leadForMatter,
} from '@/components/design/new-case/lawyers';
import { useNavigationGuard } from '@/components/navigation/navigation-guard-context';
import { useRouter } from '@/i18n/navigation';
import { commandFilter } from '@/lib/command-filter';
import { schoolOf } from '@/lib/intake/credentials';
import { modKeyLabel } from '@/lib/keyboard';
import { ANY_LAWYER } from './lawyer-picker';
import { useTalkOverlay, type TalkRequest } from './talk-overlay-context';
import { useSendPersonMessage } from './use-send-person-message';

/**
 * *Talk to a person*, as an overlay over wherever the client already was.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THE FIRST CLICK NO LONGER TAKES THE PAGE AWAY.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The exit used to navigate straight to `/client/talk`, and that screen is
 * still right — it is where a sent message lives and where a thread of them
 * reads forward. What was wrong was making the client pay for it before they
 * had written a word. Someone halfway through describing a dismissal who wants
 * to ask one question is not asking to leave the intake, and a page change is
 * a much larger commitment than the question was. A dirty-intake prompt on top
 * of that made the exit feel like a door with a warning sign on it.
 *
 * So the click opens this, over whatever is behind it. Nothing is lost because
 * nothing moved. The navigation happens on **send**, when there is finally
 * something on the other end to look at: the message, shown back, on the
 * screen that keeps it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IT IS THE COMMAND CENTRE, DELIBERATELY.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Same `CommandDialog` shell as ⌘K — the 15vh seat, the frosted `bg-popover/95`
 * panel, the hairline ring — and the same two-step `cmdk` idiom the palette
 * uses for *Share a case*: a searchable roster, then the thing you do with the
 * row you picked. This is not decoration. The palette already taught this app's
 * clients that a panel in that position is "pick a thing, then act on it", and
 * a second overlay with its own geometry and its own list styling would be a
 * second answer to a question already answered. Choosing a person out of eleven
 * is a search problem, which is what `cmdk` is for, and the dropdown it
 * replaces could not be typed into at all.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHEN A NAME WAS ALREADY PRESSED, THERE IS NO ROSTER.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `TalkRequest.lawyerId` is set only by a control with somebody's name on it —
 * *Ask Priya*, under Priya's own face, once the brief knows this is an
 * employment matter. That click **is** the choice. Opening a roster afterwards
 * would ask the client to make the same decision twice and let the second
 * answer contradict the first, which is how a client ends up sending a
 * dismissal to the commercial lead because "Anyone at Moritz" was the default
 * row. So the overlay opens straight on the message, with one face at the top,
 * and there is no way to change it from here: to ask somebody else you go back
 * and press their name.
 */
export function TalkOverlay() {
  const overlay = useTalkOverlay();
  if (!overlay) return null;

  return (
    <TalkOverlayDialog request={overlay.request} onClose={overlay.closeTalk} />
  );
}

/** Which step is showing. One level deep, exactly as the palette is. */
type Step = 'pick' | 'write';

function TalkOverlayDialog({
  request,
  onClose,
}: {
  request: TalkRequest | null;
  onClose: () => void;
}) {
  const t = useTranslations('intake.person');
  const router = useRouter();
  const navigationGuard = useNavigationGuard();
  const send = useSendPersonMessage();

  const open = request !== null;

  /*
   * The last request, held past the close so the panel still has content to
   * draw while it animates out. Without it the dialog empties on the same frame
   * the exit transition starts and the overlay collapses to a blank card.
   */
  const lastRequest = useRef<TalkRequest>({});
  if (request) lastRequest.current = request;
  const active = request ?? lastRequest.current;

  /** Locked by the caller, i.e. the client pressed a name. */
  const lockedLawyer = active.lawyerId ? lawyerById(active.lawyerId) : null;

  const [step, setStep] = useState<Step>('write');
  const [chosenId, setChosenId] = useState<string>(ANY_LAWYER);
  const [text, setText] = useState('');

  /*
   * Reset on each opening, not on each close.
   *
   * Resetting on close would wipe the recipient and the step while the panel is
   * still on screen fading out, so the last thing the client sees is the
   * overlay turning into a different overlay. Keyed on `open` going true, which
   * is also the only moment the incoming `lawyerId` is known.
   */
  useEffect(() => {
    if (!open) return;
    setText('');
    setChosenId(active.lawyerId ?? ANY_LAWYER);
    setStep(active.lawyerId ? 'write' : 'pick');
  }, [open, active.lawyerId]);

  /** The matter's lead, marked in the roster and never chosen for them. */
  const suggested = leadForMatter(active.matterId);

  const chosen = chosenId === ANY_LAWYER ? null : lawyerById(chosenId);
  const recipient = lockedLawyer ?? chosen;
  const firstName = recipient
    ? (recipient.name.split(' ')[0] ?? recipient.name)
    : undefined;

  const trimmed = text.trim();

  const submit = () => {
    if (!send(trimmed, lockedLawyer?.id ?? chosenId)) return;

    onClose();

    /*
     * And now the page, which is the half of the old behaviour worth keeping.
     * The message is already recorded, so this is navigation rather than
     * submission: the Talk screen reads the store and shows it back, along with
     * everything sent before it.
     *
     * Through the guard because an intake in progress is registered dirty and
     * the client should be the one who says "yes, leave" — the draft is in
     * `localStorage` either way, and so is the message, so neither answer to
     * the prompt can lose anything.
     */
    const href = active.matterId
      ? `/client/talk?matter=${active.matterId}`
      : '/client/talk';
    if (navigationGuard) navigationGuard.navigate(href);
    else router.push(href);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={firstName ? t('overlay.titleNamed', { firstName }) : t('trigger')}
      description={t('dialogDescription')}
    >
      {step === 'pick' && !lockedLawyer ? (
        /*
         * `key` on the step for the palette's reason: a remount clears the
         * query and the highlighted row, so a search typed to find a person
         * cannot survive into the next screen.
         */
        <Command key="pick" filter={commandFilter} className="bg-transparent">
          <CommandInput
            autoFocus
            aria-label={t('overlay.pickLabel')}
            placeholder={t('overlay.pickPlaceholder')}
          />
          <CommandList>
            <CommandEmpty>{t('overlay.pickEmpty')}</CommandEmpty>
            <CommandGroup heading={t('picker.label')}>
              {/*
               * Anyone-at-Moritz first and highlighted first, which is the
               * picker's own ordering and its own argument: a client who does
               * not know the names should not have to learn eleven of them
               * before they can ask for help, and routing to a named
               * individual is slower than routing to whoever is free.
               */}
              <CommandItem
                value={t('picker.anyName')}
                keywords={['anyone', 'any', 'moritz', 'whoever']}
                onSelect={() => {
                  setChosenId(ANY_LAWYER);
                  setStep('write');
                }}
              >
                <PersonRow
                  name={t('picker.anyName')}
                  detail={t('picker.anyDetail')}
                  initials="MZ"
                  imageUrl=""
                  lawyerId=""
                />
              </CommandItem>
              {/*
               * The whole roster, not the five onboarding personas the old
               * dropdown listed. The faces the client has been watching rotate
               * beside the composer come from `INTAKE_NOTE_ROSTER`, and a
               * roster that cannot offer the person whose photograph was just
               * on screen is the stock-photo problem this feature exists to
               * fix.
               */}
              {INTAKE_NOTE_ROSTER.map((lawyer) => (
                <CommandItem
                  key={lawyer.id}
                  value={lawyer.name}
                  keywords={[lawyer.title, schoolOf(lawyer.education)]}
                  onSelect={() => {
                    setChosenId(lawyer.id);
                    setStep('write');
                  }}
                >
                  <PersonRow
                    name={lawyer.name}
                    detail={
                      suggested?.id === lawyer.id
                        ? t('picker.fitsYourMatter', {
                            school: schoolOf(lawyer.education),
                          })
                        : `${lawyer.title} · ${schoolOf(lawyer.education)}`
                    }
                    initials={lawyer.initials}
                    imageUrl={lawyer.imageUrl}
                    lawyerId={lawyer.id}
                  />
                  {suggested?.id === lawyer.id ? (
                    <CommandShortcut>{t('overlay.fits')}</CommandShortcut>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      ) : (
        <div className="flex flex-col">
          {/*
           * Who this is going to, in the input's seat.
           *
           * Not a field. On the locked path there is nothing to change, and on
           * the picked path the change is "go back and pick again" — so it
           * reads as a header with a face rather than as a control that looks
           * editable and is not.
           */}
          <div className="border-border/60 flex items-center gap-2.5 border-b px-3 py-2.5">
            {!lockedLawyer ? (
              <button
                type="button"
                onClick={() => setStep('pick')}
                aria-label={t('overlay.back')}
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring -ml-1 rounded-[0.5rem] p-1 transition-colors focus-visible:outline-none focus-visible:ring-2"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
              </button>
            ) : null}
            <PersonRow
              name={recipient ? recipient.name : t('picker.anyName')}
              detail={
                recipient
                  ? `${recipient.title} · ${schoolOf(recipient.education)}`
                  : t('picker.anyDetail')
              }
              initials={recipient ? recipient.initials : 'MZ'}
              imageUrl={recipient?.imageUrl ?? ''}
              lawyerId={recipient?.id ?? ''}
            />
          </div>

          <div className="flex flex-col gap-2 p-3">
            <label htmlFor="talk-overlay-message" className="sr-only">
              {t('label')}
            </label>
            <Textarea
              id="talk-overlay-message"
              autoFocus
              rows={4}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={t('placeholder')}
              onKeyDown={(event) => {
                /*
                 * Mod+Enter, not Enter. This is a textarea and the client is
                 * writing prose about something that went wrong at work;
                 * Enter has to make a paragraph. The palette's rows send on
                 * Enter because a row is not a sentence.
                 */
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  submit();
                }
              }}
            />
            {/*
             * What this costs and where it goes, beside the control that does
             * it (L17) — the same sentence the screen carries, because it is
             * the same promise.
             */}
            <p className="text-muted-foreground text-[11.5px] leading-relaxed">
              {t('cost')}
            </p>
          </div>

          <div className="border-border/60 flex items-center justify-between gap-3 border-t px-3 py-2.5">
            <p className="text-muted-foreground text-[11px]">
              {t('overlay.sendHint', { key: modKeyLabel() })}
            </p>
            <Button
              type="button"
              size="sm"
              onClick={submit}
              disabled={trimmed === ''}
            >
              {t('send')}
              <Send data-icon="inline-end" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </CommandDialog>
  );
}

/**
 * One person, in a command row and in the message step's header.
 *
 * A near-twin of `LawyerPicker`'s `Row` and deliberately not shared with it:
 * that one inverts through `group-focus:` because `SelectItem` highlights with
 * `focus:`, and this one has to invert through
 * `group-data-[selected=true]/command-item:` because that is how `CommandItem`
 * marks the active row. One component covering both would carry two sets of
 * variant selectors, half of them dead at each call site, and the seam would be
 * invisible until a row went black-on-black — which is exactly the defect the
 * picker's own note records.
 */
function PersonRow({
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
        {/*
         * Rendered even with an empty `src`, which resolves to `error` without
         * a request — see `intake-lawyer-note.tsx` on why leaving it out is
         * what suppresses the monogram rather than what saves anything.
         */}
        <AvatarImage
          src={imageUrl}
          alt=""
          className={AVATAR_FRAMING[lawyerId] ?? 'object-cover'}
        />
        <AvatarFallback className="bg-primary/10 text-foreground group-data-[selected=true]/command-item:bg-primary-foreground/20 group-data-[selected=true]/command-item:text-primary-foreground text-[10px] font-medium tracking-wide">
          {initials || <UserRound aria-hidden="true" className="size-3" />}
        </AvatarFallback>
      </Avatar>
      <span className="flex min-w-0 flex-col text-left">
        <span className="text-foreground group-data-[selected=true]/command-item:text-primary-foreground truncate text-[13px] font-medium">
          {name}
        </span>
        {/* 75% rather than the muted token, so the second line stays quieter
            than the first on the dark fill too. */}
        <span className="text-muted-foreground group-data-[selected=true]/command-item:text-primary-foreground/75 truncate text-[11px]">
          {detail}
        </span>
      </span>
    </span>
  );
}
