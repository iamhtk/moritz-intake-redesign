'use client';

import { useTranslations } from 'next-intl';
import { CompanyDetailsCard } from './company-details-card';
import type { RegistrationState } from './registration-types';
import { PersonalDetailsSettings } from './personal-details-settings';
import { TeamSettings } from './team-settings';
import { NotificationSettings } from './notification-settings';
import ArchiveMyCompanyButton from './archive-my-company-button';
import { PasskeyManager } from './passkey-manager';
import { TwoFactorManager } from './two-factor-manager';
import { useRuntimeConfig } from './runtime-config-context';
import { ExportAuditLogDialog } from './audit-log/export-audit-log-dialog';
import { FeatureFlagged } from './feature-flagged';
import { PlaygroundSettingsSection } from './design/playground-settings-section';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/design/design-system/card';
import { H4, Muted } from './typography';

export type SettingsPageContentProps = RegistrationState & {
  refreshPath?: string | null;
  updateCompany: boolean;
};

export function SettingsPageContent(props: SettingsPageContentProps) {
  const {
    user,
    refreshPath,
    allowedNotificationTypes,
    notificationPreferences,
    allowedSmsNotificationTypes,
    smsNotificationPreferences,
    smsEnabled,
    invitations,
    companyType,
    updateCompany,
    phoneVerificationEnabled,
  } = props;

  const tReg = useTranslations('registration.sections');
  const tSec = useTranslations('settings.security');
  const tExport = useTranslations('auditLog.exportSection');
  const { authProviders, featureFlags, arclineEnv } = useRuntimeConfig();

  const company = user.company;
  const hasCompany = !!company?.id;

  const invalidateRegistration = () => {};

  return (
    <div className="mb-4 max-w-3xl space-y-10">
      {/* Personal Section */}
      <div id="personal" className="scroll-mt-6">
        <div className="space-y-4">
          <div>
            <H4 asChild>
              <h2>{tReg('yourDetails')}</h2>
            </H4>
            <Muted>{tReg('yourDetailsDescription')}</Muted>
          </div>
          <PersonalDetailsSettings
            defaultName={user.name ?? ''}
            defaultDescription={user.description ?? ''}
            defaultEmail={user.email ?? ''}
            defaultPhoneNumber={user.phoneNumber ?? ''}
            phoneVerifiedAt={user.phoneVerifiedAt}
            phoneVerificationEnabled={phoneVerificationEnabled}
            defaultImage={user.image}
            refreshPath={refreshPath}
            updateCompany={updateCompany}
            companyCountry={company?.country ?? 'USA'}
          />
        </div>
      </div>

      {/* Company Section */}
      <div id="company" className="scroll-mt-6">
        <div className="space-y-4">
          <div>
            <H4 asChild>
              <h2>{tReg('companyDetails')}</h2>
            </H4>
            <Muted>{tReg('companyDetailsDescription')}</Muted>
          </div>
          {hasCompany ? (
            <CompanyDetailsCard
              initialValues={{
                companyName: company?.name ?? '',
                description: company?.description ?? '',
                image: company?.image ?? null,
                orgNumber: company?.orgNumber ?? '',
                companyUrl: company?.companyUrl ?? '',
                type: company?.type ?? companyType ?? 'NON_LEGAL',
                country: company?.country ?? 'NORWAY',
                size: company?.size ?? 'SMALL',
              }}
              isCompanyOwner={user.isCompanyOwner}
              refreshPath={refreshPath}
              hasExistingCompany={hasCompany}
              updateCompany={updateCompany}
            />
          ) : (
            <Muted>{tReg('noCompany')}</Muted>
          )}
        </div>
      </div>

      {/* Team Section */}
      <div id="team" className="scroll-mt-6">
        <TeamSettings
          user={user}
          invitations={invitations}
          updateCompany={updateCompany}
          onUpdate={invalidateRegistration}
        />
      </div>

      {/* Notifications Section */}
      <div id="notifications" className="scroll-mt-6">
        <NotificationSettings
          allowedNotificationTypes={allowedNotificationTypes}
          notificationPreferences={notificationPreferences}
          allowedSmsNotificationTypes={allowedSmsNotificationTypes}
          smsNotificationPreferences={smsNotificationPreferences}
          smsEnabled={smsEnabled}
          companyType={companyType}
          updateCompany={updateCompany}
          onUpdate={invalidateRegistration}
          emailVerified={!!user.emailVerified}
          hasPhoneNumber={!!user.phoneNumber}
          phoneVerified={!!user.phoneVerifiedAt}
          fullCaseViewEmail={props.fullCaseViewEmail}
          userPreferenceRelayEmail={props.userPreferenceRelayEmail}
        />
      </div>

      {/* Security Section */}
      <div id="security" className="scroll-mt-6">
        <div className="space-y-6">
          <div>
            <H4 asChild>
              <h2>{tSec('title')}</h2>
            </H4>
          </div>
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
      </div>

      {/* Audit Log Export Section */}
      {user.isCompanyOwner && hasCompany && (
        <FeatureFlagged
          flag={featureFlags.auditLogExport}
          flagName="AUDIT_LOG_EXPORT_ENABLED"
          arclineEnv={arclineEnv}
        >
          <div id="audit-log-export" className="scroll-mt-6">
            <div className="space-y-4">
              <div>
                <H4 asChild>
                  <h2>{tExport('title')}</h2>
                </H4>
                <Muted>{tExport('description')}</Muted>
              </div>
              <ExportAuditLogDialog userEmail={user.email ?? ''} />
            </div>
          </div>
        </FeatureFlagged>
      )}

      {/* Company Management Section */}
      {user.isCompanyOwner &&
        hasCompany &&
        user.company?.type === 'NON_LEGAL' && (
          <div id="company-management" className="scroll-mt-6">
            <div className="space-y-4">
              <div>
                <H4 asChild>
                  <h2>{tReg('company.management.title')}</h2>
                </H4>
                <Muted>{tReg('company.management.description')}</Muted>
              </div>
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive">
                    {tReg('company.management.dangerZone')}
                  </CardTitle>
                  <CardDescription>
                    {tReg('company.management.dangerZoneDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ArchiveMyCompanyButton />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

      {/* Design Playground Section (playground-only, never in production) */}
      <div id="design-playground" className="scroll-mt-6">
        <PlaygroundSettingsSection />
      </div>
    </div>
  );
}
