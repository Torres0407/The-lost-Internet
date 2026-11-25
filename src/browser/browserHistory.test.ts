import { describe, expect, it } from 'vitest';
import {
  backBrowserState,
  canGoBack,
  canGoForward,
  createInitialBrowserState,
  forwardBrowserState,
  getCurrentUrl,
  goHomeBrowserState,
  navigateBrowserState,
  reloadBrowserState,
  toggleBookmarkBrowserState,
} from './browserHistory';

describe('browserHistory pure functions', () => {
  it('supports back and forward navigation accurately', () => {
    let state = createInitialBrowserState();
    expect(getCurrentUrl(state)).toBe('meridian://ring-hub/');
    expect(canGoBack(state)).toBe(false);
    expect(canGoForward(state)).toBe(false);

    state = navigateBrowserState(state, 'meridian://delphines-garden/');
    state = navigateBrowserState(state, 'meridian://delphines-garden/guestbook');

    expect(state.history).toEqual([
      'meridian://ring-hub/',
      'meridian://delphines-garden/',
      'meridian://delphines-garden/guestbook',
    ]);
    expect(state.index).toBe(2);
    expect(canGoBack(state)).toBe(true);
    expect(canGoForward(state)).toBe(false);

    state = backBrowserState(state);
    expect(getCurrentUrl(state)).toBe('meridian://delphines-garden/');
    expect(canGoBack(state)).toBe(true);
    expect(canGoForward(state)).toBe(true);

    state = forwardBrowserState(state);
    expect(getCurrentUrl(state)).toBe('meridian://delphines-garden/guestbook');
    expect(canGoForward(state)).toBe(false);
  });

  it('truncates forward history when navigating after going back', () => {
    let state = createInitialBrowserState();
    state = navigateBrowserState(state, 'meridian://delphines-garden/');
    state = navigateBrowserState(state, 'meridian://delphines-garden/guestbook');

    state = backBrowserState(state);
    expect(getCurrentUrl(state)).toBe('meridian://delphines-garden/');

    state = navigateBrowserState(state, 'meridian://ring-hub/');
    expect(state.history).toEqual([
      'meridian://ring-hub/',
      'meridian://delphines-garden/',
      'meridian://ring-hub/',
    ]);
    expect(state.index).toBe(2);
    expect(canGoForward(state)).toBe(false);
  });

  it('ignores consecutive duplicate navigations and deduplicates visited list', () => {
    let state = createInitialBrowserState();
    state = navigateBrowserState(state, 'meridian://RING-HUB');
    expect(state.history).toHaveLength(1);

    state = navigateBrowserState(state, 'meridian://delphines-garden/');
    state = navigateBrowserState(state, 'meridian://ring-hub/');
    expect(state.history).toHaveLength(3);
    expect(state.visited).toEqual([
      'meridian://ring-hub/',
      'meridian://delphines-garden/',
    ]);
  });

  it('records unknown 404 URLs in history so back and forward still work', () => {
    let state = createInitialBrowserState();
    state = navigateBrowserState(state, 'meridian://missing-node/');
    expect(getCurrentUrl(state)).toBe('meridian://missing-node/');
    expect(state.index).toBe(1);

    state = backBrowserState(state);
    expect(getCurrentUrl(state)).toBe('meridian://ring-hub/');

    state = forwardBrowserState(state);
    expect(getCurrentUrl(state)).toBe('meridian://missing-node/');
  });

  it('toggles bookmarks, reloads, and navigates home', () => {
    let state = createInitialBrowserState();
    state = navigateBrowserState(state, 'meridian://delphines-garden/guestbook');

    state = toggleBookmarkBrowserState(state, 'meridian://delphines-garden/guestbook');
    expect(state.bookmarks).toContain('meridian://delphines-garden/guestbook');

    state = toggleBookmarkBrowserState(state, 'meridian://delphines-garden/guestbook');
    expect(state.bookmarks).not.toContain('meridian://delphines-garden/guestbook');

    state = reloadBrowserState(state);
    expect(state.reloadToken).toBe(1);

    state = goHomeBrowserState(state);
    expect(getCurrentUrl(state)).toBe('meridian://ring-hub/');
  });
});
