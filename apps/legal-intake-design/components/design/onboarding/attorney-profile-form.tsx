'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Field, FieldError, FieldLabel } from '@repo/ui/components/field';
import { Input } from '@/components/design/design-system/input';
import { Textarea } from '@/components/design/design-system/textarea';
import { OnboardingActions } from '@/components/design/onboarding/onboarding-actions';
import { AnimatedPlaceholder } from '@/components/design/onboarding/animated-placeholder';

interface AttorneyProfileFormProps {
  defaultBio?: string;
  defaultLinkedinUrl?: string;
  onContinue?: () => void;
  onBack?: () => void;
  progressCurrent?: number;
  progressTotal?: number;
}

function isValidLinkedInUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return /(^|\.)linkedin\.com$/.test(url.hostname);
  } catch {
    return false;
  }
}

/**
 * Attorney-only onboarding step that collects the public-facing profile shown to
 * clients: a short professional bio and a LinkedIn profile link.
 */
export function AttorneyProfileForm({
  defaultBio = '',
  defaultLinkedinUrl = '',
  onContinue,
  onBack,
  progressCurrent,
  progressTotal,
}: AttorneyProfileFormProps) {
  const t = useTranslations('registration');
  const bioPlaceholders = t.raw('fields.bioPlaceholders') as string[];

  const [bio, setBio] = useState(defaultBio);
  const [linkedinUrl, setLinkedinUrl] = useState(defaultLinkedinUrl);
  const [bioInvalid, setBioInvalid] = useState(false);
  const [linkedinInvalid, setLinkedinInvalid] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const hasBioError = !bio.trim();
    const hasLinkedinError = !isValidLinkedInUrl(linkedinUrl);
    setBioInvalid(hasBioError);
    setLinkedinInvalid(hasLinkedinError);
    if (hasBioError || hasLinkedinError) {
      return;
    }

    // Design playground: simulate persisting the attorney profile.
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
        <Field data-invalid={bioInvalid || undefined}>
          <FieldLabel htmlFor="bio">{t('fields.bio')}</FieldLabel>
          <div className="relative">
            <Textarea
              id="bio"
              name="bio"
              rows={5}
              value={bio}
              onChange={(event) => {
                setBio(event.target.value);
                if (bioInvalid) setBioInvalid(false);
              }}
              aria-invalid={bioInvalid || undefined}
            />
            {bio.trim() === '' && (
              <AnimatedPlaceholder examples={bioPlaceholders} />
            )}
          </div>
          {bioInvalid && <FieldError>{t('fields.bioRequired')}</FieldError>}
        </Field>

        <Field data-invalid={linkedinInvalid || undefined}>
          <FieldLabel htmlFor="linkedinUrl">{t('fields.linkedin')}</FieldLabel>
          <Input
            id="linkedinUrl"
            name="linkedinUrl"
            type="url"
            inputMode="url"
            value={linkedinUrl}
            placeholder={t('fields.linkedinPlaceholder')}
            onChange={(event) => {
              setLinkedinUrl(event.target.value);
              if (linkedinInvalid) setLinkedinInvalid(false);
            }}
            aria-invalid={linkedinInvalid || undefined}
            autoComplete="url"
          />
          {linkedinInvalid && (
            <FieldError>
              {linkedinUrl.trim()
                ? t('fields.linkedinInvalid')
                : t('fields.linkedinRequired')}
            </FieldError>
          )}
        </Field>
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
