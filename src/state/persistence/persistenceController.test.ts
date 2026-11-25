import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GAME_REGISTRY } from '../../engine/gameRegistry';
import { resolveWithProgress } from '../../engine/resolve';
import { CURRENT_SAVE_VERSION, serializeState, type SaveData } from '../../engine/save';
import { subscribeCollectionEvent } from '../../events/eventBus';
import { useBrowserStore } from '../browserStore';
import { useCollectionStore } from '../collectionStore';
import { useDesktopStore } from '../desktopStore';
import { useNotebookStore } from '../notebookStore';
import { chooseStorage } from './chooseStorage';
import { createInMemorySaveStorage } from './inMemoryStorage';
import {
  createIndexedDbSaveStorage,
  DB_NAME,
  STORE_NAME,
} from './indexedDbStorage';
import {
  AUTOSAVE_DEBOUNCE_MS,
  AUTOSAVE_MAX_WAIT_MS,
  createPersistenceController,
  DEFAULT_VALIDATION_CONTENT,
  HYDRATION_TIMEOUT_MS,
  useSaveStatusStore,
} from './persistenceController';
import type { SaveStorage } from './types';
import { useProgressStore } from '../progressStore';
import { useWindowsStore } from '../windowsStore';

function resetAllStores(): void {
  useCollectionStore.getState().setHydrating(false);
  useProgressStore.getState().resetProgress();
  useNotebookStore.getState().clearNotebook();
  useCollectionStore.getState().resetCollection();
  useBrowserStore.getState().resetBrowser();
  useDesktopStore.getState().clearSelection();
  for (const id of Object.keys(useWindowsStore.getState().windows)) {
    useWindowsStore.getState().closeWindow(id);
  }
  useSaveStatusStore.setState({
    status: 'idle',
    lastSavedAt: null,
    storageKind: 'memory',
    bootStage: 'loading',
    hasUnsavedChanges: false,
    fallbackWarningVisible: false,
    backupNotice: null,
    timeoutNotice: null,
    multiTabWarningVisible: false,
    errorMessage: null,
  });
}

function createSampleSave(overrides: Partial<SaveData> = {}): SaveData {
  return {
    saveVersion: CURRENT_SAVE_VERSION,
    savedAt: 1700000000000,
    progress: {
      facts: ['visited_ring_hub'],
      discoveredPages: ['meridian://ring-hub/'],
    },
    notebook: {
      clues: [
        {
          id: 'clue-1',
          text: '11/09',
          sourceUrl: 'meridian://delphines-garden/guestbook',
          sourceTitle: "Delphine's Guestbook",
          savedAt: 1700000000000,
          tags: [],
          x: 20,
          y: 20,
        },
      ],
      links: [],
      freeNotes: 'saved notes',
      insights: [],
    },
    collection: {
      unlockedArtifacts: [{ id: 'flower_banner', unlockedAt: 1700000000000 }],
      unlockedAchievements: [{ id: 'first_dialup', unlockedAt: 1700000000000 }],
      sourceViewedUrls: ['meridian://ring-hub/'],
      spoilersHidden: true,
    },
    browser: {
      bookmarks: ['meridian://ring-hub/'],
    },
    ...overrides,
  };
}

/**
 * Minimal hand-written mock of IDBFactory, IDBDatabase, and IDBRequest
 * without adding external dependencies.
 */
function createMockIndexedDbFactory(options: {
  failFirstGetWithClosed?: boolean;
  failPutWithQuota?: boolean;
  failOpen?: boolean;
} = {}) {
  const stores = new Map<string, Map<string, unknown>>();
  let openCount = 0;
  let closedFailUsed = false;

  const makeRequest = <T>(
    run: () => T,
    afterSettled?: () => void
  ): IDBRequest<T> => {
    const req = {
      result: undefined as unknown as T,
      error: null as DOMException | null,
      onsuccess: null as ((ev: Event) => void) | null,
      onerror: null as ((ev: Event) => void) | null,
    };

    queueMicrotask(() => {
      try {
        req.result = run();
        req.onsuccess?.({} as Event);
      } catch (err) {
        req.error = err as DOMException;
        req.onerror?.({} as Event);
      } finally {
        afterSettled?.();
      }
    });

    return req as unknown as IDBRequest<T>;
  };

  const factory = {
    open(name: string) {
      openCount += 1;
      const openReq = {
        result: null as unknown as IDBDatabase,
        error: null as DOMException | null,
        onupgradeneeded: null as ((ev: IDBVersionChangeEvent) => void) | null,
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null,
        onblocked: null as ((ev: Event) => void) | null,
      };

      queueMicrotask(() => {
        if (options.failOpen) {
          openReq.error = Object.assign(new Error('IndexedDB blocked'), {
            name: 'SecurityError',
          }) as unknown as DOMException;
          openReq.onerror?.({} as Event);
          return;
        }

        const existed = stores.has(name);
        if (!existed) {
          stores.set(name, new Map<string, unknown>());
        }

        const dbStoreNames = {
          contains: (storeName: string) =>
            existed ? storeName === STORE_NAME : stores.get(`${name}:${storeName}`) !== undefined,
        };

        const db = {
          objectStoreNames: dbStoreNames,
          onversionchange: null as (() => void) | null,
          onclose: null as (() => void) | null,
          close: vi.fn(),
          createObjectStore(storeName: string) {
            if (!stores.has(`${name}:${storeName}`)) {
              stores.set(`${name}:${storeName}`, new Map<string, unknown>());
            }
            return {} as IDBObjectStore;
          },
          transaction(storeName: string) {
            const backing = stores.get(`${name}:${storeName}`);
            if (!backing) {
              throw new Error(`Missing object store ${storeName}`);
            }
            if (options.failFirstGetWithClosed && !closedFailUsed) {
              closedFailUsed = true;
              const err = new Error('The database connection is closing.');
              err.name = 'InvalidStateError';
              throw err;
            }

            let pending = 0;
            let txFinished = false;
            const tx = {
              error: null as DOMException | null,
              oncomplete: null as (() => void) | null,
              onerror: null as ((ev: Event) => void) | null,
              onabort: null as ((ev: Event) => void) | null,
              objectStore() {
                const scheduleComplete = () => {
                  queueMicrotask(() => {
                    if (pending === 0 && !txFinished) {
                      txFinished = true;
                      tx.oncomplete?.();
                    }
                  });
                };

                const wrapReq = <T>(run: () => T): IDBRequest<T> => {
                  pending += 1;
                  return makeRequest(run, () => {
                    pending -= 1;
                    scheduleComplete();
                  });
                };

                return {
                  get(key: string) {
                    return wrapReq(() => backing.get(key));
                  },
                  put(val: unknown, key: string) {
                    return wrapReq(() => {
                      if (options.failPutWithQuota) {
                        const err = new Error('Quota exceeded');
                        err.name = 'QuotaExceededError';
                        throw err;
                      }
                      backing.set(key, JSON.parse(JSON.stringify(val)));
                      return key;
                    });
                  },
                  delete(key: string) {
                    return wrapReq(() => {
                      backing.delete(key);
                      return undefined;
                    });
                  },
                };
              },
            };
            return tx as unknown as IDBTransaction;
          },
        } as unknown as IDBDatabase;

        openReq.result = db;
        if (!existed) {
          openReq.onupgradeneeded?.({} as IDBVersionChangeEvent);
        }
        openReq.onsuccess?.({} as Event);
      });

      return openReq as unknown as IDBOpenDBRequest;
    },
  } as unknown as IDBFactory;

  return {
    factory,
    getOpenCount: () => openCount,
    getBackingStore: () => stores.get(`${DB_NAME}:${STORE_NAME}`),
  };
}

describe('IndexedDB adapter & chooseStorage', () => {
  it('creates object store on upgrade, writes rolling backups, and clears both slots', async () => {
    const mock = createMockIndexedDbFactory();
    const storage = createIndexedDbSaveStorage({ indexedDB: mock.factory });

    const save1 = createSampleSave({ savedAt: 100 });
    const save2 = createSampleSave({ savedAt: 200 });

    await storage.save(save1);
    await storage.save(save2);

    expect(await storage.load()).toEqual(save2);
    expect(await storage.loadBackup?.()).toEqual(save1);

    await storage.clear();
    expect(await storage.load()).toBeNull();
    expect(await storage.loadBackup?.()).toBeNull();
  });

  it('reopens once automatically when encountering a closed-connection error', async () => {
    const mock = createMockIndexedDbFactory({ failFirstGetWithClosed: true });
    const storage = createIndexedDbSaveStorage({ indexedDB: mock.factory });

    const data = await storage.load();
    expect(data).toBeNull();
    expect(mock.getOpenCount()).toBe(2);
  });

  it('surfaces QuotaExceededError cleanly and falls back to in-memory when IDB fails to open', async () => {
    const quotaMock = createMockIndexedDbFactory({ failPutWithQuota: true });
    const quotaStorage = createIndexedDbSaveStorage({ indexedDB: quotaMock.factory });
    await expect(quotaStorage.save(createSampleSave())).rejects.toMatchObject({
      name: 'QuotaExceededError',
    });

    const brokenMock = createMockIndexedDbFactory({ failOpen: true });
    const chosen = await chooseStorage({ indexedDB: brokenMock.factory });
    expect(chosen.fallback).toBe(true);
    expect(chosen.storage.kind).toBe('memory');
  });
});

describe('persistenceController: hydration, autosave, import, start over, and regressions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetAllStores();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('hydrates stores without firing unlock toasts or collection events', async () => {
    const storage = createInMemorySaveStorage();
    await storage.save(createSampleSave());

    const events: string[] = [];
    const unsubA = subscribeCollectionEvent('artifact_unlocked', (p) => events.push(p.id));
    const unsubC = subscribeCollectionEvent('achievement_unlocked', (p) => events.push(p.id));

    const controller = createPersistenceController({
      storage,
      channelName: null,
    });
    await controller.start();

    expect(useProgressStore.getState().facts.has('visited_ring_hub')).toBe(true);
    expect(useNotebookStore.getState().freeNotes).toBe('saved notes');
    expect(useCollectionStore.getState().unlockedArtifacts.map((a) => a.id)).toEqual([
      'flower_banner',
    ]);
    expect(useCollectionStore.getState().toastQueue).toEqual([]);
    expect(events).toEqual([]);
    expect(useBrowserStore.getState().bookmarks).toEqual(['meridian://ring-hub/']);

    controller.dispose();
    unsubA();
    unsubC();
  });

  it('loads rolling backup when main slot fails validation and alerts the player', async () => {
    const storage = createInMemorySaveStorage();
    const olderValid = createSampleSave({ savedAt: 1111 });
    await storage.save(olderValid);
    await storage.save(createSampleSave({ savedAt: 2222 }));
    await storage.writeRawSlot?.({ corrupted: true, saveVersion: 1 });

    const controller = createPersistenceController({
      storage,
      channelName: null,
    });
    await controller.start();

    expect(useSaveStatusStore.getState().backupNotice).toBe(
      'Your latest save could not be read, so an earlier backup was loaded.'
    );
    expect(useProgressStore.getState().facts.has('visited_ring_hub')).toBe(true);
    expect(useSaveStatusStore.getState().lastSavedAt).toBe(1111);

    controller.dispose();
  });

  it('times out hydration after 3 seconds and boots with an empty session notice', async () => {
    const hangingStorage: SaveStorage = {
      kind: 'memory',
      load: () => new Promise<SaveData | null>(() => {}),
      save: async () => {},
      clear: async () => {},
    };

    const controller = createPersistenceController({
      storage: hangingStorage,
      channelName: null,
      hydrationTimeoutMs: HYDRATION_TIMEOUT_MS,
    });

    const startPromise = controller.start();
    await vi.advanceTimersByTimeAsync(HYDRATION_TIMEOUT_MS + 10);
    await startPromise;

    expect(useSaveStatusStore.getState().bootStage).toBe('ready');
    expect(useSaveStatusStore.getState().timeoutNotice).toMatch(/timed out/i);

    controller.dispose();
  });

  it('debounces saves at 1500 ms and enforces 10 s maxWait under continuous changes', async () => {
    const storage = createInMemorySaveStorage();
    const saveSpy = vi.spyOn(storage, 'save');

    const controller = createPersistenceController({
      storage,
      channelName: null,
    });
    await controller.start();

    // Debounce 1500 ms
    useNotebookStore.getState().updateFreeNotes('draft 1');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS - 100);
    expect(saveSpy).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(150);
    expect(saveSpy).toHaveBeenCalledTimes(1);

    // Continuous edits every 1000 ms should trigger maxWait at 10000 ms
    saveSpy.mockClear();
    for (let i = 0; i < 11; i += 1) {
      useNotebookStore.getState().updateFreeNotes(`typing ${i}`);
      await vi.advanceTimersByTimeAsync(1000);
    }
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect((await storage.load())?.notebook.freeNotes).toBe('typing 9');

    // Finish remaining debounce for typing 10
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);
    expect(saveSpy).toHaveBeenCalledTimes(2);
    expect((await storage.load())?.notebook.freeNotes).toBe('typing 10');

    controller.dispose();
  });

  it('skips saving when serialized payload is identical to last saved data', async () => {
    const storage = createInMemorySaveStorage();
    const saveSpy = vi.spyOn(storage, 'save');

    const controller = createPersistenceController({
      storage,
      channelName: null,
    });
    await controller.start();

    useNotebookStore.getState().updateFreeNotes('same text');
    await controller.flush();
    expect(saveSpy).toHaveBeenCalledTimes(1);

    // Mutate and revert before flush -> identical to lastSaved
    useNotebookStore.getState().updateFreeNotes('temporary');
    useNotebookStore.getState().updateFreeNotes('same text');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MAX_WAIT_MS);
    await controller.flush();
    expect(saveSpy).toHaveBeenCalledTimes(1);

    controller.dispose();
  });

  it('serializes writes so two writes never overlap and latest state wins', async () => {
    let activeWrites = 0;
    let maxConcurrentWrites = 0;
    let releaseFirstWrite: (() => void) | null = null;
    const savedNotes: string[] = [];

    const slowStorage: SaveStorage = {
      kind: 'memory',
      load: async () => null,
      clear: async () => {},
      save: async (data) => {
        activeWrites += 1;
        maxConcurrentWrites = Math.max(maxConcurrentWrites, activeWrites);
        if (savedNotes.length === 0) {
          await new Promise<void>((resolve) => {
            releaseFirstWrite = resolve;
          });
        }
        savedNotes.push(data.notebook.freeNotes);
        activeWrites -= 1;
      },
    };

    const controller = createPersistenceController({
      storage: slowStorage,
      channelName: null,
    });
    await controller.start();

    useNotebookStore.getState().updateFreeNotes('first');
    const firstWritePromise = controller.flush();
    await Promise.resolve();

    useNotebookStore.getState().updateFreeNotes('second');
    const secondWritePromise = controller.flush();
    useNotebookStore.getState().updateFreeNotes('third');

    releaseFirstWrite!();
    await Promise.all([firstWritePromise, secondWritePromise]);

    expect(maxConcurrentWrites).toBe(1);
    expect(savedNotes[0]).toBe('first');
    expect(savedNotes[savedNotes.length - 1]).toBe('third');

    controller.dispose();
  });

  it('flushes immediately on document visibilitychange to hidden', async () => {
    const fakeDocument = Object.assign(new EventTarget(), {
      visibilityState: 'visible',
    });
    vi.stubGlobal('document', fakeDocument);

    try {
      const storage = createInMemorySaveStorage();
      const saveSpy = vi.spyOn(storage, 'save');

      const controller = createPersistenceController({
        storage,
        channelName: null,
      });
      await controller.start();

      useNotebookStore.getState().updateFreeNotes('urgent tab hide');
      fakeDocument.visibilityState = 'hidden';
      fakeDocument.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();
      await Promise.resolve();

      expect(saveSpy).toHaveBeenCalledTimes(1);
      expect((await storage.load())?.notebook.freeNotes).toBe('urgent tab hide');

      controller.dispose();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('sets error status on failed write and retries on the next store change', async () => {
    let shouldFail = true;
    const inner = createInMemorySaveStorage();
    const flakyStorage: SaveStorage = {
      kind: 'memory',
      load: () => inner.load(),
      clear: () => inner.clear(),
      save: async (data) => {
        if (shouldFail) {
          throw new Error('Disk full');
        }
        await inner.save(data);
      },
    };

    const controller = createPersistenceController({
      storage: flakyStorage,
      channelName: null,
    });
    await controller.start();

    useNotebookStore.getState().updateFreeNotes('first attempt');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);
    expect(useSaveStatusStore.getState().status).toBe('error');
    expect(useSaveStatusStore.getState().errorMessage).toContain('Disk full');

    shouldFail = false;
    useNotebookStore.getState().updateFreeNotes('retry attempt');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);

    expect(useSaveStatusStore.getState().status).toBe('saved');
    expect((await inner.load())?.notebook.freeNotes).toBe('retry attempt');

    controller.dispose();
  });

  it('replaces progress on confirmed import and preserves startOver reset behavior', async () => {
    const storage = createInMemorySaveStorage();
    const controller = createPersistenceController({
      storage,
      channelName: null,
    });
    await controller.start();

    const imported = createSampleSave({
      savedAt: 5555,
      notebook: {
        clues: [],
        links: [],
        freeNotes: 'imported note',
        insights: [],
      },
    });
    await controller.replaceWithSave(imported);

    expect(useNotebookStore.getState().freeNotes).toBe('imported note');
    expect((await storage.load())?.notebook.freeNotes).toBe('imported note');

    // Open a window before Start Over
    useWindowsStore.getState().openWindow('settings');
    await controller.startOver();

    expect(await storage.load()).toBeNull();
    expect(await storage.loadBackup?.()).toBeNull();
    expect(useProgressStore.getState().facts.size).toBe(0);
    expect(useNotebookStore.getState().clues).toEqual([]);
    expect(useCollectionStore.getState().unlockedArtifacts).toEqual([]);
    expect(useWindowsStore.getState().windows).toEqual({});
    expect(useSaveStatusStore.getState().bootStage).toBe('boot-prompt');

    controller.dispose();
  });

  it('continues 11/09 and NightCrawler chains cleanly after a mid-chain save and restore', async () => {
    const storage = createInMemorySaveStorage();
    const controllerA = createPersistenceController({
      storage,
      channelName: null,
    });
    await controllerA.start();

    // Mid-chain progress: solve 11/09 connection and visit NightCrawler home
    useProgressStore.getState().addFacts(['date_1109', 'maintenance_window_known']);
    const { clue: clueA } = useNotebookStore.getState().addClue({
      text: '11/09',
      sourceUrl: 'meridian://delphines-garden/guestbook',
      sourceTitle: 'Guestbook',
    });
    const { clue: clueB } = useNotebookStore.getState().addClue({
      text: 'maintenance window',
      sourceUrl: 'meridian://tumbleweed/support',
      sourceTitle: 'Support',
    });
    useNotebookStore.getState().addLink(clueA.id, clueB.id);

    const logRes = resolveWithProgress(
      'meridian://lamplighter/log_0911',
      GAME_REGISTRY,
      useProgressStore.getState().facts
    );
    expect(logRes.status).toBe('ok');
    if (logRes.status === 'ok') {
      useProgressStore.getState().addFacts(logRes.newFacts);
      useProgressStore.getState().markPageDiscovered(logRes.page.url);
    }

    await controllerA.flush();
    controllerA.dispose();

    // Reset runtime stores cleanly and restore from saved storage
    resetAllStores();

    const controllerB = createPersistenceController({
      storage,
      channelName: null,
    });
    await controllerB.start();

    expect(useProgressStore.getState().facts.has('lamplighter_log_1')).toBe(true);
    expect(
      useCollectionStore.getState().unlockedArtifacts.map((a) => a.id)
    ).toContain('porch_light');

    // Continue the NightCrawler chain from the restored session
    const projectsRes = resolveWithProgress(
      'meridian://nightcrawler/projects',
      GAME_REGISTRY,
      useProgressStore.getState().facts
    );
    expect(projectsRes.status).toBe('ok');
    if (projectsRes.status === 'ok') {
      useProgressStore.getState().addFacts(projectsRes.newFacts);
    }

    const readmeRes = resolveWithProgress(
      'meridian://nightcrawler/files/readme_if_found.txt',
      GAME_REGISTRY,
      useProgressStore.getState().facts
    );
    expect(readmeRes.status).toBe('ok');
    if (readmeRes.status === 'ok') {
      useProgressStore.getState().addFacts(readmeRes.newFacts);
    }

    const { clue: clueC } = useNotebookStore.getState().addClue({
      text: 'bulk account removal',
      sourceUrl: 'meridian://tumbleweed/tickets/4418',
      sourceTitle: 'Ticket 4418',
    });
    const { clue: clueD } = useNotebookStore.getState().addClue({
      text: 'thanks for everything',
      sourceUrl: 'meridian://backroom/thread/goodbye',
      sourceTitle: 'Goodbye',
    });
    useNotebookStore.getState().addLink(clueC.id, clueD.id);

    const porchRes = resolveWithProgress(
      'meridian://nightcrawler/porchlight',
      GAME_REGISTRY,
      useProgressStore.getState().facts
    );
    expect(porchRes.status).toBe('ok');
    if (porchRes.status === 'ok') {
      useProgressStore.getState().addFacts(porchRes.newFacts);
      useProgressStore.getState().markPageDiscovered(porchRes.page.url);
    }

    expect(
      useCollectionStore.getState().unlockedArtifacts.map((a) => a.id)
    ).toEqual(expect.arrayContaining(['porch_light', 'readme_file', 'fragment_1']));
    expect(
      useCollectionStore.getState().unlockedAchievements.map((a) => a.id)
    ).toEqual(expect.arrayContaining(['behind_curtain', 'nobody_did_this', 'keep_light_on']));

    const exported = serializeState(
      {
        progress: useProgressStore.getState(),
        notebook: useNotebookStore.getState(),
        collection: useCollectionStore.getState(),
        browser: useBrowserStore.getState(),
      },
      Date.now()
    );
    expect(DEFAULT_VALIDATION_CONTENT.achievements).toHaveLength(8);
    expect(exported.collection.unlockedArtifacts.length).toBeGreaterThanOrEqual(3);

    controllerB.dispose();
  });
});
