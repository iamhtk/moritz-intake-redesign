/**
 * Drag and drop over the whole window, as a state machine rather than an effect
 * (Decisions 9 and 20).
 *
 * Two behaviours, and only one of them is a feature.
 *
 * **The guard.** A browser's default action for a dropped file is to navigate to
 * it. The old flow had a single card that handled drops, so a file that missed
 * it replaced the page with a PDF viewer and took the entire conversation with
 * it. Nothing about that is recoverable and all of it is the default's fault, so
 * `dragover` and `drop` are cancelled for the lifetime of the intake whether or
 * not anything is going to be read. The guard runs even when dropping is
 * disabled, which is the case the tests care most about: a state that accepts no
 * files is still a state with a session worth protecting.
 *
 * **Drop anywhere.** Once the default is dead, the viewport can be the target,
 * which is what someone dragging a contract out of another window expects.
 *
 * It lives here, outside the hook, for the reason Wave 4 put the phase rules in
 * a module: the awkward parts of this are all decisions (does a text drag count,
 * when has the cursor really left, which list of files is authoritative) and
 * every one of them is a browser event away from being untestable. The hook in
 * `use-window-drop.ts` does nothing but install these on `window`.
 */

/** The parts of a `DragEvent` this needs, so a test does not need a browser. */
export type DragLike = {
  preventDefault: () => void;
  /**
   * True where something nearer the file has already handled this.
   *
   * The page has real drop zones on it (the composer's panel, the one on the
   * confirmation) and they cancel the event themselves. A drop on one of those
   * still bubbles up to the window, so without this the file is taken twice:
   * two extraction calls for one document, or one document listed twice on the
   * confirmation with Moritz saying so twice.
   */
  defaultPrevented?: boolean;
  /** `null` when the cursor has left the window rather than crossed a child. */
  relatedTarget?: unknown;
  /**
   * Array-*like*, not arrays, and that distinction cost a working feature.
   *
   * `DataTransferItemList` and `FileList` are indexed collections with a
   * `length` and nothing else: no `some`, no `filter`, no `map`. Typing them as
   * `ReadonlyArray` compiled, passed a test suite built entirely out of real
   * arrays, and threw `transfer.items.some is not a function` on the first
   * `dragenter` in a real browser — which took out the guard, so a missed drop
   * navigated away from the intake exactly as it had before Decision 20.
   *
   * `types` is a real array per the spec, but it is declared the same way and
   * read the same way; a second rule for the one member that happens to be
   * safe today is a rule nobody will remember.
   */
  dataTransfer: {
    items?: ArrayLike<{ kind: string; getAsFile?: () => File | null }>;
    files?: ArrayLike<File>;
    types?: ArrayLike<string>;
    dropEffect?: string;
  } | null;
};

export type DropGuard = {
  dragenter: (event: DragLike) => void;
  dragover: (event: DragLike) => void;
  dragleave: (event: DragLike) => void;
  drop: (event: DragLike) => void;
  dragend: () => void;
};

/**
 * True only for a drag carrying files.
 *
 * Dragging a selected sentence out of the transcript is a text drag, and
 * lighting up a full-page "drop your document here" target for it would be
 * nonsense. Mid-drag the items are listed but not readable, so `kind` is all
 * there is to go on, which is exactly what it is for; `types` is the fallback
 * for browsers that leave `items` empty until the drop.
 */
export function carriesFiles(event: DragLike): boolean {
  const transfer = event.dataTransfer;
  if (!transfer) return false;
  const items = Array.from(transfer.items ?? []);
  if (items.length > 0) {
    return items.some((item) => item.kind === 'file');
  }
  return Array.from(transfer.types ?? []).includes('Files');
}

/** The files a drop actually carried, preferring the item list. */
export function filesFrom(event: DragLike): File[] {
  const transfer = event.dataTransfer;
  if (!transfer) return [];

  const fromItems = Array.from(transfer.items ?? [])
    .filter((item) => item.kind === 'file')
    .map((item) => item.getAsFile?.() ?? null)
    .filter((file): file is File => file !== null);

  if (fromItems.length > 0) return fromItems;
  return Array.from(transfer.files ?? []);
}

export function createDropGuard({
  onFiles,
  isEnabled,
  setDragging,
}: {
  onFiles: (files: File[]) => void;
  /** Read at event time, so a phase change mid-drag is respected. */
  isEnabled: () => boolean;
  setDragging: (dragging: boolean) => void;
}): DropGuard {
  /**
   * `dragenter` and `dragleave` fire as a pair for every element crossed, not
   * once for the window, so this has to count depth rather than hold a boolean.
   * Without it the overlay flickers off every time the cursor passes over a
   * child, and a target that flickers under a held file reads as a page
   * refusing the drop.
   */
  let depth = 0;

  const stop = () => {
    depth = 0;
    setDragging(false);
  };

  return {
    dragenter(event) {
      if (!carriesFiles(event)) return;
      depth += 1;
      if (isEnabled()) setDragging(true);
    },

    dragover(event) {
      // The guard. Skipping this is the whole bug.
      event.preventDefault();
      if (!isEnabled() || !event.dataTransfer) return;
      // Without an explicit copy the cursor shows a "no entry" badge over most
      // of the page, which tells the client the opposite of the truth.
      event.dataTransfer.dropEffect = 'copy';
    },

    dragleave(event) {
      if (!carriesFiles(event)) return;
      depth -= 1;
      // No related target means the cursor is properly gone, rather than moving
      // between two children. It is the only reliable signal for that.
      if (depth <= 0 || event.relatedTarget === null) stop();
    },

    drop(event) {
      // Read before cancelling, because cancelling is about to set it.
      const handledNearer = event.defaultPrevented === true;

      // The guard, unconditionally: a drop nothing claims must not navigate.
      event.preventDefault();
      stop();

      // A zone closer to the file has already taken it. The guard still had to
      // run, but taking it again would double the work it caused.
      if (handledNearer || !isEnabled()) return;

      const files = filesFrom(event);
      if (files.length > 0) onFiles(files);
    },

    /*
     * A drag cancelled with Escape, or one that ends off-window, fires neither
     * a `drop` nor a final `dragleave` in every browser. Without this the
     * overlay can be left covering a page with nothing holding it up.
     */
    dragend: stop,
  };
}
