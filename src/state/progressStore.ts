import { create } from 'zustand';
import { createInitialNotebookState } from '../engine/notebook';
import { applyGrants, getNewGrants } from '../engine/unlock';
import { normalizeMeridianUrl } from '../engine/url';
import type {
  PersistedCollectionState,
  PersistedNotebookState,
  PersistedProgressState,
} from './progressPersistence';

export interface ProgressState {
  facts: Set<string>;
  discoveredPages: string[];
  addFacts: (ids: readonly string[]) => string[];
  removeFact: (id: string) => void;
  markPageDiscovered: (url: string) => void;
  hydrateProgress: (snapshot: {
    facts: ReadonlySet<string>;
    discoveredPages: readonly string[];
  }) => void;
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  facts: new Set<string>(),
  discoveredPages: [],

  addFacts: (ids) => {
    const newlyAdded = getNewGrants(ids, get().facts);
    if (newlyAdded.length === 0) {
      return [];
    }
    set((state) => ({
      facts: applyGrants(newlyAdded, state.facts),
    }));
    return newlyAdded;
  },

  removeFact: (id) =>
    set((state) => {
      if (!state.facts.has(id)) {
        return state;
      }
      const next = new Set(state.facts);
      next.delete(id);
      return { facts: next };
    }),

  markPageDiscovered: (url) =>
    set((state) => {
      const normalized = normalizeMeridianUrl(url) ?? url;
      if (state.discoveredPages.includes(normalized)) {
        return state;
      }
      return {
        discoveredPages: [...state.discoveredPages, normalized],
      };
    }),

  hydrateProgress: (snapshot) =>
    set({
      facts: new Set(snapshot.facts),
      discoveredPages: [...snapshot.discoveredPages],
    }),

  resetProgress: () =>
    set({
      facts: new Set<string>(),
      discoveredPages: [],
    }),
}));

export const selectFacts = (state: ProgressState): ReadonlySet<string> => state.facts;

export const selectDiscoveredPages = (state: ProgressState): readonly string[] =>
  state.discoveredPages;

export const selectHasFact = (factId: string) => (state: ProgressState): boolean =>
  state.facts.has(factId);

export const selectIsPageDiscovered =
  (url: string) =>
  (state: ProgressState): boolean => {
    const normalized = normalizeMeridianUrl(url) ?? url;
    return state.discoveredPages.includes(normalized);
  };

export function toPersistedProgress(
  state: ProgressState,
  notebook: PersistedNotebookState = {
    ...createInitialNotebookState(),
    insights: [],
  },
  collection: PersistedCollectionState = {
    unlockedArtifacts: [],
    unlockedAchievements: [],
    sourceViewedUrls: [],
    spoilersHidden: false,
  }
): PersistedProgressState {
  return {
    facts: Array.from(state.facts),
    discoveredPages: [...state.discoveredPages],
    notebook: {
      clues: notebook.clues.map((c) => ({ ...c, tags: [...c.tags] })),
      links: notebook.links.map((l) => ({ ...l })),
      freeNotes: notebook.freeNotes,
      insights: notebook.insights.map((i) => ({ ...i })),
    },
    collection: {
      unlockedArtifacts: collection.unlockedArtifacts.map((a) => ({ ...a })),
      unlockedAchievements: collection.unlockedAchievements.map((a) => ({ ...a })),
      sourceViewedUrls: [...collection.sourceViewedUrls],
      spoilersHidden: collection.spoilersHidden,
    },
  };
}
