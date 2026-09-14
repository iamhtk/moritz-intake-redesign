import path from 'node:path';
import { fileURLToPath } from 'node:url';
import createNextIntlPlugin from 'next-intl/plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output is for self-hosting (Docker). Vercel packages the app
  // itself and its build step fails on the standalone layout, so only opt in
  // when not building there.
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  // The dev-only indicator parks a floating button in the bottom-left corner,
  // over the intake's own content. Reviewers should not have to look past it.
  devIndicators: false,
  transpilePackages: ['@repo/ui'],
  outputFileTracingRoot: path.join(__dirname, '../..'),
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
};

export default withNextIntl(nextConfig);
