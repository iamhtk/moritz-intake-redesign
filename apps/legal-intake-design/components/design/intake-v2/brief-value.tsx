'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@repo/ui/lib/utils';

/**
 * A brief row's value, with the row's controls set into the top-right of it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THE CONTROLS FLOAT INSTEAD OF SITTING IN A FLEX ROW.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * They used to be a `shrink-0` sibling of the value in a `flex` row, which is
 * the obvious layout and is wrong for this content. The receipt pill —
 * "✓ Accepted · you · 11 minutes ago · Undo" — is about 230px wide and never
 * shrinks, so in a sidebar it took roughly half the available width away from
 * the value **for the pill's whole height and for every line below it**. A
 * two-line answer became six lines in a column half as wide as the panel it
 * was in, and the panel's own argument is that the brief reads like a document.
 *
 * A float is the layout that matches the intent: the pill is set into the
 * text's top-right corner, the first line or two wrap around it, and every
 * line after it runs the full width of the column. This is what a pull-quote
 * does, and it is what CSS floats are actually for.
 *
 * **The wrapper's `overflow-hidden` is load-bearing twice over**, and the two
 * reasons pull in opposite directions, which is worth spelling out because the
 * obvious simplification breaks one of them:
 *
 * 1. It clips the collapsed value, so the fade has an edge to sit on.
 * 2. It establishes a block formatting context — and a BFC does **not** let
 *    the box overlap floats *outside* it, which is exactly why the float has
 *    to live **inside** this wrapper. Floated as a sibling above it, the
 *    wrapper would be pushed clear of the pill instead of wrapping around it,
 *    and the layout would silently go back to a narrow column.
 *
 * So: float inside, clip on the wrapper, and no `line-clamp`. `line-clamp`
 * switches the box to `-webkit-box`, whose interaction with an intruding float
 * is not something to rely on; a measured `max-height` is plain block layout
 * and wraps correctly.
 */

/**
 * The collapsed height, in lines of `text-sm` (20px each).
 *
 * Four rather than two. The pill is 28px tall, so two lines is the *wrap*
 * height — the point at which the text stops being indented — and collapsing
 * at exactly that would hide the fact that the value continues into the full
 * width below it. Four lines shows the wrap, shows the column widen again, and
 * then fades, so what is hidden reads as more of the same rather than as a
 * different shape.
 */
const COLLAPSED_LINES = 4;
const LINE_HEIGHT_REM = 1.25;
const COLLAPSED_MAX_HEIGHT = `${COLLAPSED_LINES * LINE_HEIGHT_REM}rem`;

export function BriefValue({
  value,
  controls,
  muted = false,
  className,
}: {
  /** The text to show. Rendered with `whitespace-pre-line`, as it always was. */
  value: string;
  /**
   * The row's trailing controls — the receipt pill, or Accept and Edit.
   *
   * Passed in rather than rendered here so this component stays a layout: it
   * knows the controls go top-right and wrap the text, and nothing about which
   * controls a row is in a state to offer.
   */
  controls?: ReactNode;
  /** The empty-row hint, which is the same layout in a lighter ink. */
  muted?: boolean;
  className?: string;
}) {
  const t = useTranslations('intake.brief');
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  /*
   * Measured rather than guessed from the length of the string. The wrap
   * around the pill means the same text occupies a different number of lines
   * depending on whether the row has controls and how wide the panel is, so a
   * character count would show "Read more" on a value that fits and hide it on
   * one that does not.
   */
  const measure = useCallback(() => {
    const box = boxRef.current;
    if (!box || expanded) return;
    setOverflowing(box.scrollHeight > box.clientHeight + 1);
  }, [expanded]);

  useLayoutEffect(() => {
    measure();
  }, [measure, value]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(box);
    return () => observer.disconnect();
  }, [measure]);

  const collapsed = !expanded && overflowing;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div
        ref={boxRef}
        className="relative overflow-hidden"
        style={collapsed ? { maxHeight: COLLAPSED_MAX_HEIGHT } : undefined}
      >
        {/*
         * First in source order, which is what a float needs: it shortens the
         * line boxes that come *after* it. Inside the clipping wrapper, per the
         * note at the top of this file.
         *
         * `mb-1` keeps the line that runs underneath the pill off its edge.
         */}
        {controls ? (
          <span className="float-right mb-1 ms-2 flex items-center gap-1.5">
            {controls}
          </span>
        ) : null}

        <p
          className={cn(
            'whitespace-pre-line text-sm',
            muted ? 'text-muted-foreground' : 'text-foreground',
          )}
        >
          {value}
        </p>

        {/*
         * The fade, only while there is something behind it. Pointer events
         * off so it never swallows a click on the text it covers, and
         * `to-transparent` rather than a second colour so it works on the
         * panel's own `background` without being told what that is.
         */}
        {collapsed ? (
          <span
            aria-hidden="true"
            className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t to-transparent"
          />
        ) : null}
      </div>

      {/*
       * Shown only once the text has actually been cut. A permanent "Read more"
       * on a one-line value is a control that does nothing, which is the same
       * defect as a permanent Undo.
       *
       * `w-fit` so the hit area is the words rather than the column.
       */}
      {overflowing ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="text-muted-foreground hover:text-foreground focus-visible:outline-ring focus-visible:outline-solid mz-tap relative w-fit cursor-pointer text-xs outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {expanded ? t('showLess') : t('readMore')}
        </button>
      ) : null}
    </div>
  );
}
