import type { ReactNode } from 'react';

/**
 * Root layout required so routes outside `[locale]` (e.g. /api-test) can render.
 * Locale routes keep their own `<html>` / `<body>` in `[locale]/layout.tsx`
 * (next-intl App Router pattern).
 */
export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return children;
}
