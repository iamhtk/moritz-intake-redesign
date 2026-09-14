/**
 * One answer to "is this a phone", for the JavaScript that has to ask.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS FILE EXISTS.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The app used to hold three different numbers for the same question: the
 * settings modal switched to a drawer at 640, `useIsMobile` (the overlays, the
 * account sheet, the command palette) at 768, and the case shells at 767. So
 * an iPad at 700px got a bottom-sheet account menu, a centred settings dialog
 * and a phone-shaped case page — three components disagreeing about what
 * device they were on, in one viewport.
 *
 * 768 is the number, because it is Tailwind's `md` and the CSS in this app is
 * already written against that scale. A JS check that answers differently
 * from the `md:` class beside it is the worst version of this bug, since the
 * two are usually describing one layout.
 *
 * ── WHAT THIS IS NOT ──
 *
 * This is not a general "use 768 for everything" rule. The intake's two-pane
 * split lives at `lg` (1024) and stays there, because it is answering a
 * different question: *do two document-width columns fit side by side*, which
 * is about content, not about the device. Squeezing a brief and a transcript
 * into 768px would make both unreadable to satisfy a constant.
 *
 * The test is whether the question is "how big is the screen" (this file) or
 * "does this composition fit" (a Tailwind breakpoint chosen by measuring).
 */

/** Below this width the product is a phone. Tailwind's `md`. */
export const MOBILE_BREAKPOINT = 768;

/** `true` while the viewport is a phone. */
export const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

/** `true` from a tablet up. The inverse of {@link MOBILE_QUERY}. */
export const DESKTOP_QUERY = `(min-width: ${MOBILE_BREAKPOINT}px)`;
