import { CalendarClock } from '@repo/ui/icons';
import { DescriptionList } from '@/components/design/foundations/components/description-list';
import { FormattedDate } from '@/components/formatted-date';
import { ClientCaseTimeline } from '@/components/cases/client/client-case-timeline';
import { ClientCaseBrief } from '@/components/cases/client/client-case-brief';
import {
  CaseCounselCard,
  DescriptionRow,
  PanelEmpty,
  PanelSection,
  ParticipantRow,
} from '@/components/cases/case-detail-primitives';
import type { LegalCase } from '@/lib/types';

/**
 * Case details content (summary, progress timeline, counsel, parties, brief)
 * for a client case. Rendered inside the docked "Case details" side panel now
 * that the Overview tab is a full-bleed chat.
 */
export function ClientCaseDetailsPanel({
  legalCase,
}: {
  legalCase: LegalCase;
}) {
  return (
    <div className="mz-animate-step space-y-8">
      <PanelSection title="Counsel">
        <CaseCounselCard lawyer={legalCase.assignedLawyer} />
      </PanelSection>

      <SummaryBlock legalCase={legalCase} />

      <ClientCaseTimeline legalCase={legalCase} />

      <PanelSection title="Opposing party">
        {legalCase.opposingParty ? (
          <ParticipantRow participant={legalCase.opposingParty} />
        ) : (
          <PanelEmpty>No opposing party on record.</PanelEmpty>
        )}
      </PanelSection>

      <ClientCaseBrief legalCase={legalCase} />
    </div>
  );
}

function SummaryBlock({ legalCase }: { legalCase: LegalCase }) {
  if (!legalCase.claimDeadline) return null;

  return (
    <DescriptionList>
      <DescriptionRow
        label="Claim deadline"
        value={
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock
              aria-hidden="true"
              className="text-muted-foreground size-3.5"
            />
            <FormattedDate
              date={legalCase.claimDeadline}
              options={{ dateStyle: 'medium' }}
            />
          </span>
        }
      />
    </DescriptionList>
  );
}
