'use client';

import type { FileDocument } from './types';

/**
 * Hand the file back.
 *
 * The client's own bytes, unmodified — not a re-export of what the viewer
 * managed to render. A document that failed to open is still downloadable for
 * exactly this reason: "this browser cannot show it" and "you cannot have it"
 * are different sentences, and only the first one is true.
 */
export function downloadDocument(item: FileDocument): void {
  const url = URL.createObjectURL(item.file);
  const link = document.createElement('a');
  link.href = url;
  link.download = item.name;
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();
  // A tick, not immediately: revoking in the same frame as the click cancels
  // the download in Safari.
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

/**
 * Print the original, through the browser's own PDF pipeline.
 *
 * Not the rendered canvases. The pages on screen are raster images sized for a
 * screen, so printing them would put a 96dpi photograph of a contract on paper
 * — and a contract that goes in a file gets read, annotated and scanned again.
 * A hidden frame holding the real file hands the job to the viewer the browser
 * already ships, which prints the vectors.
 */
export function printDocument(item: FileDocument): void {
  const url = URL.createObjectURL(item.file);
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.inset = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  frame.style.visibility = 'hidden';
  frame.src = url;

  frame.addEventListener('load', () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } catch {
      // Some browsers refuse to print a cross-origin-ish frame. Opening the
      // file in a tab leaves the client somewhere they can print from, which
      // is better than a button that silently did nothing.
      window.open(url, '_blank', 'noopener');
    }
    /*
     * The frame outlives the print dialog on purpose: removing it while the
     * dialog is open cancels the job in Chrome. Cleared on a timer, which is
     * long enough for a decision and short enough not to leak a file into a
     * session that goes on for an hour.
     */
    window.setTimeout(() => {
      frame.remove();
      URL.revokeObjectURL(url);
    }, 60_000);
  });

  document.body.append(frame);
}

/** "2.4 MB", or "812 KB" — the units a client recognises on a file. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
