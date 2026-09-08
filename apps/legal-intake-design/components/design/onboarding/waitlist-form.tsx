'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Mail } from '@repo/ui/icons';
import { Button } from '@/components/design/design-system/button';
import { Heading } from '@/components/design/foundations/components/heading';
import { Text } from '@/components/design/foundations/components/text';

interface WaitlistFormProps {
  userEmail: string;
  companyName: string;
  countryCode: string;
  countryName: string;
  onSubmittedChange?: (submitted: boolean) => void;
  /**
   * Async action run when the user joins the waitlist. The playground defaults
   * to a simulated delay; the main app injects `waitlist.joinAuthenticated`
   * here (see PORTING.md). The success state shows once it resolves.
   */
  onJoin?: () => void | Promise<void>;
}

export function WaitlistForm({
  userEmail,
  companyName,
  countryCode,
  countryName,
  onSubmittedChange,
  onJoin,
}: WaitlistFormProps) {
  const t = useTranslations('onboarding.waitlist');

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleNotify = () => {
    // Submit seam: the main app injects waitlist.joinAuthenticated via `onJoin`.
    // The playground defaults to a simulated delay.
    setIsPending(true);
    const runJoin = onJoin
      ? Promise.resolve(onJoin())
      : new Promise<void>((resolve) => setTimeout(resolve, 500));
    runJoin
      .then(() => {
        setIsSubmitted(true);
        onSubmittedChange?.(true);
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  if (isSubmitted) {
    // Mirror the completion screen: a restrained hairline check mark, the
    // headline, and a short reassurance — monochrome to match the editorial
    // feel. The ring eases in on mount and the check draws itself.
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <span className="border-border text-foreground mz-animate-reveal flex size-12 items-center justify-center rounded-full border">
          <Mail
            className="mz-animate-draw size-5"
            strokeWidth={1.75}
            style={{
              ['--mz-draw' as string]: '92',
              animationDuration: '2.6s',
            }}
          />
        </span>
        <div className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both space-y-3 delay-300 duration-700 ease-out">
          <Heading level={2}>{t('success.title')}</Heading>
          <Text className="mx-auto max-w-md text-balance">
            {t('success.description', {
              country: countryName,
            })}
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border p-5">
        <dl className="space-y-3 text-sm">
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">{t('summary.email')}</dt>
            <dd className="break-words text-right">{userEmail}</dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">{t('summary.company')}</dt>
            <dd className="break-words text-right">
              {companyName || t('summary.companyFallback')}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">{t('summary.country')}</dt>
            <dd className="break-words text-right">
              {countryName} ({countryCode})
            </dd>
          </div>
        </dl>
      </div>

      <Button
        type="button"
        disabled={isPending}
        className="w-full"
        onClick={handleNotify}
      >
        {isPending ? t('cta.notifying') : t('cta.notify')}
      </Button>
    </div>
  );
}
