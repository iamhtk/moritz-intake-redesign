import type { ReactNode } from 'react';

import { LibrarySidebar } from '@/components/design/foundations/showcase/library-sidebar';

export default function FoundationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <LibrarySidebar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl space-y-12 px-6 py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
