'use client';

import { Clock, GraduationCap } from '@repo/ui/icons';
import { Card } from '@repo/ui/components/card';
import { MessageAvatar } from '@/components/messages/message-avatar';
import { ONBOARDING_LAWYERS } from '@/components/design/onboarding/onboarding-lawyers';
import type { ParticipantRef } from '@/lib/types';

/**
 * "Counsel assigned" milestone rendered inline in the case chat, marking the
 * intake -> counsel handoff. Mirrors the Overview panel's Counsel card — a
 * lawyer profile row over a muted response-time footer — with the assigned
 * lawyer's education surfaced as a credential. A profile card, not an
 * actionable one, centered and width-capped like the other chat event cards.
 */
export function LawyerAssignedCard({ lawyer }: { lawyer: ParticipantRef }) {
  const profile = ONBOARDING_LAWYERS.find((l) => l.name === lawyer.name);

  return (
    <div className="flex justify-center py-1">
      <Card className="w-full max-w-md gap-0 overflow-hidden py-0 shadow-none">
        <div className="flex items-center gap-3 p-4">
          <MessageAvatar participant={lawyer} className="size-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-snug">
              <span className="font-medium">{lawyer.name}</span>
              <span className="text-muted-foreground">
                {' '}
                was assigned as counsel
              </span>
            </p>
            {profile?.education ? (
              <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                <GraduationCap
                  aria-hidden="true"
                  className="size-3.5 shrink-0"
                />
                <span className="truncate">{profile.education}</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="text-muted-foreground bg-muted/40 flex items-center gap-1.5 px-4 py-2.5 text-xs">
          <Clock aria-hidden="true" className="size-3.5 shrink-0" />
          <span>
            Typically responds in{' '}
            <span className="text-foreground font-medium">24–48 hours</span>
          </span>
        </div>
      </Card>
    </div>
  );
}
