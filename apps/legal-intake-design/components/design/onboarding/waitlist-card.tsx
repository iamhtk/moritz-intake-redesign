'use client';

import { useTranslations } from 'next-intl';
import { ArrowUpRight, BadgeCheck, User } from '@repo/ui/icons';
import { Button } from '@/components/design/design-system/button';
import {
  Card,
  CardAction,
  CardFooter,
  CardHeader,
  CardDescription,
} from '@/components/design/design-system/card';
import { H2, H3, Muted } from '@/components/design/design-system/typography';

// Design playground: stand-in for env.NEXT_PUBLIC_ENTERPRISE_CONTACT_URL.
const ENTERPRISE_CONTACT_URL = 'https://moritz.legal/contact';

interface WaitlistCardProps {
  userName: string;
}

export function WaitlistCard({ userName }: WaitlistCardProps) {
  const t = useTranslations('onboarding.review');

  return (
    <div className="flex h-full flex-col gap-8">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="border-border text-foreground mz-animate-reveal flex size-10 shrink-0 items-center justify-center rounded-full border">
            <BadgeCheck
              className="mz-animate-draw size-5 [--mz-draw:96]"
              strokeWidth={1.75}
            />
          </span>
          <H2>{t('title')}</H2>
        </div>
        <div className="space-y-2">
          <Muted>{t('body1', { name: userName })}</Muted>
          <Muted>{t('body2')}</Muted>
        </div>
      </div>

      {/* Demo prompt, pinned to the bottom of the column. */}
      <Card size="sm" className="mt-auto">
        <CardHeader>
          <H3>{t('demo1')}</H3>
          <CardDescription>{t('demo2')}</CardDescription>
          <CardAction>
            <div className="hidden -space-x-2 sm:flex">
              {Array.from({ length: 5 }, (_, index) => (
                <span
                  key={index}
                  className="border-card bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-full border-2"
                >
                  <User className="size-4" strokeWidth={1.75} />
                </span>
              ))}
            </div>
          </CardAction>
        </CardHeader>
        <CardFooter>
          <Button className="w-fit" asChild>
            <a
              href={ENTERPRISE_CONTACT_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('demoButton')}
              <ArrowUpRight data-icon="inline-end" className="size-4" />
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
