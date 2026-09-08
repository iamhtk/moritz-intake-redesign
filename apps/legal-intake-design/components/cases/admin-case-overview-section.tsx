'use client';

import { useState } from 'react';
import { Badge } from '@repo/ui/components/badge';
import { Label } from '@repo/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/design/design-system/select';
import { Link } from '@/i18n/navigation';
import { RichTextViewer } from '@/components/rich-text/rich-text-viewer';
import { caseStatusLabels } from './case-status-badge';
import { toast } from 'sonner';
import type { LegalCase, LegalCaseStatus } from '@/lib/types';

const STATUS_OPTIONS: LegalCaseStatus[] = [
  'READY_FOR_SUBMISSION_REVIEW',
  'READY_FOR_ASSIGNMENT',
  'READY_FOR_CLAIM',
  'IN_PROGRESS',
  'CLOSED',
];

export function AdminCaseOverviewSection({
  legalCase,
}: {
  legalCase: LegalCase;
}) {
  const [status, setStatus] = useState<LegalCaseStatus>(legalCase.status);
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Case number">
          <span className="font-mono text-sm">{legalCase.caseNumber}</span>
        </Field>
        <Field label="Status">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as LegalCaseStatus);
              toast.success('Status updated (mock).');
            }}
          >
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {caseStatusLabels[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Client">
          <Link
            href={`/admin/companies/${legalCase.ownerCompanyId}`}
            className="underline hover:no-underline"
          >
            {legalCase.client.name}
          </Link>{' '}
          <span className="text-muted-foreground text-sm">
            ({legalCase.ownerCompanyName})
          </span>
        </Field>

        <Field label="Assigned lawyer">
          {legalCase.assignedLawyer ? (
            <span>
              {legalCase.assignedLawyer.name}{' '}
              <span className="text-muted-foreground text-sm">
                ({legalCase.legalCompanyName})
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">Not yet assigned</span>
          )}
        </Field>

        <Field label="Claimable firms">
          {legalCase.claimableCompanyIds.length === 0 ? (
            <span className="text-muted-foreground">None</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {legalCase.claimableCompanyIds.map((id) => (
                <Badge key={id} variant="secondary">
                  {id}
                </Badge>
              ))}
            </div>
          )}
        </Field>
      </div>

      <div>
        <Label className="text-muted-foreground mb-2 block text-xs">
          Description
        </Label>
        <RichTextViewer value={legalCase.description} />
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <div>{children}</div>
    </div>
  );
}
