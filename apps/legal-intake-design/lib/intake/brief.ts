/**
 * The brief: the source of truth for an intake session.
 *
 * The model proposes; this module decides. Every value that reaches a lawyer
 * passes through `applyFieldUpdates`, and the invariants below are the reason a
 * model-driven conversation is safe to demo:
 *
 * 1. The model can never mark a field as confirmed. Code decides, either by
 *    accepting a value whose confidence is good enough, or because the client
 *    said so.
 * 2. A confirmed field is never overwritten by the model.
 * 3. Updates are validated before they touch the brief.
 * 4. Submit requires every required field filled *and* client-confirmed.
 * 5. A claimed document source is only believed when its quote was verified
 * (server-side, in `/api/extract`), unverified sources arrive stripped.
 *
 * Pure TypeScript: no React, no network, no imports with side effects.
 */

import type { MatterId } from '@/components/design/new-case/intake-types';
import { isAutoApprovable } from './confidence';

/** Where a value came from. `client` outranks everything. */
export type FieldSource = 'client' | 'document' | 'inferred';

/** The model's own claim about a value. Advisory, never a substitute for confirmation. */
export type FieldConfidence = 'sure' | 'unsure';

export type BriefField = {
  key: string;
  label: string;
  required: boolean;
  /** `null` until something fills it. */
  value: string | null;
  source: FieldSource | null;
  confidence: FieldConfidence;
  /** CODE-OWNED. Only `confirmField` sets this. */
  confirmed: boolean;
  /** Human readable, e.g. "Notice period clause, page 3". */
  sourceNote: string | null;
  /** The exact words the value was read from. Only present when verified. */
  sourceQuote: string | null;
  /**
   * What the document (or the model) had here before the client corrected it.
   *
   * A client changing "Northwind Logistics Limited" to "Northwind Logistics
   * (UK) Ltd" is not noise to be discarded, a disagreement between the
   * document and the client's own account is a fact about the matter, and one
   * a lawyer would want. The brief stops *claiming* the old source, but it does
   * not forget it.
   */
  supersededValue: string | null;
  supersededSource: FieldSource | null;
  supersededNote: string | null;
};

export type Brief = {
  matterId: MatterId;
  fields: BriefField[];
  title: string | null;
};

/** The shape a field takes before anything has filled it. */
export type FieldDef = {
  key: string;
  label: string;
  required: boolean;
};

/**
 * One proposed change. This is what the model returns and what
 * `/api/extract` emits after quote verification. Note the absence of
 * `confirmed`, it is not expressible here by design (invariant 1).
 */
export type FieldUpdate = {
  key: string;
  value: string;
  source: FieldSource;
  confidence: FieldConfidence;
  sourceNote?: string | null;
  sourceQuote?: string | null;
};

/** The four states a field is displayed in (Decision 5). Derived, never stored. */
export type FieldState = 'confirmed' | 'from-document' | 'unsure' | 'missing';

const FIELD_SOURCES: ReadonlySet<string> = new Set([
  'client',
  'document',
  'inferred',
]);

const FIELD_CONFIDENCES: ReadonlySet<string> = new Set(['sure', 'unsure']);

export function createBrief(matterId: MatterId, defs: FieldDef[]): Brief {
  return {
    matterId,
    title: null,
    fields: defs.map((def) => ({
      key: def.key,
      label: def.label,
      required: def.required,
      value: null,
      source: null,
      confidence: 'unsure',
      confirmed: false,
      sourceNote: null,
      sourceQuote: null,
      supersededValue: null,
      supersededSource: null,
      supersededNote: null,
    })),
  };
}

/**
 * A field is only shown as coming from a document when it still carries the
 * quote that was verified against that document. Unverified extractions are
 * downgraded before they get here, but this check means a stripped field can
 * never render a source even if something upstream regresses.
 */
export function fieldState(field: BriefField): FieldState {
  if (field.confirmed) return 'confirmed';
  if (field.value === null) return 'missing';
  if (field.source === 'document' && field.sourceQuote !== null) {
    return 'from-document';
  }
  return 'unsure';
}

/** Invariant 3: anything malformed is dropped rather than coerced. */
export function isValidUpdate(
  value: unknown,
  knownKeys: ReadonlySet<string>,
): value is FieldUpdate {
  if (typeof value !== 'object' || value === null) return false;
  const {
    key,
    value: fieldValue,
    source,
    confidence,
  } = value as Record<string, unknown>;
  if (typeof key !== 'string' || !knownKeys.has(key)) return false;
  if (typeof fieldValue !== 'string' || fieldValue.trim() === '') return false;
  if (typeof source !== 'string' || !FIELD_SOURCES.has(source)) return false;
  if (typeof confidence !== 'string' || !FIELD_CONFIDENCES.has(confidence)) {
    return false;
  }
  return true;
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/**
 * The only path by which the model changes the brief.
 *
 * Confirmed fields are skipped entirely (invariant 2), not merged, not
 * partially applied. Unknown keys and malformed updates are dropped
 * (invariant 3). `confirmed` is never read off the payload (invariant 1).
 */
export function applyFieldUpdates(
  brief: Brief,
  updates: readonly unknown[],
): Brief {
  const knownKeys = new Set(brief.fields.map((field) => field.key));
  const accepted = new Map<string, FieldUpdate>();

  for (const candidate of updates) {
    if (!isValidUpdate(candidate, knownKeys)) continue;
    // Last write wins within a single response.
    accepted.set(candidate.key, candidate);
  }

  if (accepted.size === 0) return brief;

  return {
    ...brief,
    fields: brief.fields.map((field) => {
      const update = accepted.get(field.key);
      if (!update) return field;
      if (field.confirmed) return field;

      const fromDocument = update.source === 'document';
      const sourceQuote = fromDocument
        ? optionalText(update.sourceQuote)
        : null;

      // A document field that arrived without a verified quote is not a
      // document field. Nothing renders a source it cannot back up.
      const source: FieldSource =
        fromDocument && sourceQuote === null ? 'inferred' : update.source;

      return {
        ...field,
        value: update.value,
        source,
        confidence: update.confidence,
        // Accepted on arrival unless the value is genuinely shaky. Asking the
        // client to tap every field made the flow slower than the one it
        // replaces; asking only where it matters keeps the protection and
        // drops the busywork. An edit still overrides anything.
        confirmed: isAutoApprovable(
          source,
          update.confidence,
          sourceQuote !== null,
        ),
        sourceNote:
          fromDocument && sourceQuote === null
            ? null
            : optionalText(update.sourceNote),
        sourceQuote,
      };
    }),
  };
}

/**
 * A client edit or a one-tap "looks right". Always wins (Decision 4), and is
 * the only way `confirmed` becomes true.
 *
 * Passing `value` is an edit; omitting it confirms what is already there.
 * Confirming an empty field is a no-op, there is nothing to agree with.
 */
export function confirmField(brief: Brief, key: string, value?: string): Brief {
  return {
    ...brief,
    fields: brief.fields.map((field) => {
      if (field.key !== key) return field;

      const nextValue = value === undefined ? field.value : value;
      if (nextValue === null || nextValue.trim() === '') return field;

      const edited = value !== undefined && value !== field.value;

      // Only the first correction of a non-client value is a disagreement with
      // the document. A client editing their own earlier answer is just a
      // second thought, and must not overwrite what the document said.
      const supersedes =
        edited &&
        field.value !== null &&
        field.source !== null &&
        field.source !== 'client';

      return {
        ...field,
        value: nextValue,
        // An edited value is the client's own; a confirmed one keeps its
        // provenance so the brief can still say where it originally came from.
        source: edited ? 'client' : field.source,
        sourceNote: edited ? null : field.sourceNote,
        sourceQuote: edited ? null : field.sourceQuote,
        supersededValue: supersedes ? field.value : field.supersededValue,
        supersededSource: supersedes ? field.source : field.supersededSource,
        supersededNote: supersedes ? field.sourceNote : field.supersededNote,
        confidence: 'sure',
        confirmed: true,
      };
    }),
  };
}

/** Confirm every field that has a value. Backs "confirm all" on the review step. */
export function confirmAll(brief: Brief): Brief {
  return brief.fields.reduce(
    (next, field) =>
      field.value === null ? next : confirmField(next, field.key),
    brief,
  );
}

/**
 * Progress is information received, not turns taken (Part 1 of the design plan).
 *
 * Two numbers, because the plan wants two things at once. `filled` is
 * information received, a document that fills five fields has moved the case
 * forward five fields the moment it lands. `confirmed` is information the
 * client has stood behind, and it is the only one the submit gate cares about.
 * The brief shows both, which is what makes the gap between them legible.
 */
export function progress(brief: Brief): {
  confirmed: number;
  filled: number;
  total: number;
} {
  // Count everything that actually needs an answer: every required field, plus
  // any optional one the client has filled in. Counting an empty optional field
  // would stop the bar reaching full on a case that is ready to send; ignoring
  // a filled one would show a total smaller than the number of rows on screen.
  const counted = brief.fields.filter(
    (field) => field.required || field.value !== null,
  );
  return {
    confirmed: counted.filter((field) => field.confirmed).length,
    filled: counted.filter((field) => field.value !== null).length,
    total: counted.length,
  };
}

/** Every required field has a value. Enough to reach review, not to submit. */
export function isComplete(brief: Brief): boolean {
  return brief.fields.every((field) => !field.required || field.value !== null);
}

/**
 * Invariant 4. The gate: every required field filled, and nothing left that was
 * too shaky to accept on its own. In practice that is one or two fields a case,
 * not all of them.
 */
export function canSubmit(brief: Brief): boolean {
  return brief.fields.every(
    (field) => !field.required || (field.value !== null && field.confirmed),
  );
}

/** Fields that were not good enough to accept, so the client has to look. */
export function unconfirmedFields(brief: Brief): BriefField[] {
  return brief.fields.filter(
    (field) => field.value !== null && !field.confirmed,
  );
}

/**
 * Places where the client's account differs from the document.
 *
 * Not shown in the brief, the client already knows what they typed, and the
 * brief stays clean. This feeds the confirmation and the recap, so the
 * disagreement reaches the person who needs it.
 */
export function documentDisagreements(brief: Brief): {
  label: string;
  clientValue: string;
  documentValue: string;
  where: string | null;
}[] {
  return brief.fields
    .filter(
      (field) =>
        field.supersededValue !== null &&
        field.supersededSource === 'document' &&
        field.value !== null,
    )
    .map((field) => ({
      label: field.label,
      clientValue: field.value as string,
      documentValue: field.supersededValue as string,
      where: field.supersededNote,
    }));
}

/** What the model still needs to ask about. */
export function missingRequiredKeys(brief: Brief): string[] {
  return brief.fields
    .filter((field) => field.required && field.value === null)
    .map((field) => field.key);
}
