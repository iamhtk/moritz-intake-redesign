'use client';

import { cn } from '@repo/ui/lib/utils';
import CaseStatusBadge from '@/components/cases/case-status-badge';
import { CaseHeaderActions } from '@/components/cases/case-header-actions';
import {
  CasePanelToggle,
  RelativeUpdatedAt,
  caseTopBar,
} from '@/components/cases/case-header-primitives';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { LegalCase } from '@/lib/types';

export function AdminCaseHeader({
  legalCase,
  isPanelOpen,
  onTogglePanel,
}: {
  legalCase: LegalCase;
  isPanelOpen: boolean;
  onTogglePanel: () => void;
}) {
  return (
    <TooltipProvider>
      <div className={cn('@container', caseTopBar)}>
        <div className="flex min-w-0 shrink items-center gap-3 overflow-hidden">
          <span className="shrink-0">
            <CaseStatusBadge status={legalCase.status} />
          </span>
          <span className="text-muted-foreground @md:inline hidden shrink-0 font-mono text-xs">
            {legalCase.caseNumber}
          </span>
          <RelativeUpdatedAt
            date={legalCase.updatedAt}
            className="@lg:inline hidden"
          />
        </div>

        <div className="min-w-0 flex-1" />

        <CaseHeaderActions legalCase={legalCase} />

        <CasePanelToggle
          isPanelOpen={isPanelOpen}
          onTogglePanel={onTogglePanel}
        />
      </div>
    </TooltipProvider>
  );
}
