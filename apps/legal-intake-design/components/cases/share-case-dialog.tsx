'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Link2, Search } from '@repo/ui/icons';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/design/foundations/components/dialog';
import { Button } from '@/components/design/design-system/button';
import { Input } from '@/components/design/foundations/components/input';
import { MessageAvatar } from '@/components/messages/message-avatar';
import type { ParticipantRef } from '@/lib/types';

/**
 * Mock roster of teammates the case can be shared with. Playground-only —
 * productionising this would fetch the sharer's team members from the API.
 */
const TEAM: ParticipantRef[] = [
  {
    id: 'usr_client_010',
    name: 'Nadia Okonkwo',
    email: 'nadia.okonkwo@northwindltd.com',
    image: '/onboarding-lawyers/amara-okonkwo.jpg',
    actor: 'client',
    companyName: 'Northwind Ltd.',
  },
  {
    id: 'usr_client_011',
    name: 'Tomás Herrera',
    email: 'tomas.herrera@northwindltd.com',
    image: '/onboarding-lawyers/maxim-van-eeckhout.png',
    actor: 'client',
    companyName: 'Northwind Ltd.',
  },
  {
    id: 'usr_client_012',
    name: 'Priya Raman',
    email: 'priya.raman@northwindltd.com',
    image: '/onboarding-lawyers/mei-lin-chen.jpg',
    actor: 'client',
    companyName: 'Northwind Ltd.',
  },
  {
    id: 'usr_client_014',
    name: 'Sofia Marchetti',
    email: 'sofia.marchetti@northwindltd.com',
    image: '/onboarding-lawyers/sofia-marchetti.jpg',
    actor: 'client',
    companyName: 'Northwind Ltd.',
  },
  {
    id: 'usr_client_015',
    name: 'Daniel Osei',
    email: 'daniel.osei@northwindltd.com',
    image: '/onboarding-lawyers/daniel-foss.jpg',
    actor: 'client',
    companyName: 'Northwind Ltd.',
  },
  {
    id: 'usr_client_016',
    name: 'Hannah Kowalski',
    email: 'hannah.kowalski@northwindltd.com',
    image: null,
    actor: 'client',
    companyName: 'Northwind Ltd.',
  },
];

export function ShareCaseDialog({
  open,
  onOpenChange,
  caseNumber,
  participants,
  onShare,
  title = 'Share case',
  description = 'Share this case with people on your team so they can view and message on it.',
  shareLink: shareLinkProp,
  resourceLabel = 'case',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Used to build the default share link when `shareLink` is not provided. */
  caseNumber?: string;
  /** People already on the case — filtered out of the shareable roster. */
  participants?: ParticipantRef[];
  /** Called when a teammate is granted access, e.g. to update header avatars. */
  onShare?: (person: ParticipantRef) => void;
  /** Dialog heading — override for non-case resources (e.g. playbooks). */
  title?: string;
  /** Dialog subtext — override for non-case resources. */
  description?: string;
  /** Explicit share link; falls back to the case link built from `caseNumber`. */
  shareLink?: string;
  /** Noun used in toast/empty-state copy, e.g. "case" or "playbook". */
  resourceLabel?: string;
}) {
  const [query, setQuery] = useState('');
  const [sharedIds, setSharedIds] = useState<Set<string>>(new Set());

  const shareLink =
    shareLinkProp ?? `https://app.moritz.legal/cases/${caseNumber}`;
  const normalizedQuery = query.trim().toLowerCase();
  const participantIds = new Set((participants ?? []).map((p) => p.id));
  const team = TEAM.filter((person) => !participantIds.has(person.id)).filter(
    (person) =>
      normalizedQuery.length === 0 ||
      person.name.toLowerCase().includes(normalizedQuery) ||
      person.email.toLowerCase().includes(normalizedQuery),
  );

  const handleShare = (person: ParticipantRef) => {
    setSharedIds((current) => new Set(current).add(person.id));
    onShare?.(person);
    toast.success(
      `${person.name} can now access this ${resourceLabel} (mock).`,
    );
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard?.writeText(shareLink);
      toast.success('Link copied (mock).');
    } catch {
      toast.error('Could not copy the link.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5">
          <div className="space-y-2">
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2" />
              <Input
                type="search"
                placeholder="Search your team"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search your team"
                className="[&_input]:pl-9"
              />
            </div>

            {team.length > 0 ? (
              <ul className="divide-border/60 max-h-64 divide-y overflow-y-auto">
                {team.map((person) => {
                  const isShared = sharedIds.has(person.id);
                  return (
                    <li
                      key={person.id}
                      className="flex items-center gap-3 py-2.5"
                    >
                      <MessageAvatar
                        participant={person}
                        className="size-8 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {person.name}
                        </div>
                        <div className="text-muted-foreground truncate text-xs">
                          {person.email}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        disabled={isShared}
                        onClick={() => handleShare(person)}
                      >
                        {isShared ? (
                          <>
                            <Check data-icon="inline-start" />
                            Shared
                          </>
                        ) : (
                          'Share'
                        )}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="border-field text-muted-foreground rounded-xl border border-dashed px-3 py-4 text-center text-sm">
                {normalizedQuery.length > 0
                  ? 'No teammates match your search.'
                  : `Everyone on your team already has access to this ${resourceLabel}.`}
              </div>
            )}
          </div>

          <div className="border-border/70 space-y-2 border-t pt-5">
            <label
              htmlFor="share-case-link"
              className="text-muted-foreground text-[0.6875rem] font-medium uppercase tracking-wide"
            >
              Share by link
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="share-case-link"
                type="text"
                readOnly
                value={shareLink}
                aria-label={`${title} link`}
                onFocus={(event) => event.target.select()}
              />
              <Button
                type="button"
                variant="secondary"
                className="shrink-0"
                onClick={handleCopyLink}
              >
                <Link2 data-icon="inline-start" />
                Copy link
              </Button>
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Done
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
