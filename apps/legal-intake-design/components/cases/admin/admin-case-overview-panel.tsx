'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/design/foundations/components/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/design/design-system/select';
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from '@/components/design/foundations/components/description-list';
import { FormattedDate } from '@/components/formatted-date';
import { ClientCaseBrief } from '@/components/cases/client/client-case-brief';
import { caseStatusLabels } from '@/components/cases/case-status-badge';
import {
  CaseCounselCard,
  DescriptionRow,
  PanelEmpty,
  PanelSection,
  ParticipantRow,
} from '@/components/cases/case-detail-primitives';
import { MOCK_COMPANIES } from '@/lib/mocks/companies';
import { formatCurrency, regionName } from '@/lib/utils';
import type { LegalCase, LegalCaseStatus } from '@/lib/types';

const STATUS_OPTIONS: LegalCaseStatus[] = [
  'READY_FOR_SUBMISSION_REVIEW',
  'READY_FOR_ASSIGNMENT',
  'READY_FOR_CLAIM',
  'IN_PROGRESS',
  'CLOSED',
];

/**
 * Sleek admin overview for the "Case details" panel: a metadata description list
 * (with an inline, editable status control), counsel and parties, the firms that
 * can claim the case, and the brief — matching the client/lawyer panel language.
 */
export function AdminCaseOverviewPanel({
  legalCase,
}: {
  legalCase: LegalCase;
}) {
  const [status, setStatus] = useState<LegalCaseStatus>(legalCase.status);

  const claimableFirms = legalCase.claimableCompanyIds.map(
    (id) => MOCK_COMPANIES.find((c) => c.id === id)?.name ?? id,
  );

  return (
    <div className="mz-animate-step space-y-8">
      <DescriptionList>
        <DescriptionRow
          label="Case number"
          value={<span className="font-mono">{legalCase.caseNumber}</span>}
        />
        <DescriptionRow
          label="Status"
          value={
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as LegalCaseStatus);
                toast.success('Status updated (mock).');
              }}
            >
              <SelectTrigger size="sm" className="w-auto gap-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {caseStatusLabels[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
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
      </DescriptionList>

      <PanelSection title="Counsel">
        <CaseCounselCard
          lawyer={legalCase.assignedLawyer}
          emptyLabel="Not yet assigned."
        />
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

      <PanelSection title="Claimable firms">
        {claimableFirms.length === 0 ? (
          <PanelEmpty>No firms can claim this case yet.</PanelEmpty>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {claimableFirms.map((name) => (
              <Badge key={name} variant="secondary">
                {name}
              </Badge>
            ))}
          </div>
        )}
      </PanelSection>

      <ClientCaseBrief legalCase={legalCase} />
    </div>
  );
}
