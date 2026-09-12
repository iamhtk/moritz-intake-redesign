'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MatterId } from '@/components/design/new-case/intake-types';
import {
  applyFieldUpdates,
  canSubmit as canSubmitBrief,
  confirmAll as confirmAllFields,
  confirmField,
  createBrief,
  isComplete as isBriefComplete,
  progress as briefProgress,
  unconfirmedFields as briefUnconfirmed,
  type Brief,
} from '@/lib/intake/brief';
import { fieldsForMatter } from '@/lib/intake/matter-fields';
import {
  BRIEF_STORAGE_KEY,
  readStoredJson,
  writeStoredJson,
} from '@/lib/intake/session-storage';

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
 * `applyUpdates`, or from the client through `confirm`.
 */
export function useBrief(matterId: MatterId = 'contract') {
  const [brief, setBrief] = useState<Brief>(() =>
    createBrief(matterId, fieldsForMatter(matterId)),
  );
  const [hydrated, setHydrated] = useState(false);
  const skipNextWrite = useRef(true);

  // Read stored state after mount: localStorage does not exist on the server,
  // and reading it during render would make the first paint differ from the
  // server's HTML.
  useEffect(() => {
    const stored = readStoredBrief();
    if (stored) setBrief(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    writeStoredJson(BRIEF_STORAGE_KEY, brief);
  }, [brief, hydrated]);

  /** Values proposed by the model or by document extraction. Never confirmed. */
  const applyUpdates = useCallback((updates: readonly unknown[]) => {
    setBrief((current) => applyFieldUpdates(current, updates));
  }, []);

  /** A one-tap "looks right", or an edit when a value is passed. Always wins. */
  const confirm = useCallback((key: string, value?: string) => {
    setBrief((current) => confirmField(current, key, value));
  }, []);

  const confirmAll = useCallback(() => {
    setBrief((current) => confirmAllFields(current));
  }, []);

  const reset = useCallback(() => {
    setBrief(createBrief(matterId, fieldsForMatter(matterId)));
  }, [matterId]);

  /** The recap's title. Renameable, and never taken from raw chat (D14). */
  const setTitle = useCallback((title: string) => {
    setBrief((current) => ({ ...current, title }));
  }, []);

  /** Escape hatch for the demo seed. Not used by the conversation. */
  const replace = useCallback((next: Brief) => setBrief(next), []);

  const derived = useMemo(
    () => ({
      progress: briefProgress(brief),
      canSubmit: canSubmitBrief(brief),
      isComplete: isBriefComplete(brief),
      unconfirmed: briefUnconfirmed(brief),
    }),
    [brief],
  );

  return {
    brief,
    hydrated,
    applyUpdates,
    confirm,
    confirmAll,
    reset,
    replace,
    setTitle,
    ...derived,
  };
}
