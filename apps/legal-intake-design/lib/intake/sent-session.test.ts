import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createBrief } from './brief';
import { fieldsForMatter } from './matter-fields';
import {
  clearSentSession,
  readSentSession,
  SENT_STORAGE_KEY,
  SENT_TTL_MS,
  writeSentSession,
  type SentSession,
} from './sent-session';

/**
 * Items 20 and 21. The thing under test is whether a client who sent a case
 * can still see that they sent it, so the tests are about what survives and
 * what is refused, not about the storage mechanics.
 */

/** `localStorage` does not exist in the node environment these tests run in. */
function installLocalStorage() {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, 'window', {
    value: { localStorage: storage },
    configurable: true,
    writable: true,
  });
  return store;
}

let store: Map<string, string>;

beforeEach(() => {
  store = installLocalStorage();
});

afterEach(() => {
  Reflect.deleteProperty(globalThis as Record<string, unknown>, 'window');
});

function sentAt(when: number): SentSession {
  return {
    brief: createBrief('employment', fieldsForMatter('employment')),
    matterId: 'employment',
    sentAt: when,
    caseId: 'case_010',
    documentNames: ['contract.pdf'],
  };
}

describe('the sent session', () => {
  it('comes back after a reload', () => {
    const now = 1_700_000_000_000;
    writeSentSession(sentAt(now));

    // The whole of item 20: refreshing the intake route one second after
    // sending must not look like nothing happened.
    expect(readSentSession(now + 1_000)?.caseId).toBe('case_010');
  });

  it('keeps the sealed brief, which is what the confirmation renders from', () => {
    const now = 1_700_000_000_000;
    writeSentSession(sentAt(now));

    const restored = readSentSession(now);
    expect(restored?.brief.fields.length).toBeGreaterThan(0);
    expect(restored?.matterId).toBe('employment');
  });

  it('expires, so it cannot redirect a client away from a new case forever', () => {
    const now = 1_700_000_000_000;
    writeSentSession(sentAt(now));

    expect(readSentSession(now + SENT_TTL_MS + 1)).toBeNull();
  });

  it('clears an expired record rather than re-reading it every mount', () => {
    const now = 1_700_000_000_000;
    writeSentSession(sentAt(now));
    readSentSession(now + SENT_TTL_MS + 1);

    expect(store.has(SENT_STORAGE_KEY)).toBe(false);
  });

  it('survives right up to the edge of the window', () => {
    const now = 1_700_000_000_000;
    writeSentSession(sentAt(now));

    expect(readSentSession(now + SENT_TTL_MS)).not.toBeNull();
  });

  it('refuses a malformed record instead of rendering half a confirmation', () => {
    store.set(SENT_STORAGE_KEY, JSON.stringify({ caseId: 'case_010' }));

    expect(readSentSession()).toBeNull();
    expect(store.has(SENT_STORAGE_KEY)).toBe(false);
  });

  it('refuses a record whose brief has no fields', () => {
    store.set(
      SENT_STORAGE_KEY,
      JSON.stringify({ brief: {}, sentAt: Date.now(), caseId: 'case_010' }),
    );

    expect(readSentSession()).toBeNull();
  });

  it('is nothing when nothing was sent', () => {
    expect(readSentSession()).toBeNull();
  });

  it('goes when it is cleared, which is what Start another case does', () => {
    writeSentSession(sentAt(Date.now()));
    clearSentSession();

    expect(readSentSession()).toBeNull();
  });

  it('does not touch the draft keys a submission clears', () => {
    writeSentSession(sentAt(Date.now()));

    // `use-document-workspace.ts` decides whether to keep a client's document
    // bytes by looking for the draft keys. Writing one here would keep the
    // bytes of a case that has already gone.
    expect([...store.keys()]).toEqual([SENT_STORAGE_KEY]);
  });
});
