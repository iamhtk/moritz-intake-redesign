'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { AcceptedFile } from '@/lib/intake/accepted-files';
import {
  forgetAllDocuments,
  loadDocuments,
  saveDocuments,
} from '@/lib/intake/document-store';
import {
  BRIEF_STORAGE_KEY,
  DOCUMENT_PANEL_STORAGE_KEY,
  MESSAGES_STORAGE_KEY,
  readStoredJson,
  writeStoredJson,
} from '@/lib/intake/session-storage';

import {
  isFileDocument,
  type DocumentReveal,
  type FileDocument,
  type IntakeDocument,
  type ReaderDocument,
} from './types';

/**
 * How the document surface is showing itself.
 *
 * `docked` is the third column beside the conversation and the brief;
 * `maximised` is the same panel promoted to a centred overlay, the way the
 * command palette arrives. One state rather than two booleans because the two
 * are exclusive and a panel that was somehow both was the first bug.
 */
export type DocumentPanelMode = 'closed' | 'docked' | 'maximised';

/**
 * A stable id for a file, without a counter.
 *
 * Name and size, because that is what "the same file" means to a client who
 * re-drops the contract they already dropped — and because a random id would
 * make `addFiles` non-idempotent, which matters: it is called from inside a
 * `setStagedFiles` updater, and React runs those twice in development.
 */
function documentId(file: File): string {
  return `doc_${file.size}_${file.name.replace(/[^\w.-]+/g, '_')}`;
}

/**
 * How the panel was arranged when the client last looked at it.
 *
 * Ids rather than documents, because the documents themselves are in IndexedDB
 * and this is the cheap half — and `open` rather than a mode, because a reload
 * restores the sidebar and never the full-screen overlay. Coming back to a
 * panel covering the conversation would be the page deciding what the client
 * came back for; coming back to the column they left open is just the page
 * where they left it. A narrow window promotes it to the overlay by itself
 * (see `canDock` in `intake-v2.tsx`), which is the one case it belongs in.
 */
type StoredArrangement = {
  tabIds: readonly string[];
  activeId: string | null;
  open: boolean;
};

function parseArrangement(value: unknown): StoredArrangement | null {
  if (typeof value !== 'object' || value === null) return null;
  const one = value as Partial<StoredArrangement>;
  if (!Array.isArray(one.tabIds)) return null;
  return {
    tabIds: one.tabIds.filter((id): id is string => typeof id === 'string'),
    activeId: typeof one.activeId === 'string' ? one.activeId : null,
    open: one.open === true,
  };
}

/**
 * Whether there is an intake here to restore documents *into*.
 *
 * The bytes outlive the tab and the session keys do not outlive a clear, so
 * this is what keeps the two honest. A sent case and a deleted draft both wipe
 * the brief and the transcript (`clearIntakeSession`), so a saved document with
 * no session behind it is an orphan — and restoring it would put a stranger's
 * contract on the handle of a brand new case. A reload on the opening screen,
 * before a word has been typed, reads the same way and gets the same answer:
 * the staged dock does not survive a reload either, so a library that did would
 * be offering a document this case is never going to send.
 */
function hasSessionToRestore(): boolean {
  return (
    readStoredJson<unknown>(BRIEF_STORAGE_KEY) !== null ||
    readStoredJson<unknown>(MESSAGES_STORAGE_KEY) !== null
  );
}

export type DocumentWorkspace = {
  documents: readonly IntakeDocument[];
  /** Open tabs, in the order they were opened. */
  tabs: readonly IntakeDocument[];
  active: IntakeDocument | null;
  mode: DocumentPanelMode;
  /** Adds to the library without opening anything. Idempotent. */
  addFiles: (accepted: readonly AcceptedFile[]) => void;
  /**
   * Opens something the app wrote — today, the confirmation email.
   *
   * One call rather than an add and an open, because unlike a file there is no
   * moment where it exists but has not been asked for: it is built by the
   * control that opens it. Idempotent by id, so clicking "read it" twice
   * returns to the tab instead of stacking a second copy of the same receipt.
   */
  openReader: (document: Omit<ReaderDocument, 'kind' | 'addedAt'>) => void;
  /** Opens the panel on a document, by id. */
  open: (
    documentId: string,
    reveal?: Omit<DocumentReveal, 'documentId'>,
  ) => void;
  /**
   * Opens the panel on a document named by something other than the browser —
   * a brief field's `sourceNote`, which carries the file name the extractor was
   * given. Returns false when no such document is in the library, which used to
   * be the reloaded-session case and is now the genuinely-not-here case: the
   * library is restored on mount. The call site still has an answer for it.
   */
  openByName: (
    name: string,
    reveal?: Omit<DocumentReveal, 'documentId'>,
  ) => boolean;
  select: (documentId: string) => void;
  closeTab: (documentId: string) => void;
  close: () => void;
  /**
   * Throws the library away, in memory and on disk.
   *
   * Called by a restart, which is the one action that means "this is not my
   * case any more". Without it the second case opened in the same tab would
   * inherit the first one's contracts.
   */
  reset: () => void;
  maximise: () => void;
  minimise: () => void;
  /**
   * The width the client dragged the docked panel to, in pixels.
   *
   * `null` means they have not, and the grid's own responsive track decides —
   * which is the better answer at every size until somebody disagrees with it.
   * Kept for the session rather than saved: a width is a response to what is
   * on screen right now, not a setting.
   */
  width: number | null;
  setWidth: (width: number) => void;
  resetWidth: () => void;
  /** True only while a drag is in flight, so the grid can stop animating. */
  resizing: boolean;
  setResizing: (resizing: boolean) => void;
  /**
   * Whether the saved library has been read back yet.
   *
   * Exposed because a lookup by name that runs before this is true is looking
   * in an empty library and would wrongly report the document missing. Nothing
   * the client can reach fires that early — the first click is many frames
   * after the read — but a caller that wants to wait now can.
   */
  hydrated: boolean;
  /** The pending "open it at this passage" request, if any. */
  reveal: DocumentReveal | null;
  /** Called by the viewer once it has acted on `reveal`. */
  clearReveal: () => void;
};

/**
 * The library of documents handed over in this intake, and the panel showing
 * them.
 *
 * Library and panel live in one hook because every real action touches both:
 * opening a tab needs the document, closing the last tab has to close the
 * panel, and a document removed from the library cannot stay open. Splitting
 * them meant an effect in the middle syncing two sources of truth.
 */
export function useDocumentWorkspace(): DocumentWorkspace {
  const [documents, setDocuments] = useState<readonly IntakeDocument[]>([]);
  const [tabIds, setTabIds] = useState<readonly string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<DocumentPanelMode>('closed');
  const [reveal, setReveal] = useState<DocumentReveal | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [resizing, setResizing] = useState(false);

  /*
   * The library, readable during an event without waiting a render.
   *
   * `openByName` is called from a click handler that has just added files in
   * the same tick (drop, then "view source" on the row it filled). Reading
   * state there would read the previous render's library and find nothing.
   */
  const libraryRef = useRef<readonly IntakeDocument[]>([]);
  libraryRef.current = documents;

  /* Same reason: `addFiles` has to know whether the panel is open right now. */
  const modeRef = useRef<DocumentPanelMode>('closed');
  modeRef.current = mode;

  const [hydrated, setHydrated] = useState(false);

  /*
   * Which documents are already on disk, so a re-render does not rewrite them.
   *
   * A set of ids rather than a comparison against the store, because the thing
   * being avoided is re-writing several megabytes of blob every time a tab
   * changes. Restored documents go in here on arrival: they came *from* the
   * store, so writing them back would be the same waste with an extra step.
   */
  const savedRef = useRef<Set<string>>(new Set());

  /*
   * Reading the saved library back, once, on arrival.
   *
   * This is what makes a reload mid-intake a reload. Before it, the library was
   * session state and nothing else, so a refresh took the panel, every "show
   * this in the document" link on the brief, and every chip in the transcript
   * with it — the client was told their work was saved and then watched their
   * contract stop existing.
   */
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!hasSessionToRestore()) {
        /*
         * Nothing to restore into, so the bytes are not ours to keep. Clearing
         * here rather than only in `clearIntakeSession` covers the case that
         * call cannot: a tab closed between a document arriving and the case
         * being sent or deleted.
         */
        await forgetAllDocuments();
        if (!cancelled) setHydrated(true);
        return;
      }

      const saved = await loadDocuments();
      if (cancelled) return;

      const restored = saved.map(
        (one): FileDocument => ({
          id: one.id,
          name: one.name,
          size: one.size,
          kind: one.kind,
          mediaType: one.mediaType,
          addedAt: one.addedAt,
          /*
           * Rebuilt rather than stored as a `File`, so the name and the type
           * come from the row beside the bytes and not from whatever the
           * browser chose to keep. Everything downstream — the extractor, the
           * PDF viewer, the image view — takes a `File` and cannot tell.
           */
          file: new File([one.bytes], one.name, { type: one.mediaType }),
        }),
      );

      for (const one of restored) savedRef.current.add(one.id);

      if (restored.length > 0) {
        setDocuments((current) => {
          /*
           * Merged rather than assigned. A document can already be here: the
           * demo seed fetches its fixture on mount, and a client can drop a
           * file before this read comes back. Both are keyed by name and size,
           * so the same document from either door is one entry.
           */
          const known = new Set(current.map((one) => one.id));
          const next = [
            ...restored.filter((one) => !known.has(one.id)),
            ...current,
          ].sort((a, b) => a.addedAt - b.addedAt);
          libraryRef.current = next;
          return next;
        });
      }

      const available = new Set(restored.map((one) => one.id));
      const arrangement = parseArrangement(
        readStoredJson<unknown>(DOCUMENT_PANEL_STORAGE_KEY),
      );
      const openTabs =
        arrangement?.tabIds.filter((id) => available.has(id)) ?? [];

      if (openTabs.length > 0) {
        setTabIds((current) => [
          ...openTabs,
          ...current.filter((id) => !openTabs.includes(id)),
        ]);
        setActiveId(
          (current) =>
            current ??
            (arrangement !== null &&
            arrangement.activeId !== null &&
            openTabs.includes(arrangement.activeId)
              ? arrangement.activeId
              : (openTabs.at(-1) ?? null)),
        );
        /*
         * Restored as the column, never as the overlay, and never opened when
         * it was closed. The client's last act on this panel is the one being
         * honoured — including "put it away".
         */
        if (arrangement?.open === true) {
          setMode((current) => (current === 'closed' ? 'docked' : current));
        }
      }

      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Writing the bytes down, as documents arrive.
   *
   * Keyed on the library rather than called from `addFiles`, because there are
   * two doors into it (a drop and the demo seed) and one of them runs inside a
   * `setStagedFiles` updater, which React calls twice in development. An
   * effect that diffs against what is already saved is the version that cannot
   * write the same contract twice.
   *
   * Reader documents are skipped: the confirmation email's body is a rendered
   * node, not bytes, and it is rebuilt from the brief on the screen that owns
   * it. Nothing is lost — a receipt for a case that has been sent is reachable
   * from the case.
   */
  useEffect(() => {
    if (!hydrated) return;
    const fresh = documents
      .filter(isFileDocument)
      .filter((one) => !savedRef.current.has(one.id));
    if (fresh.length === 0) return;

    for (const one of fresh) savedRef.current.add(one.id);
    void saveDocuments(
      fresh.map((one) => ({
        id: one.id,
        name: one.name,
        size: one.size,
        kind: one.kind,
        mediaType: one.mediaType,
        addedAt: one.addedAt,
        bytes: one.file,
      })),
    );
  }, [documents, hydrated]);

  /*
   * And the arrangement, which is the cheap half and changes far more often.
   *
   * Only ids that have bytes behind them, so a restored session cannot come
   * back with a tab for the confirmation email it can no longer render.
   */
  useEffect(() => {
    if (!hydrated) return;
    const withBytes = new Set(
      documents.filter(isFileDocument).map((one) => one.id),
    );
    const openTabs = tabIds.filter((id) => withBytes.has(id));
    writeStoredJson(DOCUMENT_PANEL_STORAGE_KEY, {
      tabIds: openTabs,
      activeId:
        activeId !== null && withBytes.has(activeId)
          ? activeId
          : (openTabs.at(-1) ?? null),
      open: openTabs.length > 0 && mode !== 'closed',
    } satisfies StoredArrangement);
  }, [activeId, documents, hydrated, mode, tabIds]);

  const addFiles = useCallback((accepted: readonly AcceptedFile[]) => {
    if (accepted.length === 0) return;
    setDocuments((current) => {
      const known = new Set(current.map((one) => one.id));
      const added = accepted
        .map(
          (one): IntakeDocument => ({
            id: documentId(one.file),
            name: one.file.name,
            size: one.file.size,
            kind: one.kind,
            mediaType: one.mediaType,
            file: one.file,
            addedAt: Date.now(),
          }),
        )
        .filter((one) => {
          if (known.has(one.id)) return false;
          known.add(one.id);
          return true;
        });
      if (added.length === 0) return current;
      const next = [...current, ...added];
      libraryRef.current = next;

      /*
       * A document attached while the panel is open opens in it.
       *
       * The client is looking at documents and has just handed over another
       * one; making them then find the handle and pick it out of a list is
       * asking them to do the filing twice. Attached while the panel is shut,
       * nothing opens — the count on the handle goes up and that is all, which
       * is the difference between answering an intention and interrupting one.
       */
      if (modeRef.current !== 'closed') {
        const last = added[added.length - 1];
        setTabIds((tabs) => [
          ...tabs,
          ...added.filter((one) => !tabs.includes(one.id)).map((one) => one.id),
        ]);
        if (last) setActiveId(last.id);
      }

      return next;
    });
  }, []);

  const openReader = useCallback(
    (document: Omit<ReaderDocument, 'kind' | 'addedAt'>) => {
      const entry: ReaderDocument = {
        ...document,
        kind: 'reader',
        addedAt: Date.now(),
      };

      setDocuments((current) => {
        const next = current.some((one) => one.id === entry.id)
          ? current
          : [...current, entry];
        libraryRef.current = next;
        return next;
      });

      setTabIds((current) =>
        current.includes(entry.id) ? current : [...current, entry.id],
      );
      setActiveId(entry.id);
      setMode((current) => (current === 'maximised' ? current : 'docked'));
      setReveal(null);
    },
    [],
  );

  const open = useCallback(
    (id: string, at?: Omit<DocumentReveal, 'documentId'>) => {
      if (!libraryRef.current.some((one) => one.id === id)) return;
      setTabIds((current) =>
        current.includes(id) ? current : [...current, id],
      );
      setActiveId(id);
      // A maximised panel stays maximised: opening a second document from the
      // overlay should not throw the reader back into a 30rem column.
      setMode((current) => (current === 'maximised' ? current : 'docked'));
      setReveal(at ? { documentId: id, ...at } : null);
    },
    [],
  );

  const openByName = useCallback(
    (name: string, at?: Omit<DocumentReveal, 'documentId'>) => {
      /*
       * `sourceNote` is a sentence, not a file name: "Notice period clause,
       * page 3 of MSA.pdf". So the library is searched for a name the note
       * contains rather than one it equals, longest name first — otherwise
       * "MSA.pdf" would match a note that names "MSA.pdf" only as part of
       * "MSA.pdf-amendment.pdf".
       */
      const match = [...libraryRef.current]
        .sort((a, b) => b.name.length - a.name.length)
        .find(
          (one) =>
            name === one.name ||
            name.toLowerCase().includes(one.name.toLowerCase()),
        );
      if (!match) return false;
      open(match.id, at);
      return true;
    },
    [open],
  );

  const closeTab = useCallback((id: string) => {
    setTabIds((current) => {
      const next = current.filter((one) => one !== id);
      setActiveId((active) => {
        if (active !== id) return active;
        if (next.length === 0) return null;
        /*
         * Closing the active tab lands on its neighbour rather than on the
         * first tab: the client closed the thing they were looking at, and the
         * one beside it is the likeliest next read.
         */
        const wasAt = current.indexOf(id);
        return next[Math.min(wasAt, next.length - 1)] ?? null;
      });
      if (next.length === 0) setMode('closed');
      return next;
    });
  }, []);

  const close = useCallback(() => {
    setMode('closed');
    setReveal(null);
    /*
     * Tabs survive the panel closing. Reopening is then a return to the set
     * the client had built rather than a fresh start — the same reason a
     * browser keeps its tabs when the window loses focus. `close` is "put this
     * away", not "throw it out"; throwing a single document out is the tab's
     * own ×.
     */
  }, []);

  /**
   * A second case in the same tab starts with an empty library.
   *
   * Paired with `clearIntakeSession`, which takes the brief and the transcript.
   * That call also clears the store, so the `forgetAllDocuments` here is the
   * one that matters when a caller resets the workspace without ending the
   * session — and it is cheap enough to be unconditional rather than something
   * the caller has to remember.
   */
  const reset = useCallback(() => {
    setDocuments([]);
    libraryRef.current = [];
    savedRef.current = new Set();
    setTabIds([]);
    setActiveId(null);
    setMode('closed');
    setReveal(null);
    setWidth(null);
    void forgetAllDocuments();
  }, []);

  const panelActions = useMemo(
    () => ({
      select: (id: string) => setActiveId(id),
      setWidth: (next: number) => setWidth(next),
      resetWidth: () => setWidth(null),
      setResizing: (next: boolean) => setResizing(next),
      maximise: () => setMode('maximised'),
      minimise: () => setMode('docked'),
      clearReveal: () => setReveal(null),
    }),
    [],
  );

  const tabs = useMemo(
    () =>
      tabIds
        .map((id) => documents.find((one) => one.id === id))
        .filter((one): one is IntakeDocument => one !== undefined),
    [documents, tabIds],
  );

  const active = useMemo(
    () => tabs.find((one) => one.id === activeId) ?? null,
    [activeId, tabs],
  );

  return {
    documents,
    tabs,
    active,
    // A panel with nothing in it is closed, whatever the mode says. Cheaper
    // than keeping the two in step in every action that can empty the tabs.
    mode: tabs.length === 0 ? 'closed' : mode,
    addFiles,
    openReader,
    open,
    openByName,
    closeTab,
    close,
    reset,
    hydrated,
    reveal,
    width,
    resizing,
    ...panelActions,
  };
}
