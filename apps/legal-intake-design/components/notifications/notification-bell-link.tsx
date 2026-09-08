'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/design/design-system/button';
import { useNotificationsPanel } from '@/components/design/notifications/notifications-panel-context';
import { NotificationBell } from './notification-bell';

export function NotificationBellLink() {
  const t = useTranslations('notifications.page');
  const { openPanel } = useNotificationsPanel();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="relative"
      aria-label={t('bellLabel')}
      onClick={openPanel}
    >
      <NotificationBell />
    </Button>
  );
}
