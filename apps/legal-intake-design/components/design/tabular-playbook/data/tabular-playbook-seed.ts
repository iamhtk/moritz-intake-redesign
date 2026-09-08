import {
  pylonPlaybookRows,
  pylonPlaybookSchema,
  type PylonPlaybookRow,
} from './pylon-provider-playbook-data';
import { DEFAULT_COLUMN_WIDTHS } from '../types';

export interface SeedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: string;
  [key: string]: unknown;
}

export interface SeedColumn {
  key: string;
  label: string;
  type: string;
  width?: number;
  isLoading: boolean;
  cellLoadingStates: { [docId: string]: boolean };
  cellData: { [docId: string]: string };
  enumOptions?: string[];
}

/**
 * Widths for the Pylon schema, picked per column from the median length of its
 * seeded values and the room its header label needs. Severity holds three short
 * enum badges; First Position and Precedent hold the longest prose, so a
 * uniform width either wastes space on the badges or shows a useless preview of
 * the prose. Applied here rather than on the schema itself, which mirrors the
 * source CSV.
 */
const SEED_COLUMN_WIDTHS: Record<string, number> = {
  // A step above the badge tier: "Termination / Exit" is close to compact's
  // ceiling, and a badge sitting flush against the cell edge reads as clipped.
  category: DEFAULT_COLUMN_WIDTHS.short,
  severity: DEFAULT_COLUMN_WIDTHS.compact,
  rationale: DEFAULT_COLUMN_WIDTHS.medium,
  walkAwayTrigger: DEFAULT_COLUMN_WIDTHS.medium,
  openQuestions: DEFAULT_COLUMN_WIDTHS.medium,
  fallback1: DEFAULT_COLUMN_WIDTHS.medium,
  fallback2: DEFAULT_COLUMN_WIDTHS.medium,
  fallback3: DEFAULT_COLUMN_WIDTHS.medium,
  standardMsaGuidelineSummary: DEFAULT_COLUMN_WIDTHS.long,
  precedent: DEFAULT_COLUMN_WIDTHS.long,
  firstPosition: DEFAULT_COLUMN_WIDTHS.extraLong,
};

/**
 * Derived from the row index rather than randomised so the demo table renders
 * identically on every mount.
 */
function seedSize(index: number): number {
  return 100_000 + ((index * 37_013) % 5_000_000);
}

function seedLastModified(index: number): string {
  const date = new Date(Date.UTC(2024, index % 12, ((index * 7) % 28) + 1));
  return date.toISOString().split('T')[0]!;
}

function toDocument(row: PylonPlaybookRow, index: number): SeedDocument {
  return {
    id: row.id,
    name: row.name,
    type: 'PLAYBOOK',
    size: seedSize(index),
    lastModified: seedLastModified(index),
    category: row.category,
    severity: row.severity,
    standardMsaGuidelineSummary: row.standardMsaGuidelineSummary,
    firstPosition: row.firstPosition,
    fallback1: row.fallback1,
    fallback2: row.fallback2,
    fallback3: row.fallback3,
    walkAwayTrigger: row.walkAwayTrigger,
    precedent: row.precedent,
    rationale: row.rationale,
    openQuestions: row.openQuestions,
  };
}

/** The Pylon provider playbook positions the table is seeded with on mount. */
export const seedDocuments: SeedDocument[] = pylonPlaybookRows.map(toDocument);

/** Empty column schema (headers only) used when a generation run clears the table. */
export function createEmptySeedColumns(): SeedColumn[] {
  return pylonPlaybookSchema.columns.map((column) => ({
    key: column.key,
    label: column.label,
    type: column.type || 'text',
    width: SEED_COLUMN_WIDTHS[column.key],
    isLoading: false,
    cellLoadingStates: {},
    cellData: {},
    enumOptions: column.enumOptions,
  }));
}

/**
 * The seeded columns, fully populated. Every cell is resolved up front and
 * marked not-loading so the table has no extraction step to run.
 */
export const seedColumns: SeedColumn[] = pylonPlaybookSchema.columns.map(
  (column) => {
    const cellData: { [docId: string]: string } = {};
    const cellLoadingStates: { [docId: string]: boolean } = {};

    for (const document of seedDocuments) {
      const value = document[column.key];
      cellData[document.id] =
        value === undefined || value === null ? '' : String(value);
      cellLoadingStates[document.id] = false;
    }

    return {
      key: column.key,
      label: column.label,
      type: column.type || 'text',
      width: SEED_COLUMN_WIDTHS[column.key],
      isLoading: false,
      cellLoadingStates,
      cellData,
      enumOptions: column.enumOptions,
    };
  },
);
