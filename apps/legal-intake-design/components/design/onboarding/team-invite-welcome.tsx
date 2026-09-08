'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback } from '@repo/ui/components/avatar';
import { ArrowRight } from '@repo/ui/icons';
import MoritzSymbol from '@/components/icons/moritz-symbol';
import { Button } from '@/components/design/design-system/button';
import { Checkbox } from '@/components/design/foundations/components/checkbox';
import {
  Text,
  TextLink,
} from '@/components/design/foundations/components/text';
import { H2, Muted } from '@/components/design/design-system/typography';

interface TeamInviteWelcomeProps {
  /**
   * The person who sent the invite. Often unknown — an invite record may only
   * carry the company — so when absent the screen falls back to company-only
   * copy and a single company avatar.
   */
  inviterName?: string | null;
  companyName: string;
  email: string;
  onContinue: () => void;
  /**
   * Which message namespace supplies the copy. Defaults to the client team
   * invite; the attorney invite flow passes `onboarding.attorneyInvite` to reuse
   * this same screen (hero, consent gate, inviter fallback) with lawyer copy.
   */
  namespace?: 'onboarding.invite' | 'onboarding.attorneyInvite';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (
    parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)
  ).toUpperCase();
}

export function TeamInviteWelcome({
  inviterName,
  companyName,
  email,
  onContinue,
  namespace = 'onboarding.invite',
}: TeamInviteWelcomeProps) {
  const t = useTranslations(namespace);
  const consentId = useId();
  // Consent is captured on the invitation screen, before any data is collected
  // — accepting the invite gates on agreeing to the legal terms.
  const [accepted, setAccepted] = useState(false);

  // The inviter's name is often unknown (the invite may only carry the company).
  // When we have it, we lead with them; otherwise we fall back to company-only
  // copy and a single company avatar so the screen never shows an empty "?".
  const trimmedInviter = inviterName?.trim();
  const hasInviter = Boolean(trimmedInviter);

  return (
    <div className="flex h-full flex-col gap-8">
      {/* Hero: when we know the inviter, an overlapping inviter -> company avatar
          cluster sets the scene; otherwise a single company avatar. Then the
          welcome heading and who invited them. */}
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          {hasInviter ? (
            <div className="flex -space-x-4">
              <Avatar className="ring-background size-16 ring-4">
                <AvatarFallback className="text-base font-medium">
                  {getInitials(trimmedInviter!)}
                </AvatarFallback>
              </Avatar>
              <Avatar className="ring-background size-16 rounded-2xl ring-4">
                <AvatarFallback className="bg-primary/10 text-primary rounded-2xl text-base font-medium">
                  {getInitials(companyName)}
                </AvatarFallback>
              </Avatar>
            </div>
          ) : (
            <MoritzSymbol shine className="text-foreground h-16 w-auto" />
          )}
        </div>
        <div className="space-y-3">
          <H2>{t('title')}</H2>
          <Muted className="mx-auto max-w-md">
            {hasInviter
              ? t('subtitle', { inviterName: trimmedInviter!, companyName })
              : t('subtitleNoInviter', { companyName })}
          </Muted>
        </div>
      </div>

      <div className="mt-auto space-y-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id={consentId}
            checked={accepted}
            onCheckedChange={(value) => setAccepted(value === true)}
            // Optically centre the box on the first line of the label (its
            // line-height is 1.5rem, the box is 18px mobile / 16px desktop).
            className="mt-[3px] sm:mt-1"
          />
          <label htmlFor={consentId} className="cursor-pointer">
            <Text className="text-foreground">
              {t.rich('consent', {
                terms: (chunks) => (
                  <TextLink
                    href="#"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {chunks}
                  </TextLink>
                ),
                privacy: (chunks) => (
                  <TextLink
                    href="#"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {chunks}
                  </TextLink>
                ),
              })}
            </Text>
          </label>
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={onContinue}
          disabled={!accepted}
        >
          {t('accept')}
          <ArrowRight data-icon="inline-end" className="size-4" />
        </Button>
        <Muted className="text-center text-sm">
          {t('invitedAs', { email })}
        </Muted>
      </div>
    </div>
  );
}
