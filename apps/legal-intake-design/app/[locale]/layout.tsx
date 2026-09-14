import type { Metadata } from 'next';
import { Cormorant_Garamond, IBM_Plex_Mono, Inter } from 'next/font/google';
import '../globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@repo/ui/components/sonner';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import { ALL_LOCALES } from '@/lib/locales';
import { redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { getCurrentRole } from '@/components/playground/auth-stubs';
import { PasswordGate } from '@/components/playground/password-gate';
import { GATE_COOKIE, verifyGateToken } from '@/lib/playground/gate';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

// Foundation type system (all OFL-licensed): Inter for sans/UI, Cormorant
// Garamond for serif display headings, IBM Plex Mono for code and tokens.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant-garamond',
  display: 'swap',
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

/**
 * One title template, so every page only has to name itself.
 *
 * Every route in this app used to render the same tab title, because only
 * two of ninety-two set one. That is a paper cut on a marketing site and a
 * real problem here: this is a product people work in with six case tabs
 * open, and six identical tabs means reading each one to find the matter you
 * were in. `%s · Moritz` is the suffix; the leaf page supplies the part that
 * distinguishes it, and `default` covers the routes that genuinely have no
 * better name than the product's.
 */
export const metadata: Metadata = {
  title: {
    template: '%s · Moritz',
    default: 'Moritz Design Playground',
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: Locale }>;
}) {
  const { locale } = await params;

  if (!hasLocale(ALL_LOCALES, locale)) {
    redirect({ href: '/', locale: routing.defaultLocale });
    notFound();
  }

  const role = await getCurrentRole();

  const unlocked = await verifyGateToken(
    (await cookies()).get(GATE_COOKIE)?.value,
  );

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      // Playground is light-mode only; force light without next-themes so no
      // client-rendered theme <script> is injected (React 19 disallows that).
      style={{ colorScheme: 'light' }}
      className={`light ${inter.variable} ${cormorantGaramond.variable} ${ibmPlexMono.variable}`}
    >
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className="antialiased">
        <Providers initialRole={role}>
          <NextIntlClientProvider>
            {unlocked ? children : <PasswordGate />}
          </NextIntlClientProvider>
        </Providers>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
