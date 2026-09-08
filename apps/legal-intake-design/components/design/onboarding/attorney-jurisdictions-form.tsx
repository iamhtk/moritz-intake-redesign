'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Field, FieldError, FieldLabel } from '@repo/ui/components/field';
import { OnboardingActions } from '@/components/design/onboarding/onboarding-actions';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxItemLabel,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/design/foundations/components/combobox';
import { DIAL_CODES } from '@/lib/dial-codes';
import { US_STATES, type StateOption } from '@/lib/us-states';

/** A jurisdiction (country) an attorney can be admitted to practice in. */
export type JurisdictionOption = { value: string; label: string; flag: string };

// Jurisdictions reuse the country catalogue from dial-codes (sorted by name)
// so the multi-select stays in step with the rest of the onboarding country UI.
const JURISDICTIONS: JurisdictionOption[] = [...DIAL_CODES]
  .map((entry) => ({
    value: entry.code,
    label: entry.name,
    flag: entry.flag,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

interface AttorneyJurisdictionsFormProps {
  defaultJurisdictions?: JurisdictionOption[];
  defaultStates?: StateOption[];
  onContinue?: () => void;
  onBack?: () => void;
  progressCurrent?: number;
  progressTotal?: number;
}

/**
 * Attorney-only onboarding step that collects the jurisdictions a lawyer is
 * admitted to practice in. Lives on its own screen (separate from the bio /
 * LinkedIn profile step) since it describes professional capability rather than
 * client-facing identity, and has room to grow.
 */
export function AttorneyJurisdictionsForm({
  defaultJurisdictions = [],
  defaultStates = [],
  onContinue,
  onBack,
  progressCurrent,
  progressTotal,
}: AttorneyJurisdictionsFormProps) {
  const t = useTranslations('registration');

  const [jurisdictions, setJurisdictions] =
    useState<JurisdictionOption[]>(defaultJurisdictions);
  const [jurisdictionsInvalid, setJurisdictionsInvalid] = useState(false);
  const [states, setStates] = useState<StateOption[]>(defaultStates);
  const [statesInvalid, setStatesInvalid] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const jurisdictionAnchor = useComboboxAnchor();
  const stateAnchor = useComboboxAnchor();
  const jurisdictionItems = useMemo(() => JURISDICTIONS, []);
  const stateItems = useMemo(() => US_STATES, []);

  // US attorneys hold bar admissions per state, so once the US is one of the
  // chosen jurisdictions we ask which states specifically.
  const usSelected = jurisdictions.some((j) => j.value === 'US');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (jurisdictions.length === 0) {
      setJurisdictionsInvalid(true);
      return;
    }

    if (usSelected && states.length === 0) {
      setStatesInvalid(true);
      return;
    }

    // Design playground: simulate persisting the attorney jurisdictions.
    setIsPending(true);
    setTimeout(() => {
      setIsPending(false);
      onContinue?.();
    }, 500);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 flex-col gap-6"
      noValidate
    >
      <div className="mz-animate-step space-y-4">
        <Field data-invalid={jurisdictionsInvalid || undefined}>
          <FieldLabel htmlFor="jurisdictions">
            {t('fields.jurisdictions')}
          </FieldLabel>
          <Combobox
            multiple
            items={jurisdictionItems}
            value={jurisdictions}
            onValueChange={(options: JurisdictionOption[]) => {
              setJurisdictions(options);
              if (jurisdictionsInvalid && options.length > 0) {
                setJurisdictionsInvalid(false);
              }
              if (!options.some((option) => option.value === 'US')) {
                setStates([]);
                setStatesInvalid(false);
              }
            }}
          >
            <ComboboxChips
              ref={jurisdictionAnchor}
              aria-invalid={jurisdictionsInvalid || undefined}
            >
              <ComboboxValue>
                {(selected: JurisdictionOption[]) =>
                  selected.map((item) => (
                    <ComboboxChip key={item.value}>
                      <span aria-hidden className="text-base leading-none">
                        {item.flag}
                      </span>
                      {item.label}
                    </ComboboxChip>
                  ))
                }
              </ComboboxValue>
              <ComboboxChipsInput
                id="jurisdictions"
                placeholder={t('fields.jurisdictionsPlaceholder')}
              />
            </ComboboxChips>
            <ComboboxContent anchor={jurisdictionAnchor}>
              <ComboboxEmpty>{t('fields.jurisdictionsEmpty')}</ComboboxEmpty>
              <ComboboxList>
                {(item: JurisdictionOption) => (
                  <ComboboxItem key={item.value} value={item}>
                    <span aria-hidden className="text-base leading-none">
                      {item.flag}
                    </span>
                    <ComboboxItemLabel>{item.label}</ComboboxItemLabel>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          {jurisdictionsInvalid && (
            <FieldError>{t('fields.jurisdictionsRequired')}</FieldError>
          )}
        </Field>

        {usSelected && (
          <Field data-invalid={statesInvalid || undefined}>
            <FieldLabel htmlFor="states">{t('fields.states')}</FieldLabel>
            <Combobox
              multiple
              items={stateItems}
              value={states}
              onValueChange={(options: StateOption[]) => {
                setStates(options);
                if (statesInvalid && options.length > 0) {
                  setStatesInvalid(false);
                }
              }}
            >
              <ComboboxChips
                ref={stateAnchor}
                aria-invalid={statesInvalid || undefined}
              >
                <ComboboxValue>
                  {(selected: StateOption[]) =>
                    selected.map((item) => (
                      <ComboboxChip key={item.value}>{item.label}</ComboboxChip>
                    ))
                  }
                </ComboboxValue>
                <ComboboxChipsInput
                  id="states"
                  placeholder={t('fields.statesPlaceholder')}
                />
              </ComboboxChips>
              <ComboboxContent anchor={stateAnchor}>
                <ComboboxEmpty>{t('fields.statesEmpty')}</ComboboxEmpty>
                <ComboboxList>
                  {(item: StateOption) => (
                    <ComboboxItem key={item.value} value={item}>
                      <ComboboxItemLabel>{item.label}</ComboboxItemLabel>
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            {statesInvalid && (
              <FieldError>{t('fields.statesRequired')}</FieldError>
            )}
          </Field>
        )}
      </div>

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
