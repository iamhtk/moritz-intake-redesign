'use client';

import * as React from 'react';

import { Check, Copy } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

/**
 * Documentation code block for the foundation pages: a bordered, mono surface
 * that matches the Input/Button family (0.5rem radius, `border-input`, blended
 * `shadow-sm`) with the same click-to-copy affordance as the color swatches.
 */
export function CodeBlock({
  code,
  label,
  className,
}: {
  code: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const timeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = React.useCallback(() => {
    void navigator.clipboard?.writeText(code);
    setCopied(true);
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setCopied(false), 1200);
  }, [code]);

  React.useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
    },
    [],
  );

  return (
    <div
      className={cn(
        'bg-muted/40 border-input group relative w-full overflow-hidden rounded-[0.5rem] border shadow-sm',
        className,
      )}
    >
      {label ? (
        <div className="border-input text-muted-foreground border-b px-4 py-2 font-mono text-xs">
          {label}
        </div>
      ) : null}
      <button
        type="button"
        onClick={copy}
        aria-label="Copy code"
        className="bg-background/90 text-foreground border-border hover:border-foreground/20 focus-visible:outline-ring absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium shadow-sm outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {copied ? (
          <>
            <Check className="size-3" /> Copied
          </>
        ) : (
          <>
            <Copy className="size-3" /> Copy
          </>
        )}
      </button>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
        <code className="text-foreground font-mono">{code}</code>
      </pre>
    </div>
  );
}
