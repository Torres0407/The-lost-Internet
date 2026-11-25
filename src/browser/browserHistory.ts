import { coerceAddressInput, HOME_URL } from '../engine/pages';

export interface BrowserStateSlice {
  history: string[];
  index: number;
  bookmarks: string[];
  visited: string[];
  reloadToken: number;
}

export const DEFAULT_BOOKMARKS: readonly string[] = [
  'meridian://ring-hub/',
  'meridian://delphines-garden/',
];

export function createInitialBrowserState(
  initialUrl: string = HOME_URL
): BrowserStateSlice {
  const normalized = coerceAddressInput(initialUrl);
  return {
    history: [normalized],
    index: 0,
    bookmarks: [...DEFAULT_BOOKMARKS],
    visited: [normalized],
    reloadToken: 0,
  };
}

export function canGoBack(state: BrowserStateSlice): boolean {
  return state.index > 0;
}

export function canGoForward(state: BrowserStateSlice): boolean {
  return state.index >= 0 && state.index < state.history.length - 1;
}

export function getCurrentUrl(state: BrowserStateSlice): string {
  return state.history[state.index] ?? HOME_URL;
}

export function navigateBrowserState(
  state: BrowserStateSlice,
  rawUrl: string
): BrowserStateSlice {
  const targetUrl = coerceAddressInput(rawUrl);
  const currentUrl = getCurrentUrl(state);

  if (targetUrl === currentUrl) {
    return state;
  }

  const nextHistory = [...state.history.slice(0, state.index + 1), targetUrl];
  const nextVisited = state.visited.includes(targetUrl)
    ? state.visited
    : [...state.visited, targetUrl];

  return {
    ...state,
    history: nextHistory,
    index: nextHistory.length - 1,
    visited: nextVisited,
  };
}

export function backBrowserState(state: BrowserStateSlice): BrowserStateSlice {
  if (!canGoBack(state)) {
    return state;
  }
  return {
    ...state,
    index: state.index - 1,
  };
}

export function forwardBrowserState(state: BrowserStateSlice): BrowserStateSlice {
  if (!canGoForward(state)) {
    return state;
  }
  return {
    ...state,
    index: state.index + 1,
  };
}

export function reloadBrowserState(state: BrowserStateSlice): BrowserStateSlice {
  return {
    ...state,
    reloadToken: state.reloadToken + 1,
  };
}

export function goHomeBrowserState(state: BrowserStateSlice): BrowserStateSlice {
  return navigateBrowserState(state, HOME_URL);
}

export function toggleBookmarkBrowserState(
  state: BrowserStateSlice,
  rawUrl: string
): BrowserStateSlice {
  const normalized = coerceAddressInput(rawUrl);
  const exists = state.bookmarks.includes(normalized);
  return {
    ...state,
    bookmarks: exists
      ? state.bookmarks.filter((item) => item !== normalized)
      : [...state.bookmarks, normalized],
  };
}
