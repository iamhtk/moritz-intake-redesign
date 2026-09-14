import { toast } from 'sonner';

/**
 * "Done · Undo", the house pattern for anything that removes something.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY UNDO RATHER THAN "ARE YOU SURE?".
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This app had 109 toasts and one confirmation dialog, which means almost
 * every destructive action was a single click with a green message after it.
 * The obvious correction — put a dialog in front of each one — is the wrong
 * one, and it is worth writing down why.
 *
 * A confirmation dialog taxes the ninety-nine people who meant it in order to
 * catch the one who did not, and because it always appears it stops being
 * read: after the fourth "Are you sure?" the answer is a reflex, so the
 * dialog costs a click and catches nobody. Undo charges nothing to the
 * person who meant it and gives the person who did not a real way back.
 *
 * Keep a dialog only where undo is genuinely impossible — something sent to a
 * third party, something irreversibly destroyed. Everywhere else this is the
 * pattern.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE CONTRACT.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `undo` has to actually restore the thing, which means the caller must
 * capture whatever it needs *before* the change — the removed row, its index
 * — and put it back. A handler that re-fetches and hopes is not an undo.
 *
 * The window is ten seconds rather than sonner's default four. Four is right
 * for an acknowledgement you can ignore; it is not long enough to notice a
 * mistake, read a sentence and act on it, and a miss here is the exact case
 * this exists for.
 */
export function toastUndo(
  message: string,
  undo: () => void,
  options?: { description?: string; label?: string },
) {
  return toast.success(message, {
    duration: 10_000,
    ...(options?.description ? { description: options.description } : {}),
    action: {
      label: options?.label ?? 'Undo',
      onClick: undo,
    },
  });
}
