'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  getPlaybooks,
  getSeedPlaybooks,
  type PlaybookStudioPlaybook,
} from './playbook-studio-data';

/**
 * Client hook over the localStorage-backed playbook store. Seeds with the
 * SSR-safe snapshot so the first client render matches the server, then loads
 * the real localStorage store in a mount effect (avoiding a hydration
 * mismatch). Mutations go through the store functions in
 * `playbook-studio-data.ts`, then `refresh()` pulls the latest snapshot.
 */
export function usePlaybooks() {
  const [playbooks, setPlaybooks] =
    useState<PlaybookStudioPlaybook[]>(getSeedPlaybooks);

  const refresh = useCallback(() => {
    setPlaybooks(getPlaybooks());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { playbooks, refresh };
}
