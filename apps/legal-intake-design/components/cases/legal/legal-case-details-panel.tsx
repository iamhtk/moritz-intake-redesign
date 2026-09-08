import { CalendarClock } from '@repo/ui/icons';
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from '@/components/design/foundations/components/description-list';
import { FormattedDate } from '@/components/formatted-date';
import { ClientCaseBrief } from '@/components/cases/client/client-case-brief';
import {
  CaseCounselCard,
  DescriptionRow,
  PanelSection,
  ParticipantRow,
} from '@/components/cases/case-detail-primitives';
import { formatCurrency, regionName } from '@/lib/utils';
import type { LegalCase } from '@/lib/types';

/**
 * Case details content (summary, counsel, parties, brief) for the legal view.
 * Rendered inside the docked "Case details" side panel now that the main area
 * is a full-bleed conversation with the client. Built from the same primitives
 * as the client and admin panels, in the same order, so the case reads the same
 * whoever opens it.
 */
export function LegalCaseDetailsPanel({ legalCase }: { legalCase: LegalCase }) {
  return (
    <div className="mz-animate-step space-y-8">
      <SummaryBlock legalCase={legalCase} />

      <PanelSection title="Counsel">
        <CaseCounselCard lawyer={legalCase.assignedLawyer} />
      </PanelSection>

      <PanelSection title="Parties">
        <DescriptionList>
          <DescriptionTerm>Client</DescriptionTerm>
          <DescriptionDetails>
            <ParticipantRow participant={legalCase.client} />
          </DescriptionDetails>
          {legalCase.opposingParty && (
            <>
              <DescriptionTerm>Opposing party</DescriptionTerm>
              <DescriptionDetails>
                <ParticipantRow participant={legalCase.opposingParty} />
              </DescriptionDetails>
            </>
          )}
        </DescriptionList>
      </PanelSection>

      <ClientCaseBrief legalCase={legalCase} />
    </div>
  );
}

function SummaryBlock({ legalCase }: { legalCase: LegalCase }) {
  return (
    <DescriptionList>
      <DescriptionRow
        label="Case number"
        value={<span className="font-mono">{legalCase.caseNumber}</span>}
      />
      <DescriptionRow
        label="Opened"
        value={
          <FormattedDate
            date={legalCase.createdAt}
            options={{ dateStyle: 'medium' }}
          />
        }
      />
      <DescriptionRow
        label="Jurisdiction"
        value={regionName(legalCase.country)}
      />
      {legalCase.quoteAmount != null && (
        <DescriptionRow
          label="Quote"
          value={formatCurrency(legalCase.quoteAmount, legalCase.currency)}
        />
      )}
      {legalCase.claimDeadline && (
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
      )}
    </DescriptionList>
  );
}
