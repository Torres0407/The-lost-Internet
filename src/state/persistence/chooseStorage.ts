import {
  createIndexedDbSaveStorage,
  openSavesDatabase,
} from './indexedDbStorage';
import { createInMemorySaveStorage } from './inMemoryStorage';
import type { SaveStorage } from './types';

export interface ChooseStorageOptions {
  slotId?: string;
  indexedDB?: IDBFactory | null;
}

export interface ChosenStorageResult {
  storage: SaveStorage;
  fallback: boolean;
  reason?: string;
}

export async function chooseStorage(
  options: ChooseStorageOptions = {}
): Promise<ChosenStorageResult> {
  const slotId = options.slotId ?? 'slot-1';
  const factory =
    options.indexedDB !== undefined
      ? options.indexedDB
      : typeof globalThis !== 'undefined' && 'indexedDB' in globalThis
        ? globalThis.indexedDB ?? null
        : null;

  if (!factory) {
    return {
      storage: createInMemorySaveStorage({ slotId }),
      fallback: true,
      reason: 'IndexedDB is unavailable.',
    };
  }

  try {
    const db = await openSavesDatabase(factory);
    try {
      db.close();
    } catch {
      // ignore close errors during probe
    }
    return {
      storage: createIndexedDbSaveStorage({ slotId, indexedDB: factory }),
      fallback: false,
    };
  } catch (error) {
    return {
      storage: createInMemorySaveStorage({ slotId }),
      fallback: true,
      reason: error instanceof Error ? error.message : 'IndexedDB probe failed.',
    };
  }
}
