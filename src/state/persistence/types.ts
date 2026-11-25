import type { SaveData } from '../../engine/save';

export type StorageKind = 'indexeddb' | 'memory';

export interface SaveStorage {
  readonly kind: StorageKind;
  load: () => Promise<SaveData | null>;
  save: (data: SaveData) => Promise<void>;
  clear: () => Promise<void>;
  loadBackup?: () => Promise<SaveData | null>;
  writeRawSlot?: (raw: unknown) => Promise<void>;
}
