'use client';

import { Bell } from '@repo/ui/icons';

import { Button } from '@/components/design/design-system/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUnreadNotificationCount } from '@/lib/mocks/portal-notifications';
import { useNotificationsPanel } from '@/components/design/notifications/notifications-panel-context';
import { usePlayground } from '@/components/playground/role-context';

/**
 * Bell trigger that opens the notifications slide-over panel directly. This is
 * the single desktop entry point for notifications (the old standalone
 * Notifications nav pill and the dropdown preview have been folded into it).
 */
export function NotificationMenu() {
  const { role } = usePlayground();
  const unreadCount = useUnreadNotificationCount(role);
  const { openPanel } = useNotificationsPanel();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative inline-flex size-11 sm:size-9"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : 'Notifications'
          }
          onClick={() => openPanel()}
        >
          <Bell aria-hidden />
          {unreadCount > 0 && (
            <span
              aria-hidden
              className="bg-destructive ring-background absolute right-2 top-2 size-2 rounded-full ring-2"
            />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Notifications</TooltipContent>
    </Tooltip>
  );
}
