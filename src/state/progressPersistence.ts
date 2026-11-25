import type { Clue, Link } from '../engine/notebook';
import type { CollectionUnlockRecord, Insight, SaveData } from '../engine/save';
import { createInMemorySaveStorage } from './persistence/inMemoryStorage';
import type { SaveStorage } from './persistence/types';

export type PersistedInsight = Insight;
export type PersistedCollectionItem = CollectionUnlockRecord;

export interface PersistedNotebookState {
  clues: Clue[];
  links: Link[];
  freeNotes: string;
  insights: Insight[];
}

export interface PersistedCollectionState {
  unlockedArtifacts: CollectionUnlockRecord[];
  unlockedAchievements: CollectionUnlockRecord[];
  sourceViewedUrls: string[];
  spoilersHidden: boolean;
}

export interface PersistedProgressState {
  facts: string[];
  discoveredPages: string[];
  notebook: PersistedNotebookState;
  collection: PersistedCollectionState;
}

export type { SaveStorage };

export interface LegacyProgressPersistence {
  load: () => Promise<PersistedProgressState | null>;
  save: (state: PersistedProgressState) => Promise<void>;
}

export function createInMemoryProgressPersistence(): LegacyProgressPersistence {
  let snapshot: PersistedProgressState | null = null;

  return {
    async load() {
      if (!snapshot) {
        return null;
      }
      return JSON.parse(JSON.stringify(snapshot)) as PersistedProgressState;
    },
    async save(state) {
      snapshot = JSON.parse(JSON.stringify(state)) as PersistedProgressState;
    },
  };
}

export const inMemorySavePersistence = createInMemoryProgressPersistence();
export { createInMemorySaveStorage };
export type { SaveData };
