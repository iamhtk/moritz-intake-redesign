'use client';

import { useTranslations } from 'next-intl';
import { Ban } from '@repo/ui/icons';
import {
  H2,
  Muted,
  TextLink,
} from '@/components/design/design-system/typography';

export function InactiveUserCard() {
  const t = useTranslations('onboarding.inactive');

  return (
    <div className="space-y-6 pt-16 lg:pt-28">
      <div className="flex items-center gap-3">
        <span className="border-border text-foreground mz-animate-reveal flex size-10 shrink-0 items-center justify-center rounded-full border">
          <Ban
            className="mz-animate-draw size-5 [--mz-draw:64]"
            strokeWidth={1.75}
          />
        </span>
        <H2>{t('title')}</H2>
      </div>
      <div className="space-y-3">
        <Muted>{t('description')}</Muted>
        <Muted>
          {t.rich('help', {
            support: (chunks) => (
              <TextLink href="mailto:support@moritzlegal.com">
                {chunks}
              </TextLink>
            ),
          })}
        </Muted>
      </div>
    </div>
  );
}
