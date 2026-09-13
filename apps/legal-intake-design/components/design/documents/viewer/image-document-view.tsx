'use client';

import { useEffect, useState } from 'react';

import { cn } from '@repo/ui/lib/utils';

/**
 * A photographed document.
 *
 * Every intake that takes PDFs also takes photos — a client shoots the letter
 * they were sent rather than scanning it — so the viewer cannot be a PDF
 * viewer with a gap where images are. It is the plain case: one image, fitted
 * to the column, with the same download and print controls above it. There is
 * no text layer, so there is nothing to search and nothing to highlight, and
 * the toolbar hides those controls rather than offering ones that cannot work.
 */
export function ImageDocumentView({
  file,
  alt,
  className,
}: {
  file: File;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    // Revoked on the way out: an object URL holds the whole file in memory for
    // as long as it exists, and a client can attach five of them.
    return () => URL.revokeObjectURL(next);
  }, [file]);

  return (
    <div
      className={cn(
        'mz-scrollbar-on-scroll bg-muted/40 min-h-0 flex-1 overflow-auto p-6',
        className,
      )}
    >
      {url !== null && (
        /*
         * A plain `img`, not `next/image`: the source is a blob URL for a file
         * that never left the browser, so there is no origin for the optimiser
         * to fetch and nothing it could do if there were.
         */
        <img
          src={url}
          alt={alt}
          className="bg-background ring-foreground/10 mx-auto block h-auto max-w-full rounded-[0.5rem] ring-1"
        />
      )}
    </div>
  );
}
