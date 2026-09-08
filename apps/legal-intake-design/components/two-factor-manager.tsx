'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { ShieldCheck } from '@repo/ui/icons';
import { Button } from '@/components/design/design-system/button';
import { FormattedDate } from '@/components/formatted-date';
import { Muted } from '@/components/design/design-system/typography';

type TwoFactorState = {
  available: boolean;
  enrolled: boolean;
  factor: { id: string; createdAt: Date } | null;
};

const INITIAL_STATE: TwoFactorState = {
  available: true,
  enrolled: false,
  factor: null,
};

/**
 * Playground replacement for the production `TwoFactorManager`. Renders the
 * same enable/disable surface but skips the QR-code + TOTP enrollment dialog —
 * the user's "minimal flows" choice meant we don't wire that up here.
 * Engineers can lift this back to prod by restoring the InputOTP-driven
 * enrollment dialog and swapping the local state for the `security.*` tRPC
 * procedures.
 */
export function TwoFactorManager() {
  const t = useTranslations('settings.security.twoFactor');
  const [state, setState] = useState<TwoFactorState>(INITIAL_STATE);

  if (!state.available) return null;

  const handleEnable = () => {
    setState({
      available: true,
      enrolled: true,
      factor: { id: 'fct_mock_001', createdAt: new Date() },
    });
    toast.success('Two-factor authentication enabled (mock).');
  };

  const handleDisable = () => {
    setState({ available: true, enrolled: false, factor: null });
    toast.success('Two-factor authentication disabled (mock).');
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-medium">{t('title')}</h3>
        <Muted>{t('description')}</Muted>
      </div>
      {state.enrolled && state.factor ? (
        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-muted-foreground h-5 w-5" />
            <div>
              <p className="text-sm font-medium">{t('enabled')}</p>
              <p className="text-muted-foreground text-xs">
                {t('enabledOn')} <FormattedDate date={state.factor.createdAt} />
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDisable}>
            {t('disable')}
          </Button>
        </div>
      ) : (
        <Button variant="outline" onClick={handleEnable}>
          {t('enable')}
        </Button>
      )}
    </div>
  );
}
