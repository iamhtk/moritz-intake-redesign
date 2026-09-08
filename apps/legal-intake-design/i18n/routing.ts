import { defineRouting } from 'next-intl/routing';
import { ALL_LOCALES } from '@/lib/locales';

export const routing = defineRouting({
  locales: ALL_LOCALES,
  defaultLocale: 'en',
});

export type { Locale } from '@/lib/locales';
