// Cell state types for flagging and verification
export type CellState = 'unflagged' | 'verified' | 'incorrect' | 'at-risk';

/** A contract row in a tabular playbook. Extra keys hold per-column extracted values. */
export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: string;
  [key: string]: unknown;
}

/**
 * Provenance behind one inline citation marker: which document an extracted
 * value came from, the passage it came from, and the surrounding text to show
 * when the source is opened in full.
 */
export interface CitationSource {
  /** Marker number shown inline and in the hover card. */
  number: number;
  /** Source document the citation points at. */
  documentName: string;
  /** The cited passage. Previewed in the card, highlighted in the drawer. */
  snippet: string;
  /** Full text of the source document, rendered in the drawer. */
  documentText: string;
  /** Who last touched the document. Shown in the viewer's metadata strip. */
  documentAuthor?: string;
  /** ISO date the document was last modified, for the metadata strip. */
  documentLastModified?: string;
}

/**
 * Where a rule stands with the lawyer. Anything the agent writes — a generated
 * rule, or a re-run of one that already existed — is a draft until it is
 * approved; a rule the agent hasn't touched needs no sign-off, so rows carry no
 * review record until one is written.
 */
export type RuleReviewState = 'draft' | 'approved';

export interface RuleReview {
  state: RuleReviewState;
  /** Who signed the rule off, once someone has. */
  approvedBy?: string;
  approvedAt?: Date;
}

/** Which of a playbook's rules are still waiting on a lawyer. */
export interface ReviewSummary {
  total: number;
  /** Rules still in draft, in grid order — the order a review walks them. */
  draftIds: readonly string[];
}

/**
 * One value a cell has held. The oldest entry is always the agent's extraction,
 * so a cell's history reads from where the value came from to where it stands.
 */
export interface CellRevision {
  id: string;
  value: string;
  /** Display name — `Playbook agent` for the extraction. */
  author: string;
  /** True for the extraction, which can be restored but never rewritten. */
  isExtraction?: boolean;
  /** True for a value the agent has put forward and nobody has approved yet. */
  isProposal?: boolean;
  savedAt: Date;
}

export interface Column {
  key: string;
  label: string;
  type: string;
  width?: number; // Column width in pixels (for manual resize)
  isLoading?: boolean;
  cellLoadingStates?: { [docId: string]: boolean };
}

/**
 * Column width tiers in pixels. Cells truncate to a single line unless text
 * wrapping is on, so a width buys preview length rather than fitting the whole
 * value: enum badges stay compact while prose columns get room to read.
 */
export const DEFAULT_COLUMN_WIDTHS = {
  /** The sticky Position column, sized to the longest rule names. */
  document: 240,
  /** Enum badges and other values under ~20 characters. */
  compact: 128,
  /** Around a sentence. */
  short: 200,
  /** A paragraph's worth of preview. */
  medium: 240,
  /** Long prose. */
  long: 280,
  /** The longest fields in the schema. */
  extraLong: 320,
  /** Ad-hoc columns whose content isn't known yet. */
  default: 200,
} as const;

// Minimum and maximum column widths for resizing
export const MIN_COLUMN_WIDTH = 80;
export const MAX_COLUMN_WIDTH = 600;
