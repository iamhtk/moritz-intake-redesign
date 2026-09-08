'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, GraduationCap } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@/components/design/design-system/button';
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from '@/components/design/foundations/components/avatar';
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from '@/components/design/foundations/components/description-list';
import { Heading } from '@/components/design/foundations/components/heading';
import { Text } from '@/components/design/foundations/components/text';
import { AVATAR_FRAMING } from '@/components/design/homepage-v2/legal-team';
import { ADDITIONAL_TEAM_LAWYERS } from '@/components/design/onboarding/onboarding-lawyers';
import { Link } from '@/i18n/navigation';
import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import { useSlackConnection } from '@/components/design/slack/slack-connection-context';
import { OpenInSlackButton } from '@/components/design/slack/open-in-slack-button';
import { SLACK_CHANNEL } from '@/components/design/slack/slack-config';
import { getCasesForCompany } from '@/lib/mocks/cases';
import { MOCK_CLIENT_USER } from '@/lib/mocks/users';
import { estimateTurnaround } from './extract';
import { type AnswersMap, type MatterId } from './intake-types';

/**
 * Playground stand-in for the freshly created case. Submission is stubbed here
 * (no backend), so there's no server-routable case to open. Deep-link to the
 * mock client's most recent case so "Go to case" lands on a real detail page.
 */
const NEW_CASE_HREF = (() => {
  const cases = getCasesForCompany(MOCK_CLIENT_USER.company?.id ?? '');
  const latest = [...cases].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )[0];
  return latest ? `/client/cases/${latest.id}` : '/client/cases';
})();
import {
  ENTERPRISE_POD,
  showcaseForMatter,
  type OnboardingLawyer,
} from './lawyers';

/**
 * Inline confirmation shown as the final Moritz turn once a case is submitted.
 * Standard accounts see a minimal row of headshots for the lawyers who could
 * take the matter on (assigned after the quote); enterprise accounts see their
 * dedicated pod, already notified, with the fuller profile treatment. Both
 * surface a rough turnaround.
 */
export function CaseSubmittedCard({
  matterId,
  answers,
  enterprise = false,
  onStartAnother,
}: {
  matterId?: MatterId;
  answers: AnswersMap;
  enterprise?: boolean;
  onStartAnother?: () => void;
}) {
  const turnaround = estimateTurnaround(answers);

  return (
    <div className="border-border bg-card mz-animate-step overflow-hidden rounded-xl border shadow">
      <div className="space-y-6 px-6 py-7">
        <div className="flex flex-col items-center gap-4 text-center">
          <span
            aria-hidden="true"
            className="border-border text-foreground mz-animate-reveal flex size-12 items-center justify-center rounded-full border"
          >
            <Check
              className="mz-animate-draw size-5 [--mz-draw:88]"
              strokeWidth={1.75}
            />
          </span>
          <p className="text-sm font-medium">Case submitted</p>
        </div>

        {enterprise ? (
          <EnterprisePod turnaround={turnaround} />
        ) : (
          <StandardShowcase matterId={matterId} />
        )}

        <DescriptionList>
          <DescriptionTerm className="border-t-0 sm:border-t-0">
            Estimated response
          </DescriptionTerm>
          <DescriptionDetails className="sm:border-t-0">
            {turnaround}
          </DescriptionDetails>
          <DescriptionTerm className="border-t-0 sm:border-t-0">
            Next step
          </DescriptionTerm>
          <DescriptionDetails className="sm:border-t-0">
            {enterprise
              ? 'Your dedicated Moritz team has been notified and will be in touch.'
              : "We'll prepare your quote. Once it's paid, we'll assign one of our lawyers."}
          </DescriptionDetails>
        </DescriptionList>
      </div>

      <div
        className={cn(
          'bg-muted/40 grid gap-2 p-6',
          onStartAnother ? 'grid-cols-2' : 'grid-cols-1',
        )}
      >
        {onStartAnother ? (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onStartAnother}
          >
            Start another case
          </Button>
        ) : null}
        <Button asChild className="w-full">
          <Link href={NEW_CASE_HREF}>
            Go to case
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

/** Eyebrow label above a lawyer section. */
function SectionEyebrow({ children }: { children: React.ReactNode }) {
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
function LawyerProfile({ lawyer }: { lawyer: OnboardingLawyer }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Avatar className="border-border/60 size-20 border shadow-sm">
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

function EnterprisePod({ turnaround }: { turnaround: string }) {
  const { flags } = useDesignFlags();
  const { connected } = useSlackConnection();
  const slackConnected = Boolean(flags.useSlackIntegration) && connected;
  const [primary, ...rest] = ENTERPRISE_POD;
  if (!primary) return null;
  const firstName = primary.name.split(' ')[0];

  return (
    <div className="space-y-4">
      <SectionEyebrow>Your legal team</SectionEyebrow>
      <LawyerProfile lawyer={primary} />

      {rest.length > 0 ? (
        <div className="flex flex-col items-center gap-2">
          <AvatarGroup>
            {ENTERPRISE_POD.map((lawyer) => (
              <Avatar key={lawyer.id} size="sm">
                <AvatarImage
                  src={lawyer.imageUrl}
                  alt={lawyer.name}
                  className="object-cover"
                />
                <AvatarFallback>{lawyer.initials}</AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
          <p className="text-muted-foreground text-xs">
            Backed by your dedicated Moritz team
          </p>
        </div>
      ) : null}

      <p className="text-muted-foreground text-center text-xs leading-relaxed">
        <strong className="text-foreground font-medium">{firstName}</strong> has
        been notified and will get back to you as soon as possible &mdash;
        typically within {turnaround}.
      </p>

      {slackConnected ? (
        <div className="border-border flex flex-col items-center gap-2 border-t pt-4">
          <p className="text-muted-foreground text-center text-xs">
            Updates will post to your {SLACK_CHANNEL} Slack channel.
          </p>
          <OpenInSlackButton variant="outline" size="sm" context="this case" />
        </div>
      ) : null}
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

function StandardShowcase({ matterId }: { matterId?: MatterId }) {
  const cellRosters = useMemo(
    () =>
      splitRosterIntoCells(
        [...showcaseForMatter(matterId), ...ADDITIONAL_TEAM_LAWYERS],
        SHOWCASE_CELL_COUNT,
      ),
    [matterId],
  );
  const [reducedMotion, setReducedMotion] = useState(false);

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
      <SectionEyebrow>Lawyers who could take this on</SectionEyebrow>
      <ul className="grid grid-cols-3 gap-x-4 gap-y-6">
        {cellRosters.map((roster, cell) => (
          <ShowcaseCell
            key={cell}
            roster={roster}
            delayMs={cell * SHOWCASE_STAGGER_MS}
            reducedMotion={reducedMotion}
          />
        ))}
      </ul>
    </div>
  );
}

function ShowcaseCell({
  roster,
  delayMs,
  reducedMotion,
}: {
  roster: OnboardingLawyer[];
  delayMs: number;
  reducedMotion: boolean;
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
          </div>
        ))}
      </div>
    </li>
  );
}
