'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

/**
 * The only controls in the flow that are not part of the product.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THESE EXIST AND WHY THEY MUST NOT LOOK LIKE BUTTONS.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The quote used to arrive on a twelve-second timer armed by every real
 * submission, so the last screen of the required flow dissolved while a
 * reviewer was reading it. The timer went (see `advanceToQuote`), and these
 * replaced it: the reviewer moves between the confirmation and the quote by
 * pressing something, in both directions.
 *
 * A pair rather than a one-way door, because a reviewer who skips ahead and
 * then wants to re-read the confirmation would otherwise have to start a case
 * again. The back link is on the quote screen and stays on it after "Accept
 * and start", which is the furthest the prototype goes and therefore the
 * easiest place to get stranded.
 *
 * **They have to read as prototype controls.** §3's warning is the whole
 * design brief for this component: if one reads as a normal button, a
 * reviewer's first thought is "customers can summon their own quote?", which
 * is a worse impression than not showing the quote at all — it would say the
 * flow does not understand that a person writes the price. So: no button
 * component, no border, no fill, the smallest step on the type scale, muted
 * throughout, and the words **"Prototype only" first**, before the thing it
 * does. A reviewer skimming reads two words, and those two words are the
 * whole job of this element.
 *
 * One component for both, so the two cannot drift apart. A reviewer who has
 * learned what this treatment means on one screen should not have to learn it
 * again on the next.
 */
export function PrototypeLink({
  action,
  direction,
  onClick,
  className,
}: {
  /** The key under `intake.prototype` naming what pressing it does. */
  action: 'skipToQuote' | 'backToConfirmation';
  direction: 'forward' | 'back';
  onClick: () => void;
  className?: string;
}) {
  const t = useTranslations('intake.prototype');
  const Arrow = direction === 'forward' ? ArrowRight : ArrowLeft;

  return (
    <div className={cn('flex justify-center', className)}>
      <button
        type="button"
        data-tour={direction === 'forward' ? 'prototype-link' : 'prototype-back'}
        onClick={onClick}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring mz-tap relative -mx-1 flex items-center gap-1.5 rounded-[0.5rem] px-1 py-0.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2"
      >
        {direction === 'back' ? (
          <Arrow className="size-3 shrink-0" strokeWidth={1.75} />
        ) : null}
        <span className="uppercase tracking-[0.14em]">{t('label')}</span>
        <span aria-hidden="true">·</span>
        <span className="underline underline-offset-4">{t(action)}</span>
        {direction === 'forward' ? (
          <Arrow className="size-3 shrink-0" strokeWidth={1.75} />
        ) : null}
      </button>
    </div>
  );
}
