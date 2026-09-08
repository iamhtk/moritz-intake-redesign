'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cn } from '@repo/ui/lib/utils';

interface AnimatedPlaceholderProps {
  /** Lines to cycle through. */
  examples: string[];
  /** How long each line stays before the next fades in (ms). */
  intervalMs?: number;
  className?: string;
}

// How far each line travels vertically as it swipes in / out.
const SWIPE = 16;

/**
 * A faux textarea placeholder that cycles through example lines. Each line
 * swipes upward and out as the next slides up into place from below.
 * Rendered as a pointer-transparent, aria-hidden overlay on top of an empty
 * field so it reads like a live placeholder. Padding/typography here must match
 * the foundation Textarea so the text lands exactly where the user's input will.
 */
export function AnimatedPlaceholder({
  examples,
  intervalMs = 4000,
  className,
}: AnimatedPlaceholderProps) {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (examples.length <= 1) return;
    const id = setInterval(
      () => setIndex((current) => (current + 1) % examples.length),
      intervalMs,
    );
    return () => clearInterval(id);
  }, [examples.length, intervalMs]);

  const offset = reduceMotion ? 0 : SWIPE;

  return (
    <div
      aria-hidden
      className={cn(
        'text-field-placeholder pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: offset }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -offset }}
          transition={
            reduceMotion
              ? { duration: 0.3, ease: 'easeInOut' }
              : { type: 'spring', stiffness: 280, damping: 30, mass: 0.8 }
          }
          className="absolute inset-0 px-3.5 py-2.5 text-base/6 will-change-[opacity,transform] sm:px-3 sm:py-1.5 sm:text-sm/6"
        >
          {examples[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
