'use client';

import { useTranslations } from 'next-intl';
import { Mail } from '@repo/ui/icons';
import { Chip } from '@/components/design/foundations/components/chip';
import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import { useClientEngagement } from '@/components/design/engagement-letter/engagement-letter-context';
import { buildCaseIntakeMailto } from '@/lib/support';

/**
 * Quick-action chip that opens a pre-filled intake email to Moritz.
 *
 * Gated behind the `useEmailCaseAction` design flag.
 */
export function EmailCaseChip() {
  const t = useTranslations('dashboard.client.homepageV2.quickActions');
  const { flags } = useDesignFlags();
  const { enabled, isPending, openSigning } = useClientEngagement();

  if (!flags.useEmailCaseAction) return null;

  if (enabled && isPending) {
    return (
      <Chip onClick={openSigning}>
        <Mail aria-hidden="true" />
        {t('emailCase')}
      </Chip>
    );
  }

  return (
    <Chip asChild>
      <a href={buildCaseIntakeMailto()}>
        <Mail aria-hidden="true" />
        {t('emailCase')}
      </a>
    </Chip>
  );
}
