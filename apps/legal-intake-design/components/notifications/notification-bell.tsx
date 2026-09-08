'use client';

import { Badge } from '@repo/ui/components/badge';
import { Bell } from '@repo/ui/icons';
import { useUnreadNotificationCount } from '@/lib/mocks/portal-notifications';
import { usePlayground } from '@/components/playground/role-context';

export function NotificationBell() {
  const { role } = usePlayground();
  const unreadCount = useUnreadNotificationCount(role);
  return (
    <span className="relative">
      <Bell size={20} />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -right-2 -top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px]"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </span>
  );
}
