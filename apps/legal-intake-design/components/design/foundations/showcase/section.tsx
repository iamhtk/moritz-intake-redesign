import type * as React from 'react';

import { Subheading } from '@/components/design/foundations/components/heading';

/**
 * Showcase section used across the design-library pages: a titled block with an
 * optional description and a wrapping row of examples.
 */
export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <Subheading variant="sans">{title}</Subheading>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </section>
  );
}
