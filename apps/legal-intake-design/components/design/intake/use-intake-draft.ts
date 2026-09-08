'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatItem, IntakeAnswers, IntakePhase } from './intake-types';

const STORAGE_VERSION = 'v1';
const SAVE_DEBOUNCE_MS = 300;

export type SetId = 'basics' | 'details';

export type IntakeDraft = {
  answers: IntakeAnswers;
  messages: ChatItem[];
  phase: IntakePhase;
  activeSet: SetId | null;
  setIndex: number;
  committedSets: SetId[];
  requiredOnly: boolean;
};

function storageKey(matterType: string): string {
  return `playground:intake:${matterType}:draft:${STORAGE_VERSION}`;
}

function loadDraft(key: string): IntakeDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<IntakeDraft>;
    if (!parsed || typeof parsed !== 'object' || !parsed.answers) return null;
    return {
      answers: parsed.answers,
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      phase: parsed.phase ?? 'intro',
      activeSet: parsed.activeSet ?? 'basics',
      setIndex: typeof parsed.setIndex === 'number' ? parsed.setIndex : 0,
      committedSets: Array.isArray(parsed.committedSets)
        ? parsed.committedSets
        : [],
      requiredOnly: Boolean(parsed.requiredOnly),
    };
  } catch {
    return null;
  }
}

function hasMeaningfulAnswers(answers: IntakeAnswers): boolean {
  return Object.values(answers).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return value !== undefined && value !== null && value !== false;
  });
}

/**
 * localStorage-backed save/resume for an intake chat, namespaced per matter
 * type. Reads any saved draft once on mount (so the flow can offer a resume
 * banner), then persists the full transcript + answers + phase on a short
 * debounce.
 */
export function useIntakeDraft(matterType: string) {
  const key = storageKey(matterType);
  const [initialDraft, setInitialDraft] = useState<IntakeDraft | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInitialDraft(loadDraft(key));
    setHydrated(true);
  }, [key]);

  const save = useCallback(
    (draft: IntakeDraft) => {
      if (typeof window === 'undefined') return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        try {
          if (!hasMeaningfulAnswers(draft.answers)) return;
          window.localStorage.setItem(key, JSON.stringify(draft));
          setSavedAt(Date.now());
        } catch {
          // localStorage may be unavailable; fail silently.
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [key],
  );

  const clear = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }, [key]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { initialDraft, hydrated, savedAt, save, clear };
}
