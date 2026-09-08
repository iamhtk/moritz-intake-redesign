import type { ReactNode } from 'react';
import { Clock } from '@repo/ui/icons';
import {
  DescriptionDetails,
  DescriptionTerm,
} from '@/components/design/foundations/components/description-list';
import { MessageAvatar } from '@/components/messages/message-avatar';
import type { ParticipantRef } from '@/lib/types';

/**
 * The building blocks every "Case details" panel is made of — client, lawyer
 * and admin alike: uppercase tracked eyebrows, bordered `border-field`
 * metadata lists, and dashed empty states. Shared so the same case looks the
 * same whoever is reading it.
 */

export function PanelSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          {title}
        </h4>
        {action}
      </div>
      {children}
    </section>
  );
}

export function MetaList({ children }: { children: ReactNode }) {
  return (
    <dl className="border-field divide-border/70 divide-y rounded-xl border px-4">
      {children}
    </dl>
  );
}

export function MetaRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground min-w-0 text-right font-medium">
        {value}
      </dd>
    </div>
  );
}

/** A label/value pair for a foundation `DescriptionList`. */
export function DescriptionRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <>
      <DescriptionTerm>{label}</DescriptionTerm>
      <DescriptionDetails>{value}</DescriptionDetails>
    </>
  );
}

export function PanelEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="border-field text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-sm">
      {children}
    </div>
  );
}

export function ParticipantRow({
  participant,
  label,
  inset = false,
}: {
  participant: ParticipantRef;
  label?: string;
  inset?: boolean;
}) {
  return (
    <div
      className={
        inset ? 'flex items-center gap-3 py-3' : 'flex items-center gap-3'
      }
    >
      <MessageAvatar participant={participant} className="h-9 w-9" />
      <div className="min-w-0 flex-1">
        {label && (
          <div className="text-muted-foreground text-[0.6875rem] font-medium uppercase tracking-wide">
            {label}
          </div>
        )}
        <div className="truncate text-sm font-medium">{participant.name}</div>
        {participant.companyName && (
          <div className="text-muted-foreground truncate text-xs">
            {participant.companyName}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * The assigned lawyer with the response-time footer the client sees — the one
 * bit of the panel that sets an expectation, so admins read the same promise.
 */
export function CaseCounselCard({
  lawyer,
  emptyLabel = 'No lawyer assigned yet.',
}: {
  lawyer?: ParticipantRef | null;
  emptyLabel?: string;
}) {
  if (!lawyer) return <PanelEmpty>{emptyLabel}</PanelEmpty>;

  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <div className="p-3">
        <ParticipantRow participant={lawyer} />
      </div>
      <div className="text-muted-foreground bg-muted/40 flex items-center gap-1.5 px-3 py-2 text-xs">
        <Clock aria-hidden="true" className="size-3.5 shrink-0" />
        <span>
          Typically responds in{' '}
          <span className="text-foreground font-medium">24–48 hours</span>
        </span>
      </div>
    </div>
  );
}
