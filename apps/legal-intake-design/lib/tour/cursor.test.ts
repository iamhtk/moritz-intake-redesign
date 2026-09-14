import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  TOUR_CURSOR_KEY,
  TOUR_DISMISSED_KEY,
  clearCursor,
  isTourCursor,
  readCursor,
  readDismissal,
  writeCursor,
  writeDismissal,
} from './cursor';

function fakeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, String(v)),
  };
}

describe('the tour cursor', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      sessionStorage: fakeStorage(),
      localStorage: fakeStorage(),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('round-trips a cursor through session storage', () => {
    expect(readCursor()).toBeNull();
    writeCursor({ screen: 'sent', stop: 3 });
    expect(readCursor()).toEqual({ screen: 'sent', stop: 3 });
    clearCursor();
    expect(readCursor()).toBeNull();
  });

  it('refuses a cursor naming a screen that does not exist', () => {
    window.sessionStorage.setItem(
      TOUR_CURSOR_KEY,
      JSON.stringify({ screen: 'renamed', stop: 0 }),
    );
    expect(readCursor()).toBeNull();
  });

  it('refuses malformed values', () => {
    expect(isTourCursor(null)).toBe(false);
    expect(isTourCursor({ screen: 'home' })).toBe(false);
    expect(isTourCursor({ screen: 'home', stop: -1 })).toBe(false);
    expect(isTourCursor({ screen: 'home', stop: 1.5 })).toBe(false);
    expect(isTourCursor({ screen: 'home', stop: 2 })).toBe(true);
    window.sessionStorage.setItem(TOUR_CURSOR_KEY, 'not json');
    expect(readCursor()).toBeNull();
  });

  it('keeps the dismissal in local storage, separately', () => {
    expect(readDismissal()).toBeNull();
    writeDismissal('skipped');
    expect(readDismissal()).toBe('skipped');
    expect(window.localStorage.getItem(TOUR_DISMISSED_KEY)).toBe('skipped');
    expect(window.sessionStorage.getItem(TOUR_DISMISSED_KEY)).toBeNull();
  });

  it('survives a storage that throws', () => {
    vi.stubGlobal('window', {
      get sessionStorage(): Storage {
        throw new Error('blocked');
      },
      get localStorage(): Storage {
        throw new Error('blocked');
      },
    });
    expect(() => writeCursor({ screen: 'home', stop: 0 })).not.toThrow();
    expect(readCursor()).toBeNull();
    expect(readDismissal()).toBeNull();
  });
});
