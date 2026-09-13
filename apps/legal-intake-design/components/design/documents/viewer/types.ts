/**
 * What a document is to the viewer, and where the model said it read something.
 *
 * Kept apart from `lib/intake/accepted-files` on purpose. That module answers
 * "will the extractor read this file"; this one answers "can the client look at
 * it", and the two have different lifetimes — a file is accepted once and
 * looked at many times, including after the case has been sent.
 */

import type { ReactNode } from 'react';

import type { AcceptedKind } from '@/lib/intake/accepted-files';

/** What a file is, as the extractor and the viewer both understand it. */
export type DocumentKind = AcceptedKind;

type DocumentBase = {
  /** Derived from what the document is, so opening it twice is one tab. */
  id: string;
  name: string;
  addedAt: number;
};

/**
 * A document the client handed over, as the viewer sees it.
 *
 * `file` is the real `File` from the drop or the picker, and it now survives a
 * reload: the bytes are written to IndexedDB and read back on mount (see
 * `lib/intake/document-store.ts`), which is what makes the panel, the brief's
 * citations and the transcript's chips all still work in a second sitting.
 *
 * This used to be the opposite, and the reversal is recorded because the old
 * reasoning was the good kind of wrong. `File` bytes cannot go in localStorage,
 * and a client's contract outliving their session on a shared machine is not a
 * decision a prototype should make for them — so nothing was saved, and a
 * refresh left the brief holding the document's *name* with no bytes behind it.
 * The cost landed on the client: the panel vanished, every "show this in the
 * document" link apologised, and a file attached a minute earlier was reported
 * as no longer open in this browser. The shared-machine worry is answered where
 * it can be answered honestly instead — the store is cleared by
 * `clearIntakeSession`, so a deleted draft and a sent case both take the bytes
 * with them, and a reload with no session behind it clears them on arrival.
 */
export type FileDocument = DocumentBase & {
  kind: DocumentKind;
  size: number;
  /** What the file declared. Never guessed from the extension. */
  mediaType: string;
  file: File;
};

/**
 * Something the app itself wrote, opened in the same panel.
 *
 * The confirmation email is the case that asked for this. It is a document by
 * every test that matters — it is read, it is referred back to, it sits beside
 * the brief it describes — and it was a modal, which meant reading it covered
 * the thing it was about and closing it was the only way back. In the panel it
 * is a tab: it can be left open next to the contract, collapsed to the column,
 * or closed, and none of those is a decision about the intake underneath.
 *
 * `body` is a rendered node rather than a string or a file, because the email
 * already exists as the real thing `packages/ui` sends (see
 * `confirmation-email.tsx`) and re-expressing it as data here would be a second
 * copy to keep in step. Captured when the tab is opened, which is safe for what
 * this holds: a receipt for a case that has been sent cannot change afterwards.
 */
export type ReaderDocument = DocumentBase & {
  kind: 'reader';
  /** Shown by About, as the envelope a mail client would draw. */
  meta: readonly (readonly [string, string])[];
  body: ReactNode;
};

export type IntakeDocument = FileDocument | ReaderDocument;

/** Narrows to the documents that have bytes behind them. */
export function isFileDocument(item: IntakeDocument): item is FileDocument {
  return item.kind !== 'reader';
}

/**
 * A rectangle on a page, in PDF points at scale 1, origin top-left.
 *
 * Stored unscaled so a highlight survives zooming: the overlay multiplies by
 * the current scale at render time. Held top-left rather than in PDF user space
 * (origin bottom-left) because every consumer is CSS.
 */
export type PageRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/**
 * Something to draw over the page.
 *
 * One shape for two producers, which is the point. Today the only producer is
 * find-in-document. Tomorrow it is the extractor saying where it read a value
 * (see `EvidenceAnchor`), and that arrives at the same overlay through the same
 * type — so the thing that has to be right now is this boundary, not the
 * feature behind it.
 *
 * A highlight names its place one of two ways, and the overlay takes either:
 *
 * - `range` — a character span in the page's text index, resolved to pixels
 *   against the rendered text layer with `Range.getClientRects`. Exact, because
 *   it asks the browser where the glyphs actually landed rather than guessing
 *   from font metrics. This is what search produces.
 * - `rects` — page-space rectangles the producer already knows. Nothing
 *   produces these yet; they exist so an extractor taught to return
 *   coordinates does not need a second overlay.
 */
export type DocumentHighlight = {
  id: string;
  /** 1-based, as the client counts pages. */
  page: number;
  kind: 'find' | 'evidence';
  range?: { start: number; end: number };
  rects?: readonly PageRect[];
};

/**
 * Where the model read a value. NOT PRODUCED YET — this is the seam.
 *
 * `/api/extract` already returns the verbatim `sourceQuote` for a document
 * value and verifies it against the PDF's text layer (`locateQuote` in
 * `lib/intake/verify-source.ts`), so the evidence exists; what it does not
 * carry is *where on the page* those words sit. Two ways to close that, and
 * this type is shaped to take either:
 *
 * 1. `quote` alone, resolved client-side by searching the page text — the same
 *    path find-in-document already walks, which is why find was built on the
 *    highlight model rather than on its own. This works today.
 * 2. `page` and `rects`, if the extractor is ever taught to return coordinates
 *    (pdf.js gives them server-side as easily as it does here). Then the
 *    viewer draws them directly and never searches.
 *
 * `documentName` rather than an id because the extractor names files, and ids
 * here are local to the browser session that made them.
 */
export type EvidenceAnchor = {
  /** The brief field that cited it, e.g. `noticePeriod`. */
  fieldKey: string;
  documentName: string;
  /** The exact words, as verified server-side. */
  quote: string;
  /** Set only when the producer knows it. */
  page?: number;
  /** Set only when the producer knows it; skips the text search entirely. */
  rects?: readonly PageRect[];
};

/**
 * A request to open a document at something in particular.
 *
 * Carried as state rather than called as a method because the viewer that has
 * to act on it may not be mounted yet when the click happens — opening the
 * panel and reaching a passage are one intention and two renders apart.
 */
export type DocumentReveal = {
  documentId: string;
  /** Highlighted and scrolled to, when it can be found in the text layer. */
  quote?: string;
  page?: number;
  fieldKey?: string;
};
