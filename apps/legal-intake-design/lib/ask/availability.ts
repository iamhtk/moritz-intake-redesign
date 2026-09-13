/**
 * Who Ask Nora is for. One list, and right now it has one entry.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ASK IS A CLIENT SURFACE. THE OTHER THREE ROLES ARE OFF, NOT GONE.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The feature was ported from the Moritz admin app, where it read "the firm's
 * data" and every role was a real audience. Here the product is the client's,
 * and a panel that answers a lawyer about their assigned matters and an admin
 * about which lawyers are carrying the most work is three-quarters somebody
 * else's tool. So it is offered to clients only.
 *
 * **Nothing was deleted to achieve that**, and that is the point of putting the
 * decision in a list rather than in a `git rm`. `buildAskScope` still holds the
 * lawyer, admin and assistant projections; `buildInternalContext` still
 * serialises claimable work, quote rounds, the directory and the audit log;
 * `ASK_SYSTEM_PROMPT` and the internal chips are still here; and all of it is
 * still covered by `projection.test.ts`, `scope.test.ts` and
 * `suggestions.test.ts`. Turning a role back on is adding it to `ASK_ROLES`.
 * The tests are what make that a one-line change rather than an archaeology
 * project, so they are deliberately *not* skipped while the roles are off.
 *
 * Three surfaces read this, and they have to agree:
 *
 * 1. `TopNav` — whether the ⌘J trigger exists. The chord is bound inside the
 *    trigger, so an unmounted trigger is also an unbound shortcut, which is
 *    what stops ⌘J opening a panel that is not there.
 * 2. `DashboardOverlays` — whether the panel mounts, and therefore whether the
 *    command palette is handed an `onAskNora`. The palette derives its *Ask
 *    Nora* row from that handle being present, so gating the panel gates the
 *    row too and there is no offered-and-inert third case to get wrong.
 * 3. `POST /api/ask` — the one that actually matters. The two above are the UI
 *    declining to offer the feature; this is the server declining to serve it,
 *    read from the same cookie that decides the scope. A gate that lives only
 *    in the components is a gate a `curl` walks through.
 */

import type { Role } from '@/lib/types';

/**
 * The roles Ask answers for.
 *
 * Typed as `readonly Role[]` rather than a narrowed tuple on purpose: the
 * predicate below takes any `Role`, and callers pass the role they happen to
 * have rather than proving it is in the list first.
 */
export const ASK_ROLES: readonly Role[] = ['NON_LEGAL'];

/** Whether Ask is offered to, and answered for, this role. */
export function isAskAvailableFor(role: Role): boolean {
  return ASK_ROLES.includes(role);
}
