'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { GraduationCap } from '@repo/ui/icons';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/avatar';
import { cn } from '@repo/ui/lib/utils';
import { Heading } from '@/components/design/foundations/components/heading';
import { Text } from '@/components/design/foundations/components/text';
import {
  ONBOARDING_LAWYERS,
  type OnboardingLawyer,
} from '@/components/design/onboarding/onboarding-lawyers';

const ROTATE_MS = 6000;
const FADE_MS = 700;

/**
 * Ambient showcase of Moritz lawyers for the client onboarding brand panel.
 * Reuses the proven `intake-success` crossfade-and-dots rotation: every profile
 * shares one grid cell so the panel never reflows, and we fade between them on a
 * gentle timer. Respects `prefers-reduced-motion` by parking on the first
 * profile (dots still let you browse). Purely decorative-adjacent, so it stays
 * keyboard-light and `aria-hidden`s the inactive layers.
 *
 * The showcase stays mounted while the brand panel fades, so `active` gates the
 * rotation: it only advances while the panel is visible, and resets to the first
 * profile when hidden so each fade-in starts fresh on the first lawyer instead
 * of mid-cycle.
 */
export function OnboardingLawyerShowcase({
  active = true,
}: {
  active?: boolean;
}) {
  const t = useTranslations('onboarding.brandPanel');
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  // While hidden, park on the first profile so the rotation always begins from
  // the top once the panel fades back in.
  useEffect(() => {
    if (!active) setIndex(0);
  }, [active]);

  // Depending on `index` restarts the timer whenever the profile changes —
  // including manual dot clicks — so a click always buys a full dwell. Gated on
  // `active` so the timer never runs while the panel is faded out.
  useEffect(() => {
    if (!active || reducedMotion || ONBOARDING_LAWYERS.length <= 1) return;
    const timeout = window.setTimeout(() => {
      setIndex((current) => (current + 1) % ONBOARDING_LAWYERS.length);
    }, ROTATE_MS);
    return () => window.clearTimeout(timeout);
  }, [active, index, reducedMotion]);

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
      <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
        {t('eyebrow')}
      </span>

      {/* All profiles share one grid cell so the panel is sized to the tallest
          profile and never reflows as we cross-fade between them. */}
      <div className="grid w-full" style={{ gridTemplateAreas: '"stack"' }}>
        {ONBOARDING_LAWYERS.map((lawyer, profileIndex) => (
          <div
            key={lawyer.id}
            aria-hidden={profileIndex !== index}
            className={cn(
              'transition-opacity ease-in-out',
              profileIndex === index
                ? 'opacity-100'
                : 'pointer-events-none opacity-0',
            )}
            style={{
              gridArea: 'stack',
              transitionDuration: `${FADE_MS}ms`,
            }}
          >
            <LawyerProfile lawyer={lawyer} />
          </div>
        ))}
      </div>

      {ONBOARDING_LAWYERS.length > 1 ? (
        <div className="flex justify-center gap-2">
          {ONBOARDING_LAWYERS.map((lawyer, dotIndex) => (
            <button
              key={lawyer.id}
              type="button"
              onClick={() => setIndex(dotIndex)}
              aria-label={t('showProfile', { name: lawyer.name })}
              aria-current={dotIndex === index}
              className={cn(
                'size-1.5 rounded-full transition-colors',
                dotIndex === index
                  ? 'bg-primary'
                  : 'bg-muted hover:bg-muted-foreground/40',
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function LawyerProfile({ lawyer }: { lawyer: OnboardingLawyer }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <Avatar className="border-border/60 size-28 border shadow-sm">
        <AvatarImage
          src={lawyer.imageUrl}
          alt={lawyer.name}
          className="object-cover"
        />
        <AvatarFallback className="text-foreground text-xl font-medium">
          {lawyer.initials}
        </AvatarFallback>
      </Avatar>

      <div className="space-y-1">
        <Heading level={3} style={{ fontWeight: 600 }}>
          {lawyer.name}
        </Heading>
        <Text className="text-muted-foreground text-sm">{lawyer.title}</Text>
      </div>

      <Text className="text-foreground text-balance">
        &ldquo;{lawyer.tagline}&rdquo;
      </Text>

      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <GraduationCap aria-hidden className="size-4 shrink-0" />
        <span>{lawyer.education}</span>
      </div>
    </div>
  );
}
