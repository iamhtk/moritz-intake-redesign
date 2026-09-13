'use client';

import { UploadCloud } from '@repo/ui/icons';

/**
 * What "drop anywhere" looks like (Decision 9).
 *
 * The whole viewport is the target, so the whole viewport has to say so. A
 * page-wide target with no page-wide feedback is worse than a small one: the
 * client is holding a file over a screen that gives them nothing, so they hunt
 * for the panel anyway and the feature buys nothing.
 *
 * It is deliberately quiet: a wash and one line, not a coloured flood. The file
 * is still in the client's hand, this is confirmation that letting go is safe,
 * and it is on screen for about a second.
 *
 * `pointer-events-none` matters more than it looks. An overlay that eats
 * pointer events becomes the drop's target, and the drag events the elements
 * underneath were listening for stop arriving, so the composer's own zone would
 * go dead the moment this appeared. Every drop is handled at the window
 * (`use-window-drop.ts`), so this never needs to be hit.
 */
export function DropOverlay({
  heading,
  hint,
}: {
  heading: string;
  hint: string;
}) {
  return (
    <div
      aria-hidden="true"
      className="bg-background/80 mz-animate-reveal pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6 supports-[backdrop-filter]:backdrop-blur-[2px]"
    >
      <div className="border-foreground/25 bg-background/60 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-10 py-9 text-center shadow-sm">
        <span className="border-border bg-background text-foreground flex size-11 items-center justify-center rounded-full border">
          <UploadCloud className="size-5" strokeWidth={1.75} />
        </span>
        <p className="text-foreground text-[15px] font-medium">{heading}</p>
        <p className="text-muted-foreground max-w-xs text-xs leading-relaxed">
          {hint}
        </p>
      </div>
    </div>
  );
}
