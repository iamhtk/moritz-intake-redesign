'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Field, FieldError, FieldLabel } from '@repo/ui/components/field';
import { Search } from '@repo/ui/icons';
import { Input } from '@/components/design/design-system/input';
import { Button } from '@/components/design/design-system/button';
import { Muted } from '@/components/design/design-system/typography';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/design/design-system/select';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemDescription,
  ComboboxItemLabel,
  ComboboxList,
} from '@/components/design/foundations/components/combobox';
import { InputGroupAddon } from '@/components/design/foundations/components/input-group';
import {
  type StructuredAddress,
  formatAddressSummary,
  getAddressesForPostcode,
  getCountryAddressConfig,
  searchAddresses,
} from '@/lib/mocks/addresses';

interface AddressFieldProps {
  /** ISO country code (from the company step) that drives lookup mode + labels. */
  country: string;
  value: StructuredAddress | null;
  onChange: (value: StructuredAddress | null) => void;
  /** Surface required-field errors (the step wrapper sets this on submit). */
  showErrors?: boolean;
}

const EMPTY: StructuredAddress = {
  line1: '',
  line2: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
};

/**
 * Country-aware address capture for onboarding. The lookup experience adapts to
 * the selected country (UK/IE: postcode -> pick-an-address; elsewhere: single
 * line type-ahead), and a manual structured form is always available as a
 * fallback. All lookups run on mock data (`@/lib/mocks/addresses`); the same UI
 * works unchanged once a real provider is wired in (see PORTING.md).
 */
export function AddressField({
  country,
  value,
  onChange,
  showErrors = false,
}: AddressFieldProps) {
  const t = useTranslations('onboarding.address');
  const config = useMemo(() => getCountryAddressConfig(country), [country]);

  // Start on the manual form if we already have an address (returning to step).
  const [manualVisible, setManualVisible] = useState(() =>
    Boolean(value?.line1),
  );

  // Postcode-lookup state.
  const [postcode, setPostcode] = useState(value?.postalCode ?? '');
  const [results, setResults] = useState<StructuredAddress[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Type-ahead state.
  const [query, setQuery] = useState('');
  const typeaheadItems = useMemo(
    () => searchAddresses(query, country),
    [query, country],
  );

  const update = useCallback(
    (patch: Partial<StructuredAddress>) => {
      onChange({ ...EMPTY, ...value, ...patch, country });
    },
    [onChange, value, country],
  );

  const selectAddress = useCallback(
    (address: StructuredAddress) => {
      onChange({ ...address, country });
      setManualVisible(true);
    },
    [onChange, country],
  );

  const handleFindPostcode = useCallback(() => {
    const found = getAddressesForPostcode(postcode, country);
    setResults(found);
    setHasSearched(true);
  }, [postcode, country]);

  const enterManually = useCallback(() => {
    if (!value) update({ postalCode: postcode });
    setManualVisible(true);
  }, [value, update, postcode]);

  const searchAgain = useCallback(() => {
    setManualVisible(false);
    setResults([]);
    setHasSearched(false);
  }, []);

  const line1Error = showErrors && !value?.line1?.trim();
  const cityError = showErrors && !value?.city?.trim();
  const postalError = showErrors && !value?.postalCode?.trim();

  return (
    <div className="space-y-4">
      {!manualVisible && config.mode === 'postcode-lookup' && (
        <div className="space-y-3">
          <Field>
            <FieldLabel htmlFor="postcode-lookup">
              {config.labels.postalCode}
            </FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                id="postcode-lookup"
                value={postcode}
                autoFocus
                placeholder={config.postcodePlaceholder}
                onChange={(event) => {
                  setPostcode(event.target.value);
                  setHasSearched(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleFindPostcode();
                  }
                }}
                className="min-w-0 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleFindPostcode}
                disabled={postcode.trim().length < 3}
              >
                {t('findAddress')}
              </Button>
            </div>
          </Field>

          {hasSearched && results.length > 0 && (
            <Field>
              <FieldLabel htmlFor="postcode-results">
                {t('selectAddress')}
              </FieldLabel>
              <Select
                onValueChange={(index) =>
                  selectAddress(results[Number(index)]!)
                }
              >
                <SelectTrigger id="postcode-results" className="w-full">
                  <SelectValue placeholder={t('selectAddressPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {results.map((address, index) => (
                    <SelectItem key={index} value={String(index)}>
                      {formatAddressSummary(address)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          {hasSearched && results.length === 0 && (
            <Muted className="text-sm">{t('noResults')}</Muted>
          )}
        </div>
      )}

      {!manualVisible && config.mode === 'typeahead' && (
        <Field>
          <FieldLabel>{t('searchLabel')}</FieldLabel>
          <Combobox
            items={typeaheadItems}
            // We already searched server-side (mock), so keep every result.
            filter={() => true}
            itemToStringLabel={(address: StructuredAddress) =>
              formatAddressSummary(address)
            }
            onValueChange={(address: StructuredAddress | null) => {
              if (address) selectAddress(address);
            }}
            onInputValueChange={(next: string) => setQuery(next)}
          >
            <ComboboxInput placeholder={config.searchPlaceholder}>
              <InputGroupAddon align="inline-start">
                <Search />
              </InputGroupAddon>
            </ComboboxInput>
            <ComboboxContent>
              <ComboboxEmpty>
                {query.trim().length < 3 ? t('keepTyping') : t('noResults')}
              </ComboboxEmpty>
              <ComboboxList>
                {(address: StructuredAddress) => (
                  <ComboboxItem
                    key={formatAddressSummary(address)}
                    value={address}
                  >
                    <ComboboxItemLabel>{address.line1}</ComboboxItemLabel>
                    <ComboboxItemDescription>
                      {[address.city, address.region, address.postalCode]
                        .filter(Boolean)
                        .join(', ')}
                    </ComboboxItemDescription>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </Field>
      )}

      {!manualVisible && (
        <div className="space-y-2">
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0"
            onClick={enterManually}
          >
            {t('enterManually')}
          </Button>
          {showErrors && <FieldError>{t('addressRequired')}</FieldError>}
        </div>
      )}

      {manualVisible && (
        <div className="space-y-4">
          <Field data-invalid={line1Error || undefined}>
            <FieldLabel htmlFor="address-line1">
              {config.labels.line1}
            </FieldLabel>
            <Input
              id="address-line1"
              value={value?.line1 ?? ''}
              onChange={(event) => update({ line1: event.target.value })}
              aria-invalid={line1Error || undefined}
              autoComplete="address-line1"
            />
            {line1Error && <FieldError>{t('line1Required')}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="address-line2">
              {config.labels.line2}
            </FieldLabel>
            <Input
              id="address-line2"
              value={value?.line2 ?? ''}
              onChange={(event) => update({ line2: event.target.value })}
              autoComplete="address-line2"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field data-invalid={cityError || undefined}>
              <FieldLabel htmlFor="address-city">
                {config.labels.city}
              </FieldLabel>
              <Input
                id="address-city"
                value={value?.city ?? ''}
                onChange={(event) => update({ city: event.target.value })}
                aria-invalid={cityError || undefined}
                autoComplete="address-level2"
              />
              {cityError && <FieldError>{t('cityRequired')}</FieldError>}
            </Field>

            <Field data-invalid={postalError || undefined}>
              <FieldLabel htmlFor="address-postal">
                {config.labels.postalCode}
              </FieldLabel>
              <Input
                id="address-postal"
                value={value?.postalCode ?? ''}
                onChange={(event) => update({ postalCode: event.target.value })}
                aria-invalid={postalError || undefined}
                autoComplete="postal-code"
              />
              {postalError && <FieldError>{t('postalRequired')}</FieldError>}
            </Field>
          </div>

          {config.showRegion && (
            <Field>
              <FieldLabel htmlFor="address-region">
                {config.labels.region}
              </FieldLabel>
              <Input
                id="address-region"
                value={value?.region ?? ''}
                onChange={(event) => update({ region: event.target.value })}
                autoComplete="address-level1"
              />
            </Field>
          )}

          <Button
            type="button"
            variant="link"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-auto p-0"
            onClick={searchAgain}
          >
            {t('searchAgain')}
          </Button>
        </div>
      )}
    </div>
  );
}
