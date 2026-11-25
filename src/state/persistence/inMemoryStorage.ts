import type { SaveData } from '../../engine/save';
import type { SaveStorage } from './types';

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export interface InMemoryStorageOptions {
  slotId?: string;
}

export function createInMemorySaveStorage(
  options: InMemoryStorageOptions = {}
): SaveStorage {
  const slotId = options.slotId ?? 'slot-1';
  const backupKey = `${slotId}-backup`;
  const records = new Map<string, unknown>();

  return {
    kind: 'memory',

    async load() {
      if (!records.has(slotId)) {
        return null;
      }
      return cloneValue(records.get(slotId)) as SaveData;
    },

    async loadBackup() {
      if (!records.has(backupKey)) {
        return null;
      }
      return cloneValue(records.get(backupKey)) as SaveData;
    },

    async save(data) {
      if (records.has(slotId)) {
        records.set(backupKey, cloneValue(records.get(slotId)));
      }
      records.set(slotId, cloneValue(data));
    },

    async clear() {
      records.delete(slotId);
      records.delete(backupKey);
    },

    async writeRawSlot(raw) {
      records.set(slotId, cloneValue(raw));
    },
  };
}
