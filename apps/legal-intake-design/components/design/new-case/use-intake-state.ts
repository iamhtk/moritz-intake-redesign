'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MATTER_TYPE_KEY,
  type AnswersMap,
  type IntakeFile,
  type IntakeMessage,
  type MatterId,
} from './intake-types';

const STORAGE_KEY = 'playground:new-case-intake:v2';
const SAVE_DEBOUNCE_MS = 300;
const MAX_MESSAGES = 60;

export interface IntakeSnapshot {
  matterId?: MatterId;
  answers: AnswersMap;
  currentKey: string;
  messages: IntakeMessage[];
  files: IntakeFile[];
  done: boolean;
  /**
   * Client-supplied case name. When set (and non-empty) it wins over the
   * auto-derived title everywhere the case is named; clearing it reverts to the
   * derived title.
   */
  titleOverride?: string;
  /**
   * Claude-generated concise summaries of free-text answers, keyed by question
   * key. Populated at the recap step when the AI intake path is active; absent
   * when unavailable, in which case the recap card shows the raw answers.
   */
  aiSummaries?: Record<string, string>;
}

const EMPTY: IntakeSnapshot = {
  matterId: undefined,
  answers: {},
  currentKey: MATTER_TYPE_KEY,
  messages: [],
  files: [],
  done: false,
  titleOverride: undefined,
  aiSummaries: undefined,
};

/** Accept only a plain object of string values; anything else becomes undefined. */
function sanitizeSummaries(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const out: Record<string, string> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === 'string' && v.trim()) out[key] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function loadSnapshot(): IntakeSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<IntakeSnapshot>;
    if (!parsed || typeof parsed !== 'object') return null;
    const messages = Array.isArray(parsed.messages) ? parsed.messages : [];
    // A submitted case is terminal — don't resume it. Reopening "New case"
    // after submitting should start a fresh intake, so drop the stored snapshot
    // (in-progress drafts, which have no submitted card, still resume).
    if (messages.some((m) => m.card?.type === 'submitted')) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return {
      matterId: parsed.matterId,
      answers:
        parsed.answers && typeof parsed.answers === 'object'
          ? parsed.answers
          : {},
      currentKey:
        typeof parsed.currentKey === 'string'
          ? parsed.currentKey
          : MATTER_TYPE_KEY,
      messages,
      files: Array.isArray(parsed.files) ? parsed.files : [],
      done: Boolean(parsed.done),
      titleOverride:
        typeof parsed.titleOverride === 'string'
          ? parsed.titleOverride
          : undefined,
      aiSummaries: sanitizeSummaries(parsed.aiSummaries),
    };
  } catch {
    return null;
  }
}

const cap = (msgs: IntakeMessage[]): IntakeMessage[] =>
  msgs.length <= MAX_MESSAGES ? msgs : msgs.slice(msgs.length - MAX_MESSAGES);

/**
 * In-memory intake state backed by localStorage so an in-progress conversation
 * survives a refresh or navigation away. Hydrates once on mount; persists the
 * full snapshot on a short debounce. The storage key is versioned (`v2`) so
 * older drafts from the previous brief-based shape don't deserialize here.
 */
export function useIntakeState() {
  const [snapshot, setSnapshot] = useState<IntakeSnapshot>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = loadSnapshot();
    if (stored) setSnapshot(stored);
    setHydrated(true);
  }, []);

  // Persist on a short debounce whenever the snapshot changes post-hydration.
  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        // localStorage may be unavailable (private mode, quota); fail silently.
      }
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [snapshot, hydrated]);

  const appendMessage = useCallback((msg: IntakeMessage) => {
    setSnapshot((s) => ({ ...s, messages: cap([...s.messages, msg]) }));
  }, []);

  const updateMessage = useCallback(
    (id: string, patch: Partial<IntakeMessage>) => {
      setSnapshot((s) => ({
        ...s,
        messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      }));
    },
    [],
  );

  const setCurrentKey = useCallback((currentKey: string) => {
    setSnapshot((s) => ({ ...s, currentKey }));
  }, []);

  const setMatterId = useCallback((matterId: MatterId) => {
    setSnapshot((s) => ({ ...s, matterId }));
  }, []);

  const mergeAnswers = useCallback((patch: AnswersMap) => {
    setSnapshot((s) => ({ ...s, answers: { ...s.answers, ...patch } }));
  }, []);

  const setFiles = useCallback((files: IntakeFile[]) => {
    setSnapshot((s) => ({ ...s, files }));
  }, []);

  const setDone = useCallback((done: boolean) => {
    setSnapshot((s) => ({ ...s, done }));
  }, []);

  const setTitleOverride = useCallback((titleOverride: string) => {
    // Empty/whitespace clears the override so the derived title takes over.
    setSnapshot((s) => ({
      ...s,
      titleOverride: titleOverride.trim() === '' ? undefined : titleOverride,
    }));
  }, []);

  const setAiSummaries = useCallback((aiSummaries: Record<string, string>) => {
    setSnapshot((s) => ({ ...s, aiSummaries }));
  }, []);

  const reset = useCallback(() => {
    setSnapshot(EMPTY);
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return {
    ...snapshot,
    hydrated,
    appendMessage,
    updateMessage,
    setCurrentKey,
    setMatterId,
    mergeAnswers,
    setFiles,
    setDone,
    setTitleOverride,
    setAiSummaries,
    reset,
  };
}
