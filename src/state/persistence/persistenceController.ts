import { create } from 'zustand';
import { ACHIEVEMENTS, ARTIFACTS } from '../../content/collection';
import { GAME_REGISTRY } from '../../engine/gameRegistry';
import {
  deserializeState,
  getCanonicalSaveKey,
  serializeState,
  validateSave,
  type SaveData,
  type SaveValidationContent,
  type StoreSnapshots,
} from '../../engine/save';
import { useBrowserStore } from '../browserStore';
import { toPersistedCollection, useCollectionStore } from '../collectionStore';
import { useDesktopStore } from '../desktopStore';
import { toPersistedNotebook, useNotebookStore } from '../notebookStore';
import { useProgressStore } from '../progressStore';
import { useWindowsStore } from '../windowsStore';
import { chooseStorage } from './chooseStorage';
import { createInMemorySaveStorage } from './inMemoryStorage';
import {
  readLastSavedAtFlag,
  readStorageWarningDismissedFlag,
  writeLastSavedAtFlag,
  writeStorageWarningDismissedFlag,
} from './localFlags';
import type { SaveStorage, StorageKind } from './types';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export type BootStage = 'loading' | 'ready' | 'boot-prompt';

export const AUTOSAVE_DEBOUNCE_MS = 1500;
export const AUTOSAVE_MAX_WAIT_MS = 10_000;
export const HYDRATION_TIMEOUT_MS = 3000;
export const SAVE_BROADCAST_CHANNEL = 'the-lost-internet-save';

export interface SaveStatusState {
  status: SaveStatus;
  lastSavedAt: number | null;
  storageKind: StorageKind;
  bootStage: BootStage;
  hasUnsavedChanges: boolean;
  fallbackWarningVisible: boolean;
  backupNotice: string | null;
  timeoutNotice: string | null;
  multiTabWarningVisible: boolean;
  errorMessage: string | null;
  setBootStage: (stage: BootStage) => void;
  dismissFallbackWarning: () => void;
  dismissBackupNotice: () => void;
  dismissTimeoutNotice: () => void;
  dismissMultiTabWarning: () => void;
  dismissError: () => void;
}

export const useSaveStatusStore = create<SaveStatusState>((set) => ({
  status: 'idle',
  lastSavedAt: readLastSavedAtFlag(),
  storageKind: 'indexeddb',
  bootStage: 'loading',
  hasUnsavedChanges: false,
  fallbackWarningVisible: false,
  backupNotice: null,
  timeoutNotice: null,
  multiTabWarningVisible: false,
  errorMessage: null,

  setBootStage: (bootStage) => set({ bootStage }),

  dismissFallbackWarning: () => {
    writeStorageWarningDismissedFlag(true);
    set({ fallbackWarningVisible: false });
  },

  dismissBackupNotice: () => set({ backupNotice: null }),

  dismissTimeoutNotice: () => set({ timeoutNotice: null }),

  dismissMultiTabWarning: () => set({ multiTabWarningVisible: false }),

  dismissError: () => set({ errorMessage: null }),
}));

export const DEFAULT_VALIDATION_CONTENT: SaveValidationContent = {
  registry: GAME_REGISTRY,
  artifacts: ARTIFACTS,
  achievements: ACHIEVEMENTS,
};

export function collectStoreSnapshots(): StoreSnapshots {
  const progress = useProgressStore.getState();
  const notebook = toPersistedNotebook(useNotebookStore.getState());
  const collection = toPersistedCollection(useCollectionStore.getState());
  const browser = useBrowserStore.getState();

  return {
    progress: {
      facts: new Set(progress.facts),
      discoveredPages: [...progress.discoveredPages],
    },
    notebook,
    collection,
    browser: {
      bookmarks: [...browser.bookmarks],
    },
  };
}

export function buildCurrentSaveData(savedAt: number = Date.now()): SaveData {
  return serializeState(collectStoreSnapshots(), savedAt);
}

function areArraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

export interface PersistenceControllerOptions {
  storage?: SaveStorage;
  validationContent?: SaveValidationContent;
  debounceMs?: number;
  maxWaitMs?: number;
  hydrationTimeoutMs?: number;
  channelName?: string | null;
}

interface TabBroadcastMessage {
  type: 'save_written';
  tabId: string;
  savedAt: number;
}

export interface PersistenceController {
  start: () => Promise<void>;
  dispose: () => void;
  flush: () => Promise<boolean>;
  saveNow: () => Promise<boolean>;
  replaceWithSave: (save: SaveData) => Promise<boolean>;
  startOver: () => Promise<void>;
  enterDesktop: () => void;
  corruptMainSave: () => Promise<void>;
  simulateIndexedDbFailure: () => void;
  getStorage: () => SaveStorage;
  setStorageForTest: (storage: SaveStorage) => void;
}

export function createPersistenceController(
  options: PersistenceControllerOptions = {}
): PersistenceController {
  const validationContent = options.validationContent ?? DEFAULT_VALIDATION_CONTENT;
  const debounceMs = options.debounceMs ?? AUTOSAVE_DEBOUNCE_MS;
  const maxWaitMs = options.maxWaitMs ?? AUTOSAVE_MAX_WAIT_MS;
  const hydrationTimeoutMs = options.hydrationTimeoutMs ?? HYDRATION_TIMEOUT_MS;
  const channelName =
    options.channelName === undefined ? SAVE_BROADCAST_CHANNEL : options.channelName;

  const tabId = `tab-${Math.random().toString(36).slice(2)}-${Date.now()}`;

  let activeStorage: SaveStorage =
    options.storage ?? createInMemorySaveStorage({ slotId: 'slot-1' });
  let started = false;
  let disposed = false;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let maxWaitTimer: ReturnType<typeof setTimeout> | null = null;
  let isWriting = false;
  let pendingWriteRequested = false;
  let inFlightSave: Promise<boolean> | null = null;

  let lastSavedKey: string = getCanonicalSaveKey(buildCurrentSaveData(0));
  let lastWriteFailed = false;

  let broadcastChannel: BroadcastChannel | null = null;
  const unsubscribers: Array<() => void> = [];

  const clearTimers = () => {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (maxWaitTimer !== null) {
      clearTimeout(maxWaitTimer);
      maxWaitTimer = null;
    }
  };

  const applySaveBatch = (save: SaveData) => {
    const snapshots = deserializeState(save);
    useCollectionStore.getState().setHydrating(true);
    try {
      useProgressStore.getState().hydrateProgress(snapshots.progress);
      useNotebookStore.getState().hydrateNotebook(snapshots.notebook);
      useCollectionStore.getState().hydrateCollection(snapshots.collection);
      useBrowserStore.getState().hydrateBookmarks(snapshots.browser.bookmarks);
    } finally {
      useCollectionStore.getState().setHydrating(false);
    }
  };

  const postSaveWritten = (savedAt: number) => {
    if (!broadcastChannel) {
      return;
    }
    try {
      const msg: TabBroadcastMessage = {
        type: 'save_written',
        tabId,
        savedAt,
      };
      broadcastChannel.postMessage(msg);
    } catch {
      // Ignore BroadcastChannel errors
    }
  };

  const executeWrite = async (): Promise<boolean> => {
    clearTimers();

    if (useCollectionStore.getState().hydrating) {
      return false;
    }

    const initialPayload = buildCurrentSaveData(Date.now());
    const initialKey = getCanonicalSaveKey(initialPayload);
    if (initialKey === lastSavedKey && !lastWriteFailed) {
      useSaveStatusStore.setState((prev) => ({
        hasUnsavedChanges: false,
        status: prev.lastSavedAt !== null ? 'saved' : 'idle',
      }));
      return true;
    }

    if (isWriting && inFlightSave) {
      pendingWriteRequested = true;
      return inFlightSave;
    }

    isWriting = true;
    inFlightSave = (async () => {
      let overallSuccess = true;

      try {
        // Loop so queued/continuous edits collapse into a final latest write
        while (true) {
          pendingWriteRequested = false;
          const payload = buildCurrentSaveData(Date.now());
          const canonicalKey = getCanonicalSaveKey(payload);

          useSaveStatusStore.setState({
            status: 'saving',
            errorMessage: null,
          });

          try {
            await activeStorage.save(payload);
            lastSavedKey = canonicalKey;
            lastWriteFailed = false;
            writeLastSavedAtFlag(payload.savedAt);
            postSaveWritten(payload.savedAt);

            const latestKey = getCanonicalSaveKey(buildCurrentSaveData(0));
            if (pendingWriteRequested || latestKey !== lastSavedKey) {
              continue;
            }

            useSaveStatusStore.setState({
              status: 'saved',
              lastSavedAt: payload.savedAt,
              hasUnsavedChanges: false,
              errorMessage: null,
            });
            overallSuccess = true;
            break;
          } catch (error) {
            lastWriteFailed = true;
            pendingWriteRequested = false;
            const message =
              error instanceof Error
                ? error.message
                : 'Unable to write save data to browser storage.';
            useSaveStatusStore.setState({
              status: 'error',
              hasUnsavedChanges: true,
              errorMessage: message,
            });
            overallSuccess = false;
            break;
          }
        }
      } finally {
        isWriting = false;
        inFlightSave = null;
      }

      return overallSuccess;
    })();

    return inFlightSave;
  };

  const scheduleAutosave = () => {
    if (disposed || useCollectionStore.getState().hydrating) {
      return;
    }

    const currentKey = getCanonicalSaveKey(buildCurrentSaveData(0));
    if (currentKey === lastSavedKey && !lastWriteFailed) {
      clearTimers();
      useSaveStatusStore.setState((prev) => ({
        hasUnsavedChanges: false,
        status: prev.lastSavedAt !== null ? 'saved' : 'idle',
      }));
      return;
    }

    useSaveStatusStore.setState({
      hasUnsavedChanges: true,
    });

    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      void executeWrite();
    }, debounceMs);

    if (maxWaitTimer === null) {
      maxWaitTimer = setTimeout(() => {
        void executeWrite();
      }, maxWaitMs);
    }
  };

  const attachStoreSubscriptions = () => {
    if (unsubscribers.length > 0) {
      return;
    }

    unsubscribers.push(
      useProgressStore.subscribe((state, prevState) => {
        if (
          state.facts !== prevState.facts ||
          state.discoveredPages !== prevState.discoveredPages
        ) {
          scheduleAutosave();
        }
      })
    );

    unsubscribers.push(
      useNotebookStore.subscribe((state, prevState) => {
        if (
          state.clues !== prevState.clues ||
          state.links !== prevState.links ||
          state.freeNotes !== prevState.freeNotes ||
          state.insights !== prevState.insights
        ) {
          scheduleAutosave();
        }
      })
    );

    unsubscribers.push(
      useCollectionStore.subscribe((state, prevState) => {
        if (
          state.unlockedArtifacts !== prevState.unlockedArtifacts ||
          state.unlockedAchievements !== prevState.unlockedAchievements ||
          state.sourceViewedUrls !== prevState.sourceViewedUrls ||
          state.spoilersHidden !== prevState.spoilersHidden
        ) {
          scheduleAutosave();
        }
      })
    );

    unsubscribers.push(
      useBrowserStore.subscribe((state, prevState) => {
        if (!areArraysEqual(state.bookmarks, prevState.bookmarks)) {
          scheduleAutosave();
        }
      })
    );

    if (typeof document !== 'undefined') {
      const onVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          void executeWrite();
        }
      };
      document.addEventListener('visibilitychange', onVisibilityChange);
      unsubscribers.push(() =>
        document.removeEventListener('visibilitychange', onVisibilityChange)
      );
    }

    if (typeof window !== 'undefined') {
      const onPageHide = () => {
        void executeWrite();
      };
      window.addEventListener('pagehide', onPageHide);
      unsubscribers.push(() => window.removeEventListener('pagehide', onPageHide));
    }

    if (channelName && typeof BroadcastChannel !== 'undefined') {
      try {
        broadcastChannel = new BroadcastChannel(channelName);
        const onMessage = (event: MessageEvent<unknown>) => {
          const data = event.data as Partial<TabBroadcastMessage> | null;
          if (!data || data.type !== 'save_written' || data.tabId === tabId) {
            return;
          }
          const currentKey = getCanonicalSaveKey(buildCurrentSaveData(0));
          const statusState = useSaveStatusStore.getState();
          const dirty =
            statusState.hasUnsavedChanges ||
            debounceTimer !== null ||
            currentKey !== lastSavedKey;
          if (dirty) {
            useSaveStatusStore.setState({ multiTabWarningVisible: true });
          }
        };
        broadcastChannel.addEventListener('message', onMessage);
        unsubscribers.push(() => {
          broadcastChannel?.removeEventListener('message', onMessage);
          broadcastChannel?.close();
          broadcastChannel = null;
        });
      } catch {
        broadcastChannel = null;
      }
    }
  };

  const loadFromStorageWithBackup = async (storage: SaveStorage) => {
    const rawMain = await storage.load();
    if (rawMain !== null) {
      const mainResult = validateSave(rawMain, validationContent);
      if (mainResult.ok) {
        return {
          save: mainResult.data,
          backupNotice: null as string | null,
        };
      }

      if (storage.loadBackup) {
        try {
          const rawBackup = await storage.loadBackup();
          if (rawBackup !== null) {
            const backupResult = validateSave(rawBackup, validationContent);
            if (backupResult.ok) {
              return {
                save: backupResult.data,
                backupNotice:
                  'Your latest save could not be read, so an earlier backup was loaded.',
              };
            }
          }
        } catch {
          // Ignore backup read errors and fall through
        }
      }

      return {
        save: null,
        backupNotice:
          'Your latest save could not be read and no valid backup was available.',
      };
    }

    return {
      save: null,
      backupNotice: null as string | null,
    };
  };

  return {
    start: async () => {
      if (started) {
        return;
      }
      started = true;
      disposed = false;

      useSaveStatusStore.setState({
        bootStage: 'loading',
        backupNotice: null,
        timeoutNotice: null,
        errorMessage: null,
      });

      let timedOut = false;
      let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

      const loadSequence = async () => {
        if (!options.storage) {
          const chosen = await chooseStorage();
          activeStorage = chosen.storage;
          const dismissed = readStorageWarningDismissedFlag();
          useSaveStatusStore.setState({
            storageKind: activeStorage.kind,
            fallbackWarningVisible: chosen.fallback && !dismissed,
          });
        } else {
          activeStorage = options.storage;
          useSaveStatusStore.setState({
            storageKind: activeStorage.kind,
          });
        }

        const loaded = await loadFromStorageWithBackup(activeStorage);
        if (timedOut || disposed) {
          return;
        }

        if (loaded.save) {
          applySaveBatch(loaded.save);
          lastSavedKey = getCanonicalSaveKey(buildCurrentSaveData(0));
          lastWriteFailed = false;
          useSaveStatusStore.setState({
            status: 'saved',
            lastSavedAt: loaded.save.savedAt,
            hasUnsavedChanges: false,
            backupNotice: loaded.backupNotice,
          });
        } else {
          lastSavedKey = getCanonicalSaveKey(buildCurrentSaveData(0));
          lastWriteFailed = false;
          useSaveStatusStore.setState({
            status: 'idle',
            hasUnsavedChanges: false,
            backupNotice: loaded.backupNotice,
          });
        }

        // One silent evaluation after hydrating to catch newly added content milestones
        const evalResult = useCollectionStore.getState().runEvaluation({ silent: true });
        if (
          evalResult.newArtifacts.length > 0 ||
          evalResult.newAchievements.length > 0
        ) {
          scheduleAutosave();
        }
      };

      const timeoutPromise = new Promise<'timeout'>((resolve) => {
        timeoutHandle = setTimeout(() => {
          timedOut = true;
          resolve('timeout');
        }, hydrationTimeoutMs);
      });

      try {
        const outcome = await Promise.race([
          loadSequence().then(() => 'loaded' as const),
          timeoutPromise,
        ]);

        if (outcome === 'timeout' && !disposed) {
          lastSavedKey = getCanonicalSaveKey(buildCurrentSaveData(0));
          useSaveStatusStore.setState({
            status: 'idle',
            hasUnsavedChanges: false,
            timeoutNotice:
              'Loading saved progress timed out after 3 seconds. Started with an empty session.',
          });
        }
      } catch (error) {
        if (!disposed) {
          useSaveStatusStore.setState({
            status: 'error',
            errorMessage:
              error instanceof Error
                ? error.message
                : 'Failed to initialize browser storage.',
          });
        }
      } finally {
        if (timeoutHandle !== null) {
          clearTimeout(timeoutHandle);
        }
      }

      if (!disposed) {
        attachStoreSubscriptions();
        useSaveStatusStore.setState({ bootStage: 'ready' });
      }
    },

    dispose: () => {
      disposed = true;
      started = false;
      clearTimers();
      while (unsubscribers.length > 0) {
        const unsub = unsubscribers.pop();
        unsub?.();
      }
    },

    flush: () => executeWrite(),

    saveNow: () => executeWrite(),

    replaceWithSave: async (save) => {
      clearTimers();
      applySaveBatch(save);
      lastWriteFailed = false;
      // Ensure write runs so imported state persists immediately
      lastSavedKey = '';
      useSaveStatusStore.setState({
        hasUnsavedChanges: true,
        backupNotice: null,
        errorMessage: null,
      });

      const ok = await executeWrite();
      const evalResult = useCollectionStore.getState().runEvaluation({ silent: true });
      if (
        evalResult.newArtifacts.length > 0 ||
        evalResult.newAchievements.length > 0
      ) {
        return executeWrite();
      }
      return ok;
    },

    startOver: async () => {
      clearTimers();
      if (inFlightSave) {
        try {
          await inFlightSave;
        } catch {
          // ignore pending write error before clearing
        }
      }

      await activeStorage.clear();
      writeLastSavedAtFlag(null);

      useCollectionStore.getState().setHydrating(true);
      try {
        // Close all open OS windows before resetting stores
        const openIds = Object.keys(useWindowsStore.getState().windows);
        for (const id of openIds) {
          useWindowsStore.getState().closeWindow(id);
        }
        useDesktopStore.getState().clearSelection();
        useProgressStore.getState().resetProgress();
        useNotebookStore.getState().clearNotebook();
        useCollectionStore.getState().resetCollection();
        useBrowserStore.getState().resetBrowser();
      } finally {
        useCollectionStore.getState().setHydrating(false);
      }

      lastSavedKey = getCanonicalSaveKey(buildCurrentSaveData(0));
      lastWriteFailed = false;

      useSaveStatusStore.setState({
        status: 'idle',
        lastSavedAt: null,
        hasUnsavedChanges: false,
        backupNotice: null,
        timeoutNotice: null,
        multiTabWarningVisible: false,
        errorMessage: null,
        bootStage: 'boot-prompt',
      });
    },

    enterDesktop: () => {
      useSaveStatusStore.setState({ bootStage: 'ready' });
    },

    corruptMainSave: async () => {
      if (activeStorage.writeRawSlot) {
        await activeStorage.writeRawSlot({
          corrupted: true,
          saveVersion: 'invalid-version',
        });
      }
    },

    simulateIndexedDbFailure: () => {
      activeStorage = createInMemorySaveStorage({ slotId: 'slot-1' });
      writeStorageWarningDismissedFlag(false);
      useSaveStatusStore.setState({
        storageKind: 'memory',
        fallbackWarningVisible: true,
      });
    },

    getStorage: () => activeStorage,

    setStorageForTest: (storage) => {
      activeStorage = storage;
      useSaveStatusStore.setState({ storageKind: storage.kind });
    },
  };
}

export const persistenceController = createPersistenceController();
