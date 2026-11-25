import { create } from 'zustand';
import { audioEngine } from '../audio/audioEngine';
import { ACHIEVEMENTS, ARTIFACTS } from '../content/collection';
import { evaluateCollection } from '../engine/collection';
import type { CollectionUnlockRecord } from '../engine/save';
import { normalizeMeridianUrl } from '../engine/url';
import { emitCollectionEvent, subscribeCollectionEvent } from '../events/eventBus';
import { useNotebookStore } from './notebookStore';
import type { PersistedCollectionState } from './progressPersistence';
import { useProgressStore } from './progressStore';

export type UnlockedCollectionItem = CollectionUnlockRecord;

export interface CollectionToast {
  key: string;
  kind: 'artifact' | 'achievement';
  id: string;
  name: string;
  message: string;
}

export interface CollectionState {
  unlockedArtifacts: UnlockedCollectionItem[];
  unlockedAchievements: UnlockedCollectionItem[];
  sourceViewedUrls: string[];
  spoilersHidden: boolean;
  toastQueue: CollectionToast[];
  hydrating: boolean;
  setHydrating: (hydrating: boolean) => void;
  recordSourceView: (url: string) => void;
  runEvaluation: (options?: { silent?: boolean }) => {
    newArtifacts: string[];
    newAchievements: string[];
  };
  dismissActiveToast: () => void;
  setSpoilersHidden: (hidden: boolean) => void;
  toggleSpoilersHidden: () => void;
  unlockAllArtifacts: () => void;
  unlockAllAchievements: () => void;
  hydrateCollection: (snapshot: {
    unlockedArtifacts: readonly UnlockedCollectionItem[];
    unlockedAchievements: readonly UnlockedCollectionItem[];
    sourceViewedUrls: readonly string[];
    spoilersHidden: boolean;
  }) => void;
  resetCollection: () => void;
}

const ARTIFACT_BY_ID = new Map(ARTIFACTS.map((item) => [item.id, item]));
const ACHIEVEMENT_BY_ID = new Map(ACHIEVEMENTS.map((item) => [item.id, item]));

function createUnlockItems(
  ids: readonly string[],
  now: number
): UnlockedCollectionItem[] {
  return ids.map((id) => ({ id, unlockedAt: now }));
}

function buildToasts(
  artifactIds: readonly string[],
  achievementIds: readonly string[],
  now: number
): CollectionToast[] {
  const toasts: CollectionToast[] = [];
  for (const id of artifactIds) {
    const def = ARTIFACT_BY_ID.get(id);
    const name = def?.name ?? id;
    toasts.push({
      key: `artifact-${id}-${now}`,
      kind: 'artifact',
      id,
      name,
      message: `Artifact recovered: ${name}`,
    });
  }
  for (const id of achievementIds) {
    const def = ACHIEVEMENT_BY_ID.get(id);
    const name = def?.name ?? id;
    toasts.push({
      key: `achievement-${id}-${now}`,
      kind: 'achievement',
      id,
      name,
      message: `Achievement: ${name}`,
    });
  }
  return toasts;
}

function emitUnlockEvents(
  artifactIds: readonly string[],
  achievementIds: readonly string[],
  timestamp: number
): void {
  for (const id of artifactIds) {
    emitCollectionEvent('artifact_unlocked', {
      game: 'the-lost-internet',
      id,
      type: 'artifact',
      timestamp,
    });
  }
  for (const id of achievementIds) {
    emitCollectionEvent('achievement_unlocked', {
      game: 'the-lost-internet',
      id,
      type: 'achievement',
      timestamp,
    });
  }
}

export function toPersistedCollection(
  state: Pick<
    CollectionState,
    'unlockedArtifacts' | 'unlockedAchievements' | 'sourceViewedUrls' | 'spoilersHidden'
  >
): PersistedCollectionState {
  return {
    unlockedArtifacts: state.unlockedArtifacts.map((item) => ({ ...item })),
    unlockedAchievements: state.unlockedAchievements.map((item) => ({ ...item })),
    sourceViewedUrls: [...state.sourceViewedUrls],
    spoilersHidden: state.spoilersHidden,
  };
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  unlockedArtifacts: [],
  unlockedAchievements: [],
  sourceViewedUrls: [],
  spoilersHidden: false,
  toastQueue: [],
  hydrating: false,

  setHydrating: (hydrating) => set({ hydrating }),

  recordSourceView: (url) => {
    if (get().hydrating) {
      return;
    }
    const normalized = normalizeMeridianUrl(url) ?? url.trim();
    if (!normalized) {
      return;
    }
    const current = get().sourceViewedUrls;
    if (!current.includes(normalized)) {
      set({ sourceViewedUrls: [...current, normalized] });
      get().runEvaluation();
    }
  },

  runEvaluation: (options) => {
    const silent = Boolean(options?.silent);
    const state = get();
    if (state.hydrating) {
      return { newArtifacts: [], newAchievements: [] };
    }
    const progress = useProgressStore.getState();
    const notebook = useNotebookStore.getState();

    const { newArtifacts, newAchievements } = evaluateCollection(
      ARTIFACTS,
      ACHIEVEMENTS,
      {
        facts: progress.facts,
        discoveredPages: progress.discoveredPages,
        clueCount: notebook.clues.length,
        insightCount: notebook.insights.length,
        sourceViewedUrls: state.sourceViewedUrls,
      },
      {
        artifacts: new Set(state.unlockedArtifacts.map((item) => item.id)),
        achievements: new Set(state.unlockedAchievements.map((item) => item.id)),
      }
    );

    if (newArtifacts.length === 0 && newAchievements.length === 0) {
      return { newArtifacts: [], newAchievements: [] };
    }

    const now = Date.now();
    const addedArtifacts = createUnlockItems(newArtifacts, now);
    const addedAchievements = createUnlockItems(newAchievements, now);
    const newToasts = silent
      ? []
      : buildToasts(newArtifacts, newAchievements, now);

    set((prev) => ({
      unlockedArtifacts: [...prev.unlockedArtifacts, ...addedArtifacts],
      unlockedAchievements: [...prev.unlockedAchievements, ...addedAchievements],
      toastQueue: silent ? prev.toastQueue : [...prev.toastQueue, ...newToasts],
    }));

    emitUnlockEvents(newArtifacts, newAchievements, now);

    if (!silent) {
      for (const toast of newToasts) {
        audioEngine.playSound('artifact_chime', { visualCue: toast.message });
      }
    }

    return { newArtifacts, newAchievements };
  },

  dismissActiveToast: () =>
    set((state) => ({
      toastQueue: state.toastQueue.slice(1),
    })),

  setSpoilersHidden: (hidden) => {
    set({ spoilersHidden: hidden });
  },

  toggleSpoilersHidden: () => {
    set((state) => ({ spoilersHidden: !state.spoilersHidden }));
  },

  unlockAllArtifacts: () => {
    const existing = new Set(get().unlockedArtifacts.map((item) => item.id));
    const missingIds = ARTIFACTS.map((item) => item.id).filter(
      (id) => !existing.has(id)
    );
    if (missingIds.length === 0) {
      return;
    }
    const now = Date.now();
    set((state) => ({
      unlockedArtifacts: [
        ...state.unlockedArtifacts,
        ...createUnlockItems(missingIds, now),
      ],
      toastQueue: [...state.toastQueue, ...buildToasts(missingIds, [], now)],
    }));
    emitUnlockEvents(missingIds, [], now);
  },

  unlockAllAchievements: () => {
    const existing = new Set(get().unlockedAchievements.map((item) => item.id));
    const missingIds = ACHIEVEMENTS.map((item) => item.id).filter(
      (id) => !existing.has(id)
    );
    if (missingIds.length === 0) {
      return;
    }
    const now = Date.now();
    set((state) => ({
      unlockedAchievements: [
        ...state.unlockedAchievements,
        ...createUnlockItems(missingIds, now),
      ],
      toastQueue: [...state.toastQueue, ...buildToasts([], missingIds, now)],
    }));
    emitUnlockEvents([], missingIds, now);
  },

  hydrateCollection: (snapshot) => {
    set({
      unlockedArtifacts: snapshot.unlockedArtifacts.map((item) => ({ ...item })),
      unlockedAchievements: snapshot.unlockedAchievements.map((item) => ({ ...item })),
      sourceViewedUrls: [...snapshot.sourceViewedUrls],
      spoilersHidden: snapshot.spoilersHidden,
      toastQueue: [],
    });
  },

  resetCollection: () => {
    set({
      unlockedArtifacts: [],
      unlockedAchievements: [],
      sourceViewedUrls: [],
      spoilersHidden: false,
      toastQueue: [],
    });
  },
}));

// Subscribe to progress, notebook, and source_viewed events (suppressed while hydrating)
useProgressStore.subscribe((state, prevState) => {
  if (useCollectionStore.getState().hydrating) {
    return;
  }
  if (
    state.facts !== prevState.facts ||
    state.discoveredPages !== prevState.discoveredPages
  ) {
    useCollectionStore.getState().runEvaluation();
  }
});

useNotebookStore.subscribe((state, prevState) => {
  if (useCollectionStore.getState().hydrating) {
    return;
  }
  if (
    state.clues !== prevState.clues ||
    state.insights !== prevState.insights
  ) {
    useCollectionStore.getState().runEvaluation();
  }
});

subscribeCollectionEvent('source_viewed', ({ url }) => {
  if (useCollectionStore.getState().hydrating) {
    return;
  }
  useCollectionStore.getState().recordSourceView(url);
});
