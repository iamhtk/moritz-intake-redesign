/**
 * Where the documents handed over in an intake live between visits.
 *
 * The brief and the transcript go in `localStorage` (see `session-storage.ts`).
 * A document cannot: `File` bytes are not JSON, and a 10 MB contract would blow
 * the quota even if they were. So the bytes go in IndexedDB, keyed by the same
 * id the viewer derives from name and size, and everything else about the
 * session keeps the storage it already had.
 *
 * ## Why this exists at all
 *
 * It used to not. The decision was recorded on `FileDocument` and it was
 * defensible: a client's contract written to disk outlives the tab on a shared
 * machine. What it cost was not defensible. Reload the page mid-intake — which
 * clients do, because they are told their work is saved — and the document
 * panel vanished, every citation on the brief apologised instead of opening,
 * and the chips in the transcript said the file "is not open in this browser
 * any more" about a file the client had attached ninety seconds earlier. A
 * privacy stance that reads to the person it protects as data loss is not a
 * privacy stance, it is a bug with a rationale.
 *
 * The stance is kept where it can be kept honestly: the store is cleared by the
 * same call that clears the rest of the session, so "Delete case" and a sent
 * case both take the bytes with them (`clearIntakeSession`).
 */

import type { AcceptedKind } from './accepted-files';

const DB_NAME = 'moritz.intake';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

/**
 * A document as it survives a reload.
 *
 * `bytes` is a `Blob` rather than a `File` because that is what IndexedDB
 * round-trips reliably across browsers — Safari has historically handed back a
 * `File` stripped of its name. The name is stored beside it and the `File` is
 * rebuilt on read, so nothing downstream has to know the difference.
 */
export type StoredDocument = {
  id: string;
  name: string;
  size: number;
  kind: AcceptedKind;
  mediaType: string;
  addedAt: number;
  bytes: Blob;
};

/**
 * The database, or `null` when there is no usable one.
 *
 * `null` rather than a rejection, at every level of this module. Private
 * browsing, a blocked origin and a failed upgrade are all the same thing to the
 * caller — the session simply has no memory of its documents, which is exactly
 * the behaviour that shipped before this file existed. A storage layer that can
 * throw would put a `try` around every call site for no gain.
 */
function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = window.indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    // A second tab holding the old version open. Nothing to do but go without.
    request.onblocked = () => resolve(null);
  });
}

/**
 * Runs one transaction and closes the connection after it settles.
 *
 * A connection per call rather than a cached one, because the calls are rare —
 * a hydration on mount and a write per document attached — and a long-lived
 * handle is what makes a later version upgrade block on a tab nobody is
 * looking at.
 */
async function transact<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore, done: (value: T) => void) => void,
  fallback: T,
): Promise<T> {
  const db = await openDatabase();
  if (db === null) return fallback;

  try {
    return await new Promise<T>((resolve) => {
      let settled = false;
      const finish = (value: T) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      let transaction: IDBTransaction;
      try {
        transaction = db.transaction(STORE_NAME, mode);
      } catch {
        finish(fallback);
        return;
      }
      transaction.onabort = () => finish(fallback);
      transaction.onerror = () => finish(fallback);
      run(transaction.objectStore(STORE_NAME), finish);
    });
  } catch {
    return fallback;
  } finally {
    /*
     * Safe here even for a write: `close` only marks the connection pending,
     * and the transaction above has already reported success or abort.
     */
    db.close();
  }
}

function isStored(value: unknown): value is StoredDocument {
  if (typeof value !== 'object' || value === null) return false;
  const one = value as Partial<StoredDocument>;
  return (
    typeof one.id === 'string' &&
    typeof one.name === 'string' &&
    typeof one.size === 'number' &&
    (one.kind === 'pdf' || one.kind === 'image') &&
    typeof one.mediaType === 'string' &&
    typeof one.addedAt === 'number' &&
    one.bytes instanceof Blob
  );
}

/**
 * Everything saved, oldest first — the order they were handed over in.
 *
 * Rows that do not match the shape are dropped rather than repaired. The only
 * way one gets here is a version of this code that wrote something else, and a
 * half-understood document is worse than a missing one: it would put a name on
 * a tab that cannot render.
 */
export async function loadDocuments(): Promise<readonly StoredDocument[]> {
  const rows = await transact<readonly unknown[]>(
    'readonly',
    (store, done) => {
      const request = store.getAll();
      request.onsuccess = () => done(request.result ?? []);
      request.onerror = () => done([]);
    },
    [],
  );

  return rows.filter(isStored).sort((a, b) => a.addedAt - b.addedAt);
}

/** Writes the given documents. Existing ids are overwritten, not duplicated. */
export async function saveDocuments(
  documents: readonly StoredDocument[],
): Promise<void> {
  if (documents.length === 0) return;
  await transact<void>(
    'readwrite',
    (store, done) => {
      for (const one of documents) store.put(one);
      store.transaction.oncomplete = () => done(undefined);
    },
    undefined,
  );
}

export async function forgetDocument(id: string): Promise<void> {
  await transact<void>(
    'readwrite',
    (store, done) => {
      store.delete(id);
      store.transaction.oncomplete = () => done(undefined);
    },
    undefined,
  );
}

/** Called by "Delete case", by a restart, and when a case is sent. */
export async function forgetAllDocuments(): Promise<void> {
  await transact<void>(
    'readwrite',
    (store, done) => {
      store.clear();
      store.transaction.oncomplete = () => done(undefined);
    },
    undefined,
  );
}
