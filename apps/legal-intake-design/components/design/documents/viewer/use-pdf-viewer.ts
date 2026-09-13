'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';

import type { PDFDocumentProxy } from 'unpdf/pdfjs';

/** `getDocument`'s return, which pdf.js does not name at its entry point. */
type PDFDocumentLoadingTask = ReturnType<
  Awaited<ReturnType<typeof loadPdfjs>>['getDocument']
>;

import { loadPdfjs } from './pdfjs';
import {
  findMatches,
  findQuote,
  MIN_QUERY_LENGTH,
  pageTextIndex,
  type PageTextIndex,
} from './pdf-text';
import type { DocumentHighlight } from './types';

/** The page box at scale 1, in PDF points. */
export type PageBox = { page: number; width: number; height: number };

export type PdfViewerStatus = 'loading' | 'ready' | 'error';

/** Why a document could not be opened, in terms a client can act on. */
export type PdfFailure = 'password' | 'damaged' | 'unknown';

/**
 * Zoom stops rather than a continuous slider.
 *
 * A document has a right size — the width of the column it is in — and the
 * reasons to leave it are "I cannot read this" and "show me the whole page".
 * Stops make both one click, and they stop a client landing on 113% and
 * wondering whether that is why the type looks wrong.
 */
const ZOOM_STOPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3] as const;

/** Breathing room either side of a page inside the scroller. */
const GUTTER = 24;

/**
 * How far fitting to width is allowed to go.
 *
 * Fit-to-width is the right default in the docked column, where a page is
 * 480px and every pixel of it is needed. In the maximised overlay the same rule
 * stretched an A4 page to 1100px — 160%, with type the size of a headline — and
 * a contract set at 160% is harder to read than one set at 100%, not easier,
 * because a line runs wider than the eye tracks. So width-fitting stops a
 * little over actual size and the page centres in what is left, which is what
 * makes the overlay feel like a document on a desk rather than a zoomed
 * screenshot.
 */
const MAX_FIT_SCALE = 1.35;

const DEBOUNCE_MS = 180;

export type PdfViewer = {
  scrollerRef: RefObject<HTMLDivElement | null>;
  status: PdfViewerStatus;
  failure: PdfFailure | null;
  doc: PDFDocumentProxy | null;
  pages: readonly PageBox[];
  /** The scale the pages are drawn at right now. */
  scale: number;
  fitted: boolean;
  fitWidth: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  currentPage: number;
  goToPage: (page: number) => void;
  query: string;
  setQuery: (query: string) => void;
  searching: boolean;
  matchCount: number;
  activeMatch: number;
  stepMatch: (delta: number) => void;
  clearQuery: () => void;
  /** Everything the pages should draw: search hits and evidence. */
  highlights: readonly DocumentHighlight[];
  activeHighlightId: string | null;
  /**
   * Finds a verbatim passage, highlights it and scrolls to it.
   *
   * This is what a brief row's "view source" reaches (see `EvidenceAnchor`):
   * the extractor verified the words server-side, so the viewer's job is to
   * find the same words in the same text layer. Resolves false when the
   * document does not contain them, which the caller has to be able to say out
   * loud rather than leaving the reader on page 1 wondering.
   */
  revealQuote: (quote: string) => Promise<boolean>;
};

export function usePdfViewer(file: File): PdfViewer {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const [status, setStatus] = useState<PdfViewerStatus>('loading');
  const [failure, setFailure] = useState<PdfFailure | null>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [pages, setPages] = useState<readonly PageBox[]>([]);

  const [fitScale, setFitScale] = useState(1);
  const [zoom, setZoom] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState<readonly DocumentHighlight[]>([]);
  const [activeMatch, setActiveMatch] = useState(0);
  const [evidence, setEvidence] = useState<DocumentHighlight | null>(null);

  // ------------------------------------------------------------------- load

  useEffect(() => {
    let cancelled = false;
    /*
     * The loading task rather than the document, because the task is what owns
     * the teardown: destroying it releases the parsed document, its page
     * images and its fonts together. `PDFDocumentProxy` on its own can only be
     * asked to `cleanup`, which keeps the file open.
     */
    let task: PDFDocumentLoadingTask | null = null;

    setStatus('loading');
    setFailure(null);
    setDoc(null);
    setPages([]);

    void (async () => {
      try {
        const pdfjs = await loadPdfjs();
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (cancelled) return;

        task = pdfjs.getDocument({ data: bytes });
        const opened = await task.promise;
        if (cancelled) return;

        /*
         * Every page's size up front, before any of them is drawn. It is one
         * cheap call per page and it buys a scrollbar that is the right length
         * from the first frame: pages are not all the same size (an exhibit
         * scanned landscape in the middle of a contract is normal), so a
         * scroller that assumed page 1's shape would jump as each new one
         * arrived.
         */
        const boxes: PageBox[] = [];
        for (let page = 1; page <= opened.numPages; page += 1) {
          const proxy = await opened.getPage(page);
          if (cancelled) return;
          const viewport = proxy.getViewport({ scale: 1 });
          boxes.push({ page, width: viewport.width, height: viewport.height });
        }

        setDoc(opened);
        setPages(boxes);
        setStatus('ready');
      } catch (error) {
        if (cancelled) return;
        const pdfjs = await loadPdfjs();
        setFailure(
          error instanceof pdfjs.PasswordException
            ? 'password'
            : error instanceof pdfjs.InvalidPDFException
              ? 'damaged'
              : 'unknown',
        );
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      // Frees the parsed document and, with it, the page images pdf.js is
      // holding. A tab left open on a scanned exhibit is tens of megabytes.
      void task?.destroy();
    };
  }, [file]);

  // ------------------------------------------------------------------- zoom

  const widest = useMemo(
    () => pages.reduce((most, one) => Math.max(most, one.width), 0),
    [pages],
  );

  /*
   * Fit-to-width is measured, not guessed, and re-measured when the panel
   * changes size — which it does on every real interaction in this feature:
   * docking, maximising, and the browser window itself.
   */
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || widest === 0) return;

    const fit = () => {
      const available = scroller.clientWidth - GUTTER * 2;
      if (available <= 0) return;
      setFitScale(Math.min(Math.max(available / widest, 0.2), MAX_FIT_SCALE));
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [widest]);

  const scale = zoom ?? fitScale;

  const step = useCallback(
    (delta: number) => {
      setZoom((current) => {
        const from = current ?? fitScale;
        const stops = [...ZOOM_STOPS];
        const next =
          delta > 0
            ? stops.find((stop) => stop > from + 0.001)
            : [...stops].reverse().find((stop) => stop < from - 0.001);
        return next ?? from;
      });
    },
    [fitScale],
  );

  // ------------------------------------------------------------- page number

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || pages.length === 0) return;

    let frame = 0;
    const onScroll = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        /*
         * The page the client is reading is the first one still showing below
         * the top edge, not the one taking up most of the viewport. On a
         * half-scrolled spread those differ, and the number in the toolbar
         * should match the page number printed on the sheet they are looking
         * at the top of.
         */
        const top = scroller.getBoundingClientRect().top;
        const sheets = scroller.querySelectorAll<HTMLElement>('[data-page]');
        for (const sheet of sheets) {
          const box = sheet.getBoundingClientRect();
          if (box.bottom > top + 60) {
            setCurrentPage(Number(sheet.dataset.page));
            return;
          }
        }
      });
    };

    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, [pages.length]);

  const goToPage = useCallback((page: number) => {
    const scroller = scrollerRef.current;
    const sheet = scroller?.querySelector<HTMLElement>(`[data-page="${page}"]`);
    if (!scroller || !sheet) return;
    scroller.scrollTo({
      top: sheet.offsetTop - GUTTER,
      behavior: 'smooth',
    });
    setCurrentPage(page);
  }, []);

  // ----------------------------------------------------------------- search

  /**
   * The document's text, read once and kept.
   *
   * Held in a ref rather than state because nothing renders from it — it is
   * the haystack, and putting it in state would re-render every page each time
   * another page's text arrived.
   */
  const indexes = useRef<PageTextIndex[]>([]);
  const indexing = useRef<Promise<PageTextIndex[]> | null>(null);

  useEffect(() => {
    // A new document is a new haystack.
    indexes.current = [];
    indexing.current = null;
    setQuery('');
    setMatches([]);
    setEvidence(null);
    setZoom(null);
    setCurrentPage(1);
  }, [file]);

  const ensureIndexed = useCallback(async (): Promise<PageTextIndex[]> => {
    if (indexes.current.length > 0) return indexes.current;
    if (!doc) return [];
    /*
     * Read on demand, and only once. Text extraction is the one part of this
     * that touches every page whether or not it is on screen, so it waits
     * until something actually needs the whole document: a search, or a brief
     * row asking where its value came from. An intake where nobody searches
     * never pays for it.
     */
    indexing.current ??= (async () => {
      const all: PageTextIndex[] = [];
      for (let page = 1; page <= doc.numPages; page += 1) {
        all.push(await pageTextIndex(doc, page));
      }
      indexes.current = all;
      return all;
    })();
    return indexing.current;
  }, [doc]);

  useEffect(() => {
    if (status !== 'ready') return;

    if (query.trim().length < MIN_QUERY_LENGTH) {
      setMatches([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        const all = await ensureIndexed();
        if (cancelled) return;
        const found = findMatches(all, query);
        setMatches(found);
        setActiveMatch(0);
        setSearching(false);
      })();
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [ensureIndexed, query, status]);

  const stepMatch = useCallback(
    (delta: number) => {
      setActiveMatch((current) => {
        if (matches.length === 0) return 0;
        // Wraps, because the alternative is a disabled "next" at the last hit
        // and a client who has to work out that they are at the end.
        return (current + delta + matches.length) % matches.length;
      });
    },
    [matches.length],
  );

  const active = matches[activeMatch] ?? null;
  useEffect(() => {
    if (!active) return;
    goToPage(active.page);
  }, [active, goToPage]);

  const revealQuote = useCallback(
    async (quote: string) => {
      const all = await ensureIndexed();
      const found = findQuote(all, quote);
      if (!found) return false;
      setEvidence(found);
      setQuery('');
      goToPage(found.page);
      return true;
    },
    [ensureIndexed, goToPage],
  );

  const highlights = useMemo(
    () => (evidence ? [...matches, evidence] : matches),
    [evidence, matches],
  );

  return {
    scrollerRef,
    status,
    failure,
    doc,
    pages,
    scale,
    fitted: zoom === null,
    fitWidth: () => setZoom(null),
    zoomIn: () => step(1),
    zoomOut: () => step(-1),
    canZoomIn: scale < ZOOM_STOPS[ZOOM_STOPS.length - 1]!,
    canZoomOut: scale > ZOOM_STOPS[0]!,
    currentPage,
    goToPage,
    query,
    setQuery,
    searching,
    matchCount: matches.length,
    activeMatch,
    stepMatch,
    clearQuery: () => setQuery(''),
    highlights,
    activeHighlightId: evidence?.id ?? active?.id ?? null,
    revealQuote,
  };
}
