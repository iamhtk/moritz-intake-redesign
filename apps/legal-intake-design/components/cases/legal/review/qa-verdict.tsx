'use client';

import { Check, CircleCheck, TriangleAlert, X } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { Badge } from '@/components/design/foundations/components/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/design/foundations/components/collapsible';
import { FormattedDate } from '@/components/formatted-date';
import { PanelSection } from '@/components/cases/case-detail-primitives';
import { ThingToFixCard } from './thing-to-fix-card';
import { fixCount, type QaCheck, type WorkSubmission } from './review-data';

/**
 * The verdict on one round of work. The brief leads because it is the agent's
 * own summary of where the work stands; the standard checks follow as a list the
 * lawyer can scan, with the ones that failed already open and the ones that
 * passed folded away — a passed check is a reassurance, not reading.
 */
export function QaVerdict({ submission }: { submission: WorkSubmission }) {
  const feedback = submission.feedback;
  if (!feedback) return null;

  const passed = feedback.verdict === 'PASSED';
  const total = fixCount(feedback);
  const failedChecks = feedback.checks.filter(
    (check) => check.status === 'FAILED',
  );

  return (
    <div className="mz-animate-step space-y-6">
      <div
        className={cn(
          'rounded-xl border p-4',
          passed
            ? 'border-green-500/30 bg-green-500/5'
            : 'border-red-500/30 bg-red-500/5',
        )}
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant={passed ? 'success' : 'destructive'}>
            {passed ? (
              <CircleCheck data-icon="inline-start" />
            ) : (
              <TriangleAlert data-icon="inline-start" />
            )}
            {passed ? 'Passed' : 'Failed'}
          </Badge>
          <span className="text-muted-foreground text-xs">
            Submission {submission.round} ·{' '}
            <FormattedDate
              date={submission.submittedAt}
              options={{
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                hour: 'numeric',
                minute: '2-digit',
              }}
            />
          </span>
          {total > 0 ? (
            <span className="text-muted-foreground ml-auto text-xs tabular-nums">
              {total} thing{total === 1 ? '' : 's'} to fix
            </span>
          ) : null}
        </div>
        <p className="text-foreground text-sm leading-relaxed">
          {feedback.brief}
        </p>
      </div>

      {failedChecks.length > 0 ? (
        <PanelSection title="What to fix">
          <div className="space-y-4">
            {failedChecks.map((check) => (
              <FailedCheck key={check.id} check={check} />
            ))}
          </div>
        </PanelSection>
      ) : null}

      {feedback.otherThingsToFix.length > 0 ? (
        <PanelSection title="Also flagged">
          <div className="space-y-3">
            {feedback.otherThingsToFix.map((fix) => (
              <ThingToFixCard key={fix.id} fix={fix} />
            ))}
          </div>
        </PanelSection>
      ) : null}

      <PanelSection
        title="Standard checks"
        action={
          <span className="text-muted-foreground text-xs tabular-nums">
            {
              feedback.checks.filter((check) => check.status === 'PASSED')
                .length
            }
            /{feedback.checks.length} passed
          </span>
        }
      >
        <ul className="border-field divide-border/70 divide-y rounded-xl border">
          {feedback.checks.map((check) => (
            <CheckRow key={check.id} check={check} />
          ))}
        </ul>
      </PanelSection>
    </div>
  );
}

/** A failed check, with its findings laid out ready to work through. */
function FailedCheck({ check }: { check: QaCheck }) {
  return (
    <section className="space-y-2.5">
      <div>
        <h5 className="text-foreground text-sm font-medium">{check.title}</h5>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {check.description}
        </p>
      </div>
      {check.thingsToFix.map((fix) => (
        <ThingToFixCard key={fix.id} fix={fix} />
      ))}
    </section>
  );
}

/**
 * A check in the standard list. Passed checks are a status line; failed ones
 * open to their findings, so the list also works as the way back to a finding
 * after it has been scrolled past above.
 */
function CheckRow({ check }: { check: QaCheck }) {
  const passed = check.status === 'PASSED';

  return (
    <li>
      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger className="group flex w-full items-start gap-3 px-3 py-2.5 text-left">
          <span
            className={cn(
              'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full',
              passed
                ? 'bg-green-500/15 text-green-700'
                : 'bg-red-500/15 text-red-700',
            )}
          >
            {passed ? (
              <Check className="size-3" aria-hidden="true" />
            ) : (
              <X className="size-3" aria-hidden="true" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-foreground block text-sm">{check.title}</span>
            <span className="text-muted-foreground block text-xs">
              {passed
                ? 'Passed'
                : `${check.thingsToFix.length} to fix — tap to read`}
            </span>
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2.5 px-3 pb-3 pl-10">
            <p className="text-muted-foreground text-xs leading-relaxed">
              {check.description}
            </p>
            {check.thingsToFix.map((fix) => (
              <ThingToFixCard key={fix.id} fix={fix} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}
