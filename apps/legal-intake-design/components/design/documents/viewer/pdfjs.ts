/**
 * pdf.js, loaded once, in the browser, on demand.
 *
 * **Why `unpdf/pdfjs` rather than `pdfjs-dist`.** The app already depends on
 * `unpdf`, which ships a full pdf.js browser build and re-exports its types —
 * `/api/extract` uses it server-side to pull a document's text layer and verify
 * the quote behind every document value (`lib/intake/verify-source.ts`). Using
 * the same build here means the viewer and the verifier agree about what the
 * document says, which is the whole basis of the provenance on a brief row. A
 * second copy of pdf.js at a second version could disagree about the text of
 * the very passage the row claims to quote.
 *
 * **Why there is no worker file.** That build wires `globalThis.pdfjsWorker`
 * itself, so pdf.js finds its message handler on the main thread and needs no
 * separate `pdf.worker.mjs` to fetch — no `public/` copy, no bundler config,
 * nothing to get out of step on deploy. The cost is real and bounded: parsing
 * and rasterising happen on the main thread, so a very large document can make
 * the page jank while a page renders. Mitigated by rendering one page at a time
 * as it scrolls into view rather than the whole file up front, and by the 10 MB
 * per-file ceiling the intake already enforces. If it ever needs a real worker,
 * this is the one place that changes: set `GlobalWorkerOptions.workerSrc`.
 *
 * Imported lazily because it is 1.6 MB of JavaScript that most clients never
 * need — plenty of intakes are a conversation with no documents in them at all.
 */

import type * as PdfjsModule from 'unpdf/pdfjs';

type Pdfjs = typeof PdfjsModule;

let pending: Promise<Pdfjs> | null = null;

export function loadPdfjs(): Promise<Pdfjs> {
  pending ??= import('unpdf/pdfjs');
  return pending;
}
