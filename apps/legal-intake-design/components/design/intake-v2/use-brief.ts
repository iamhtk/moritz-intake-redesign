'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MatterId } from '@/components/design/new-case/intake-types';
import {
  applyFieldUpdates,
  blockingFields as briefBlocking,
  canSubmit as canSubmitBrief,
  confirmAll as confirmAllFields,
  confirmField,
  createBrief,
  isComplete as isBriefComplete,
  markDocumentsSuggested as markSuggested,
  noteObservation as noteOne,
  progress as briefProgress,
  restoreField,
  retargetBrief,
  unconfirmedFields as briefUnconfirmed,
  type Brief,
  type BriefField,
} from '@/lib/intake/brief';
import { fieldsForMatter } from '@/lib/intake/matter-fields';
import { matterOf } from '@/lib/intake/matter-of';
import {
  BRIEF_STORAGE_KEY,
  readStoredJson,
  writeStoredJson,
} from '@/lib/intake/session-storage';

/**
 * What the client did to a field, kept next to the brief rather than in it.
 *
 * The receipt on a row — "Accepted · you · 14:02", with an Undo — is a record
 * of an interaction, not a property of the value, so the field schema has no
 * business carrying it. Holding it here also keeps the undo honest: `previous`
 * is the field exactly as it stood, so backing out restores the value, the
 * provenance and the unconfirmed state in one move.
 *
 * Session-lived on purpose. A receipt is there so the client can see and
 * reverse what they just did; a field confirmed in an earlier sitting simply
 * reads as confirmed.
 */
export type FieldReceipt = {
  kind: 'accepted' | 'edited';
  /** Epoch ms. Rendered as HH:MM. */
  at: number;
  previous: BriefField;
};

type Session = {
  brief: Brief;
  receipts: Record<string, FieldReceipt>;
};

function readStoredBrief(): Brief | null {
  const parsed = readStoredJson<unknown>(BRIEF_STORAGE_KEY);
  if (typeof parsed !== 'object' || parsed === null) return null;
  const { matterId, fields } = parsed as Record<string, unknown>;
  if (typeof matterId !== 'string' || !Array.isArray(fields)) return null;
  return parsed as Brief;
}

/**
 * The brief, and the only four things anything is allowed to do to it.
 *
 * All the rules live in `lib/intake/brief.ts`, this hook is storage and React
 * state around them, deliberately thin. In particular there is no setter that
 * writes a field directly: an update either comes from the model through
 * `applyUpdates`, or from the client through `confirm` — and `undo` can only
 * put back a field this hook watched `confirm` replace.
 *
 * The brief and its receipts are one piece of state so that a confirmation and
 * the receipt explaining it are decided from the same snapshot. Two `useState`s
 * would read the brief as it was at render time, and a confirm that follows an
 * extraction in the same tick would be judged against a field that had not been
 * filled in yet.
 */
export function useBrief(
  matterId: MatterId = 'contract',
  /**
   * Whether the brief is still a draft worth saving.
   *
   * Goes false at the moment the case is sent. Without it, the session is
   * cleared at submission and then written straight back by this effect the
   * next time anything touches the brief, which is how a sent case came back
   * as an unfinished one.
   */
  { persist = true }: { persist?: boolean } = {},
) {
  const [session, setSession] = useState<Session>(() => ({
    brief: createBrief(matterId, fieldsForMatter(matterId)),
    receipts: {},
  }));
  const [hydrated, setHydrated] = useState(false);
  /**
   * When the brief was last written to storage, for the line that tells the
   * client so (item 3).
   *
   * The promise on the opening screen is that they can stop and come back, and
   * this is the evidence for it. A reassurance with nothing behind it is worth
   * less than no reassurance: the client is being asked to trust that closing
   * the tab is safe, and the only honest basis for that is showing them each
   * save as it actually lands.
   *
   * The timestamp rather than a boolean, because the indicator has to reappear
   * on the *next* save too, and a flag that is already true cannot announce
   * anything. Keying the element on this value is what restarts its animation.
   */
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const skipNextWrite = useRef(true);
  const { brief, receipts } = session;

  // Read stored state after mount: localStorage does not exist on the server,
  // and reading it during render would make the first paint differ from the
  // server's HTML.
  useEffect(() => {
    const stored = readStoredBrief();
    if (stored) setSession({ brief: stored, receipts: {} });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !persist) return;
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    writeStoredJson(BRIEF_STORAGE_KEY, brief);
    // After the write, not before it, and deliberately not conditional on the
    // write having succeeded: `writeStoredJson` swallows a blocked or full
    // quota so the conversation survives it. That trade is the right one for
    // the conversation and the wrong one for this line, which would otherwise
    // say "Saved" to the one client whose browser is refusing to save. Worth
    // writing down as the known gap it is.
    setSavedAt(Date.now());
  }, [brief, hydrated, persist]);

  /** Values proposed by the model or by document extraction. Never confirmed. */
  const applyUpdates = useCallback((updates: readonly unknown[]) => {
    setSession((current) => ({
      ...current,
      brief: retarget(applyFieldUpdates(current.brief, updates)),
    }));
  }, []);

  /** A one-tap Accept, or an edit when a value is passed. Always wins. */
  const confirm = useCallback((key: string, value?: string) => {
    setSession((current) => confirmOne(current, key, value));
  }, []);

  const confirmAll = useCallback(() => {
    setSession((current) => ({
      ...current,
      brief: confirmAllFields(current.brief),
    }));
  }, []);

  /** Back out of a confirmation, and with it the receipt that recorded it. */
  const undo = useCallback((key: string) => {
    setSession((current) => {
      const receipt = current.receipts[key];
      if (!receipt) return current;
      const receipts = Object.fromEntries(
        Object.entries(current.receipts).filter(([other]) => other !== key),
      );
      return { brief: restoreField(current.brief, receipt.previous), receipts };
    });
  }, []);

  const reset = useCallback(() => {
    setSession({
      brief: createBrief(matterId, fieldsForMatter(matterId)),
      receipts: {},
    });
    // A deleted case has nothing saved. Leaving the old timestamp here would
    // put "Saved just now" under an empty brief.
    setSavedAt(null);
  }, [matterId]);

  /** The recap's title. Renameable, and never taken from raw chat (D14). */
  const setTitle = useCallback((title: string) => {
    setSession((current) => ({
      ...current,
      brief: { ...current.brief, title },
    }));
  }, []);

  /**
   * What the recap call came back with.
   *
   * Both parts are optional because they fail separately: a recap that names
   * the case but writes an unusable description should still leave the name on
   * the brief rather than throw the whole response away.
   */
  const setRecap = useCallback(
    (recap: { title?: string; description?: string }) => {
      setSession((current) => ({
        ...current,
        brief: {
          ...current.brief,
          ...(recap.title !== undefined ? { title: recap.title } : {}),
          ...(recap.description !== undefined
            ? { description: recap.description }
            : {}),
        },
      }));
    },
    [],
  );

  /**
   * Record the one observation, if there is not one already (item 6).
   *
   * Thin on purpose: the at-most-one rule lives in `noteObservation` so it is
   * testable without React, and this hook is the same storage-and-state wrapper
   * it is for everything else. Returns nothing, so a caller cannot branch on
   * whether it took; the brief is the answer to that.
   */
  const noteObservation = useCallback((text: string) => {
    setSession((current) => ({
      ...current,
      brief: noteOne(current.brief, text),
    }));
  }, []);

  /** Spend the once-per-intake document suggestion (item 7). */
  const markDocumentsSuggested = useCallback(() => {
    setSession((current) => ({
      ...current,
      brief: markSuggested(current.brief),
    }));
  }, []);

  /** Escape hatch for the demo seed. Not used by the conversation. */
  const replace = useCallback((next: Brief) => {
    setSession({ brief: next, receipts: {} });
  }, []);

  const derived = useMemo(
    () => ({
      progress: briefProgress(brief),
      canSubmit: canSubmitBrief(brief),
      isComplete: isBriefComplete(brief),
      unconfirmed: briefUnconfirmed(brief),
      blocking: briefBlocking(brief),
    }),
    [brief],
  );

  return {
    brief,
    receipts,
    hydrated,
    savedAt,
    applyUpdates,
    confirm,
    confirmAll,
    undo,
    reset,
    replace,
    noteObservation,
    markDocumentsSuggested,
    setTitle,
    setRecap,
    ...derived,
  };
}

/**
 * Put the brief on the checklist its `matter-type` row actually describes
 * (item 15).
 *
 * Applied on both paths that can write that row — the model through
 * `applyUpdates`, and the client through `confirm` — rather than in an effect.
 * An effect would render once with the wrong checklist first, and the brief
 * panel would visibly swap its rows a frame after the reply landed.
 *
 * `matterOf` returning `undefined` leaves the brief alone. An unrecognised
 * matter type is not a reason to throw away the rows the client has been
 * answering; it just means there is nothing better to move to yet.
 */
function retarget(brief: Brief): Brief {
  const resolved = matterOf(brief);
  if (!resolved) return brief;
  return retargetBrief(brief, resolved, fieldsForMatter(resolved));
}

/**
 * One confirmation: the brief change and the receipt that explains it.
 *
 * Accepting a value the client did not touch and changing it are two different
 * events, and the receipt has to say which, so both are decided here from the
 * same snapshot. Confirming a field that is already settled is not an event at
 * all — that is how a value accepted on arrival, or seeded by the demo, avoids
 * claiming the client agreed to something they never saw.
 */
function confirmOne(session: Session, key: string, value?: string): Session {
  const previous = session.brief.fields.find((field) => field.key === key);
  if (!previous) return session;
  if (value === undefined && previous.confirmed) return session;

  const brief = retarget(confirmField(session.brief, key, value));
  const next = brief.fields.find((field) => field.key === key);
  // `confirmField` hands back the very same field when there was nothing to
  // agree with, which is the one case that must not leave a receipt behind.
  if (next === previous) return session;

  return {
    brief,
    receipts: {
      ...session.receipts,
      [key]: {
        kind:
          value !== undefined && value !== previous.value
            ? 'edited'
            : 'accepted',
        at: Date.now(),
        previous,
      },
    },
  };
}
