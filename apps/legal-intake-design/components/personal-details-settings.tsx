'use client';

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useTransition,
  type FormEvent,
} from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/design/design-system/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from '@/components/design/design-system/select';
import { DirtySubmitButton } from './dirty-submit-button';
import { Field, FieldLabel } from '@repo/ui/components/field';
import {
  PINNED_DIAL_CODES,
  OTHER_DIAL_CODES,
  getDefaultCountryCode,
  getDialCodeForCountry,
  getEntryForCountry,
  parsePhoneToCountry,
} from '@/lib/dial-codes';

type PersonalDetailsSettingsProps = {
  defaultName?: string;
  defaultTitle?: string;
  defaultDescription?: string | null;
  defaultEmail: string;
  defaultPhoneNumber?: string;
  phoneVerifiedAt?: string | null;
  phoneVerificationEnabled?: boolean;
  defaultImage?: string | null;
  refreshPath?: string | null;
  updateCompany: boolean;
  companyCountry?: string | null;
  hideInlineSubmit?: boolean;
};

function initPhoneState(
  phoneNumber: string,
  companyCountry: string | null,
): { countryCode: string; localNumber: string } {
  if (phoneNumber) {
    const parsed = parsePhoneToCountry(phoneNumber);
    if (parsed.countryCode) {
      return parsed;
    }
  }
  return {
    countryCode: getDefaultCountryCode(companyCountry),
    localNumber: '',
  };
}

export function PersonalDetailsSettings(props: PersonalDetailsSettingsProps) {
  const {
    defaultName = '',
    defaultTitle = '',
    defaultDescription,
    defaultEmail,
    defaultPhoneNumber = '',
    phoneVerifiedAt,
    phoneVerificationEnabled = false,
    companyCountry = 'USA',
    hideInlineSubmit = false,
  } = props;

  const t = useTranslations('registration');

  const defaultParsed = useMemo(
    () => initPhoneState(defaultPhoneNumber, companyCountry),
    [defaultPhoneNumber, companyCountry],
  );

  const [name, setName] = useState(defaultName);
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription ?? '');
  const [email, setEmail] = useState(defaultEmail);
  const [selectedCountry, setSelectedCountry] = useState(
    defaultParsed.countryCode,
  );
  const [localPhoneNumber, setLocalPhoneNumber] = useState(
    defaultParsed.localNumber,
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setName(defaultName);
    setTitle(defaultTitle);
    setDescription(defaultDescription ?? '');
    setEmail(defaultEmail);
    const parsed = initPhoneState(defaultPhoneNumber, companyCountry);
    setSelectedCountry(parsed.countryCode);
    setLocalPhoneNumber(parsed.localNumber);
  }, [
    defaultName,
    defaultTitle,
    defaultDescription,
    defaultEmail,
    defaultPhoneNumber,
    companyCountry,
  ]);

  const combinedPhoneNumber = useMemo(() => {
    const digits = localPhoneNumber.replace(/\D/g, '');
    if (!digits) return '';
    return `+${getDialCodeForCountry(selectedCountry)}${digits}`;
  }, [selectedCountry, localPhoneNumber]);

  const formId = 'personal-details-form';

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail) {
        toast.error(t('feedback.personal.error'));
        return;
      }

      startTransition(() => {
        setTimeout(() => {
          toast.success(t('feedback.personal.success'));
        }, 400);
      });
    },
    [email, t],
  );

  const phoneDisabled = phoneVerificationEnabled && !!phoneVerifiedAt;
  const phoneVerifiedBadge =
    !!phoneVerifiedAt && (combinedPhoneNumber || defaultPhoneNumber);

  return (
    <div className="space-y-4">
      <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
        <Field>
          <FieldLabel htmlFor="name">{t('fields.name')}</FieldLabel>
          <Input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="title">{t('fields.title')}</FieldLabel>
          <Input
            id="title"
            name="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoComplete="organization-title"
            placeholder={t('fields.titlePlaceholder')}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="email">{t('fields.email')}</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            disabled
            autoComplete="email"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="phoneNumber">
            {t('fields.phoneNumber')}
          </FieldLabel>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              value={selectedCountry}
              onValueChange={setSelectedCountry}
              disabled={phoneDisabled}
            >
              <SelectTrigger className="w-full shrink-0 sm:w-[130px]">
                <span>
                  {getEntryForCountry(selectedCountry)?.flag} {selectedCountry}{' '}
                  +{getDialCodeForCountry(selectedCountry)}
                </span>
              </SelectTrigger>
              <SelectContent>
                {PINNED_DIAL_CODES.map((entry) => (
                  <SelectItem key={entry.code} value={entry.code}>
                    {entry.flag} {entry.name} (+{entry.dialCode})
                  </SelectItem>
                ))}
                <SelectSeparator />
                {OTHER_DIAL_CODES.map((entry) => (
                  <SelectItem key={entry.code} value={entry.code}>
                    {entry.flag} {entry.name} (+{entry.dialCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              inputMode="tel"
              value={localPhoneNumber}
              onChange={(event) =>
                setLocalPhoneNumber(
                  // Phone numbers are digits plus common separators — never letters.
                  event.target.value.replace(/[^\d\s()+-]/g, ''),
                )
              }
              autoComplete="tel-national"
              disabled={phoneDisabled}
            />

            {phoneVerifiedBadge && (
              <span className="text-success bg-success/10 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
                Verified
              </span>
            )}
          </div>
        </Field>

        <p className="text-muted-foreground text-xs">
          {t('fields.contactPrivacyNote')}
        </p>
      </form>

      {!hideInlineSubmit && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <DirtySubmitButton
            formId={formId}
            initialValues={{
              name: defaultName,
              title: defaultTitle,
              description: defaultDescription ?? '',
              phoneNumber: defaultPhoneNumber,
            }}
            currentValues={{
              name,
              title,
              description,
              phoneNumber: combinedPhoneNumber,
            }}
            disabled={isPending}
          >
            {t('actions.updatePersonalDetails')}
          </DirtySubmitButton>
        </div>
      )}
    </div>
  );
}
