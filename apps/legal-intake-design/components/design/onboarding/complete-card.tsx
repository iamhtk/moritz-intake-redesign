'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight, Check } from '@repo/ui/icons';
import { Button } from '@/components/design/design-system/button';
import { Heading } from '@/components/design/foundations/components/heading';
import { Text } from '@/components/design/foundations/components/text';

interface CompleteCardProps {
  dashboardPath: string;
  /**
   * Which success copy to show. Clients are nudged to create their first case;
   * attorneys joining a firm get profile-oriented copy instead.
   */
  variant?: 'client' | 'attorney';
}

export function CompleteCard({
  dashboardPath,
  variant = 'client',
}: CompleteCardProps) {
  const t = useTranslations('onboarding.complete');
  const successKey = variant === 'attorney' ? 'attorneySuccess' : 'success';

  return (
    <div className="flex h-full flex-col">
      {/* Centered hero: a restrained hairline check mark, the headline, and a
          short reassurance — kept monochrome to match the editorial feel. The
          ring eases in on mount and the check draws itself. */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <span className="border-border text-foreground mz-animate-reveal flex size-12 items-center justify-center rounded-full border">
          <Check className="mz-animate-check size-5" strokeWidth={1.75} />
        </span>
        <div className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both space-y-3 delay-300 duration-700 ease-out">
          <Heading level={2}>{t(`${successKey}.title`)}</Heading>
          <Text className="mx-auto max-w-sm text-balance">
            {t(`${successKey}.description`)}
          </Text>
        </div>
      </div>

      <Button size="lg" className="group w-full" asChild>
        <Link href={dashboardPath}>
          {t(`${successKey}.cta`)}
          <ArrowRight
            data-icon="inline-end"
            className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
          />
        </Link>
      </Button>
    </div>
  );
}
