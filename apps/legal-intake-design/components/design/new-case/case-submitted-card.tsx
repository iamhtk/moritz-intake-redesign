'use client';

import { ArrowRight, Check } from '@repo/ui/icons';
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
import { Link } from '@/i18n/navigation';
import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import { useSlackConnection } from '@/components/design/slack/slack-connection-context';
import { OpenInSlackButton } from '@/components/design/slack/open-in-slack-button';
import { SLACK_CHANNEL } from '@/components/design/slack/slack-config';
import { SUBMITTED_CASE_ID } from '@/lib/mocks/cases';
import { estimateTurnaround } from './extract';
import { type AnswersMap, type MatterId } from './intake-types';

/**
 * Where "Go to case" lands (Decision 8).
 *
 * It used to deep-link to the mock client's most recent *existing* case, an
 * in-progress matter with a cancelled invoice — so a reviewer who clicked it
 * read the prototype as broken. There is now one mock case standing for the
 * case just submitted, awaiting quote and created today, and both this card and
 * the v2 confirmation point at it.
 */
const NEW_CASE_HREF = `/client/cases/${SUBMITTED_CASE_ID}`;
import { ENTERPRISE_POD } from './lawyers';
import {
  LawyerProfile,
  LawyerShowcase,
  SectionEyebrow,
} from './lawyer-showcase';

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
          <LawyerShowcase matterId={matterId} />
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
