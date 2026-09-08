import type { ReactNode } from 'react';

/**
 * Wraps feature-flagged content. When the environment is not production
 * and the flag is enabled, renders a subtle dotted border with the flag
 * name visible on hover.
 *
 * When the flag is false the children are not rendered at all.
 */
export function FeatureFlagged({
  flag,
  flagName,
  arclineEnv,
  children,
}: {
  flag: boolean;
  flagName: string;
  arclineEnv: string;
  children: ReactNode;
}) {
  if (!flag) return null;

  const showDisclaimer = arclineEnv !== 'production';

  if (!showDisclaimer) return <>{children}</>;

  return (
    <div className="hover:border-muted-foreground/30 group relative rounded border border-dashed border-transparent">
      {children}
      <span className="bg-foreground text-background pointer-events-none absolute -top-5 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[10px] opacity-0 transition-opacity group-hover:opacity-100">
        {flagName}
      </span>
    </div>
  );
}
