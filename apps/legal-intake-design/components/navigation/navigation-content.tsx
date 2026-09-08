'use client';

import NavigationLink from './navigation-link';
import { useTranslations } from 'next-intl';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { NavigationHeader } from './navigation-header';
import { NavigationFooter } from './navigation-footer';
import type { AuthUser, CompanyType } from '@/lib/types';
import { useNavigation } from './navigation-context';
import { cn } from '@repo/ui/lib/utils';
import { usePathname } from '@/i18n/navigation';
import { useEffect } from 'react';
import { MessageCircle } from '@repo/ui/icons';
import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import { useSettingsV2Modal } from '@/components/design/settings-v2/settings-v2-context';
import { useNotificationsPanel } from '@/components/design/notifications/notifications-panel-context';

type NavigationContentProps = {
  companyType: CompanyType;
  homePath: string;
  user: AuthUser;
};

export default function NavigationContent({
  companyType,
  homePath,
  user,
}: NavigationContentProps) {
  const tNavigation = useTranslations('navigation');
  const { isMobileOpen, closeMobile } = useNavigation();
  const pathname = usePathname();
  const { flags } = useDesignFlags();
  const { openModal } = useSettingsV2Modal();
  const { openPanel: openNotifications } = useNotificationsPanel();

  useEffect(() => {
    if (isMobileOpen) closeMobile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <nav
      className={cn(
        'flex h-full flex-1 flex-col overflow-auto p-4 max-sm:pb-0 max-sm:pt-3',
        isMobileOpen &&
          'max-sm:bg-background z-[100] max-sm:fixed max-sm:w-full',
      )}
    >
      <NavigationHeader
        collapseLabel={tNavigation('collapse')}
        expandLabel={tNavigation('expand')}
      />

      <div
        className={cn(
          'hidden space-y-1 pb-4 pt-8 sm:block',
          isMobileOpen && 'block',
        )}
      >
        <NavigationLink
          href={homePath}
          label={tNavigation('home')}
          iconName="home"
          exact
        />
        {(companyType === 'NON_LEGAL' || companyType === 'LEGAL') && (
          <NavigationLink
            href={`${homePath}/cases`}
            label={tNavigation('cases')}
            iconName="files"
          />
        )}
        {companyType === 'LEGAL' && (
          <NavigationLink
            href={`${homePath}/quotes`}
            label={tNavigation('quotes')}
            iconName="briefcase"
          />
        )}
        {companyType === 'INTERNAL_ADMIN' && (
          <>
            <NavigationLink
              href={`${homePath}/cases`}
              label={tNavigation('assignCases')}
              iconName="briefcase"
            />
            {flags.usePlaybooksAdmin && (
              <NavigationLink
                href={`${homePath}/playbooks`}
                label={tNavigation('playbooks')}
                iconName="book-text"
              />
            )}
            {flags.useAiEvalsAdmin && (
              <NavigationLink
                href={`${homePath}/ai-evals`}
                label={tNavigation('aiEvals')}
                iconName="flask"
              />
            )}
            {flags.useTabularPlaybooksAdmin && (
              <NavigationLink
                href={`${homePath}/tabular-playbook`}
                label={tNavigation('tabularPlaybooks')}
                iconName="table"
              />
            )}
            <NavigationLink
              href={`${homePath}/companies`}
              label={tNavigation('companies')}
              iconName="building-2"
            />
            <NavigationLink
              href={`${homePath}/law-firms`}
              label={tNavigation('lawFirms')}
              iconName="scale"
            />
            <NavigationLink
              href={`${homePath}/users`}
              label={tNavigation('users')}
              iconName="users"
            />
            <NavigationLink
              href={`${homePath}/case-types`}
              label={tNavigation('caseTypes')}
              iconName="briefcase"
            />
            <NavigationLink
              href={`${homePath}/waitlist`}
              label={tNavigation('waitlist')}
              iconName="clock"
            />
            <NavigationLink
              href={`${homePath}/countries`}
              label={tNavigation('countries')}
              iconName="earth"
            />
            <NavigationLink
              href={`${homePath}/audit-log`}
              label={tNavigation('auditLog')}
              iconName="file-text"
            />
            <NavigationLink
              href={`${homePath}/sentry-test`}
              label={tNavigation('sentryTest')}
              iconName="shield-check"
            />
          </>
        )}
        <div className="hidden sm:block">
          <NavigationLink
            label={tNavigation('notifications')}
            customIcon={<NotificationBell />}
            onClick={openNotifications}
          />
        </div>

        {flags.useSettingsV2 ? (
          <NavigationLink
            label={tNavigation('settings')}
            iconName="settings"
            onClick={openModal}
          />
        ) : (
          <NavigationLink
            href="/user"
            label={tNavigation('settings')}
            iconName="settings"
          />
        )}

        <NavigationLink
          label={tNavigation('support')}
          customIcon={<MessageCircle size={20} className="shrink-0" />}
          onClick={() => {
            /* Pylon disabled in playground */
          }}
        />
      </div>

      <NavigationFooter user={user} />
    </nav>
  );
}
