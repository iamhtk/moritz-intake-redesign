/**
 * The document viewer: a surface for looking at what the client handed over.
 *
 * A sibling of the case-documents components beside it, not a replacement for
 * them. Those model a case's document *library* — families, versions, who
 * uploaded what. This models one reader looking at one file, during intake,
 * with the passages a brief field claims to quote highlighted on the page.
 */
export { DocumentOverlay } from './document-overlay';
export { DocumentPanel } from './document-panel';
export { DocumentRailTrigger } from './document-rail-trigger';
export {
  DocumentResizeHandle,
  MIN_DOCUMENT_WIDTH,
} from './document-resize-handle';
export type { DocumentCitation } from './document-about';
export {
  useDocumentWorkspace,
  type DocumentWorkspace,
} from './use-document-workspace';
export type {
  DocumentHighlight,
  DocumentReveal,
  EvidenceAnchor,
  IntakeDocument,
  PageRect,
} from './types';
