/**
 * The brief: the source of truth for an intake session.
 *
 * The model proposes; this module decides. Every value that reaches a lawyer
 * passes through `applyFieldUpdates`, and the invariants below are the reason a
 * model-driven conversation is safe to demo:
 *
 * 1. The model can never mark a field as confirmed. Code decides, and it
 *    decides on provenance: the client's own words are in, anything read out
 *    of a document or reworded by the model is shown to them first.
 * 2. A confirmed field is never overwritten by the model.
 * 3. Updates are validated before they touch the brief.
 * 4. Submit requires every required field filled *and* client-confirmed.
 * 5. A claimed document source is only believed when its quote was verified
 * (server-side, in `/api/extract`), unverified sources arrive stripped.
 *
 * Pure TypeScript: no React, no network, no imports with side effects.
 */

import {
  MATTER_TYPE_KEY,
  type MatterId,
} from '@/components/design/new-case/intake-types';
/*
 * A value import from `matter-fields.ts`, which imports `FieldDef` from here.
 * Not a cycle: that import is type-only and erased, so nothing circular exists
 * at runtime. Worth the note, because the shape looks like one.
 */
import { canonicalMatterType } from './matter-fields';
import {
  clampRating,
  isAutoApprovable,
  scoreFor,
  type ConfidenceRating,
} from './confidence';
import type { SourcePassage } from './verify-source';

/** Where a value came from. `client` outranks everything. */
export type FieldSource = 'client' | 'document' | 'inferred';

/**
 * The model's own 1 to 10 claim about a value. Advisory, never a substitute for
 * confirmation.
 *
 * Re-exported from `confidence.ts`, which owns the scale and the clamping, so
 * that the field shape and the thing that scores it cannot drift apart.
 */
export type { ConfidenceRating };

export type BriefField = {
  key: string;
  label: string;
  required: boolean;
  /** `null` until something fills it. */
  value: string | null;
  source: FieldSource | null;
  /**
   * The rating the model gave this value when it proposed it, 1 to 10.
   *
   * `null` for a field nothing has filled yet — there is no rating of a value
   * that does not exist, and a placeholder here would be a number the model
   * never said. Kept as it arrived: `confirmField` deliberately leaves it
   * alone, for the same reason it leaves `confidenceScore` alone.
   */
  confidence: ConfidenceRating | null;
  /** CODE-OWNED. Only `confirmField` sets this. */
  confirmed: boolean;
  /**
   * CODE-OWNED. `true` only when the **client** agreed to this value.
   *
   * `confirmed` alone cannot answer that question, and the brief panel needs it
   * answered. A value the client typed is confirmed on arrival by
   * `isAutoApprovable` without anyone clicking anything, and a value read out
   * of a document is confirmed only when they press Accept — but both land as
   * `confirmed: true`, so the row could not tell "we took your word for it"
   * apart from "you checked this and said yes".
   *
   * Only `confirmField` sets it, which is the one path an explicit human action
   * goes through. `applyFieldUpdates` always clears it: a new value arriving on
   * a row is a new thing to agree with, whatever the client thought of the last
   * one.
   */
  confirmedByClient: boolean;
  /**
   * CODE-OWNED, and pinned. 0 to 100, computed once from the provenance this
   * value arrived with and the model's rating of it, then never recomputed.
   *
   * It lives on the field rather than being derived at render time because the
   * inputs it was derived from do not survive the client touching the value:
   * an edit makes the source `client`, which would recompute a model's 35%
   * into a 100% and quietly overwrite the one honest number on the row. The
   * reading is what the model earned on arrival; what the client did about it
   * is a separate fact, carried by `confirmed`.
   *
   * `null` for a field nothing has filled yet.
   */
  confidenceScore: number | null;
  /** Human readable, e.g. "Notice period clause, page 3". */
  sourceNote: string | null;
  /** The exact words the value was read from. Only present when verified. */
  sourceQuote: string | null;
  /**
   * Those words where they sit in the document, in three verbatim slices (L3).
   *
   * The quote on its own proves the value came from somewhere; the passage is
   * what lets a client check it was not cherry-picked out of a sentence that
   * said the opposite. Computed server-side in `/api/extract`, which is the
   * only place the PDF's text layer exists — see `locateQuote`.
   *
   * `null` for everything except a verified document value, and also `null`
   * when the document had a text layer the quote could not be located in, which
   * a test asserts should not happen. The row degrades to the quote alone.
   */
  sourcePassage: SourcePassage | null;
  /**
   * One line of plain-English *why*, for a value the model worked out (L4).
   *
   * Only ever set on an `inferred` field, and that restriction is the whole
   * design rather than a simplification. The other two sources already answer
   * "why is this here" better than a sentence could: a `client` value is here
   * because the client said it, and a `document` value carries the clause it
   * was read from and the exact words, verified against the text layer. An
   * `inferred` value is the only one where the answer lives nowhere but in the
   * model's head, and it is also the only one a client is being asked to accept
   * on trust. So this is the row that gets a reason, and `applyFieldUpdates`
   * strips it from the other two rather than leaving that to the prompt.
   *
   * What it buys is not transparency for its own sake. An inferred value the
   * client disagrees with is currently a row they can only correct; with the
   * reasoning on it, it is a row they can *argue with* — and the argument is
   * usually more useful to the lawyer than the correction, because it says
   * which assumption was wrong.
   *
   * `null` where there is none, which includes every value the model declined
   * to explain. A field is never held back for want of a reason.
   */
  reasoning: string | null;
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
  /**
   * The paragraph a lawyer reads first, written by the recap call from the
   * finished brief (Decision 14).
   *
   * Separate from `title` because they fail separately: a recap that returns a
   * usable name and an unusable description should still name the case.
   */
  description: string | null;
  /**
   * The one thing a lawyer would have noticed, if anything (item 6).
   *
   * At most one per intake, and that limit is enforced here rather than only in
   * the prompt: `noteObservation` refuses to overwrite a non-null value. A
   * model asked for "at most one" across a twenty turn conversation will
   * eventually produce a second, and the second is always weaker than the
   * first, because the genuine contradiction in a case is usually the one that
   * was visible early.
   *
   * `null` means nothing in this case genuinely disagreed, which is the
   * expected outcome for most intakes and is not a failure.
   */
  observation: string | null;
  /**
   * Whether the "documents that matter most here" suggestion has been made
   * (item 7).
   *
   * On the brief rather than in component state because the rule is once per
   * intake, not once per mount. A `useRef` would forget across a reload and
   * ask a client who came back to finish their case for the same two documents
   * a second time, which is the behaviour the rule exists to prevent.
   */
  documentsSuggested: boolean;
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
  /** The model's 1 to 10. Clamped into range by `scoreFor`, never rejected. */
  confidence: ConfidenceRating;
  sourceNote?: string | null;
  sourceQuote?: string | null;
  /** The quote in context, honoured only alongside a verified quote (L3). */
  sourcePassage?: SourcePassage | null;
  /** One line of plain-English why, honoured only for `inferred` (L4). */
  reasoning?: string | null;
};

/** The four states a field is displayed in (Decision 5). Derived, never stored. */
export type FieldState = 'confirmed' | 'from-document' | 'unsure' | 'missing';

const FIELD_SOURCES: ReadonlySet<string> = new Set([
  'client',
  'document',
  'inferred',
]);

/**
 * A row with nothing in it yet.
 *
 * Extracted so `createBrief` and `retargetBrief` cannot disagree about what
 * empty means. They did not, but a fifteen-property literal written twice is
 * one `confirmedByClient: true` away from a row that claims the client agreed
 * to a value that does not exist.
 */
function emptyField(def: FieldDef): BriefField {
  return {
    key: def.key,
    label: def.label,
    required: def.required,
    value: null,
    source: null,
    confidence: null,
    confirmed: false,
    confirmedByClient: false,
    confidenceScore: null,
    sourceNote: null,
    sourceQuote: null,
    sourcePassage: null,
    reasoning: null,
    supersededValue: null,
    supersededSource: null,
    supersededNote: null,
  };
}

export function createBrief(matterId: MatterId, defs: FieldDef[]): Brief {
  return {
    matterId,
    title: null,
    description: null,
    observation: null,
    documentsSuggested: false,
    fields: defs.map(emptyField),
  };
}

/**
 * Point an existing brief at a different matter's checklist (item 15).
 *
 * The bug this fixes was the worst one in the flow, because it ended the
 * conversation rather than spoiling it. `useBrief('contract', ...)` was called
 * with a literal, so every brief carried the contract checklist for its whole
 * life. Say "employment dispute" and the rows on the right were still the
 * contract ones: the model correctly proposed `whoInvolved`, no such row
 * existed, `isValidUpdate` dropped it, and `otherSide` and `outcome` stayed
 * empty forever because nothing was ever going to ask about them. `canSubmit`
 * reads the required rows, so Review and send never enabled. The client could
 * not submit at all.
 *
 * Values are carried across by key, and `label` and `required` are taken from
 * the *new* matter, because the same key can be required in one matter and
 * optional in another — keeping the old flag would let a row be required by a
 * checklist that no longer governs it.
 *
 * Answers the new matter has no row for are kept rather than dropped, and made
 * optional. A client who typed a sentence should not have it deleted because a
 * later message reclassified their case, and in the common path there is
 * nothing to keep anyway: the matter resolves on the opening turn, when
 * `matter-type` is the only filled row and it exists in every matter.
 */
export function retargetBrief(
  brief: Brief,
  matterId: MatterId,
  defs: FieldDef[],
): Brief {
  if (brief.matterId === matterId) return brief;

  const existing = new Map(brief.fields.map((field) => [field.key, field]));
  const arriving = new Set(defs.map((def) => def.key));

  const fields = defs.map((def) => {
    const carried = existing.get(def.key);
    return carried
      ? { ...carried, label: def.label, required: def.required }
      : emptyField(def);
  });

  const orphaned = brief.fields
    .filter((field) => !arriving.has(field.key) && field.value !== null)
    .map((field) => ({ ...field, required: false }));

  return { ...brief, matterId, fields: [...fields, ...orphaned] };
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
  /*
   * A number, and nothing more. The 1 to 10 range is enforced by clamping
   * rather than by rejection (see `clampRating`): a rating outside the scale
   * is a badly turned dial, not a malformed update, and losing a real value
   * over it would be the wrong trade. Anything that is not a number at all —
   * the old 'sure'/'unsure' strings included — fails here and the update is
   * dropped, because there is then no reading to position the value with.
   */
  if (typeof confidence !== 'number' || !Number.isFinite(confidence)) {
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

      /*
       * Tied to the quote, not to the source (L3). A passage with no verified
       * quote beside it is three sentences of a document the brief is no
       * longer claiming to have read from, which is worse than nothing:
       * it looks like evidence.
       *
       * Settled here rather than inline below because the score reads it: a
       * quote that could be placed back in its surrounding sentences is
       * slightly better evidence than one that could not, and `scoreFor`
       * is given that as a signal.
       */
      const sourcePassage =
        sourceQuote === null ? null : (update.sourcePassage ?? null);

      // Clamped once, here, so the rating that is stored on the field is the
      // same one the score was computed from. Storing the raw number and
      // scoring a clamped one would put an 11 on a row scored as a 10.
      const rating = clampRating(update.confidence);

      const score = scoreFor({
        source,
        rating,
        hasVerifiedQuote: sourceQuote !== null,
        hasLocatedPassage: sourcePassage !== null,
      });

      /*
       * ───────────────────────────────────────────────────────────────────────
       * A SECOND READ MAY IMPROVE A ROW. IT MAY NOT QUIETLY MAKE IT WORSE.
       * ───────────────────────────────────────────────────────────────────────
       *
       * This used to be last-write-wins for anything unconfirmed, and that is
       * the wrong rule as soon as a client uploads a second document. The
       * common case is good: the first file mentioned the other side in
       * passing and scored 30, the second names it in the parties clause with
       * a quote that verifies and scores 91, and the row should become the
       * better one. That is the whole of "amend it to improve its confidence".
       *
       * The uncommon case is the one that bites. A second file also gets read
       * for *every* field, so a row already carrying a verified quote can be
       * offered a vague inference from the new document — and last-write-wins
       * replaced 91 with 30, silently, along with the source link the client
       * could have followed. Uploading more evidence made the brief worse.
       *
       * So a model update has to be at least as good as what is already there,
       * measured by the same `confidenceScore` the client is shown. Equal
       * scores still apply, because a re-read of the same clause is not a
       * regression and because refusing ties would freeze a row against
       * corrections from an equally good source.
       *
       * `client` updates skip this entirely: the client's own words outrank
       * every reading of a document, which is what `CLIENT_SCORE` means, and a
       * client correcting a row is not competing with the model for accuracy.
       * An edit through `confirmField` does not come through here at all.
       */
      if (
        source !== 'client' &&
        field.value !== null &&
        field.confidenceScore !== null &&
        score < field.confidenceScore
      ) {
        return field;
      }

      return {
        ...field,
        /*
         * Canonicalised for one field and one kind of difference: the matter
         * type arriving as `contract` rather than `Contract`. See
         * `canonicalMatterType`, which returns the value untouched for
         * everything else, including any other field.
         */
        value:
          field.key === MATTER_TYPE_KEY
            ? canonicalMatterType(update.value)
            : update.value,
        source,
        confidence: rating,
        // Accepted on arrival only when the client is the one who said it.
        // Everything read out of a document, and everything the model reworded,
        // is shown to them first — see `isAutoApprovable`.
        confirmed: isAutoApprovable(source),
        /*
         * Cleared, including when the line above sets `confirmed`: auto-
         * approval is us trusting the client's own sentence, not the client
         * confirming anything.
         *
         * Stated rather than left implicit, and it is an invariant rather than
         * a live branch — `if (field.confirmed) return field` above means a new
         * value can never land on a row the client has already agreed with, so
         * every field reaching this line has the flag false already. Written
         * out so the pair `confirmed`/`confirmedByClient` is always set
         * together, and a future edit to that guard cannot leave a stale
         * "You confirmed" over a value the client has never seen.
         */
        confirmedByClient: false,
        /*
         * Pinned here and nowhere else, from the provenance as it stands after
         * the quote check above, and from the model's rating. This is the only
         * line that ever sets it.
         *
         * Note the order of the two: `source` is the settled source, so a
         * document read whose quote did not verify is scored in the inferred
         * band however highly the model rated it. The rating moves a value
         * within the band its provenance earned; it never chooses the band.
         */
        confidenceScore: score,
        sourceNote:
          fromDocument && sourceQuote === null
            ? null
            : optionalText(update.sourceNote),
        sourceQuote,
        sourcePassage,
        /*
         * L4, enforced here rather than asked for in the prompt.
         *
         * A reason belongs to an inferred value and to nothing else. On a
         * `client` value it would be the model explaining the client's own
         * words back to them; on a verified `document` value it would sit
         * beside the clause and the quote and compete with them, and a
         * paraphrase next to the real text is the weaker of the two claims
         * being given equal weight.
         *
         * Note that `source` here is the *settled* source, after the quote
         * check above. So a document read whose quote could not be verified is
         * demoted to `inferred` and keeps its reason — which is exactly the
         * right outcome: that row has lost its evidence, so the model's
         * account of it is the most the client has to go on.
         */
        reasoning:
          source === 'inferred' ? optionalText(update.reasoning) : null,
      };
    }),
  };
}

/**
 * A client edit or a one-tap Accept. Always wins (Decision 4), and is the only
 * way `confirmed` becomes true.
 *
 * Deliberately touches neither `confidenceScore` nor `confidence`. Agreeing
 * with a value does not make the model's reading of it any better, and an edit
 * is the client overruling that reading rather than scoring 100 on it.
 *
 * The rating used to be forced to "sure" here, back when it was a two-value
 * flag and that read as a summary of the row's state rather than as a claim
 * about the model. On a 1 to 10 scale the equivalent would be writing a 10 the
 * model never said, onto the one row where its opinion has been overruled.
 * What the client did is carried by `confirmed` and by the receipt.
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
        // Goes with the quote it is context for. An edit replaces the value, so
        // the passage would be showing where the *old* value came from.
        sourcePassage: edited ? null : field.sourcePassage,
        /*
         * Dropped on an edit, for the same reason the note and the quote are:
         * the value is now the client's, and a sentence explaining how the
         * model arrived at the value they just replaced is an account of
         * something that is no longer on the row.
         *
         * Kept on a plain Accept. The client agreeing with an inferred value
         * does not make it something they said, and a lawyer reading the brief
         * afterwards still wants to know it was worked out rather than stated.
         */
        reasoning: edited ? null : field.reasoning,
        supersededValue: supersedes ? field.value : field.supersededValue,
        supersededSource: supersedes ? field.source : field.supersededSource,
        supersededNote: supersedes ? field.sourceNote : field.supersededNote,
        confirmed: true,
        // The client pressed Accept, or edited and saved. Either way they are
        // now behind this value, which is what the panel shows as "Confirmed".
        confirmedByClient: true,
      };
    }),
  };
}

/**
 * Put a field back exactly as it was.
 *
 * The one way out of a confirmation. `confirmField` is deliberately lossy — it
 * takes ownership of the value, drops the provenance it replaced and records
 * the disagreement — so undoing it cannot be done by recomputing anything. The
 * caller keeps the field it had before and hands it back here.
 *
 * Nothing about the gate changes: a restored field is unconfirmed again, so it
 * counts as one the client still has to look at.
 */
export function restoreField(brief: Brief, field: BriefField): Brief {
  return {
    ...brief,
    fields: brief.fields.map((current) =>
      current.key === field.key ? field : current,
    ),
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
  /** `confirmed` as a whole-number percentage of `total`. */
  percent: number;
} {
  /*
   * Every row on the panel, including an optional one that is still empty.
   *
   * This used to exclude empty optional fields, so the denominator moved: a
   * five-row brief counted out of four until the client filled the optional
   * row, and then out of five. That kept the bar able to reach 100%, which was
   * the stated reason, and it cost the two things the bar is actually for.
   * A total that changes underneath the client is not a measure of anything —
   * "3 of 4" becoming "3 of 5" after they answered something reads as going
   * backwards — and it made each step worth a different amount depending on
   * what was on screen.
   *
   * Fixed at the number of rows, every step is worth the same 20% of five, and
   * the bar resting at 80% on a case with the optional row skipped is the
   * correct reading rather than a bar that failed to fill: 80% is the send
   * threshold, and the last 20% is genuinely optional.
   */
  const counted = brief.fields;
  const confirmed = counted.filter((field) => field.confirmed).length;
  return {
    confirmed,
    filled: counted.filter((field) => field.value !== null).length,
    total: counted.length,
    percent:
      counted.length === 0 ? 0 : Math.round((confirmed / counted.length) * 100),
  };
}

/**
 * The percentage at which Send opens, for this brief.
 *
 * Derived, not a constant. Every matter's brief is five rows with four of them
 * required, so this is **80%** in the product — but 80 is the *consequence* of
 * that shape rather than a rule about it, and writing it down as a literal
 * would be a number that silently stops being true the day a matter gains a
 * row. `brief.test.ts` pins the 80 against every real matter's field list,
 * which is the assertion worth having.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS IS A LABEL FOR THE GATE, NOT THE GATE. `canSubmit` IS THE GATE.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The two agree on every path the flow can actually walk, and they are not the
 * same rule. A percentage counts confirmations without caring which rows they
 * came from, so a client who agreed with three required rows *and the optional
 * one* would sit at 80% with a required row still empty. Branching Send on the
 * percentage would let that case through, which is the one thing the gate
 * exists to prevent.
 *
 * So the percentage is what the client reads, and `canSubmit` is what decides.
 */
export function sendThresholdPercent(brief: Brief): number {
  if (brief.fields.length === 0) return 0;
  return Math.round((requiredCount(brief) / brief.fields.length) * 100);
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
 * The subset of those that are actually holding the gate shut.
 *
 * `canSubmit` only cares about required fields, so an optional value the client
 * has not agreed with is worth a look but is not a blocker. Counting those in
 * the line that explains why Send is off would tell a client they have two
 * things left to do when one of them would change nothing.
 */
export function blockingFields(brief: Brief): BriefField[] {
  return brief.fields.filter(
    (field) => field.required && (field.value === null || !field.confirmed),
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

/**
 * How many required fields went from empty to filled between two briefs.
 *
 * The firing rule for the "the work got smaller" line (item 9). It is a
 * comparison of two briefs rather than a count of the updates the model sent,
 * because those are not the same number and only one of them is the client's
 * experience: a turn can re-propose a value a field already had, and a turn can
 * fill an optional field, and neither makes the remaining work any shorter.
 * Telling someone two questions just got answered when one of them was already
 * answered is the sort of cheerful arithmetic that makes the rest of the copy
 * untrustworthy.
 *
 * Required only, for the same reason `blockingFields` is: optional fields are
 * not "things I needed", so counting them would inflate the number against a
 * total the client can see on the progress bar.
 */
export function newlyFilledRequired(before: Brief, after: Brief): number {
  const wasEmpty = new Set(
    before.fields
      .filter((field) => field.required && field.value === null)
      .map((field) => field.key),
  );
  return after.fields.filter(
    (field) => wasEmpty.has(field.key) && field.value !== null,
  ).length;
}

/** Every field that has to be answered, filled or not. The denominator. */
export function requiredCount(brief: Brief): number {
  return brief.fields.filter((field) => field.required).length;
}

/**
 * Record the one observation, if there is not one already (item 6).
 *
 * The whole rule in one place. Returns the brief unchanged when an observation
 * has already been made, so a caller cannot accidentally replace it, and when
 * the text is blank, which is what a turn with nothing to say produces.
 *
 * Never clears. An observation is a note to a lawyer about a contradiction in
 * the case, and a contradiction does not stop being true because a later turn
 * did not mention it.
 */
export function noteObservation(brief: Brief, text: string): Brief {
  if (brief.observation !== null) return brief;
  const trimmed = text.trim();
  if (trimmed === '') return brief;
  return { ...brief, observation: trimmed };
}

/** Mark the document suggestion as spent, so it can only ever fire once. */
export function markDocumentsSuggested(brief: Brief): Brief {
  if (brief.documentsSuggested) return brief;
  return { ...brief, documentsSuggested: true };
}
