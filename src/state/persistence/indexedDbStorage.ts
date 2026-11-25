import type { SaveData } from '../../engine/save';
import type { SaveStorage } from './types';

export const DB_NAME = 'the-lost-internet';
export const DB_VERSION = 1;
export const STORE_NAME = 'saves';
export const DEFAULT_SLOT_ID = 'slot-1';

export interface IndexedDbStorageOptions {
  slotId?: string;
  indexedDB?: IDBFactory | null;
}

function getFactory(override?: IDBFactory | null): IDBFactory | null {
  if (override !== undefined) {
    return override;
  }
  if (typeof globalThis !== 'undefined' && 'indexedDB' in globalThis) {
    return globalThis.indexedDB ?? null;
  }
  return null;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function transactionToPromise(tx: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error('IndexedDB transaction failed.'));
    tx.onabort = () =>
      reject(tx.error ?? new Error('IndexedDB transaction was aborted.'));
  });
}

function isQuotaError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const err = error as { name?: string; code?: number; message?: string };
  return (
    err.name === 'QuotaExceededError' ||
    err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    err.code === 22 ||
    (typeof err.message === 'string' && /quota/i.test(err.message))
  );
}

function isClosedConnectionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const err = error as { name?: string; message?: string };
  if (err.name === 'InvalidStateError') {
    return true;
  }
  return (
    typeof err.message === 'string' &&
    /(closing|closed|database connection)/i.test(err.message)
  );
}

function normalizeStorageError(error: unknown): Error {
  if (isQuotaError(error)) {
    const quotaError = new Error(
      'Browser storage quota exceeded. Export your save file to avoid losing progress.'
    );
    quotaError.name = 'QuotaExceededError';
    return quotaError;
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

export function openSavesDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    let settled = false;
    let request: IDBOpenDBRequest;

    try {
      request = factory.open(DB_NAME, DB_VERSION);
    } catch (error) {
      reject(normalizeStorageError(error));
      return;
    }

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onblocked = () => {
      if (!settled) {
        settled = true;
        reject(new Error('IndexedDB database upgrade was blocked by another tab.'));
      }
    };

    request.onerror = () => {
      if (!settled) {
        settled = true;
        reject(
          normalizeStorageError(
            request.error ?? new Error('Unable to open IndexedDB database.')
          )
        );
      }
    };

    request.onsuccess = () => {
      if (!settled) {
        settled = true;
        resolve(request.result);
      }
    };
  });
}

export function createIndexedDbSaveStorage(
  options: IndexedDbStorageOptions = {}
): SaveStorage {
  const slotId = options.slotId ?? DEFAULT_SLOT_ID;
  const backupKey = `${slotId}-backup`;
  const factory = getFactory(options.indexedDB);

  let dbPromise: Promise<IDBDatabase> | null = null;

  const resetConnection = () => {
    dbPromise = null;
  };

  const getDatabase = async (): Promise<IDBDatabase> => {
    if (!factory) {
      throw new Error('IndexedDB is unavailable in this browser environment.');
    }

    if (!dbPromise) {
      dbPromise = openSavesDatabase(factory)
        .then((db) => {
          db.onversionchange = () => {
            try {
              db.close();
            } catch {
              // ignore close errors
            }
            resetConnection();
          };
          db.onclose = () => {
            resetConnection();
          };
          return db;
        })
        .catch((error) => {
          resetConnection();
          throw error;
        });
    }

    return dbPromise;
  };

  const withDbRetry = async <T>(
    operation: (db: IDBDatabase) => Promise<T>
  ): Promise<T> => {
    try {
      const db = await getDatabase();
      return await operation(db);
    } catch (firstError) {
      if (!isClosedConnectionError(firstError)) {
        throw normalizeStorageError(firstError);
      }
      resetConnection();
      try {
        const reopenedDb = await getDatabase();
        return await operation(reopenedDb);
      } catch (retryError) {
        throw normalizeStorageError(retryError);
      }
    }
  };

  return {
    kind: 'indexeddb',

    async load() {
      return withDbRetry(async (db) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const result = await requestToPromise(store.get(slotId));
        await transactionToPromise(tx);
        return (result ?? null) as SaveData | null;
      });
    },

    async loadBackup() {
      return withDbRetry(async (db) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const result = await requestToPromise(store.get(backupKey));
        await transactionToPromise(tx);
        return (result ?? null) as SaveData | null;
      });
    },

    async save(data) {
      return withDbRetry(async (db) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const existing = await requestToPromise(store.get(slotId));
        if (existing !== undefined && existing !== null) {
          await requestToPromise(store.put(existing, backupKey));
        }
        await requestToPromise(store.put(data, slotId));
        await transactionToPromise(tx);
      });
    },

    async clear() {
      return withDbRetry(async (db) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        await requestToPromise(store.delete(slotId));
        await requestToPromise(store.delete(backupKey));
        await transactionToPromise(tx);
      });
    },

    async writeRawSlot(raw) {
      return withDbRetry(async (db) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        await requestToPromise(store.put(raw, slotId));
        await transactionToPromise(tx);
      });
    },
  };
}
