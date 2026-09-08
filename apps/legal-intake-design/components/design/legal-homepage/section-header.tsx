import type { ReactNode } from 'react';

/**
 * Small section header for the lawyer homepage: an uppercase tracked eyebrow with
 * an optional right-aligned action (e.g. a "View all" link). Mirrors the calm
 * eyebrow treatment used across the client homepage and detail-panel surfaces.
 */
export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-muted-foreground text-xs font-medium uppercase tracking-[0.16em]">
        {title}
      </h2>
      {action}
    </div>
  );
}
