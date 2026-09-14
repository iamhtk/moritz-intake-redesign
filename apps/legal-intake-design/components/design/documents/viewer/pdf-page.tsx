'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { PDFDocumentProxy } from 'unpdf/pdfjs';

import { cn } from '@repo/ui/lib/utils';

import { loadPdfjs } from './pdfjs';
import { buildPageIndex, textItemsOf, type TextRun } from './pdf-text';
import type { DocumentHighlight, PageRect } from './types';

/**
 * How much of the scroller either side of the viewport counts as "coming up".
 *
 * A page that only starts rasterising when its top edge appears arrives grey
 * and fills in while the client is already reading it. One screen of lead time
 * is enough to land finished at normal scroll speeds without rendering a
 * hundred-page document nobody scrolled to.
 */
const RENDER_MARGIN = '100% 0px';

/** Retina without paying for a 3× canvas on a phone that cannot show it. */
const MAX_PIXEL_RATIO = 2;

type PdfPageProps = {
  doc: PDFDocumentProxy;
  page: number;
  /** Unscaled page box, so the placeholder is the right shape before render. */
  width: number;
  height: number;
  scale: number;
  highlights: readonly DocumentHighlight[];
  activeHighlightId: string | null;
};

type ResolvedSpan = { node: HTMLSpanElement; run: TextRun; length: number };

/**
 * Turns a character range in the page string into DOM positions.
 *
 * The page string carries separators this layer never rendered — a space where
 * the PDF broke a phrase, a newline at the end of a line (see `joinItems`) — so
 * an offset can land past the end of the span that owns it, or on a run whose
 * item was empty. Both are clamped to the nearest real character rather than
 * throwing: a highlight one character short is invisible, a thrown range takes
 * the page down.
 */
function resolveRange(
  spans: readonly ResolvedSpan[],
  start: number,
  end: number,
): Range | null {
  const first = spans.find((span) => span.run.end > start && span.length > 0);
  const last = [...spans]
    .reverse()
    .find((span) => span.run.start < end && span.length > 0);
  if (!first || !last) return null;

  const startNode = first.node.firstChild;
  const endNode = last.node.firstChild;
  if (!startNode || !endNode) return null;

  const range = document.createRange();
  range.setStart(
    startNode,
    Math.min(Math.max(start - first.run.start, 0), first.length),
  );
  range.setEnd(
    endNode,
    Math.min(Math.max(end - last.run.start, 0), last.length),
  );
  return range;
}

/**
 * Joins a range's per-run rectangles into one band per line.
 *
 * `getClientRects` returns a rectangle for every text node a range touches,
 * and a PDF line is a dozen of them — the content stream breaks a sentence
 * wherever it was kerned. Drawn as they come, a highlighted clause is a row of
 * little boxes with white slivers between the words, which reads as a rendering
 * fault rather than as a highlight. Rectangles sharing a baseline are merged
 * into the band a reader expects, and a gap wide enough to be a real column
 * break is left alone.
 */
function mergeRects(rects: readonly PageRect[]): PageRect[] {
  const lines = new Map<number, PageRect[]>();
  for (const rect of rects) {
    // Baselines wobble by a fraction of a pixel between runs of different
    // sizes, so lines are keyed by a rounded midpoint rather than by `top`.
    const key = Math.round((rect.top + rect.height / 2) / 3);
    const line = lines.get(key);
    if (line) line.push(rect);
    else lines.set(key, [rect]);
  }

  const merged: PageRect[] = [];
  for (const line of lines.values()) {
    line.sort((a, b) => a.left - b.left);
    let open: PageRect | null = null;
    for (const rect of line) {
      if (open === null) {
        open = { ...rect };
        continue;
      }
      const gap = rect.left - (open.left + open.width);
      if (gap <= 6) {
        const right = Math.max(open.left + open.width, rect.left + rect.width);
        const top = Math.min(open.top, rect.top);
        const bottom = Math.max(open.top + open.height, rect.top + rect.height);
        open = {
          left: open.left,
          top,
          width: right - open.left,
          height: bottom - top,
        };
        continue;
      }
      merged.push(open);
      open = { ...rect };
    }
    if (open !== null) merged.push(open);
  }

  return merged;
}

export function PdfPage({
  doc,
  page,
  width,
  height,
  scale,
  highlights,
  activeHighlightId,
}: PdfPageProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const spansRef = useRef<readonly ResolvedSpan[]>([]);

  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [measureToken, setMeasureToken] = useState(0);
  const [rects, setRects] = useState<
    readonly (PageRect & { id: string; highlight: string })[]
  >([]);

  /*
   * Rendered on approach rather than on arrival, and never un-rendered.
   *
   * Dropping a canvas that scrolled away would halve the memory a long document
   * costs, and would also mean scrolling back up to a page the client has
   * already read and watching it redraw. Reading a contract is not a one-way
   * scroll; they go back.
   */
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || visible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setVisible(true);
      },
      {
        root: frame.closest('[data-document-scroller]'),
        rootMargin: RENDER_MARGIN,
      },
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, [visible]);

  // --------------------------------------------------------------- rendering

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;
    let task: { cancel: () => void } | null = null;

    void (async () => {
      const pdfjs = await loadPdfjs();
      const proxy = await doc.getPage(page);
      if (cancelled) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      /*
       * Rasterised at the device's pixel ratio and shown at CSS size, which is
       * the difference between type that looks printed and type that looks
       * photographed. Capped at 2 because a 3× backing store on a phone costs
       * nine times the memory of a 1× one to show the same page.
       */
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      const viewport = proxy.getViewport({ scale: scale * ratio });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const render = proxy.render({ canvas, viewport });
      task = render;
      try {
        await render.promise;
      } catch (error) {
        // A cancelled render is the expected outcome of zooming mid-render.
        if (error instanceof pdfjs.RenderingCancelledException) return;
        throw error;
      }
      if (cancelled) return;
      setRendered(true);

      /*
       * The text layer is built after the canvas on purpose: rasterising is
       * what makes pdf.js load the document's embedded fonts, and the spans
       * below ask for those fonts by name. Built before, every span would
       * measure in a fallback face and calibrate itself to the wrong width.
       */
      const layer = textLayerRef.current;
      if (!layer) return;
      const content = await proxy.getTextContent();
      if (cancelled) return;

      const unscaled = proxy.getViewport({ scale: 1 });
      const styles = content.styles as Record<
        string,
        { fontFamily?: string } | undefined
      >;

      layer.replaceChildren();
      const items = textItemsOf(content.items);
      // One index, shared: the offsets the search matches against are the
      // offsets these spans are keyed by.
      const index = buildPageIndex(page, items);

      const spans: ResolvedSpan[] = [];
      const fragment = document.createDocumentFragment();

      items.forEach((item, at) => {
        const run = index.runs[at];
        if (!run || item.str === '') return;

        const tx = pdfjs.Util.transform(unscaled.transform, item.transform);
        const fontHeight = Math.hypot(tx[2]!, tx[3]!);
        const span = document.createElement('span');
        span.textContent = item.str;
        span.style.left = `${tx[4]}px`;
        span.style.top = `${tx[5]! - fontHeight}px`;
        span.style.fontSize = `${fontHeight}px`;
        span.style.fontFamily =
          styles[item.fontName]?.fontFamily ?? 'sans-serif';
        span.dataset.width = String(item.width);
        fragment.append(span);
        spans.push({ node: span, run, length: item.str.length });
      });

      layer.append(fragment);

      /*
       * Every span is then stretched to the width the PDF says its run
       * occupies. A browser sets type in whatever face it actually has, so a
       * span of Times renders a few percent wide or narrow of the embedded font
       * the canvas drew — and since a highlight is measured off these spans,
       * that error would show up as a box that does not sit over its words.
       * One horizontal scale per span fixes it, which is the same correction
       * pdf.js applies in its own text layer.
       */
      for (const { node } of spans) {
        const expected = Number(node.dataset.width) * scale;
        const actual = node.getBoundingClientRect().width;
        if (expected > 0 && actual > 0) {
          node.style.transform = `scaleX(${expected / actual})`;
        }
      }

      spansRef.current = spans;
      // The page has geometry now, so a highlight waiting on it can be placed.
      setMeasureToken((token) => token + 1);
    })();

    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, page, scale, visible]);

  // -------------------------------------------------------------- highlights

  /**
   * Where this page's highlights land, asked of the browser rather than worked
   * out from font metrics.
   *
   * Recomputed when the zoom changes because the rects are in on-screen pixels:
   * keeping them unscaled and multiplying would reintroduce the rounding the
   * measurement exists to avoid.
   */
  const measure = useCallback(() => {
    const frame = frameRef.current;
    const spans = spansRef.current;
    if (!frame || spans.length === 0) {
      setRects([]);
      return;
    }

    const origin = frame.getBoundingClientRect();
    const next: (PageRect & { id: string; highlight: string })[] = [];

    for (const highlight of highlights) {
      if (highlight.page !== page) continue;

      if (highlight.rects) {
        // A producer that already knows the geometry (see `EvidenceAnchor`):
        // page-space points, scaled to where the page is drawn right now.
        for (const rect of highlight.rects) {
          next.push({
            id: `${highlight.id}_${rect.left}_${rect.top}`,
            highlight: highlight.id,
            left: rect.left * scale,
            top: rect.top * scale,
            width: rect.width * scale,
            height: rect.height * scale,
          });
        }
        continue;
      }

      if (!highlight.range) continue;
      const range = resolveRange(
        spans,
        highlight.range.start,
        highlight.range.end,
      );
      if (!range) continue;

      const raw = Array.from(range.getClientRects())
        .filter((rect) => rect.width >= 1 && rect.height >= 1)
        .map((rect) => ({
          left: rect.left - origin.left,
          top: rect.top - origin.top,
          width: rect.width,
          height: rect.height,
        }));
      range.detach();

      mergeRects(raw).forEach((rect, index) => {
        next.push({
          id: `${highlight.id}_${index}`,
          highlight: highlight.id,
          ...rect,
        });
      });
    }

    setRects(next);
  }, [highlights, page, scale]);

  useEffect(() => {
    if (!rendered) return;
    measure();
  }, [measure, measureToken, rendered]);

  /*
   * The page brings the active match to the reader, rather than the toolbar
   * doing it. Only the page knows where the words ended up, and it only knows
   * once it has rendered — so a "next match" three pages down is two steps: the
   * scroller brings the page into view, and the page, on arrival, brings the
   * passage into view.
   */
  useEffect(() => {
    if (activeHighlightId === null) return;
    const target = frameRef.current?.querySelector(
      `[data-highlight="${activeHighlightId}"]`,
    );
    target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [activeHighlightId, rects]);

  return (
    <div
      ref={frameRef}
      data-page={page}
      className={cn(
        'bg-background ring-foreground/10 relative shrink-0 overflow-hidden rounded-[0.5rem] ring-1',
        // A page that has not drawn yet is a blank sheet of the right shape,
        // not a spinner: the document is arriving, and a page-shaped gap says
        // so more calmly than a widget that has to be removed again.
        !rendered && 'animate-pulse',
      )}
      style={{ width: width * scale, height: height * scale }}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ width: width * scale, height: height * scale }}
      />

      {/*
       * Selectable text, invisible, sitting exactly over the glyphs the canvas
       * drew. Built at scale 1 and scaled as a whole, so zooming is a transform
       * rather than a rebuild of several hundred spans — and so the highlight
       * measurement above keeps measuring the same DOM it measured before.
       */}
      <div
        ref={textLayerRef}
        className="mz-pdf-text-layer"
        style={{
          width,
          height,
          transform: `scale(${scale})`,
        }}
      />

      <div className="pointer-events-none absolute inset-0">
        {rects.map((rect) => (
          <div
            key={rect.id}
            data-highlight={rect.highlight}
            className={cn(
              'mz-pdf-highlight',
              rect.highlight === activeHighlightId && 'mz-pdf-highlight-active',
            )}
            style={{
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            }}
          />
        ))}
      </div>
    </div>
  );
}
