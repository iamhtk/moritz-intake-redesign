'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ShieldCheck } from '@repo/ui/icons';
import { Chip } from '@/components/design/foundations/components/chip';
import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import { useClientEngagement } from '@/components/design/engagement-letter/engagement-letter-context';

/**
 * Quick-action chip that kicks off a case via the Ironclad integration.
 *
 * Gated behind the `useIroncladIntegration` design flag. The Ironclad handoff
 * has no backend in the playground, so clicking it just surfaces a toast to
 * demonstrate the flow (see app AGENTS.md — tRPC/external calls stay stubbed).
 */
export function IroncladCaseChip() {
  const t = useTranslations('dashboard.client.homepageV2.quickActions');
  const { flags } = useDesignFlags();
  const { enabled, isPending, openSigning } = useClientEngagement();

  if (!flags.useIroncladIntegration) return null;

  return (
    <Chip
      onClick={
        enabled && isPending
          ? openSigning
          : () => toast(t('startWithIroncladToast'))
      }
    >
      <ShieldCheck aria-hidden="true" />
      {t('startWithIronclad')}
    </Chip>
  );
}
