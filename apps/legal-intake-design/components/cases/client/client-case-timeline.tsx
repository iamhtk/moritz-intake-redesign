import { FormattedDate } from '@/components/formatted-date';
import { Check } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { getInvoicesForCase } from '@/lib/mocks/billing';
import type { LegalCase } from '@/lib/types';

type Step = {
  key: string;
  label: string;
  done: boolean;
  at?: string;
};

function timelineFor(legalCase: LegalCase): Step[] {
  const paidInvoice = getInvoicesForCase(legalCase.id).find(
    (invoice) => invoice.status === 'PAID',
  );

  // The stepper is monotonic: reaching a later stage implies every earlier
  // stage is complete, so we derive each flag from the one after it.
  const completedDone = legalCase.status === 'CLOSED';
  const assignedDone = completedDone || !!legalCase.assignedLawyer;
  const paymentDone = assignedDone || !!paidInvoice;
  const quoteDone = paymentDone || legalCase.quoteAmount != null;

  return [
    {
      key: 'submitted',
      label: 'Case submitted',
      done: true,
      at: legalCase.createdAt,
    },
    {
      key: 'quoted',
      label: 'Quote provided',
      done: quoteDone,
      at: quoteDone ? (legalCase.sentToFirmsAt ?? undefined) : undefined,
    },
    {
      key: 'paid',
      label: 'Payment received',
      done: paymentDone,
      at: paymentDone ? (paidInvoice?.paidAt ?? undefined) : undefined,
    },
    {
      key: 'assigned',
      label: 'Lawyer assigned',
      done: assignedDone,
      at: assignedDone ? (legalCase.lawyerAssignedAt ?? undefined) : undefined,
    },
    {
      key: 'completed',
      label: 'Case completed',
      done: completedDone,
      at: completedDone ? legalCase.updatedAt : undefined,
    },
  ];
}

export function ClientCaseTimeline({ legalCase }: { legalCase: LegalCase }) {
  const steps = timelineFor(legalCase);
  return (
    <section className="space-y-3">
      <h4 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        Progress
      </h4>
      <ol className="space-y-0">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <li
              key={step.key}
              className="relative flex flex-col pb-8 last:pb-0"
            >
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-3 top-7 h-[calc(100%-1.25rem)] w-px -translate-x-1/2',
                    step.done ? 'bg-success/30' : 'bg-border',
                  )}
                />
              )}
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    'z-10 flex size-6 shrink-0 items-center justify-center rounded-full',
                    step.done
                      ? 'bg-success text-white'
                      : 'border-border bg-background border',
                  )}
                >
                  {step.done && <Check className="size-3.5" />}
                </span>
                <span
                  className={cn(
                    'text-sm/6 font-medium',
                    !step.done && 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {step.at && (
                <span className="text-muted-foreground ml-10 text-xs">
                  <FormattedDate
                    date={step.at}
                    options={{ dateStyle: 'medium', timeStyle: 'short' }}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
