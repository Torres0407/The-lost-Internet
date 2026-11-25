import { create } from 'zustand';
import {
  backBrowserState,
  type BrowserStateSlice,
  createInitialBrowserState,
  DEFAULT_BOOKMARKS,
  forwardBrowserState,
  getCurrentUrl,
  goHomeBrowserState,
  navigateBrowserState,
  reloadBrowserState,
  toggleBookmarkBrowserState,
} from '../browser/browserHistory';
import { GAME_REGISTRY } from '../engine/gameRegistry';
import { resolveWithProgress } from '../engine/resolve';
import { useProgressStore } from './progressStore';

export interface SourceViewTarget {
  browserWindowId: string;
  url: string;
  title: string;
  html: string;
}

interface BrowserStore {
  tabs: Record<string, BrowserStateSlice>;
  bookmarks: string[];
  activeBrowserWindowId: string | null;
  sourceViewTarget: SourceViewTarget | null;
  ensureBrowser: (windowId: string) => void;
  navigate: (windowId: string, url: string) => void;
  back: (windowId: string) => void;
  forward: (windowId: string) => void;
  reload: (windowId: string) => void;
  goHome: (windowId: string) => void;
  toggleBookmark: (windowId: string, url: string) => void;
  hydrateBookmarks: (bookmarks: readonly string[]) => void;
  resetBrowser: () => void;
  setSourceViewTarget: (target: SourceViewTarget) => void;
  setActiveBrowserWindowId: (windowId: string) => void;
}

function getOrCreateTab(
  tabs: Record<string, BrowserStateSlice>,
  windowId: string,
  bookmarks: readonly string[]
): BrowserStateSlice {
  const existing = tabs[windowId];
  if (existing) {
    return existing;
  }
  return {
    ...createInitialBrowserState(),
    bookmarks: [...bookmarks],
  };
}

function applyProgressForUrl(url: string): void {
  const progress = useProgressStore.getState();
  const result = resolveWithProgress(url, GAME_REGISTRY, progress.facts);
  if (result.status === 'ok') {
    if (result.newFacts.length > 0) {
      progress.addFacts(result.newFacts);
    }
    progress.markPageDiscovered(result.page.url);
  }
}

export const useBrowserStore = create<BrowserStore>((set, get) => ({
  tabs: {},
  bookmarks: [...DEFAULT_BOOKMARKS],
  activeBrowserWindowId: null,
  sourceViewTarget: null,

  ensureBrowser: (windowId) => {
    const existing = get().tabs[windowId];
    if (existing) {
      if (get().activeBrowserWindowId !== windowId) {
        set({ activeBrowserWindowId: windowId });
      }
      applyProgressForUrl(getCurrentUrl(existing));
      return;
    }

    const initial: BrowserStateSlice = {
      ...createInitialBrowserState(),
      bookmarks: [...get().bookmarks],
    };
    set((state) => ({
      tabs: {
        ...state.tabs,
        [windowId]: initial,
      },
      activeBrowserWindowId: windowId,
    }));
    applyProgressForUrl(getCurrentUrl(initial));
  },

  navigate: (windowId, url) => {
    const current = getOrCreateTab(get().tabs, windowId, get().bookmarks);
    const next = navigateBrowserState(current, url);
    set((state) => ({
      tabs: { ...state.tabs, [windowId]: next },
      activeBrowserWindowId: windowId,
    }));
    applyProgressForUrl(getCurrentUrl(next));
  },

  back: (windowId) => {
    const current = getOrCreateTab(get().tabs, windowId, get().bookmarks);
    const next = backBrowserState(current);
    if (next === current) {
      return;
    }
    set((state) => ({
      tabs: { ...state.tabs, [windowId]: next },
      activeBrowserWindowId: windowId,
    }));
    applyProgressForUrl(getCurrentUrl(next));
  },

  forward: (windowId) => {
    const current = getOrCreateTab(get().tabs, windowId, get().bookmarks);
    const next = forwardBrowserState(current);
    if (next === current) {
      return;
    }
    set((state) => ({
      tabs: { ...state.tabs, [windowId]: next },
      activeBrowserWindowId: windowId,
    }));
    applyProgressForUrl(getCurrentUrl(next));
  },

  reload: (windowId) => {
    const current = getOrCreateTab(get().tabs, windowId, get().bookmarks);
    const next = reloadBrowserState(current);
    set((state) => ({
      tabs: { ...state.tabs, [windowId]: next },
      activeBrowserWindowId: windowId,
    }));
    applyProgressForUrl(getCurrentUrl(next));
  },

  goHome: (windowId) => {
    const current = getOrCreateTab(get().tabs, windowId, get().bookmarks);
    const next = goHomeBrowserState(current);
    set((state) => ({
      tabs: { ...state.tabs, [windowId]: next },
      activeBrowserWindowId: windowId,
    }));
    applyProgressForUrl(getCurrentUrl(next));
  },

  toggleBookmark: (windowId, url) =>
    set((state) => {
      const current = getOrCreateTab(state.tabs, windowId, state.bookmarks);
      const nextTab = toggleBookmarkBrowserState(current, url);
      const nextBookmarks = [...nextTab.bookmarks];
      const nextTabs: Record<string, BrowserStateSlice> = {};
      for (const [id, tab] of Object.entries(state.tabs)) {
        nextTabs[id] = { ...tab, bookmarks: [...nextBookmarks] };
      }
      nextTabs[windowId] = nextTab;
      return {
        tabs: nextTabs,
        bookmarks: nextBookmarks,
        activeBrowserWindowId: windowId,
      };
    }),

  hydrateBookmarks: (bookmarks) =>
    set((state) => {
      const nextBookmarks = [...bookmarks];
      const nextTabs: Record<string, BrowserStateSlice> = {};
      for (const [id, tab] of Object.entries(state.tabs)) {
        nextTabs[id] = { ...tab, bookmarks: [...nextBookmarks] };
      }
      return {
        bookmarks: nextBookmarks,
        tabs: nextTabs,
      };
    }),

  resetBrowser: () =>
    set({
      tabs: {},
      bookmarks: [...DEFAULT_BOOKMARKS],
      activeBrowserWindowId: null,
      sourceViewTarget: null,
    }),

  setSourceViewTarget: (target) => set({ sourceViewTarget: target }),

  setActiveBrowserWindowId: (windowId) => set({ activeBrowserWindowId: windowId }),
}));
