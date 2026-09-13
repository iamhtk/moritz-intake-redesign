'use client';

import { useEffect, useMemo, useState } from 'react';
import { GraduationCap } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/design/foundations/components/avatar';
import { Heading } from '@/components/design/foundations/components/heading';
import { Text } from '@/components/design/foundations/components/text';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogTitle,
} from '@/components/design/foundations/components/dialog';
import { AVATAR_FRAMING } from '@/components/design/homepage-v2/legal-team';
import { ADDITIONAL_TEAM_LAWYERS } from '@/components/design/onboarding/onboarding-lawyers';
import { showcaseForMatter, type OnboardingLawyer } from './lawyers';
import { type MatterId } from './intake-types';

/**
 * The rotating row of real lawyers, lifted out of `case-submitted-card.tsx`
 * unchanged so the intake's sent state can show the same object (Decision 8).
 *
 * It was already the right thing — real headshots, the homepage's avatar
 * framing, a staggered cross-fade — and the instruction was to relocate it
 * rather than rebuild it. Pulling it into its own file is what makes that
 * literally true: both surfaces render the same component, so the confirmation
 * cannot drift away from the card it came from.
 */

/** Eyebrow label above a lawyer section. */
export function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-muted-foreground text-center text-[11px] font-medium uppercase tracking-[0.14em]">
      {children}
    </div>
  );
}

/**
 * Elegant lawyer profile matching the onboarding brand panel / homepage social
 * proof: a bordered headshot, serif name, muted role, a quoted tagline, and an
 * education line.
 */
export function LawyerProfile({ lawyer }: { lawyer: OnboardingLawyer }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Avatar className="border-border/60 size-20 border shadow-sm">
        {/*
         * Rendered even for the persona with no headshot (see `lawyers.ts`).
         * Leaving it out is what suppresses the initials once the same avatar
         * has shown a photograph — see `AvatarImage`'s own note.
         */}
        <AvatarImage
          src={lawyer.imageUrl}
          alt={lawyer.name}
          className="object-cover"
        />
        <AvatarFallback className="text-foreground font-medium">
          {lawyer.initials}
        </AvatarFallback>
      </Avatar>
      <div className="space-y-0.5">
        <Heading level={3} className="text-lg" style={{ fontWeight: 600 }}>
          {lawyer.name}
        </Heading>
        <Text className="text-muted-foreground text-sm">{lawyer.title}</Text>
      </div>
      <Text className="text-foreground text-balance text-sm">
        &ldquo;{lawyer.tagline}&rdquo;
      </Text>
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <GraduationCap aria-hidden="true" className="size-4 shrink-0" />
        <span>{lawyer.education}</span>
      </div>
    </div>
  );
}

const SHOWCASE_CELL_COUNT = 3;
const SHOWCASE_ROTATE_MS = 5000;
const SHOWCASE_FADE_MS = 700;
/** Per-cell start delay so the row cross-fades in a gentle wave, not in unison. */
const SHOWCASE_STAGGER_MS = 700;

/**
 * Split the roster round-robin across the grid cells so each cell owns a distinct
 * rotating subset (cell `i` cycles lawyers `i`, `i + cellCount`, ...). Keeps the
 * matter-relevant lead as the opening frame while surfacing every lawyer.
 */
function splitRosterIntoCells(
  roster: OnboardingLawyer[],
  cellCount: number,
): OnboardingLawyer[][] {
  return Array.from({ length: cellCount }, (_, cell) =>
    roster.filter((_, index) => index % cellCount === cell),
  ).filter((cell) => cell.length > 0);
}

export function LawyerShowcase({
  matterId,
  label,
  readable = false,
  readMoreLabel,
  children,
}: {
  matterId?: MatterId;
  /** Overridable so the intake can phrase it in its own voice. */
  label?: string;
  /**
   * Whether a face can be opened and read (item 41).
   *
   * The brief names the human figures on this screen as "the direction to push
   * further", and until this they were the one thing a client could learn
   * nothing more about: nine photographs, a first name and a tagline, rotating.
   * `LawyerProfile` already existed in this file with the name, the role, the
   * quote and the school on it, and nothing rendered it.
   *
   * Opt-in rather than always on, because the two other call sites are not
   * waiting screens. On the onboarding panel and the old submitted card the
   * faces are social proof being scrolled past; here the client has been told
   * the wait is hours and given permission to leave, so reading about the
   * people who will do the work is a fair use of the time, and a decoration
   * becomes the most human thing on the page.
   */
  readable?: boolean;
  /** Accessible name for a face that can be opened, e.g. "Read about Mei". */
  readMoreLabel?: (name: string) => string;
  /** Rendered inside the profile dialog, under the profile. */
  children?: (lawyer: OnboardingLawyer) => React.ReactNode;
}) {
  const cellRosters = useMemo(
    () =>
      splitRosterIntoCells(
        [...showcaseForMatter(matterId), ...ADDITIONAL_TEAM_LAWYERS],
        SHOWCASE_CELL_COUNT,
      ),
    [matterId],
  );
  const [reducedMotion, setReducedMotion] = useState(false);
  /**
   * Which profile is open, or `null`.
   *
   * Held on the showcase rather than on each cell so only one can be open, and
   * so the rotation a client interrupted is the thing they are reading about:
   * the cell hands up whichever face was visible when it was pressed.
   */
  const [reading, setReading] = useState<OnboardingLawyer | null>(null);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  if (cellRosters.length === 0) return null;

  return (
    <div className="space-y-4">
      <SectionEyebrow>
        {label ?? 'Lawyers who could take this on'}
      </SectionEyebrow>
      <ul className="grid grid-cols-3 gap-x-4 gap-y-6">
        {cellRosters.map((roster, cell) => (
          <ShowcaseCell
            key={cell}
            roster={roster}
            delayMs={cell * SHOWCASE_STAGGER_MS}
            reducedMotion={reducedMotion}
            {...(readable
              ? {
                  onRead: setReading,
                  ...(readMoreLabel ? { readMoreLabel } : {}),
                }
              : {})}
          />
        ))}
      </ul>

      {/*
       * One dialog for the whole row, rather than one per face.
       *
       * The profile is the dialog's own content and nothing else is: no "next
       * lawyer" control, no roster to page through. A client on this screen is
       * waiting on a quote, not shopping, and turning nine colleagues into a
       * carousel would make the bench the point instead of the case.
       */}
      <Dialog
        open={reading !== null}
        onOpenChange={(next) => {
          if (!next) setReading(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          {reading ? (
            <>
              {/* The name is the title, so the dialog announces who it is about. */}
              <DialogTitle className="sr-only">{reading.name}</DialogTitle>
              <DialogBody className="flex flex-col gap-4 pt-2">
                <LawyerProfile lawyer={reading} />
                {children?.(reading)}
              </DialogBody>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ShowcaseCell({
  roster,
  delayMs,
  reducedMotion,
  onRead,
  readMoreLabel,
}: {
  roster: OnboardingLawyer[];
  delayMs: number;
  reducedMotion: boolean;
  /** Absent unless the showcase is `readable`; see that prop. */
  onRead?: (lawyer: OnboardingLawyer) => void;
  readMoreLabel?: (name: string) => string;
}) {
  const [index, setIndex] = useState(0);

  // Reduced-motion users always land on the curated opening frame.
  useEffect(() => {
    if (reducedMotion) setIndex(0);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion || roster.length <= 1) return;

    let interval: number | undefined;
    const start = window.setTimeout(() => {
      setIndex((current) => (current + 1) % roster.length);
      interval = window.setInterval(() => {
        setIndex((current) => (current + 1) % roster.length);
      }, SHOWCASE_ROTATE_MS);
    }, delayMs);

    return () => {
      window.clearTimeout(start);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [roster.length, delayMs, reducedMotion]);

  return (
    <li>
      {/* All lawyers in this cell share one grid area so the row never reflows as
          we cross-fade between them. */}
      <div className="grid" style={{ gridTemplateAreas: '"stack"' }}>
        {roster.map((lawyer, lawyerIndex) => {
          const visible = lawyerIndex === index;
          /*
           * A button only where it does something, and only on the face that
           * is actually on screen.
           *
           * The hidden faces in this stack keep their `aria-hidden` and their
           * `pointer-events-none`, so making all nine buttons would add eight
           * unreachable tab stops per cell. Rendering the element as a `div`
           * when there is nothing to open is what keeps the two other call
           * sites unchanged: no focus ring, no pointer, no hover.
           */
          const Element = onRead && visible ? 'button' : 'div';
          return (
            <Element
              key={lawyer.id}
              {...(onRead && visible
                ? {
                    type: 'button' as const,
                    onClick: () => onRead(lawyer),
                    'aria-label': readMoreLabel?.(lawyer.name) ?? lawyer.name,
                  }
                : {})}
              aria-hidden={!visible}
              className={cn(
                'flex flex-col items-center gap-3 text-center transition-opacity ease-in-out',
                visible ? 'opacity-100' : 'pointer-events-none opacity-0',
                /*
                 * The affordance is the cursor and the focus ring, not a border
                 * or a chevron. The row reads as a group of photographs and
                 * should keep reading that way; something that announces itself
                 * as nine controls would turn the most human thing on the screen
                 * into a menu.
                 */
                onRead &&
                  visible &&
                  'focus-visible:ring-ring rounded-[0.5rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              )}
              style={{
                gridArea: 'stack',
                transitionDuration: `${SHOWCASE_FADE_MS}ms`,
              }}
            >
              <Avatar
                size="2xl"
                className="border-border/60 overflow-hidden border shadow-sm"
              >
                <AvatarImage
                  src={lawyer.imageUrl}
                  alt={lawyer.name}
                  className={AVATAR_FRAMING[lawyer.id] ?? 'object-cover'}
                />
                <AvatarFallback className="text-foreground font-medium">
                  {lawyer.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-medium">
                  {lawyer.name.split(' ')[0]}
                </p>
                <p className="text-muted-foreground text-balance text-xs leading-snug">
                  {lawyer.tagline}
                </p>
              </div>
            </Element>
          );
        })}
      </div>
    </li>
  );
}
