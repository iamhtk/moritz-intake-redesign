'use client';

import * as React from 'react';

import { Check, Copy } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

import type { GradientSwatch as GradientSwatchToken } from '../tokens/colors';

export function GradientSwatch({ swatch }: { swatch: GradientSwatchToken }) {
  const [copied, setCopied] = React.useState(false);
  const timeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = React.useCallback(() => {
    void navigator.clipboard?.writeText(swatch.css);
    setCopied(true);
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setCopied(false), 1200);
  }, [swatch.css]);

  React.useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
    },
    [],
  );

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${swatch.name} gradient CSS`}
      className={cn(
        // Mirrors ColorSwatch: 0.5rem radius, hover-darkening border, subtle
        // shadow, shared focus ring, column layout, clipped fill.
        'bg-background border-input hover:border-foreground/20 focus-visible:outline-ring group relative isolate flex w-full flex-col overflow-hidden rounded-[0.5rem] border text-left shadow-sm outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
      )}
    >
      <span className={cn('relative block h-40 w-full', swatch.fillClass)}>
        <span
          className={cn(
            'bg-background/90 text-foreground border-border absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium shadow-sm transition-opacity',
            copied ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
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
        </span>
      </span>
      <span className="block space-y-1 p-3">
        <span className="block text-sm font-medium leading-snug">
          {swatch.name}
        </span>
        <span className="text-muted-foreground block text-xs">
          Linear Gradient
        </span>
        <code className="text-muted-foreground block text-xs uppercase">
          {swatch.stops}
        </code>
      </span>
    </button>
  );
}
