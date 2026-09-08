'use client';

import { Sparkles } from '@repo/ui/icons';

/** "Reading your document…" state shown while mock extraction runs. */
export function ExtractionShimmer() {
  return (
    <div className="bg-muted/40 flex items-center gap-3 rounded-lg border border-dashed px-4 py-3">
      <Sparkles
        aria-hidden="true"
        className="text-primary h-4 w-4 animate-pulse"
      />
      <div className="flex-1">
        <p className="text-sm font-medium">Reading your document…</p>
        <div className="bg-muted mt-2 h-2 w-2/3 animate-pulse rounded-full" />
      </div>
    </div>
  );
}
