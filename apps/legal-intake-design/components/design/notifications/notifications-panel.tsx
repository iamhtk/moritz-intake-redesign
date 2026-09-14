'use client';

import { useState } from 'react';
import { XIcon } from '@repo/ui/icons';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/design/foundations/components/tabs';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/design/foundations/components/drawer';
import { Button } from '@/components/design/design-system/button';
import { MobileSheet } from '@/components/design/mobile/mobile-sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRoleNotifications } from '@/lib/mocks/portal-notifications';
import { usePlayground } from '@/components/playground/role-context';
import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import { SlackNotificationsBanner } from '@/components/design/slack/slack-notifications-banner';
import { NotificationList } from '@/components/design/notifications/notification-list';
import { useNotificationsPanel } from '@/components/design/notifications/notifications-panel-context';

/**
 * NotificationsPanel — the full notifications experience, docked in a right-side
 * modal Drawer from the foundation design library (Vaul-based, with the shared
 * scrim + hairline + shadow treatment). Opened from the bell (top-nav dropdown,
 * sidebar link, mobile header) via `useNotificationsPanel().openPanel()`.
 * Replaces the standalone `/notifications` route: the filter tabs, optional
 * Slack banner, and the `NotificationList` all live here now.
 *
 * On a phone it is the same content in the bottom sheet every other top-bar
 * overlay uses (`MobileSheet`). A panel sliding in from the right edge of a
 * phone reads as a sidebar and collides with the back-swipe gesture; the
 * sheet rises from the edge the thumb is already at and drags away downward.
 */
export function NotificationsPanel() {
  const { open, setOpen } = useNotificationsPanel();
  const { role } = usePlayground();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { flags } = useDesignFlags();
  const isMobile = useIsMobile();
  const slackEnabled = Boolean(flags.useSlackIntegration);

  const notifications = useRoleNotifications(role);
  const list =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const tabs = (
    <Tabs
      value={filter}
      onValueChange={(v) => setFilter(v as 'all' | 'unread')}
    >
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="unread">Unread</TabsTrigger>
      </TabsList>
    </Tabs>
  );

  const body = (
    <>
      {slackEnabled && <SlackNotificationsBanner />}
      <NotificationList notifications={list} slackEnabled={slackEnabled} />
    </>
  );

  if (isMobile) {
    return (
      <MobileSheet
        open={open}
        onOpenChange={setOpen}
        title="Notifications"
        description="Recent activity on your cases."
        closeLabel="Close notifications"
        headerBelow={tabs}
        bodyClassName="space-y-4 pt-1"
      >
        {body}
      </MobileSheet>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-md data-[vaul-drawer-direction=right]:md:w-[440px]">
        <DrawerHeader className="gap-3 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <DrawerTitle data-font="serif" className="heading-4">
                Notifications
              </DrawerTitle>
            </div>
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="-me-1 -mt-1 shrink-0"
                aria-label="Close notifications"
              >
                <XIcon />
              </Button>
            </DrawerClose>
          </div>
          {tabs}
        </DrawerHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">{body}</div>
      </DrawerContent>
    </Drawer>
  );
}
