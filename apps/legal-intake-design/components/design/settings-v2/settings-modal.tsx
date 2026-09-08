'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/design/design-system/button';
import {
  Activity,
  Bell,
  Building,
  FlaskConical,
  ShieldCheck,
  User,
  Users,
} from '@repo/ui/icons';

import ArchiveMyCompanyButton from '@/components/archive-my-company-button';
import { ExportAuditLogDialog } from '@/components/audit-log/export-audit-log-dialog';
import { CompanyDetailsCard } from '@/components/company-details-card';
import { PlaygroundSettingsSection } from '@/components/design/playground-settings-section';
import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import { SlackIntegrationPanel } from '@/components/design/slack/slack-integration-panel';
import { SlackIcon } from '@/components/design/slack/slack-icon';
import { FeatureFlagged } from '@/components/feature-flagged';
import { NotificationSettings } from '@/components/notification-settings';
import { PasskeyManager } from '@/components/passkey-manager';
import { PersonalDetailsSettings } from '@/components/personal-details-settings';
import type { RegistrationState } from '@/components/registration-types';
import { useRuntimeConfig } from '@/components/runtime-config-context';
import { TeamSettings } from '@/components/team-settings';
import { TwoFactorManager } from '@/components/two-factor-manager';
import { Muted } from '@/components/design/design-system/typography';

import {
  SettingsModalShell,
  type SettingsTabDefinition,
} from './settings-modal-shell';

type TabId =
  | 'personal'
  | 'company'
  | 'team'
  | 'notifications'
  | 'security'
  | 'integrations'
  | 'account-data'
  | 'design-playground';

type SettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: RegistrationState;
};

export function SettingsModal({
  open,
  onOpenChange,
  registration,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('personal');

  const tReg = useTranslations('registration.sections');
  const tSec = useTranslations('settings.security');
  const tExport = useTranslations('auditLog.exportSection');
  const { authProviders, featureFlags, arclineEnv } = useRuntimeConfig();
  const { flags } = useDesignFlags();

  const {
    user,
    allowedNotificationTypes,
    notificationPreferences,
    allowedSmsNotificationTypes,
    smsNotificationPreferences,
    smsEnabled,
    invitations,
    companyType,
    phoneVerificationEnabled,
    fullCaseViewEmail,
    userPreferenceRelayEmail,
  } = registration;

  const company = user.company;
  const hasCompany = !!company?.id;

  const noop = () => {};

  useEffect(() => {
    if (open) {
      setActiveTab('personal');
    }
  }, [open]);

  const tabs: Array<SettingsTabDefinition & { id: TabId }> = [
    {
      id: 'personal',
      label: 'Personal information',
      shortLabel: 'Profile',
      title: 'Personal information',
      description: 'Update your personal details here.',
      icon: User,
      content: (
        <PersonalDetailsSettings
          defaultName={user.name ?? ''}
          defaultDescription={user.description ?? ''}
          defaultEmail={user.email ?? ''}
          defaultPhoneNumber={user.phoneNumber ?? ''}
          phoneVerifiedAt={user.phoneVerifiedAt}
          phoneVerificationEnabled={phoneVerificationEnabled}
          defaultImage={user.image}
          updateCompany={true}
          companyCountry={company?.country ?? 'USA'}
          hideInlineSubmit
        />
      ),
      footer: (
        <Button
          type="submit"
          form="personal-details-form"
          className="w-full sm:w-auto"
        >
          Update personal details
        </Button>
      ),
    },
    {
      id: 'company',
      label: 'Company details',
      shortLabel: 'Company',
      title: 'Company details',
      description: 'Manage your company profile and contact details.',
      icon: Building,
      content: hasCompany ? (
        <CompanyDetailsCard
          initialValues={{
            companyName: company?.name ?? '',
            description: company?.description ?? '',
            image: company?.image ?? null,
            orgNumber: company?.orgNumber ?? '',
            companyUrl: company?.companyUrl ?? '',
            type: company?.type ?? companyType,
            country: company?.country ?? 'NORWAY',
            size: company?.size ?? 'SMALL',
          }}
          isCompanyOwner={user.isCompanyOwner}
          hasExistingCompany={hasCompany}
          updateCompany={true}
          hideInlineSubmit
        />
      ) : (
        <Muted>{tReg('noCompany')}</Muted>
      ),
      footer: hasCompany ? (
        <Button
          type="submit"
          form="company-details-form"
          className="w-full sm:w-auto"
        >
          Save company details
        </Button>
      ) : null,
    },
    {
      id: 'team',
      label: 'Team members',
      shortLabel: 'Team',
      title: 'Team members',
      description: 'Invite teammates and manage access for your company.',
      icon: Users,
      content: (
        <TeamSettings
          user={user}
          invitations={invitations}
          updateCompany={true}
          onUpdate={noop}
        />
      ),
      footer: null,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      shortLabel: 'Notifications',
      title: 'Notifications',
      description: 'Choose which updates you want to receive.',
      icon: Bell,
      content: (
        <NotificationSettings
          allowedNotificationTypes={allowedNotificationTypes}
          notificationPreferences={notificationPreferences}
          allowedSmsNotificationTypes={allowedSmsNotificationTypes}
          smsNotificationPreferences={smsNotificationPreferences}
          smsEnabled={smsEnabled}
          companyType={companyType}
          updateCompany={true}
          onUpdate={noop}
          emailVerified={!!user.emailVerified}
          hasPhoneNumber={!!user.phoneNumber}
          phoneVerified={!!user.phoneVerifiedAt}
          fullCaseViewEmail={fullCaseViewEmail}
          userPreferenceRelayEmail={userPreferenceRelayEmail}
        />
      ),
      footer: null,
    },
    {
      id: 'security',
      label: 'Security',
      shortLabel: 'Security',
      title: 'Security',
      description: 'Review sign-in and verification settings for your account.',
      icon: ShieldCheck,
      content: (
        <div className="space-y-6">
          {authProviders.passkey && (
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-medium">
                  {tSec('passkeys.title')}
                </h3>
                <Muted>{tSec('passkeys.description')}</Muted>
              </div>
              <PasskeyManager />
            </div>
          )}
          <TwoFactorManager />
        </div>
      ),
      footer: null,
    },
  ];

  if (flags.useSlackIntegration) {
    tabs.push({
      id: 'integrations',
      label: 'Integrations',
      shortLabel: 'Integrations',
      title: 'Integrations',
      description:
        'Connect Slack to get case updates in your workspace and jump back into Moritz.',
      icon: SlackIcon,
      content: <SlackIntegrationPanel />,
      footer: null,
    });
  }

  const showAuditLog = featureFlags.auditLogExport;
  const showDangerZone = company?.type === 'NON_LEGAL';

  if (user.isCompanyOwner && hasCompany && (showAuditLog || showDangerZone)) {
    tabs.push({
      id: 'account-data',
      label: 'Account & data',
      shortLabel: 'Account & data',
      title: 'Account & data',
      description: 'Export your audit log and manage your account.',
      icon: Activity,
      content: (
        <div className="space-y-6">
          {showAuditLog && (
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-medium">{tExport('title')}</h3>
                <Muted>{tExport('description')}</Muted>
              </div>
              <FeatureFlagged
                flag={featureFlags.auditLogExport}
                flagName="AUDIT_LOG_EXPORT_ENABLED"
                arclineEnv={arclineEnv}
              >
                <ExportAuditLogDialog userEmail={user.email ?? ''} />
              </FeatureFlagged>
            </div>
          )}
          {showDangerZone && (
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-medium">
                  {tReg('company.management.title')}
                </h3>
                <Muted>
                  {tReg('company.management.dangerZoneDescription')}
                </Muted>
              </div>
              <ArchiveMyCompanyButton />
            </div>
          )}
        </div>
      ),
      footer: null,
    });
  }

  tabs.push({
    id: 'design-playground',
    label: 'Design playground',
    shortLabel: 'Playground',
    title: 'Design playground',
    description:
      'Switch the mock user role and toggle in-progress design proposals. Playground-only — never in production.',
    icon: FlaskConical,
    content: <PlaygroundSettingsSection hideHeader />,
    footer: null,
  });

  return (
    <SettingsModalShell
      open={open}
      onOpenChange={onOpenChange}
      tabs={tabs}
      activeTabId={activeTab}
      onActiveTabChange={(id) => setActiveTab(id as TabId)}
    />
  );
}
