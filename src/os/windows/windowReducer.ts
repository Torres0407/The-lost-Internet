import { APPS_REGISTRY } from '../apps';
import type { AppId } from '../types';
import type { ViewportBounds, WindowRecord, WindowsStateSnapshot } from './types';
import {
  clampWindowPosition,
  clampWindowSize,
  DEFAULT_VIEWPORT,
  getCascadedPosition,
} from './windowMath';

export const TABLET_MAXIMIZE_BREAKPOINT_PX = 900;
export const PHONE_BREAKPOINT_PX = 700;

export const INITIAL_WINDOWS_STATE: WindowsStateSnapshot = {
  windows: {},
  focusedId: null,
  zCounter: 0,
};

export function findTopFocusableWindowId(
  windows: Record<string, WindowRecord>
): string | null {
  let topWindow: WindowRecord | null = null;
  for (const win of Object.values(windows)) {
    if (win.minimized) {
      continue;
    }
    if (!topWindow || win.zIndex > topWindow.zIndex) {
      topWindow = win;
    }
  }
  return topWindow ? topWindow.id : null;
}

export function isSingleWindowPhoneViewport(viewport: ViewportBounds): boolean {
  return viewport.width > 0 && viewport.width < PHONE_BREAKPOINT_PX;
}

export function shouldOpenMaximized(viewport: ViewportBounds): boolean {
  return viewport.width > 0 && viewport.width < TABLET_MAXIMIZE_BREAKPOINT_PX;
}

export function openWindowState(
  state: WindowsStateSnapshot,
  appId: AppId,
  viewport: ViewportBounds = DEFAULT_VIEWPORT
): WindowsStateSnapshot {
  const existing = Object.values(state.windows).find((w) => w.appId === appId);
  if (existing) {
    return focusWindowState(state, existing.id, viewport);
  }

  const app = APPS_REGISTRY[appId];
  const nextZ = state.zCounter + 1;
  const id = `win-${appId}`;

  const rawWidth = Math.min(app.defaultSize.width, Math.max(320, viewport.width));
  const rawHeight = Math.min(app.defaultSize.height, Math.max(220, viewport.height));

  const openCount = Object.keys(state.windows).length;
  const pos = getCascadedPosition(openCount, rawWidth, rawHeight, viewport);
  const size = clampWindowSize(rawWidth, rawHeight, pos.x, pos.y, viewport);
  const phoneMode = isSingleWindowPhoneViewport(viewport);
  const maximized = shouldOpenMaximized(viewport);

  const nextWindows: Record<string, WindowRecord> = {};
  for (const [winId, win] of Object.entries(state.windows)) {
    nextWindows[winId] = phoneMode ? { ...win, minimized: true } : win;
  }

  const newWindow: WindowRecord = {
    id,
    appId,
    title: app.title,
    x: pos.x,
    y: pos.y,
    width: size.width,
    height: size.height,
    minimized: false,
    maximized,
    zIndex: nextZ,
  };

  nextWindows[id] = newWindow;

  return {
    windows: nextWindows,
    focusedId: id,
    zCounter: nextZ,
  };
}

export function closeWindowState(
  state: WindowsStateSnapshot,
  id: string
): WindowsStateSnapshot {
  if (!state.windows[id]) {
    return state;
  }

  const nextWindows: Record<string, WindowRecord> = {};
  for (const [key, win] of Object.entries(state.windows)) {
    if (key !== id) {
      nextWindows[key] = win;
    }
  }

  const nextFocusedId =
    state.focusedId === id ? findTopFocusableWindowId(nextWindows) : state.focusedId;

  return {
    windows: nextWindows,
    focusedId: nextFocusedId,
    zCounter: state.zCounter,
  };
}

export function focusWindowState(
  state: WindowsStateSnapshot,
  id: string,
  viewport: ViewportBounds = DEFAULT_VIEWPORT
): WindowsStateSnapshot {
  const target = state.windows[id];
  if (!target) {
    return state;
  }

  const phoneMode = isSingleWindowPhoneViewport(viewport);

  if (state.focusedId === id && !target.minimized && (!phoneMode || target.maximized)) {
    return state;
  }

  const nextZ = state.zCounter + 1;
  const nextWindows: Record<string, WindowRecord> = {};
  for (const [winId, win] of Object.entries(state.windows)) {
    if (winId === id) {
      nextWindows[winId] = {
        ...win,
        minimized: false,
        maximized: phoneMode ? true : win.maximized,
        zIndex: nextZ,
      };
    } else {
      nextWindows[winId] = phoneMode ? { ...win, minimized: true } : win;
    }
  }

  return {
    windows: nextWindows,
    focusedId: id,
    zCounter: nextZ,
  };
}

export function minimizeWindowState(
  state: WindowsStateSnapshot,
  id: string
): WindowsStateSnapshot {
  const target = state.windows[id];
  if (!target || target.minimized) {
    return state;
  }

  const nextWindows: Record<string, WindowRecord> = {
    ...state.windows,
    [id]: {
      ...target,
      minimized: true,
    },
  };

  const nextFocusedId =
    state.focusedId === id ? findTopFocusableWindowId(nextWindows) : state.focusedId;

  return {
    windows: nextWindows,
    focusedId: nextFocusedId,
    zCounter: state.zCounter,
  };
}

export function toggleMaximizeState(
  state: WindowsStateSnapshot,
  id: string,
  viewport: ViewportBounds = DEFAULT_VIEWPORT
): WindowsStateSnapshot {
  const target = state.windows[id];
  if (!target) {
    return state;
  }

  const phoneMode = isSingleWindowPhoneViewport(viewport);
  const nextZ = state.zCounter + 1;
  return {
    windows: {
      ...state.windows,
      [id]: {
        ...target,
        maximized: phoneMode ? true : !target.maximized,
        minimized: false,
        zIndex: nextZ,
      },
    },
    focusedId: id,
    zCounter: nextZ,
  };
}

export function moveWindowState(
  state: WindowsStateSnapshot,
  id: string,
  x: number,
  y: number,
  viewport: ViewportBounds = DEFAULT_VIEWPORT
): WindowsStateSnapshot {
  const target = state.windows[id];
  if (!target || target.maximized) {
    return state;
  }

  const clamped = clampWindowPosition(x, y, target.width, target.height, viewport);
  if (clamped.x === target.x && clamped.y === target.y) {
    return state;
  }

  return {
    ...state,
    windows: {
      ...state.windows,
      [id]: {
        ...target,
        x: clamped.x,
        y: clamped.y,
      },
    },
  };
}

export function resizeWindowState(
  state: WindowsStateSnapshot,
  id: string,
  width: number,
  height: number,
  viewport: ViewportBounds = DEFAULT_VIEWPORT
): WindowsStateSnapshot {
  const target = state.windows[id];
  if (!target || target.maximized) {
    return state;
  }

  const clamped = clampWindowSize(width, height, target.x, target.y, viewport);
  if (clamped.width === target.width && clamped.height === target.height) {
    return state;
  }

  return {
    ...state,
    windows: {
      ...state.windows,
      [id]: {
        ...target,
        width: clamped.width,
        height: clamped.height,
      },
    },
  };
}

export function cycleFocusState(
  state: WindowsStateSnapshot,
  direction: 1 | -1 = 1,
  viewport: ViewportBounds = DEFAULT_VIEWPORT
): WindowsStateSnapshot {
  const ordered = Object.values(state.windows);
  if (ordered.length === 0) {
    return state;
  }

  const currentIndex = state.focusedId
    ? ordered.findIndex((win) => win.id === state.focusedId)
    : -1;

  const nextIndex =
    currentIndex === -1
      ? direction === 1
        ? 0
        : ordered.length - 1
      : (currentIndex + direction + ordered.length) % ordered.length;

  const nextWindow = ordered[nextIndex];
  return focusWindowState(state, nextWindow.id, viewport);
}
