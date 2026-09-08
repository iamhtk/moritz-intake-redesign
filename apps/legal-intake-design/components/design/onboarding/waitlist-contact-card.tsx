'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, CalendarClock } from '@repo/ui/icons';
import { Button } from '@/components/design/design-system/button';
import { Heading } from '@/components/design/foundations/components/heading';
import { Text } from '@/components/design/foundations/components/text';

// Same booking link as the "Book a call" action on the client homepage
// (see components/design/homepage-v2/quick-actions.tsx).
const BOOK_A_CALL_URL = 'https://cal.com/marissa-chung/moritz20min';

/**
 * Alternate client waitlist screen: we acknowledge the enquiry and point the
 * client to a single next move — booking a call to discuss their use cases
 * further. Deliberately makes no promise to follow up. Mirrors the
 * terminal-screen language of `CompleteCard`/`ClientWelcome`: a restrained
 * hairline ring with a drawn glyph, a plain headline + reassurance, and a
 * bottom-pinned primary CTA.
 */
export function WaitlistContactCard() {
  const t = useTranslations('onboarding.waitlistContact');

  return (
    <div className="flex h-full flex-col gap-8">
      {/* Centered hero: hairline ring + drawn glyph, headline, short reassurance
          — monochrome to match the editorial feel. */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <span className="border-border text-foreground mz-animate-reveal flex size-12 items-center justify-center rounded-full border">
          <CalendarClock
            className="mz-animate-draw size-5 [--mz-draw:120]"
            strokeWidth={1.75}
            style={{ animationDuration: '2.6s' }}
          />
        </span>
        <div className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both space-y-3 delay-300 duration-700 ease-out">
          <Heading level={2}>{t('title')}</Heading>
          <Text className="mx-auto max-w-md text-balance">
            {t('description')}
          </Text>
        </div>
      </div>

      {/* Single next move: book a call to discuss use cases further. */}
      <Button size="lg" className="group w-full" asChild>
        <a href={BOOK_A_CALL_URL} target="_blank" rel="noopener noreferrer">
          {t('cta.bookCall')}
          <ArrowRight
            data-icon="inline-end"
            className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
          />
        </a>
      </Button>
    </div>
  );
}
