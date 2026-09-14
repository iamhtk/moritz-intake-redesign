import type { CSSProperties } from 'react';

/**
 * How a screen arrives, defined once so every screen arrives the same way.
 *
 * This exists because they did not. The intake's opening screen ran three
 * different entrances on one page load: everything above the "not sure where to
 * begin" chips simply appeared, the chips and the how-it-works rows lifted 8px,
 * and the lawyer note faded and scaled. Three behaviours in one scroll reads as
 * a rendering fault rather than as a design, and the reason it happened is that
 * each component had brought its own animation along.
 *
 * So the entrance is a property of the page, not of the components on it. Each
 * screen applies `ENTRANCE_CLASS` to its top-level blocks and `entrance(n)` to
 * place each one in the cascade; nothing inside those blocks animates on load,
 * because two transforms inside one another compound and the inner element
 * arrives from somewhere its parent has already moved.
 *
 * `mz-animate-step` is the keyframe to standardise on: `globals.css` already
 * describes it as the flow's entrance, and it is disabled under
 * `prefers-reduced-motion` there along with every other animation in the app,
 * so honouring that setting comes for free.
 */
export const ENTRANCE_CLASS = 'mz-animate-step';

/**
 * The gap between one block landing and the next.
 *
 * Short enough that the page reads as one movement, long enough for that
 * movement to have a direction. At five blocks the whole screen settles inside
 * 800ms including the half-second keyframe, which is under the threshold where
 * a staggered load starts to feel like waiting.
 */
export const ENTRANCE_STAGGER_MS = 70;

/**
 * `style` for the nth top-level block down a screen.
 *
 * Indexed by position in the markup rather than by how many blocks are
 * actually visible, which is deliberate: a screen with a conditional section in
 * the middle would otherwise renumber everything below it depending on state,
 * and a cascade whose timing changes with content is worse than one with an
 * occasional extra beat in it.
 */
export function entrance(index: number): CSSProperties {
  return { animationDelay: `${index * ENTRANCE_STAGGER_MS}ms` };
}
