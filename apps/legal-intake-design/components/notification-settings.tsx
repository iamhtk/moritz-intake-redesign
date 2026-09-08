'use client';

import { Fragment, useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { cn } from '@repo/ui/lib/utils';
import { Label } from '@repo/ui/components/label';
import { Banner, BannerDescription } from '@repo/ui/components/banner';
import { Switch } from '@/components/design/design-system/switch';
import { Checkbox } from '@repo/ui/components/checkbox';
import { AlertCircle } from '@repo/ui/icons';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui/components/tooltip';
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from '@/components/design/foundations/components/description-list';
import { Link } from '@/i18n/navigation';
import { Muted, Small } from '@/components/design/design-system/typography';
import type { CompanyType, NotificationType } from '@/lib/types';

const SMS_NOTIFICATION_TYPES_BY_COMPANY: Record<
  CompanyType,
  NotificationType[]
> = {
  NON_LEGAL: [
    'NEW_MESSAGE',
    'QUOTE_CREATED',
    'CASE_CLOSED',
    'LAWYER_DIRECTLY_ASSIGNED',
    'INVOICE_CREATED',
  ],
  LEGAL: [
    'NEW_MESSAGE',
    'QUOTE_ROUND_INVITATION',
    'QUOTE_ACCEPTED',
    'CASE_CLOSED',
    'LAWYER_DIRECTLY_ASSIGNED',
  ],
  INTERNAL_ADMIN: [],
  INTERNAL_ASSISTANT: [],
};

function defaultEmailPreference(
  companyType: CompanyType,
  notificationType: NotificationType,
): boolean {
  if (notificationType === 'NEW_MESSAGE') return true;
  if (notificationType === 'COMPANY_CREATED') {
    return companyType === 'INTERNAL_ADMIN';
  }
  if (notificationType === 'CASE_READY_FOR_CLAIM') {
    return companyType === 'LEGAL';
  }
  if (notificationType === 'CASE_COLLABORATOR_ADDED') {
    return companyType === 'LEGAL' || companyType === 'NON_LEGAL';
  }
  if (notificationType === 'QUOTE_CREATED') return companyType === 'NON_LEGAL';
  if (notificationType === 'INVOICE_CREATED')
    return companyType === 'NON_LEGAL';
  if (notificationType === 'CASE_CLOSED') {
    return companyType === 'LEGAL' || companyType === 'NON_LEGAL';
  }
  if (notificationType === 'LAWYER_DIRECTLY_ASSIGNED') {
    return companyType === 'LEGAL' || companyType === 'NON_LEGAL';
  }
  if (
    notificationType === 'QUOTE_ROUND_INVITATION' ||
    notificationType === 'QUOTE_ACCEPTED' ||
    notificationType === 'QUOTE_ROUND_CLOSED'
  ) {
    return companyType === 'LEGAL';
  }
  return false;
}

function defaultSmsPreference(
  companyType: CompanyType,
  notificationType: NotificationType,
): boolean {
  const allowedTypes = SMS_NOTIFICATION_TYPES_BY_COMPANY[companyType] ?? [];
  if (!allowedTypes.includes(notificationType)) return false;
  return false;
}

interface NotificationSettingsProps {
  allowedNotificationTypes: NotificationType[];
  notificationPreferences: Partial<Record<NotificationType, boolean>>;
  allowedSmsNotificationTypes: NotificationType[];
  smsNotificationPreferences: Partial<Record<NotificationType, boolean>>;
  smsEnabled: boolean;
  companyType: CompanyType;
  updateCompany: boolean;
  onUpdate: () => void;
  emailVerified: boolean;
  hasPhoneNumber: boolean;
  phoneVerified: boolean;
  fullCaseViewEmail: boolean;
  userPreferenceRelayEmail: boolean;
  onVerifyPhone?: () => void;
}

export function NotificationSettings({
  allowedNotificationTypes,
  notificationPreferences,
  allowedSmsNotificationTypes,
  smsNotificationPreferences,
  smsEnabled,
  companyType,
  emailVerified,
  hasPhoneNumber,
  phoneVerified,
  fullCaseViewEmail,
  userPreferenceRelayEmail,
  onVerifyPhone,
}: NotificationSettingsProps) {
  const t = useTranslations('registration');
  const tBanner = useTranslations('emailVerificationBanner');
  const notificationsSuccessMessage = t('feedback.notifications.success');

  const [localFullCaseView, setLocalFullCaseView] = useState(fullCaseViewEmail);
  const [localRelayEmail, setLocalRelayEmail] = useState(
    userPreferenceRelayEmail,
  );

  const showSmsColumn = smsEnabled && allowedSmsNotificationTypes.length > 0;
  const smsDisabled = !hasPhoneNumber || !phoneVerified;

  const allNotificationTypes = useMemo(() => {
    const ordered: NotificationType[] = [...allowedNotificationTypes];
    for (const nt of allowedSmsNotificationTypes) {
      if (!ordered.includes(nt)) ordered.push(nt);
    }
    return ordered;
  }, [allowedNotificationTypes, allowedSmsNotificationTypes]);

  const [emailPrefs, setEmailPrefs] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const nt of allowedNotificationTypes) {
      initial[nt] =
        notificationPreferences[nt] ?? defaultEmailPreference(companyType, nt);
    }
    return initial;
  });

  const [smsPrefs, setSmsPrefs] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const nt of allowedSmsNotificationTypes) {
      initial[nt] =
        smsNotificationPreferences[nt] ?? defaultSmsPreference(companyType, nt);
    }
    return initial;
  });

  const handleFullCaseViewChange = useCallback(
    (checked: boolean) => {
      setLocalFullCaseView(checked);
      toast.success(notificationsSuccessMessage);
    },
    [notificationsSuccessMessage],
  );

  const handleRelayEmailChange = useCallback(
    (checked: boolean) => {
      setLocalRelayEmail(checked);
      toast.success(notificationsSuccessMessage);
    },
    [notificationsSuccessMessage],
  );

  const handleEmailPrefChange = useCallback(
    (notificationType: NotificationType, checked: boolean) => {
      setEmailPrefs((prev) => ({ ...prev, [notificationType]: checked }));
      toast.success(notificationsSuccessMessage);
    },
    [notificationsSuccessMessage],
  );

  const handleSmsPrefChange = useCallback(
    (notificationType: NotificationType, checked: boolean) => {
      setSmsPrefs((prev) => ({ ...prev, [notificationType]: checked }));
      toast.success(notificationsSuccessMessage);
    },
    [notificationsSuccessMessage],
  );

  const emailAllowed = new Set(allowedNotificationTypes);
  const smsAllowed = new Set(allowedSmsNotificationTypes);

  function getLabel(notificationType: NotificationType) {
    const companySpecificKey =
      `notifications.labels.${notificationType}_${companyType}` as Parameters<
        typeof t
      >[0];
    const genericKey = `notifications.labels.${notificationType}` as Parameters<
      typeof t
    >[0];
    const labelKey = t.has(companySpecificKey)
      ? companySpecificKey
      : genericKey;
    return t(labelKey);
  }

  return (
    <div className="space-y-6">
      {!emailVerified && (
        <Banner>
          <AlertCircle className="h-4 w-4" />
          <BannerDescription>
            {tBanner('description')}{' '}
            <Link
              href="/verify-email"
              className="font-medium underline underline-offset-4"
            >
              {tBanner('linkText')}
            </Link>
          </BannerDescription>
        </Banner>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <Label
            htmlFor="full-case-view"
            className={
              emailVerified
                ? 'text-sm font-semibold'
                : 'text-muted-foreground text-sm font-semibold'
            }
          >
            {t('notifications.fullCaseViewLabel')}
          </Label>
          <Muted>{t('notifications.fullCaseViewDescription')}</Muted>
        </div>
        <Switch
          id="full-case-view"
          checked={localFullCaseView}
          onCheckedChange={handleFullCaseViewChange}
          disabled={!emailVerified}
        />
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <Label
            htmlFor="relay-email"
            className={
              emailVerified
                ? 'text-sm font-semibold'
                : 'text-muted-foreground text-sm font-semibold'
            }
          >
            {t('notifications.relayEmailLabel')}
          </Label>
          <Muted>{t('notifications.relayEmailDescription')}</Muted>
        </div>
        <Switch
          id="relay-email"
          checked={localRelayEmail}
          onCheckedChange={handleRelayEmailChange}
          disabled={!emailVerified}
        />
      </div>

      {showSmsColumn && smsDisabled && (
        <div className="space-y-0.5">
          <Small asChild className="font-semibold">
            <h3>{t('notifications.smsTitle')}</h3>
          </Small>
          <Muted className="flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {t('notifications.smsVerifyPhone')}{' '}
            {onVerifyPhone && (
              <button
                type="button"
                className="text-primary font-medium hover:underline"
                onClick={onVerifyPhone}
              >
                {t('notifications.verifyNow')}
              </button>
            )}
          </Muted>
        </div>
      )}

      <div>
        <Small asChild className="font-semibold">
          <h3>{t('notifications.customizeEventsTitle')}</h3>
        </Small>
      </div>

      <DescriptionList className="sm:grid-cols-[max-content_1fr]">
        {allNotificationTypes.map((notificationType) => {
          const hasEmail = emailAllowed.has(notificationType);
          const hasSms = smsAllowed.has(notificationType);

          return (
            <Fragment key={notificationType}>
              <DescriptionTerm className="pt-4 sm:flex sm:items-center sm:pr-16">
                {getLabel(notificationType)}
              </DescriptionTerm>
              <DescriptionDetails className="pb-4 pt-2">
                <div
                  className={cn(
                    'grid items-center gap-x-6 gap-y-2',
                    showSmsColumn
                      ? 'grid-cols-[auto_auto] justify-start sm:grid-cols-2 sm:justify-normal'
                      : 'grid-cols-1',
                  )}
                >
                  {hasEmail && (
                    <div className="col-start-1 flex items-center gap-2">
                      <Checkbox
                        id={`emailPreference-${notificationType}`}
                        checked={emailPrefs[notificationType] ?? false}
                        onCheckedChange={(checked) =>
                          handleEmailPrefChange(
                            notificationType,
                            checked === true,
                          )
                        }
                        disabled={!emailVerified}
                      />
                      <Label
                        htmlFor={`emailPreference-${notificationType}`}
                        className="text-muted-foreground font-normal"
                      >
                        {t('notifications.channelEmail')}
                      </Label>
                    </div>
                  )}
                  {showSmsColumn &&
                    hasSms &&
                    (smsDisabled ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="col-start-2 flex items-center gap-2">
                            <Checkbox
                              id={`smsPreference-${notificationType}`}
                              checked={smsPrefs[notificationType] ?? false}
                              disabled
                            />
                            <Label
                              htmlFor={`smsPreference-${notificationType}`}
                              className="text-muted-foreground font-normal"
                            >
                              {t('notifications.channelSms')}
                            </Label>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t('notifications.smsVerifyTooltip')}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <div className="col-start-2 flex items-center gap-2">
                        <Checkbox
                          id={`smsPreference-${notificationType}`}
                          checked={smsPrefs[notificationType] ?? false}
                          onCheckedChange={(checked) =>
                            handleSmsPrefChange(
                              notificationType,
                              checked === true,
                            )
                          }
                        />
                        <Label
                          htmlFor={`smsPreference-${notificationType}`}
                          className="text-muted-foreground font-normal"
                        >
                          {t('notifications.channelSms')}
                        </Label>
                      </div>
                    ))}
                </div>
              </DescriptionDetails>
            </Fragment>
          );
        })}
      </DescriptionList>

      {showSmsColumn && (
        <p className="text-muted-foreground text-xs">
          {t('notifications.smsDisclosure')}
        </p>
      )}
    </div>
  );
}
