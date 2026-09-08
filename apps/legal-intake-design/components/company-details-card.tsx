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
import { useLocale, useTranslations } from 'next-intl';
import { Input } from '@/components/design/design-system/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/design/design-system/select';
import { DirtySubmitButton } from './dirty-submit-button';
import { cn } from '@repo/ui/lib/utils';
import { Field, FieldLabel } from '@repo/ui/components/field';
import { DIAL_CODES, getDefaultCountryCode } from '@/lib/dial-codes';
import type { CompanySize } from '@/lib/types';

const COUNTRY_CODES = DIAL_CODES.map((d) => d.code);

type CompanyDetailsCardProps = {
  initialValues: {
    companyName: string;
    description: string;
    image: string | null;
    orgNumber: string;
    companyUrl: string;
    type: string;
    country: string | null;
    size: CompanySize;
  };
  isCompanyOwner: boolean;
  refreshPath?: string | null;
  hasExistingCompany: boolean;
  updateCompany: boolean;
  hideInlineSubmit?: boolean;
};

export function CompanyDetailsCard({
  initialValues,
  isCompanyOwner,
  hasExistingCompany,
  hideInlineSubmit = false,
}: CompanyDetailsCardProps) {
  const t = useTranslations('registration');
  const locale = useLocale();

  const initialCountry = getDefaultCountryCode(initialValues.country);

  const [companyName, setCompanyName] = useState(initialValues.companyName);
  const [companyType] = useState(initialValues.type);
  const [country, setCountry] = useState<string>(initialCountry);
  const [size, setSize] = useState<CompanySize>(initialValues.size);
  const [hasCompany, setHasCompany] = useState(hasExistingCompany);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setCompanyName(initialValues.companyName);
    setCountry(getDefaultCountryCode(initialValues.country));
    setSize(initialValues.size);
    setHasCompany(hasExistingCompany);
  }, [initialValues, hasExistingCompany]);

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

  const formId = 'company-details-form';

  const guardOk = hasCompany;
  const guardText = guardOk ? null : t('guard.companyIncomplete');
  const errorToast = t('feedback.company.error');

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!isCompanyOwner || isPending) {
        return;
      }

      if (!companyName.trim()) {
        toast.error(errorToast);
        return;
      }

      startTransition(() => {
        setTimeout(() => {
          setHasCompany(true);
          toast.success(t('feedback.company.success'));
        }, 400);
      });
    },
    [companyName, isCompanyOwner, isPending, errorToast, t],
  );

  return (
    <div className="space-y-4">
      <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
        <Field>
          <FieldLabel htmlFor="companyName">
            {t('fields.companyName')}
          </FieldLabel>
          <Input
            id="companyName"
            name="companyName"
            disabled={!isCompanyOwner}
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="country">{t('fields.country')}</FieldLabel>
          <Select
            value={country}
            onValueChange={setCountry}
            disabled={!isCompanyOwner}
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

        <Field>
          <FieldLabel htmlFor="size">{t('fields.companySize')}</FieldLabel>
          <Select
            value={size}
            onValueChange={(value) => setSize(value as CompanySize)}
            disabled={!isCompanyOwner}
          >
            <SelectTrigger id="size" className="w-full">
              <SelectValue placeholder={t('fields.companySizePlaceholder')} />
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
        </Field>
      </form>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        {!hideInlineSubmit && (
          <DirtySubmitButton
            formId={formId}
            initialValues={{
              companyName: initialValues.companyName,
              country: initialCountry,
              size: initialValues.size,
              type: initialValues.type,
            }}
            currentValues={{
              companyName,
              country,
              size,
              type: companyType,
            }}
            disabled={!isCompanyOwner || isPending}
          >
            {hasCompany
              ? t('actions.updateCompanyDetails')
              : t('actions.createCompany')}
          </DirtySubmitButton>
        )}
        <span
          className={cn(
            'text-sm',
            guardOk ? 'text-success' : 'text-muted-foreground',
          )}
        >
          {guardText}
        </span>
      </div>
    </div>
  );
}
