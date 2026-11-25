import { create } from 'zustand';
import type { AppId } from '../os/types';
import type { ViewportBounds, WindowsStateSnapshot } from '../os/windows/types';
import { DEFAULT_VIEWPORT } from '../os/windows/windowMath';
import {
  closeWindowState,
  cycleFocusState,
  focusWindowState,
  INITIAL_WINDOWS_STATE,
  minimizeWindowState,
  moveWindowState,
  openWindowState,
  resizeWindowState,
  toggleMaximizeState,
} from '../os/windows/windowReducer';

interface WindowsStore extends WindowsStateSnapshot {
  viewport: ViewportBounds;
  setViewport: (viewport: ViewportBounds) => void;
  openWindow: (appId: AppId) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, w: number, h: number) => void;
  cycleWindowFocus: (direction?: 1 | -1) => void;
}

export const useWindowsStore = create<WindowsStore>((set) => ({
  ...INITIAL_WINDOWS_STATE,
  viewport: DEFAULT_VIEWPORT,

  setViewport: (viewport) => set({ viewport }),

  openWindow: (appId) =>
    set((state) => openWindowState(state, appId, state.viewport)),

  closeWindow: (id) =>
    set((state) => closeWindowState(state, id)),

  focusWindow: (id) =>
    set((state) => focusWindowState(state, id, state.viewport)),

  minimizeWindow: (id) =>
    set((state) => minimizeWindowState(state, id)),

  toggleMaximize: (id) =>
    set((state) => toggleMaximizeState(state, id, state.viewport)),

  moveWindow: (id, x, y) =>
    set((state) => moveWindowState(state, id, x, y, state.viewport)),

  resizeWindow: (id, w, h) =>
    set((state) => resizeWindowState(state, id, w, h, state.viewport)),

  cycleWindowFocus: (direction = 1) =>
    set((state) => cycleFocusState(state, direction, state.viewport)),
}));
