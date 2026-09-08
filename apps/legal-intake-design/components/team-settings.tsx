'use client';

import {
  useMemo,
  useCallback,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Mail } from '@repo/ui/icons';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/avatar';
import { Button } from '@/components/design/design-system/button';
import { Input } from '@/components/design/design-system/input';
import { Badge } from '@repo/ui/components/badge';
import type { CompanyInvitationStatus } from '@/lib/types';
import { getInitials } from '@/lib/utils';
import { useDateFormatter } from '@/components/formatted-date';
import { Muted } from '@/components/design/design-system/typography';
import type {
  RegistrationInvitation,
  RegistrationMember,
  RegistrationUser,
} from './registration-types';

interface TeamSettingsProps {
  user: RegistrationUser;
  invitations: RegistrationInvitation[];
  updateCompany: boolean;
  onUpdate: () => void;
}

export function TeamSettings({
  user,
  invitations: initialInvitations,
}: TeamSettingsProps) {
  const tTeam = useTranslations('registration.team');
  const company = user.company;
  const hasCompany = !!company?.id;

  const [members, setMembers] = useState<RegistrationMember[]>(
    company?.members ?? [],
  );
  const [invitations, setInvitations] =
    useState<RegistrationInvitation[]>(initialInvitations);

  const inviteSuccessMessage = tTeam('invite.success');
  const revokeSuccessMessage = tTeam('invites.revokeSuccess');
  const removeMemberSuccessMessage = tTeam('members.removeSuccess');
  const emailMissingToast = tTeam('invite.errorMissingEmail');

  const handleInviteSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      const emailValue = String(formData.get('email') ?? '').trim();
      if (!emailValue) {
        toast.error(emailMissingToast);
        return;
      }

      const newInvitation: RegistrationInvitation = {
        id: `inv_mock_${Date.now()}`,
        email: emailValue.toLowerCase(),
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        acceptedAt: null,
      };
      setInvitations((prev) => [newInvitation, ...prev]);
      toast.success(inviteSuccessMessage);
      form.reset();
    },
    [inviteSuccessMessage, emailMissingToast],
  );

  const handleRevokeInvitation = useCallback(
    (invitationId: string) => {
      setInvitations((prev) =>
        prev.map((invite) =>
          invite.id === invitationId
            ? { ...invite, status: 'REVOKED' }
            : invite,
        ),
      );
      toast.success(revokeSuccessMessage);
    },
    [revokeSuccessMessage],
  );

  const handleRemoveMember = useCallback(
    (memberId: string) => {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success(removeMemberSuccessMessage);
    },
    [removeMemberSuccessMessage],
  );

  const createFormatter = useDateFormatter();
  const dateFormatter = useMemo(
    () => createFormatter({ dateStyle: 'medium', timeStyle: 'short' }),
    [createFormatter],
  );

  return (
    <div className="space-y-8">
      {user.isCompanyOwner && hasCompany ? (
        <div className="space-y-8">
          {members.length > 0 && (
            <section className="space-y-2">
              <SectionLabel>{tTeam('members.heading')}</SectionLabel>
              <ul className="divide-border/60 divide-y">
                {members.map((member: RegistrationMember) => {
                  const isCurrentUser = member.id === user.id;
                  return (
                    <li
                      key={member.id}
                      className="flex items-center gap-3 py-2.5"
                    >
                      <MemberAvatar name={member.name} image={member.image} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {member.name ?? tTeam('members.unknownName')}
                          </span>
                          {!member.enabled && (
                            <Badge variant="outline" className="shrink-0">
                              {tTeam('members.disabled')}
                            </Badge>
                          )}
                        </div>
                        <div className="text-muted-foreground truncate text-xs">
                          {member.email ?? tTeam('members.noEmail')}
                        </div>
                      </div>
                      {!isCurrentUser && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          {tTeam('members.remove')}
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className="space-y-2">
            <label
              htmlFor="invite-email"
              className="text-muted-foreground text-[0.6875rem] font-medium uppercase tracking-wide"
            >
              {tTeam('invite.heading')}
            </label>
            <form
              onSubmit={handleInviteSubmit}
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              <Input
                id="invite-email"
                name="email"
                type="email"
                aria-label={tTeam('invite.emailLabel')}
                placeholder={tTeam('invite.placeholder')}
                required
                className="flex-1"
              />
              <Button type="submit" className="shrink-0">
                <Mail data-icon="inline-start" />
                {tTeam('invite.button')}
              </Button>
            </form>
          </section>

          {invitations.length > 0 && (
            <section className="border-border/70 space-y-2 border-t pt-6">
              <SectionLabel>{tTeam('invites.heading')}</SectionLabel>
              <ul className="divide-border/60 divide-y">
                {invitations.map((invite: RegistrationInvitation) => {
                  const statusKey =
                    `invites.status.${invite.status}` as `invites.status.${CompanyInvitationStatus}`;
                  const statusLabel = tTeam(statusKey);
                  const sentLabel = tTeam('invites.sentOn', {
                    date: dateFormatter.format(new Date(invite.createdAt)),
                  });

                  return (
                    <li
                      key={invite.id}
                      className="flex items-center gap-3 py-2.5"
                    >
                      <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full">
                        <Mail
                          className="text-muted-foreground size-4"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {invite.email}
                        </div>
                        <div className="text-muted-foreground truncate text-xs">
                          {sentLabel}
                        </div>
                      </div>
                      <Badge
                        variant={
                          invite.status === 'PENDING'
                            ? 'secondary'
                            : invite.status === 'ACCEPTED'
                              ? 'success'
                              : 'outline'
                        }
                        className="shrink-0"
                      >
                        {statusLabel}
                      </Badge>
                      {invite.status === 'PENDING' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => handleRevokeInvitation(invite.id)}
                        >
                          {tTeam('invites.revoke')}
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <Muted>{tTeam('ownerRequired')}</Muted>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-muted-foreground text-[0.6875rem] font-medium uppercase tracking-wide">
      {children}
    </h3>
  );
}

function MemberAvatar({
  name,
  image,
}: {
  name: string | null;
  image?: string | null;
}) {
  return (
    <Avatar className="size-8 shrink-0">
      <AvatarImage
        src={image ?? undefined}
        alt={name ?? ''}
        className="object-cover"
      />
      <AvatarFallback className="bg-muted text-foreground text-[10px] font-medium">
        {name ? getInitials(name) : '?'}
      </AvatarFallback>
    </Avatar>
  );
}
