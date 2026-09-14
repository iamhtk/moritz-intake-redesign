import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/**
 * A layout purely to carry the tab title.
 *
 * The page beside it is a client component — these four gallery pages hold
 * their own `useState` for the live examples — and `metadata` cannot be
 * exported from one. A server layout is the sanctioned way round it, and it
 * costs nothing at runtime.
 */
export const metadata: Metadata = { title: 'Alert · Foundations' };

export default function FoundationsPageLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
