/**
 * Does this path belong to the intake flow?
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE MATCHER, BECAUSE THE SURFACES THAT READ IT HAVE TO AGREE.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The rule is a single rule — *the intake owns its screen* — and it is read
 * from four places: the shell's two layout branches, the support launcher, the
 * Ask panel in `DashboardOverlays`, and the ⌘J trigger in `TopNav`.
 *
 * It used to live as a module-local regex in `dashboard-shell.tsx`, whose own
 * comment warned that "a literal in each place is how one of them ends up
 * matching `/client/new` but not `/client/new/review`". The drift that actually
 * happened was worse than a near-miss on a sub-path: `TopNav` had no copy of
 * the literal at all, so on `/client/new` it went on rendering `AskTrigger` —
 * and binding ⌘J — while `DashboardOverlays` declined to mount `AskPanel`.
 * Both entry points flipped a context boolean that nothing was listening to, so
 * Ask Nora was visible, focusable, keyboard-bound and completely inert on the
 * one route the client spends the most time on.
 *
 * Exported as a function rather than the regex, so no caller has to remember
 * that `usePathname()` can be `null`, and so a future third form of the path is
 * one edit here instead of a grep.
 */

/**
 * Matches the intake flow and everything under it.
 *
 * The trailing `(\/|$)` is what keeps `/client/new/review` in and a future
 * `/client/newsletter` out. Locale prefixes are not a concern: `usePathname()`
 * from `@/i18n/navigation` returns the path with the locale already stripped,
 * and the leading `\/` is unanchored so a raw `/en/client/new` still matches.
 */
export const INTAKE_ROUTE = /\/client\/new(\/|$)/;

/** Whether `pathname` is the intake flow. A missing path is not. */
export function isIntakeRoute(pathname: string | null | undefined): boolean {
  return INTAKE_ROUTE.test(pathname ?? '');
}
