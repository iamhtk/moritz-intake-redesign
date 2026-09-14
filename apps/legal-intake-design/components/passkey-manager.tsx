'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { toastUndo } from '@/lib/toast-undo';
import { Button } from '@/components/design/design-system/button';
import { Fingerprint, Trash2, Plus } from '@repo/ui/icons';
import { useTranslations } from 'next-intl';
import { FormattedDate } from '@/components/formatted-date';
import { Muted } from '@/components/design/design-system/typography';

interface Passkey {
  credentialID: string;
  credentialDeviceType: string;
  transports: string | null;
  createdAt: Date;
}

const INITIAL_MOCK_PASSKEYS: Passkey[] = [
  {
    credentialID: 'pk_mock_macbook_001',
    credentialDeviceType: 'multiDevice',
    transports: 'internal,hybrid',
    createdAt: new Date('2026-04-12T08:00:00.000Z'),
  },
  {
    credentialID: 'pk_mock_yubikey_002',
    credentialDeviceType: 'singleDevice',
    transports: 'usb',
    createdAt: new Date('2026-05-02T08:00:00.000Z'),
  },
];

export function PasskeyManager() {
  const t = useTranslations('settings.security.passkeys');
  const [passkeys, setPasskeys] = useState<Passkey[]>(INITIAL_MOCK_PASSKEYS);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const handleRegisterPasskey = () => {
    setIsRegistering(true);
    setRegisterError(null);
    setTimeout(() => {
      const newPasskey: Passkey = {
        credentialID: `pk_mock_${Date.now()}`,
        credentialDeviceType: 'multiDevice',
        transports: 'internal',
        createdAt: new Date(),
      };
      setPasskeys((prev) => [newPasskey, ...prev]);
      toast.success('Passkey registered (mock).');
      setIsRegistering(false);
    }, 400);
  };

  /*
   * Removed, with a way back. The row and its position are captured before
   * the filter, so undo restores it where it was rather than dropping it at
   * the top of the list — a passkey that reappears somewhere else reads as a
   * different passkey.
   */
  const handleDelete = (credentialID: string) => {
    const index = passkeys.findIndex((p) => p.credentialID === credentialID);
    const removed = passkeys[index];
    if (!removed) return;

    setPasskeys((prev) => prev.filter((p) => p.credentialID !== credentialID));
    toastUndo('Passkey removed', () => {
      setPasskeys((prev) => {
        const next = [...prev];
        next.splice(index, 0, removed);
        return next;
      });
    });
  };

  return (
    <div className="space-y-4">
      {passkeys.length > 0 ? (
        <ul className="space-y-2">
          {passkeys.map((passkey: Passkey) => {
            const label =
              passkey.credentialDeviceType === 'multiDevice'
                ? t('syncedPasskey')
                : t('deviceBoundPasskey');

            return (
              <li
                key={passkey.credentialID}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex items-center gap-3">
                  <Fingerprint className="text-muted-foreground h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-muted-foreground text-xs">
                      {t('registered')}{' '}
                      <FormattedDate date={passkey.createdAt} />
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(passkey.credentialID)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">{t('delete')}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <Muted>{t('empty')}</Muted>
      )}

      <Button
        variant="outline"
        onClick={handleRegisterPasskey}
        disabled={isRegistering}
      >
        <Plus className="mr-2 h-4 w-4" />
        {t('register')}
      </Button>
      {registerError && (
        <p className="text-destructive text-sm">{registerError}</p>
      )}
    </div>
  );
}
