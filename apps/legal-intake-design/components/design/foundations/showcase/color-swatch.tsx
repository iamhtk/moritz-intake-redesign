'use client';

import * as React from 'react';

import { Check, Copy } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

import type { Swatch } from '../tokens/colors';

export function ColorSwatch({
  swatch,
  compact = false,
}: {
  swatch: Swatch;
  compact?: boolean;
}) {
  const [copied, setCopied] = React.useState(false);
  const timeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = React.useCallback(() => {
    void navigator.clipboard?.writeText(swatch.hex);
    setCopied(true);
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setCopied(false), 1200);
  }, [swatch.hex]);

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
      aria-label={`Copy ${swatch.name ?? swatch.hex} hex value ${swatch.hex}`}
      className={cn(
        // Mirrors the foundation Input/Button family: 0.5rem radius, the
        // `border-input` stroke that darkens to `foreground/20` on hover, a
        // subtle blended `shadow-sm`, and the shared `outline-ring` focus stroke.
        // `flex flex-col` lays the fill + meta out as a clean column (avoids the
        // native button content-box top offset), and `overflow-hidden` clips the
        // fill to the rounded corners — it does not clip the card's own shadow or
        // focus outline.
        'bg-background border-input hover:border-foreground/20 focus-visible:outline-ring group relative isolate flex w-full flex-col overflow-hidden rounded-[0.5rem] border text-left shadow-sm outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
      )}
    >
      <span
        // Color fill; the card's `overflow-hidden` rounds its top corners and the
        // surrounding border keeps light/near-white swatches defined without an
        // inset ring (which would read as a hairline on saturated colors). When a
        // theme token (`fillClass`) is provided we paint from it; otherwise we
        // fall back to the literal hex.
        className={cn(
          'relative block w-full',
          compact ? 'h-12' : 'h-24',
          swatch.fillClass,
        )}
        style={swatch.fillClass ? undefined : { backgroundColor: swatch.hex }}
      >
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
        {swatch.name ? (
          <span className="block text-sm font-medium leading-snug">
            {swatch.name}
          </span>
        ) : null}
        <code className="text-muted-foreground block text-xs uppercase">
          {swatch.hex}
        </code>
      </span>
    </button>
  );
}
