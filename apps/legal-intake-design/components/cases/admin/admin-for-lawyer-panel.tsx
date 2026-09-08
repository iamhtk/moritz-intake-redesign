'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/design/foundations/components/badge';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Field, FieldLabel } from '@repo/ui/components/field';
import { Label } from '@repo/ui/components/label';
import { Button } from '@/components/design/design-system/button';
import { Input } from '@/components/design/design-system/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/design/design-system/select';
import { FormattedDate } from '@/components/formatted-date';
import { MOCK_CASE_TYPES } from '@/lib/mocks/case-types';
import { MOCK_COMPANIES } from '@/lib/mocks/companies';
import { MOCK_QUOTE_ROUNDS } from '@/lib/mocks/quotes';
import { formatCurrency } from '@/lib/utils';
import type { LegalCase } from '@/lib/types';
import {
  MetaList,
  MetaRow,
  PanelSection,
} from '@/components/cases/case-detail-primitives';

/**
 * Lawyer-facing admin controls in the "Case details" panel: edit case
 * properties, publish the proposal to firms, and manage the quote round. The
 * first draft is its own tab, so it does not report in here.
 */
export function AdminForLawyerPanel({ legalCase }: { legalCase: LegalCase }) {
  return (
    <div className="mz-animate-step space-y-8">
      <CasePropertiesSection legalCase={legalCase} />
      <PublishProposalSection legalCase={legalCase} />
      <QuoteRoundSection legalCase={legalCase} />
    </div>
  );
}

function CasePropertiesSection({ legalCase }: { legalCase: LegalCase }) {
  const [title, setTitle] = useState(legalCase.title);
  const [caseTypeId, setCaseTypeId] = useState(legalCase.caseTypeId);

  return (
    <PanelSection title="Case properties">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          toast.success('Case properties updated (mock).');
        }}
        className="space-y-3"
      >
        <Field>
          <FieldLabel htmlFor="case-title">Title</FieldLabel>
          <Input
            id="case-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>Case type</FieldLabel>
          <Select value={caseTypeId} onValueChange={setCaseTypeId}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOCK_CASE_TYPES.map((caseType) => (
                <SelectItem key={caseType.id} value={caseType.id}>
                  {caseType.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="flex justify-end">
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </PanelSection>
  );
}

function PublishProposalSection({ legalCase }: { legalCase: LegalCase }) {
  const legalCompanies = MOCK_COMPANIES.filter(
    (company) => company.type === 'LEGAL' && company.whitelisted,
  );
  const [selected, setSelected] = useState<string[]>(
    legalCase.claimableCompanyIds,
  );

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  };

  return (
    <PanelSection title="Publish proposal">
      <p className="text-muted-foreground text-sm leading-relaxed">
        Pick which firms should be able to claim this case once it&apos;s
        published.
      </p>
      <ul className="border-field divide-border/70 divide-y rounded-xl border">
        {legalCompanies.map((company) => (
          <li key={company.id} className="flex items-start gap-3 px-4 py-3">
            <Checkbox
              id={`claim-${company.id}`}
              checked={selected.includes(company.id)}
              onCheckedChange={() => toggle(company.id)}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <Label
                htmlFor={`claim-${company.id}`}
                className="text-sm font-medium"
              >
                {company.name}
              </Label>
              {company.description && (
                <p className="text-muted-foreground text-xs leading-snug">
                  {company.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div className="flex justify-end">
        <Button onClick={() => toast.success('Proposal published (mock).')}>
          Publish to selected firms
        </Button>
      </div>
    </PanelSection>
  );
}

function QuoteRoundSection({ legalCase }: { legalCase: LegalCase }) {
  const round = MOCK_QUOTE_ROUNDS.find((q) => q.caseId === legalCase.id);

  if (!round) {
    return (
      <PanelSection title="Quote round">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            toast.success('Quote round created (mock).');
          }}
          className="space-y-3"
        >
          <p className="text-muted-foreground text-sm leading-relaxed">
            Open a quote round to collect bids from invited firms.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="benchmark">Benchmark price</FieldLabel>
              <Input id="benchmark" type="number" placeholder="0" />
            </Field>
            <Field>
              <FieldLabel htmlFor="expiry">Auction expiry</FieldLabel>
              <Input id="expiry" type="datetime-local" />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button type="submit">Open quote round</Button>
          </div>
        </form>
      </PanelSection>
    );
  }

  return (
    <PanelSection
      title="Quote round"
      action={
        round.conflictReported ? (
          <Badge variant="destructive">Conflict</Badge>
        ) : undefined
      }
    >
      <MetaList>
        <MetaRow
          label="Benchmark"
          value={
            round.benchmarkAmount
              ? formatCurrency(round.benchmarkAmount, round.currency)
              : 'None'
          }
        />
        <MetaRow
          label="Your quote"
          value={
            <span className="inline-flex items-center gap-1.5">
              {round.yourQuoteAmount
                ? formatCurrency(round.yourQuoteAmount, round.currency)
                : 'None'}
              <span className="text-muted-foreground text-xs font-normal">
                ({round.yourQuoteStatus})
              </span>
            </span>
          }
        />
        <MetaRow
          label="Expires"
          value={
            <FormattedDate
              date={round.expiresAt}
              options={{ dateStyle: 'medium', timeStyle: 'short' }}
            />
          }
        />
      </MetaList>
      {round.adminNotes && (
        <p className="text-muted-foreground text-xs italic">
          {round.adminNotes}
        </p>
      )}
    </PanelSection>
  );
}
