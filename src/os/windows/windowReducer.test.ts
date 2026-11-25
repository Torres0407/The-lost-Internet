import { describe, expect, it } from 'vitest';
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
} from './windowReducer';
import { MIN_WINDOW_HEIGHT, MIN_WINDOW_WIDTH, WINDOW_CASCADE_STEP } from './windowMath';

const VIEWPORT = { width: 1280, height: 720 };

describe('windowReducer', () => {
  describe('focus ordering', () => {
    it('increments zIndex and focuses newly opened windows in order', () => {
      let state = openWindowState(INITIAL_WINDOWS_STATE, 'browser', VIEWPORT);
      const browserId = state.focusedId!;
      expect(state.windows[browserId].zIndex).toBe(1);

      state = openWindowState(state, 'notebook', VIEWPORT);
      const notebookId = state.focusedId!;
      expect(notebookId).not.toBe(browserId);
      expect(state.windows[notebookId].zIndex).toBe(2);
      expect(state.zCounter).toBe(2);

      // Focusing browser brings it above notebook
      state = focusWindowState(state, browserId);
      expect(state.focusedId).toBe(browserId);
      expect(state.windows[browserId].zIndex).toBe(3);
      expect(state.windows[browserId].zIndex).toBeGreaterThan(
        state.windows[notebookId].zIndex
      );
    });

    it('focuses existing window instead of opening a second copy of the same app', () => {
      let state = openWindowState(INITIAL_WINDOWS_STATE, 'browser', VIEWPORT);
      state = openWindowState(state, 'mail', VIEWPORT);
      const browserId = 'win-browser';

      state = openWindowState(state, 'browser', VIEWPORT);
      expect(Object.keys(state.windows)).toHaveLength(2);
      expect(state.focusedId).toBe(browserId);
      expect(state.windows[browserId].zIndex).toBe(3);
    });

    it('passes focus to the next highest zIndex window when the focused window closes', () => {
      let state = openWindowState(INITIAL_WINDOWS_STATE, 'browser', VIEWPORT);
      state = openWindowState(state, 'notebook', VIEWPORT);
      state = openWindowState(state, 'mail', VIEWPORT);

      expect(state.focusedId).toBe('win-mail');
      state = closeWindowState(state, 'win-mail');
      expect(state.focusedId).toBe('win-notebook');

      state = closeWindowState(state, 'win-notebook');
      expect(state.focusedId).toBe('win-browser');

      state = closeWindowState(state, 'win-browser');
      expect(state.focusedId).toBeNull();
    });

    it('cycles focus across open windows cleanly', () => {
      let state = openWindowState(INITIAL_WINDOWS_STATE, 'browser', VIEWPORT);
      state = openWindowState(state, 'notebook', VIEWPORT);
      state = openWindowState(state, 'mail', VIEWPORT);

      expect(state.focusedId).toBe('win-mail');
      state = cycleFocusState(state, 1);
      expect(state.focusedId).toBe('win-browser');
      state = cycleFocusState(state, 1);
      expect(state.focusedId).toBe('win-notebook');
    });
  });

  describe('minimize and restore', () => {
    it('minimizes the focused window and moves focus to the next top visible window', () => {
      let state = openWindowState(INITIAL_WINDOWS_STATE, 'browser', VIEWPORT);
      state = openWindowState(state, 'notebook', VIEWPORT);

      expect(state.focusedId).toBe('win-notebook');
      state = minimizeWindowState(state, 'win-notebook');

      expect(state.windows['win-notebook'].minimized).toBe(true);
      expect(state.focusedId).toBe('win-browser');

      state = minimizeWindowState(state, 'win-browser');
      expect(state.focusedId).toBeNull();
    });

    it('restores a minimized window when focused or reopened from its app icon', () => {
      let state = openWindowState(INITIAL_WINDOWS_STATE, 'browser', VIEWPORT);
      state = openWindowState(state, 'files', VIEWPORT);
      state = minimizeWindowState(state, 'win-browser');

      expect(state.windows['win-browser'].minimized).toBe(true);
      expect(state.focusedId).toBe('win-files');

      // Restoring via openWindowState brings it back and focuses it
      state = openWindowState(state, 'browser', VIEWPORT);
      expect(state.windows['win-browser'].minimized).toBe(false);
      expect(state.focusedId).toBe('win-browser');
      expect(state.windows['win-browser'].zIndex).toBeGreaterThan(
        state.windows['win-files'].zIndex
      );

      // Minimizing again then restoring via focusWindowState
      state = minimizeWindowState(state, 'win-browser');
      state = focusWindowState(state, 'win-browser');
      expect(state.windows['win-browser'].minimized).toBe(false);
      expect(state.focusedId).toBe('win-browser');
    });
  });

  describe('maximize toggling and geometry constraints', () => {
    it('toggles maximized state, clears minimized, and brings window to front', () => {
      let state = openWindowState(INITIAL_WINDOWS_STATE, 'browser', VIEWPORT);
      state = openWindowState(state, 'settings', VIEWPORT);

      state = toggleMaximizeState(state, 'win-browser');
      expect(state.windows['win-browser'].maximized).toBe(true);
      expect(state.focusedId).toBe('win-browser');
      expect(state.windows['win-browser'].zIndex).toBeGreaterThan(
        state.windows['win-settings'].zIndex
      );

      state = toggleMaximizeState(state, 'win-browser');
      expect(state.windows['win-browser'].maximized).toBe(false);
    });

    it('cascades new windows by 24px and keeps move/resize within bounds', () => {
      let state = openWindowState(INITIAL_WINDOWS_STATE, 'notebook', VIEWPORT);
      state = openWindowState(state, 'settings', VIEWPORT);

      const first = state.windows['win-notebook'];
      const second = state.windows['win-settings'];
      expect(second.x - first.x).toBe(WINDOW_CASCADE_STEP);
      expect(second.y - first.y).toBe(WINDOW_CASCADE_STEP);

      // Move clamps inside viewport
      state = moveWindowState(state, 'win-settings', -50, -30, VIEWPORT);
      expect(state.windows['win-settings'].x).toBe(0);
      expect(state.windows['win-settings'].y).toBe(0);

      // Resize enforces minimum 320x220
      state = resizeWindowState(state, 'win-settings', 100, 90, VIEWPORT);
      expect(state.windows['win-settings'].width).toBe(MIN_WINDOW_WIDTH);
      expect(state.windows['win-settings'].height).toBe(MIN_WINDOW_HEIGHT);
    });
  });
});
