/**
 * DOM predicates for global keyboard shortcuts (task S2).
 *
 * Ported from the Moritz-admin source, whose three predicates are the right
 * shape and are nearly all reusable. What is *not* reusable is its selector
 * list: that project is shadcn-on-Radix only, so it had never seen `vaul`,
 * `@base-ui/react` or this app's foundation components, and every one of those
 * marks an open overlay differently.
 *
 * The three idioms in this app, each verified against the library rather than
 * assumed:
 *
 * | Library | How an open overlay is marked |
 * |---|---|
 * | `radix-ui` (dialog, sheet, drawer, dropdown, select, tooltip) | `data-state="open"` |
 * | `@base-ui/react` (combobox, popover, select, menu) | `data-open` on the popup, `data-popup-open` on its trigger |
 * | `vaul` (mobile drawer) | `data-vaul-drawer`, plus `data-vaul-overlay` on the scrim |
 * | `cmdk` (the command palette itself) | `[cmdk-dialog]` on the shell, `[cmdk-root]` on the list |
 *
 * Base UI is the one that would have been missed by a literal port: it uses the
 * bare `data-open` attribute rather than Radix's `data-state` enum, so every
 * Radix-shaped selector misses it silently. A missed overlay is not a visible
 * bug — it is a shortcut that fires *through* an open modal, which is only ever
 * noticed as "the palette opened behind the dialog".
 */

/**
 * True when the event target is (or is inside) a typing surface.
 *
 * `isContentEditable` is checked *and* the attribute is read, rather than
 * trusting the property alone as the source does. Two reasons, and the second
 * is why this differs from the port: the property is computed and inherited,
 * which the attribute is not, so the property is the better answer where it
 * exists — but jsdom does not implement it at all and returns `undefined`, so a
 * property-only predicate is one that cannot be tested. Reading both makes it
 * correct in a browser and verifiable here.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const el =
    target.closest(
      "input, textarea, select, [contenteditable=''], [contenteditable=true]",
    ) ?? target;
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (el.isContentEditable) return true;
  const attribute = el.getAttribute('contenteditable');
  return attribute !== null && attribute !== 'false';
}

/**
 * Selectors that match an overlay which is *currently open*.
 *
 * Every entry is anchored on an open-state attribute rather than on the part
 * name alone, because Radix keeps a closed dialog's content in the tree with
 * `data-state="closed"` while it animates out. Matching the part name would
 * report an overlay for the ~100ms after it was dismissed.
 */
const OPEN_OVERLAY_SELECTORS = [
  // Radix, by role.
  '[role="dialog"][data-state="open"]',
  '[role="alertdialog"][data-state="open"]',
  '[role="menu"][data-state="open"]',
  '[role="listbox"][data-state="open"]',
  // Radix, by the shadcn part names this app's `components/ui` keeps.
  '[data-slot="sheet-content"][data-state="open"]',
  '[data-slot="dialog-content"][data-state="open"]',
  '[data-slot="dropdown-menu-content"][data-state="open"]',
  '[data-slot="select-content"][data-state="open"]',
  // Base UI. `data-open` is a bare attribute, not a `data-state` value, so
  // none of the selectors above can see one of these.
  '[role="dialog"][data-open]',
  '[role="alertdialog"][data-open]',
  '[role="menu"][data-open]',
  '[role="listbox"][data-open]',
  '[data-slot="combobox-content"][data-open]',
  '[data-slot="popover-content"][data-open]',
  // vaul. Its content is a Radix dialog underneath, but the drawer mark is the
  // reliable one: `vaul` owns the open/closed lifecycle itself.
  '[data-vaul-drawer]',
  '[data-vaul-overlay]',
  // cmdk — the palette in this very feature.
  '[cmdk-dialog]',
].join(', ');

/**
 * Selectors for "focus is inside an overlay", used as the second check.
 *
 * Deliberately *not* anchored on an open state: if focus is inside it, it is
 * open, and an element that has begun animating closed has usually already
 * returned focus to its trigger.
 */
const OVERLAY_CONTAINER_SELECTORS = [
  '[role="dialog"]',
  '[role="alertdialog"]',
  '[role="menu"]',
  '[role="listbox"]',
  '[data-slot="sheet-content"]',
  '[data-slot="dialog-content"]',
  '[data-slot="dropdown-menu-content"]',
  '[data-slot="select-content"]',
  '[data-slot="combobox-content"]',
  '[data-slot="popover-content"]',
  '[data-vaul-drawer]',
  '[cmdk-root]',
].join(', ');

/**
 * True when a sheet, dialog, command palette, menu, drawer or select is open,
 * or when focus is inside one of those overlays.
 */
export function isUiOverlayOpen(): boolean {
  if (typeof document === 'undefined') return false;
  if (document.querySelector(OPEN_OVERLAY_SELECTORS)) return true;

  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return false;
  return Boolean(active.closest(OVERLAY_CONTAINER_SELECTORS));
}

/**
 * Single-letter global shortcuts must not run while typing, with modifiers,
 * or while an overlay owns the UI.
 *
 * Kept because it is the general-purpose guard and the rest of the app may
 * grow a bare-letter shortcut later. Note that it is *not* the guard for ⌘K
 * and ⌘J — see `matchesModShortcut`, which is the one this feature uses.
 */
export function shouldSuppressGlobalLetterShortcut(e: KeyboardEvent): boolean {
  if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return true;
  if (isEditableTarget(e.target)) return true;
  if (isUiOverlayOpen()) return true;
  return false;
}

/**
 * True when a keydown is the ⌘/Ctrl + `key` chord, and the chord should act.
 *
 * A deliberate departure from the source, which returns early when focus is in
 * any ordinary form field. That rule is right for a bare letter and wrong for a
 * chord: ⌘K is the one shortcut a reader is most likely to press *from* a
 * search box, and a palette that refuses to open because the cursor happens to
 * be in a field is the kind of dead control this project spent T34 removing.
 * The modifier is what makes the intent unambiguous, so typing is no longer a
 * reason to suppress.
 *
 * `alt` and `shift` are excluded so ⌥⌘K and ⇧⌘K stay available to the browser
 * and to the OS rather than being swallowed here.
 *
 * @param withinOverlay pass `true` from a surface that is itself an overlay
 *   (the palette) so its own presence does not suppress the chord that closes
 *   it. Everywhere else, leave it unset and an open overlay wins.
 */
export function matchesModShortcut(
  e: KeyboardEvent,
  key: string,
  withinOverlay = false,
): boolean {
  if (!(e.metaKey || e.ctrlKey)) return false;
  if (e.altKey || e.shiftKey) return false;
  if (e.key.toLowerCase() !== key.toLowerCase()) return false;
  if (!withinOverlay && isUiOverlayOpen()) return false;
  return true;
}

/**
 * The modifier a reader will actually see on their own keyboard.
 *
 * Client-only, and must be read in an effect rather than at render: the server
 * has no `navigator`, and guessing "⌘" during SSR then correcting to "Ctrl" on
 * hydration is a mismatch React will warn about and a reader will see flicker.
 */
export function modKeyLabel(): string {
  if (typeof navigator === 'undefined') return 'Ctrl';
  // `userAgentData` where it exists, `platform` as the fallback. Both are
  // checked for "mac" rather than for an exact string, because the values have
  // drifted ("MacIntel", "macOS") and will drift again.
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } })
      .userAgentData?.platform ??
    navigator.platform ??
    '';
  return /mac/i.test(platform) ? '⌘' : 'Ctrl';
}
