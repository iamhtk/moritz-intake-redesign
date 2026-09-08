'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from '@repo/ui/icons';
import MoritzSymbol from '@/components/icons/moritz-symbol';
import { Button } from '@/components/design/design-system/button';
import { Checkbox } from '@/components/design/foundations/components/checkbox';
import { Heading } from '@/components/design/foundations/components/heading';
import {
  Text,
  TextLink,
} from '@/components/design/foundations/components/text';

interface ClientWelcomeProps {
  email: string;
  onContinue: () => void;
}

/**
 * Self-serve welcome screen for a client signing up directly from the website
 * (no team invite). Mirrors the TeamInviteWelcome layout but drops the inviter
 * context: a single Moritz brand mark, a welcome heading, what Moritz does, and
 * a "Get started" CTA. There is no lawyer/client choice here — the website
 * signup is already a client, so accepting leads straight into the client
 * details flow.
 */
export function ClientWelcome({ email, onContinue }: ClientWelcomeProps) {
  const t = useTranslations('onboarding.welcome');
  const consentId = useId();
  // Consent is captured here, at the front door, before any personal data is
  // collected — so "Get started" is gated on accepting the legal agreements.
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="flex h-full flex-col gap-8">
      {/* Hero: a single Moritz brand mark and the welcome heading. */}
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <MoritzSymbol shine className="text-foreground h-16 w-auto" />
        </div>
        <Heading style={{ fontWeight: 600 }}>{t('title')}</Heading>
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
          className="group w-full"
          onClick={onContinue}
          disabled={!accepted}
        >
          {t('getStarted')}
          <ArrowRight
            data-icon="inline-end"
            // Only nudge on hover while the button is enabled — the Foundation
            // Button keeps pointer events on when disabled, so a plain
            // `group-hover` would still animate the arrow on a disabled CTA.
            className="size-4 transition-transform duration-200 ease-out group-[&:enabled:hover]:translate-x-0.5"
          />
        </Button>
        <Text className="text-center">{t('signedInAs', { email })}</Text>
      </div>
    </div>
  );
}
