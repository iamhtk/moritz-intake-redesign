'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Quiet period after the last edit before the save goes out. */
const DEBOUNCE_MS = 1200;
/** Stand-in for the round trip a real save would make. */
const SAVE_LATENCY_MS = 600;

export type PlaybookSaveStatus = 'idle' | 'saving' | 'saved';

export interface PlaybookAutosave {
  /** `idle` until the first edit; then `saving` while a save is outstanding. */
  status: PlaybookSaveStatus;
  /** When the last save landed. `null` before the first one. */
  lastSavedAt: Date | null;
  /** True from the first edit until the save covering it lands. */
  isSavePending: boolean;
  /** Records an edit and (re)schedules the save that covers it. */
  markChanged: () => void;
  /** Saves now — for when the workspace is about to go away. */
  flush: () => void;
}

/**
 * Autosave for the playbook workspace: edits are saved on their own a beat
 * after the user stops making them, so there is no save button and nothing to
 * confirm on the way out.
 *
 * Debounce and latency are collapsed into a single visible `saving` state. The
 * distinction is real but not useful to the user — what they need to know is
 * that the edit hasn't landed yet — and showing "Saving…" from the first
 * keystroke avoids a label that flickers on every pause.
 *
 * The save itself is stubbed: the playground has no backend, and the edits are
 * already in the grid's state.
 */
export function usePlaybookAutosave(): PlaybookAutosave {
  const [status, setStatus] = useState<PlaybookSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latencyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /*
   * Counts edits so an in-flight save can tell whether it still speaks for the
   * current state: an edit made while it was in the air leaves it stale, and
   * letting it report "saved" would clear a change it never carried.
   */
  const changeIdRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    if (latencyRef.current !== null) clearTimeout(latencyRef.current);
    debounceRef.current = null;
    latencyRef.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const markChanged = useCallback(() => {
    const changeId = (changeIdRef.current += 1);
    clearTimers();
    setStatus('saving');

    debounceRef.current = setTimeout(() => {
      latencyRef.current = setTimeout(() => {
        if (changeIdRef.current !== changeId) return;
        setLastSavedAt(new Date());
        setStatus('saved');
      }, SAVE_LATENCY_MS);
    }, DEBOUNCE_MS);
  }, [clearTimers]);

  const flush = useCallback(() => {
    changeIdRef.current += 1;
    clearTimers();
    setLastSavedAt(new Date());
    setStatus('saved');
  }, [clearTimers]);

  return {
    status,
    lastSavedAt,
    isSavePending: status === 'saving',
    markChanged,
    flush,
  };
}
