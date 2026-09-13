'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@repo/ui/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/design/foundations/components/avatar';
import { GatedNewCaseButton } from '@/components/design/engagement-letter/gated-new-case-button';
import {
  ADDITIONAL_TEAM_LAWYERS,
  ONBOARDING_LAWYERS,
  type OnboardingLawyer,
} from '@/components/design/onboarding/onboarding-lawyers';

const ROTATE_MS = 5000;
const FADE_MS = 700;
/** Per-cell start delay so the row cross-fades in a gentle wave, not in unison. */
const STAGGER_MS = 700;
/** How many lawyer slots the grid renders at once, per breakpoint. */
const DESKTOP_CELL_COUNT = 5;
const MOBILE_CELL_COUNT = 3;
/** Tailwind `sm` breakpoint; below this we drop to the mobile cell count. */
const MOBILE_QUERY = '(max-width: 639px)';

/**
 * Per-headshot crop/zoom so the row reads as a cohesive, symmetric set: anchor
 * the top and zoom to a consistent head size, converting the taller portraits
 * into the same tight head-and-shoulders framing as the square studio shots.
 */
export const AVATAR_FRAMING: Record<string, string> = {
  'onboarding-lawyer-daniel': 'object-[50%_32%] scale-[1.18] origin-top',
  'onboarding-lawyer-kyle': 'object-center',
  'onboarding-lawyer-maxim': 'object-[62%_0%] scale-[1.06] origin-top',
  'onboarding-lawyer-aelita': 'object-[46%_0%] scale-[1.06] origin-top',
  'onboarding-lawyer-catarina': 'object-top scale-[1.3] origin-top',
  'onboarding-lawyer-eric': 'object-[48%_6%] scale-[2.2]',
  'onboarding-lawyer-aaron': 'object-top',
  'onboarding-lawyer-mike': 'object-top',
  'onboarding-lawyer-enes': 'object-top',
  'onboarding-lawyer-pamir': 'object-top',
};

const TEAM_ROSTER: OnboardingLawyer[] = [
  ...ONBOARDING_LAWYERS,
  ...ADDITIONAL_TEAM_LAWYERS,
];

/**
 * Split the roster round-robin across the grid cells so each cell owns a
 * distinct rotating subset (cell `i` cycles lawyers `i`, `i + cellCount`, ...).
 * Round-robin keeps the original onboarding lawyers as the initial visible frame
 * and ensures every lawyer still surfaces even when fewer cells are shown.
 */
function splitRosterIntoCells(
  roster: OnboardingLawyer[],
  cellCount: number,
): OnboardingLawyer[][] {
  return Array.from({ length: cellCount }, (_, cell) =>
    roster.filter((_, index) => index % cellCount === cell),
  );
}

export function LegalTeam({
  className,
  style,
}: {
  /** For the page's entrance animation; see `lib/entrance.ts`. */
  className?: string;
  style?: CSSProperties;
} = {}) {
  const t = useTranslations('dashboard.client.homepageV2.team');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const cellCount = isMobile ? MOBILE_CELL_COUNT : DESKTOP_CELL_COUNT;
  const cellRosters = useMemo(
    () => splitRosterIntoCells(TEAM_ROSTER, cellCount),
    [cellCount],
  );

  return (
    <section className={cn('flex flex-col gap-8', className)} style={style}>
      <h2 className="text-muted-foreground text-center text-xs font-medium uppercase tracking-[0.16em]">
        {t('title')}
      </h2>

      <ul className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-5">
        {cellRosters.map((roster, cell) => (
          <LegalTeamCell
            key={cell}
            roster={roster}
            delayMs={cell * STAGGER_MS}
            reducedMotion={reducedMotion}
          />
        ))}
      </ul>

      <div className="flex justify-center">
        <GatedNewCaseButton label={t('cta')} icon="arrow" size="lg" />
      </div>
    </section>
  );
}

function LegalTeamCell({
  roster,
  delayMs,
  reducedMotion,
}: {
  roster: OnboardingLawyer[];
  delayMs: number;
  reducedMotion: boolean;
}) {
  const [index, setIndex] = useState(0);

  // Reset to the first lawyer whenever rotation is disabled so reduced-motion
  // users always land on the curated opening frame.
  useEffect(() => {
    if (reducedMotion) setIndex(0);
  }, [reducedMotion]);

  // The roster length changes when the breakpoint switches the cell count;
  // clamp so a stale index never leaves the cell blank.
  useEffect(() => {
    setIndex((current) => (current >= roster.length ? 0 : current));
  }, [roster.length]);

  useEffect(() => {
    if (reducedMotion || roster.length <= 1) return;

    let interval: number | undefined;
    const start = window.setTimeout(() => {
      setIndex((current) => (current + 1) % roster.length);
      interval = window.setInterval(() => {
        setIndex((current) => (current + 1) % roster.length);
      }, ROTATE_MS);
    }, delayMs);

    return () => {
      window.clearTimeout(start);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [roster.length, delayMs, reducedMotion]);

  return (
    <li>
      {/* All lawyers in this cell share one grid area so it never reflows as we
          cross-fade between them. */}
      <div className="grid" style={{ gridTemplateAreas: '"stack"' }}>
        {roster.map((lawyer, lawyerIndex) => (
          <div
            key={lawyer.id}
            aria-hidden={lawyerIndex !== index}
            className={cn(
              'flex flex-col items-center gap-3 text-center transition-opacity ease-in-out',
              lawyerIndex === index
                ? 'opacity-100'
                : 'pointer-events-none opacity-0',
            )}
            style={{
              gridArea: 'stack',
              transitionDuration: `${FADE_MS}ms`,
            }}
          >
            <Avatar
              size="2xl"
              className="border-border/60 overflow-hidden border shadow-sm"
            >
              <AvatarImage
                src={lawyer.imageUrl}
                alt={lawyer.name}
                className={AVATAR_FRAMING[lawyer.id]}
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
          </div>
        ))}
      </div>
    </li>
  );
}
