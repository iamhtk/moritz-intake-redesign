'use client';

import { useState } from 'react';
import { PanelRight, UserPlus } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@/components/design/design-system/button';
import {
  AvatarGroup,
  AvatarGroupCount,
} from '@/components/design/foundations/components/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MessageAvatar } from '@/components/messages/message-avatar';
import { CaseHeaderActions } from '@/components/cases/case-header-actions';
import { caseTopBar } from '@/components/cases/case-header-primitives';
import { ShareCaseDialog } from '@/components/cases/share-case-dialog';
import type { LegalCase, ParticipantRef } from '@/lib/types';

const MAX_VISIBLE_AVATARS = 4;

export function ClientCaseHeader({
  legalCase,
  isPanelOpen,
  onTogglePanel,
}: {
  legalCase: LegalCase;
  isPanelOpen: boolean;
  onTogglePanel: () => void;
}) {
  const [participants, setParticipants] = useState<ParticipantRef[]>(
    legalCase.participants,
  );
  const [shareOpen, setShareOpen] = useState(false);

  const visibleParticipants = participants.slice(0, MAX_VISIBLE_AVATARS);
  const overflowCount = participants.length - visibleParticipants.length;

  const handleAddParticipant = (participant: ParticipantRef) => {
    setParticipants((current) =>
      current.some((p) => p.id === participant.id)
        ? current
        : [...current, participant],
    );
  };

  return (
    <TooltipProvider>
      <div className={cn('@container', caseTopBar)}>
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <AvatarGroup>
            {visibleParticipants.map((participant) => (
              <Tooltip key={participant.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`${participant.name} — share case`}
                    onClick={() => setShareOpen(true)}
                    className="focus-visible:outline-ring rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <MessageAvatar
                      participant={participant}
                      className="ring-background size-7 ring-2"
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {participant.name}
                </TooltipContent>
              </Tooltip>
            ))}
            {overflowCount > 0 && (
              <AvatarGroupCount className="ring-background size-7 text-xs ring-2">
                +{overflowCount}
              </AvatarGroupCount>
            )}
          </AvatarGroup>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShareOpen(true)}
                aria-label="Share case"
                className="text-muted-foreground hover:text-foreground border-field size-7 rounded-full border border-dashed"
              >
                <UserPlus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Share case</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <CaseHeaderActions legalCase={legalCase} />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="@max-md:size-8 @max-md:px-0 shrink-0 gap-1.5"
                onClick={onTogglePanel}
                aria-expanded={isPanelOpen}
                aria-controls="case-details-panel"
                aria-label={isPanelOpen ? 'Hide details' : 'View details'}
              >
                <PanelRight aria-hidden="true" className="size-4" />
                <span className="@md:inline hidden">
                  {isPanelOpen ? 'Hide details' : 'View details'}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="md:hidden">
              {isPanelOpen ? 'Hide details' : 'View details'}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <ShareCaseDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        caseNumber={legalCase.caseNumber}
        participants={participants}
        onShare={handleAddParticipant}
      />
    </TooltipProvider>
  );
}
