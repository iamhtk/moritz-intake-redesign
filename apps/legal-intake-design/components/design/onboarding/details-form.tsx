'use client';

import {
  useState,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  type FormEvent,
} from 'react';
import { useTranslations } from 'next-intl';
import { Field, FieldError, FieldLabel } from '@repo/ui/components/field';
import { Input } from '@/components/design/design-system/input';
import { OnboardingActions } from '@/components/design/onboarding/onboarding-actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/design/design-system/select';
import type { Locale } from '@/i18n/routing';
import { EditPhoto } from '@/components/design/onboarding/edit-photo';
import {
  PINNED_DIAL_CODES,
  OTHER_DIAL_CODES,
  getDefaultCountryCode,
  getDialCodeForCountry,
  getEntryForCountry,
  parsePhoneToCountry,
  formatNationalNumber,
  isValidNationalNumber,
  DIAL_CODES,
} from '@/lib/dial-codes';

const COUNTRY_CODES = DIAL_CODES.map((d) => d.code);

interface DetailsFormProps {
  defaultName: string;
  defaultPhoneNumber: string;
  defaultCompanyName: string;
  defaultCountry: string | null;
  customerType: 'LEGAL' | 'NON_LEGAL';
  userImage?: string;
  locale: Locale;
  section: 'personal' | 'company';
  /**
   * Whether the personal section collects the phone number. The client flow
   * sets this `false` because phone capture + OTP moves to the dedicated
   * `verify` step (see PORTING.md); other flows (the lawyer walkthrough) keep
   * it inline. Ignored for the company section.
   */
  showPhone?: boolean;
  companyCountry?: string | null;
  onContinue?: () => void;
  onBack?: () => void;
  onCountryChange?: (countryCode: string) => void;
  progressCurrent?: number;
  progressTotal?: number;
  /**
   * Async action run on submit after client-side validation passes. The
   * playground defaults to a simulated delay; the main app injects the real
   * `registration.updatePersonalDetails` / `registration.updateCompany`
   * mutation here (see PORTING.md). `onContinue` is called once it resolves.
   */
  onSubmit?: () => void | Promise<void>;
}

function initPhoneState(
  phoneNumber: string,
  companyCountry: string | null,
): { countryCode: string; localNumber: string } {
  if (phoneNumber) {
    const parsed = parsePhoneToCountry(phoneNumber);
    if (parsed.countryCode) {
      return {
        countryCode: parsed.countryCode,
        localNumber: formatNationalNumber(
          parsed.localNumber,
          parsed.countryCode,
        ),
      };
    }
  }
  return {
    countryCode: getDefaultCountryCode(companyCountry),
    localNumber: '',
  };
}

export function DetailsForm({
  defaultName,
  defaultPhoneNumber,
  defaultCompanyName,
  defaultCountry,
  customerType,
  userImage,
  locale,
  section,
  showPhone = true,
  companyCountry = 'US',
  onContinue,
  onBack,
  onCountryChange,
  progressCurrent,
  progressTotal,
  onSubmit,
}: DetailsFormProps) {
  const t = useTranslations('registration');

  const [name, setName] = useState(defaultName);
  // Clients give the job title that signs the engagement letter (Name / Title
  // signature block). TODO: persist via registration.updatePersonalDetails and
  // surface on the generated engagement letter during productionisation.
  const [title, setTitle] = useState('');
  const defaultParsed = useMemo(
    () => initPhoneState(defaultPhoneNumber, companyCountry),
    [defaultPhoneNumber, companyCountry],
  );
  const [selectedDialCountry, setSelectedDialCountry] = useState(
    defaultParsed.countryCode,
  );
  const [localPhoneNumber, setLocalPhoneNumber] = useState(
    defaultParsed.localNumber,
  );
  const phoneInputRef = useRef<HTMLInputElement>(null);
  // The phone field reformats on every keystroke (inserting spaces/parens/
  // dashes), and a controlled re-render would otherwise drop the caret at the
  // end. We record how many digits sat before the caret when the user edited,
  // then restore the caret after the same digit after the value reformats — so
  // editing mid-string keeps the caret in place. Separators are layout-only, so
  // counting digits (not characters) survives reformatting.
  const phoneCaretDigitsRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const input = phoneInputRef.current;
    const targetDigits = phoneCaretDigitsRef.current;
    if (!input || targetDigits === null) return;
    phoneCaretDigitsRef.current = null;

    const formatted = input.value;
    let seen = 0;
    let caret = formatted.length;
    for (let i = 0; i < formatted.length; i++) {
      if (seen === targetDigits) {
        caret = i;
        break;
      }
      if (/\d/.test(formatted[i]!)) seen++;
    }
    input.setSelectionRange(caret, caret);
  }, [localPhoneNumber]);
  const [image, setImage] = useState<string | null>(userImage ?? null);
  const [companyName, setCompanyName] = useState(defaultCompanyName);
  // Law-firm-only: a firm logo and public website shown on the Moritz profile.
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [companyUrl, setCompanyUrl] = useState('');
  const defaultCountryCode = getDefaultCountryCode(defaultCountry);
  const [selectedCountryCode, setSelectedCountryCode] =
    useState<string>(defaultCountryCode);
  // Clients tell us their company size; law firms don't fill this in. Empty by
  // default so the field shows a placeholder rather than a pre-selected size.
  const [size, setSize] = useState<
    '' | 'PRE_INCORPORATION' | 'SMALL' | 'MEDIUM' | 'LARGE'
  >('');
  const [isPending, setIsPending] = useState(false);
  const [nameInvalid, setNameInvalid] = useState(false);
  const [titleInvalid, setTitleInvalid] = useState(false);
  const [companyNameInvalid, setCompanyNameInvalid] = useState(false);
  const [sizeInvalid, setSizeInvalid] = useState(false);
  const [phoneInvalid, setPhoneInvalid] = useState(false);

  const countryOptions = useMemo(() => {
    let displayNames: Intl.DisplayNames | null = null;
    if (typeof Intl.DisplayNames !== 'undefined') {
      try {
        displayNames = new Intl.DisplayNames([locale], { type: 'region' });
      } catch {
        try {
          displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
        } catch {
          displayNames = null;
        }
      }
    }

    return COUNTRY_CODES.map((code) => ({
      code,
      label: displayNames?.of(code) ?? code,
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, [locale]);

  const handleDialCountryChange = useCallback((next: string) => {
    setSelectedDialCountry(next);
    setLocalPhoneNumber((current) => formatNationalNumber(current, next));
    setPhoneInvalid(false);
  }, []);

  const handleCountryChange = useCallback(
    (next: string) => {
      setSelectedCountryCode(next);
      onCountryChange?.(next);
    },
    [onCountryChange],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (section === 'personal') {
        const hasNameError = !name.trim();
        // Phone is only validated when this form owns the field; the client
        // flow captures + verifies it on the dedicated `verify` step instead.
        const hasPhoneError =
          showPhone &&
          !isValidNationalNumber(localPhoneNumber, selectedDialCountry);
        // Clients must give a title for the engagement letter; law firms don't.
        const hasTitleError = customerType !== 'LEGAL' && !title.trim();
        setNameInvalid(hasNameError);
        setPhoneInvalid(hasPhoneError);
        setTitleInvalid(hasTitleError);
        if (hasNameError || hasPhoneError || hasTitleError) {
          return;
        }
      }

      if (section === 'company') {
        const hasCompanyNameError = !companyName.trim();
        // Clients must pick a company size; law firms don't fill it in.
        const hasSizeError = customerType !== 'LEGAL' && !size;
        setCompanyNameInvalid(hasCompanyNameError);
        setSizeInvalid(hasSizeError);
        if (hasCompanyNameError || hasSizeError) {
          return;
        }
      }

      // Submit seam: the main app injects the real updatePersonalDetails /
      // updateCompany mutation via `onSubmit`. The playground defaults to a
      // simulated delay so the flow feels real without a backend.
      setIsPending(true);
      const runSubmit = onSubmit
        ? Promise.resolve(onSubmit())
        : new Promise<void>((resolve) => setTimeout(resolve, 500));
      runSubmit
        .then(() => {
          onContinue?.();
        })
        .finally(() => {
          setIsPending(false);
        });
    },
    [
      section,
      name,
      title,
      customerType,
      companyName,
      size,
      localPhoneNumber,
      selectedDialCountry,
      showPhone,
      onContinue,
      onSubmit,
    ],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 flex-col gap-6"
      noValidate
    >
      {/* Personal Details Section */}
      {section === 'personal' && (
        <div className="mz-animate-step space-y-4">
          <EditPhoto
            currentImage={image}
            onImageChange={setImage}
            disabled={isPending}
            userName={name || defaultName}
          />

          {/* Email is shown on the welcome screen (signed-in identity), so it is
              not collected again here. */}
          <Field data-invalid={nameInvalid || undefined}>
            <FieldLabel htmlFor="name">{t('fields.name')}</FieldLabel>
            <Input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (nameInvalid) setNameInvalid(false);
              }}
              aria-invalid={nameInvalid || undefined}
              autoComplete="name"
            />
            {nameInvalid && <FieldError>{t('fields.nameRequired')}</FieldError>}
          </Field>

          {/* Clients provide the job title that appears on the engagement
              letter signature block (Name / Title). Law firms don't sign as a
              client, so this is hidden for them. */}
          {customerType !== 'LEGAL' && (
            <Field data-invalid={titleInvalid || undefined}>
              <FieldLabel htmlFor="title">{t('fields.title')}</FieldLabel>
              <Input
                id="title"
                name="title"
                type="text"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (titleInvalid) setTitleInvalid(false);
                }}
                aria-invalid={titleInvalid || undefined}
                autoComplete="organization-title"
                placeholder={t('fields.titlePlaceholder')}
              />
              {titleInvalid && (
                <FieldError>{t('fields.titleRequired')}</FieldError>
              )}
            </Field>
          )}

          {showPhone && (
            <Field data-invalid={phoneInvalid || undefined}>
              <FieldLabel htmlFor="phoneNumber">
                {t('fields.phoneNumber')}
              </FieldLabel>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedDialCountry}
                  onValueChange={handleDialCountryChange}
                >
                  <SelectTrigger className="w-[130px] shrink-0">
                    <span>
                      {getEntryForCountry(selectedDialCountry)?.flag}{' '}
                      {selectedDialCountry} +
                      {getDialCodeForCountry(selectedDialCountry)}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {PINNED_DIAL_CODES.map((entry) => (
                      <SelectItem
                        key={entry.code}
                        value={entry.code}
                        textValue={entry.name}
                      >
                        {entry.flag} {entry.name} (+{entry.dialCode})
                      </SelectItem>
                    ))}
                    <SelectSeparator />
                    {OTHER_DIAL_CODES.map((entry) => (
                      <SelectItem
                        key={entry.code}
                        value={entry.code}
                        textValue={entry.name}
                      >
                        {entry.flag} {entry.name} (+{entry.dialCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  ref={phoneInputRef}
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  inputMode="tel"
                  value={localPhoneNumber}
                  onChange={(event) => {
                    const raw = event.target.value;
                    const caret = event.target.selectionStart ?? raw.length;
                    // Count digits before the caret in the raw (pre-format) value
                    // so the caret can be restored after reformatting.
                    let digitsBeforeCaret = 0;
                    for (let i = 0; i < caret; i++) {
                      if (/\d/.test(raw[i]!)) digitsBeforeCaret++;
                    }
                    phoneCaretDigitsRef.current = digitsBeforeCaret;
                    setLocalPhoneNumber(
                      formatNationalNumber(raw, selectedDialCountry),
                    );
                    if (phoneInvalid) setPhoneInvalid(false);
                  }}
                  aria-invalid={phoneInvalid || undefined}
                  autoComplete="tel-national"
                  className="min-w-0 flex-1"
                />
              </div>
              {phoneInvalid && (
                <FieldError>{t('fields.phoneInvalid')}</FieldError>
              )}
            </Field>
          )}
        </div>
      )}

      {/* Company Details Section */}
      {section === 'company' && (
        <div className="mz-animate-step space-y-4">
          {/* Law firms get a logo upload — it appears on their public Moritz
              profile alongside the firm name. */}
          {customerType === 'LEGAL' && (
            <EditPhoto
              variant="logo"
              currentImage={logoImage}
              onImageChange={setLogoImage}
              disabled={isPending}
              userName={companyName}
            />
          )}

          <div className="space-y-4">
            <Field data-invalid={companyNameInvalid || undefined}>
              <FieldLabel htmlFor="companyName">
                {customerType === 'LEGAL'
                  ? t('fields.firmName')
                  : t('fields.companyName')}
              </FieldLabel>
              <Input
                id="companyName"
                name="companyName"
                type="text"
                value={companyName}
                onChange={(event) => {
                  setCompanyName(event.target.value);
                  if (companyNameInvalid) setCompanyNameInvalid(false);
                }}
                aria-invalid={companyNameInvalid || undefined}
              />
              {companyNameInvalid && (
                <FieldError>
                  {customerType === 'LEGAL'
                    ? t('fields.firmNameRequired')
                    : t('fields.companyNameRequired')}
                </FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="country">{t('fields.country')}</FieldLabel>
              <Select
                value={selectedCountryCode}
                onValueChange={handleCountryChange}
              >
                <SelectTrigger id="country" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countryOptions.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Law-firm-only public website, shown on the Moritz profile. */}
          {customerType === 'LEGAL' && (
            <Field>
              <FieldLabel htmlFor="companyUrl">
                {t('fields.firmWebsite')}
              </FieldLabel>
              <Input
                id="companyUrl"
                name="companyUrl"
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder={t('fields.placeholders.companyUrl')}
                value={companyUrl}
                onChange={(event) => setCompanyUrl(event.target.value)}
              />
            </Field>
          )}

          {/* Clients tell us their company size so we know who we're working
              with. Law firms don't fill this in. */}
          {customerType !== 'LEGAL' && (
            <Field data-invalid={sizeInvalid || undefined}>
              <FieldLabel htmlFor="size">{t('fields.companySize')}</FieldLabel>
              <Select
                value={size}
                onValueChange={(value) => {
                  setSize(
                    value as 'PRE_INCORPORATION' | 'SMALL' | 'MEDIUM' | 'LARGE',
                  );
                  if (sizeInvalid) setSizeInvalid(false);
                }}
              >
                <SelectTrigger
                  id="size"
                  className="w-full"
                  aria-invalid={sizeInvalid || undefined}
                >
                  <SelectValue
                    placeholder={t('fields.companySizePlaceholder')}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRE_INCORPORATION">
                    {t('fields.sizeOptions.preIncorporation')}
                  </SelectItem>
                  <SelectItem value="SMALL">
                    {t('fields.sizeOptions.small')}
                  </SelectItem>
                  <SelectItem value="MEDIUM">
                    {t('fields.sizeOptions.medium')}
                  </SelectItem>
                  <SelectItem value="LARGE">
                    {t('fields.sizeOptions.large')}
                  </SelectItem>
                </SelectContent>
              </Select>
              {sizeInvalid && (
                <FieldError>{t('fields.companySizeRequired')}</FieldError>
              )}
            </Field>
          )}
        </div>
      )}

      <OnboardingActions
        className="mt-auto"
        continueLabel={t('actions.continue')}
        continueType="submit"
        isPending={isPending}
        backLabel={t('actions.back')}
        onBack={onBack}
        progressCurrent={progressCurrent}
        progressTotal={progressTotal}
      />
    </form>
  );
}
