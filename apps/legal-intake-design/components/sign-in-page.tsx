'use client';

import { useState } from 'react';
import { Button } from '@/components/design/design-system/button';
import { Field, FieldLabel } from '@repo/ui/components/field';
import { Input } from '@/components/design/design-system/input';
import {
  Banner,
  BannerDescription,
  BannerTitle,
} from '@repo/ui/components/banner';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { toast } from 'sonner';
import { KeyRound, Mail } from '@repo/ui/icons';
import { H3 } from '@/components/design/design-system/typography';

type Props = {
  error?: string | null;
};

export function SignInPage({ error }: Props) {
  const t = useTranslations('auth.signIn');
  const t2 = useTranslations('registration.fields');
  const router = useRouter();
  const [submitting, setSubmitting] = useState<string | null>(null);

  const handleWorkos = () => {
    setSubmitting('workos');
    toast.success('WorkOS sign-in is mocked. Redirecting…');
    setTimeout(() => router.push('/'), 600);
  };

  const handleEmail = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting('email');
    toast.success('Magic-link email is mocked. Redirecting to OTP…');
    setTimeout(() => router.push('/sign-in-verify'), 600);
  };

  const handlePasskey = () => {
    setSubmitting('passkey');
    toast.success('Passkey sign-in is mocked. Redirecting…');
    setTimeout(() => router.push('/'), 600);
  };

  const showOauthOnly = error === 'oauth_only';
  const showEmailAuthOnly = error === 'email_auth_only';

  return (
    <div className="from-background to-muted/20">
      <main className="container mx-auto flex justify-center px-4 pt-32">
        <div className="w-full max-w-sm space-y-4">
          <H3 asChild>
            <h1>{t('title')}</h1>
          </H3>
          <div>
            <p>{t('descriptionLine1')}</p>
            <p>{t('descriptionLine2')}</p>
          </div>

          {showOauthOnly && (
            <Banner variant="destructive">
              <BannerTitle>{t('emailBlockedTitle')}</BannerTitle>
              <BannerDescription>
                {t('emailBlockedDescription')}
              </BannerDescription>
            </Banner>
          )}
          {showEmailAuthOnly && (
            <Banner variant="destructive">
              <BannerTitle>{t('emailExistsTitle')}</BannerTitle>
              <BannerDescription>
                {t('emailExistsDescription')}
              </BannerDescription>
            </Banner>
          )}

          <Button
            type="button"
            onClick={handleWorkos}
            disabled={submitting !== null}
            className="w-full"
          >
            {t('workos')}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handlePasskey}
            disabled={submitting !== null}
            className="w-full gap-2"
          >
            <KeyRound className="h-4 w-4" /> {t('passkey')}
          </Button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card text-muted-foreground px-2">
                {t('divider')}
              </span>
            </div>
          </div>

          <form className="space-y-2" onSubmit={handleEmail}>
            <Field className="mb-4">
              <FieldLabel htmlFor="email">{t2('email')}</FieldLabel>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder={t('emailPlaceholder')}
              />
            </Field>
            <Button
              type="submit"
              variant="secondary"
              className="w-full gap-2"
              disabled={submitting !== null}
            >
              <Mail className="h-4 w-4" /> {t('email')}
            </Button>
          </form>

          <p className="mx-4 text-sm">
            {t('legalNoticePrefix')}{' '}
            <a
              href="https://www.moritzlegal.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:no-underline"
            >
              {t('legalNoticeTerms')} ↗
            </a>{' '}
            {t('legalNoticeAnd')}{' '}
            <a
              href="https://www.moritzlegal.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:no-underline"
            >
              {t('legalNoticePrivacy')} ↗
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
