import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { audioEngine } from '../audio/audioEngine';
import { getTrackForUrl } from '../content/audio';
import { GAME_REGISTRY } from '../engine/gameRegistry';
import { createNotFoundPage, HOME_URL } from '../engine/pages';
import { resolveWithProgress } from '../engine/resolve';
import { emitShellEvent } from '../events/eventBus';
import { useBrowserStore } from '../state/browserStore';
import { useCollectionStore } from '../state/collectionStore';
import { selectFacts, useProgressStore } from '../state/progressStore';
import { useSettingsStore } from '../state/settingsStore';
import { useWindowsStore } from '../state/windowsStore';
import {
  canGoBack,
  canGoForward,
  createInitialBrowserState,
  getCurrentUrl,
} from './browserHistory';
import { BookmarksBar } from './BookmarksBar';
import { BrowserToolbar } from './BrowserToolbar';
import { PageViewport } from './PageViewport';
import { StatusBar } from './StatusBar';

const COMPACT_BOOKMARKS_WIDTH_PX = 560;
const modemPlayedForWindows = new Set<string>();

export interface BrowserAppProps {
  windowId?: string;
}

export function BrowserApp({ windowId = 'win-browser' }: BrowserAppProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);

  const tab = useBrowserStore((state) => state.tabs[windowId]);
  const ensureBrowser = useBrowserStore((state) => state.ensureBrowser);
  const navigate = useBrowserStore((state) => state.navigate);
  const back = useBrowserStore((state) => state.back);
  const forward = useBrowserStore((state) => state.forward);
  const reload = useBrowserStore((state) => state.reload);
  const goHome = useBrowserStore((state) => state.goHome);
  const toggleBookmark = useBrowserStore((state) => state.toggleBookmark);
  const setSourceViewTarget = useBrowserStore((state) => state.setSourceViewTarget);
  const setActiveBrowserWindowId = useBrowserStore(
    (state) => state.setActiveBrowserWindowId
  );

  const facts = useProgressStore(selectFacts);
  const addFacts = useProgressStore((state) => state.addFacts);
  const markPageDiscovered = useProgressStore((state) => state.markPageDiscovered);

  const focusedWindowId = useWindowsStore((state) => state.focusedId);
  const isMinimized = useWindowsStore((state) =>
    Boolean(state.windows[windowId]?.minimized)
  );
  const openWindow = useWindowsStore((state) => state.openWindow);

  const modemSound = useSettingsStore((state) => state.modemSound);
  const hydrating = useCollectionStore((state) => state.hydrating);

  const [hoveredUrl, setHoveredUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [compactBookmarks, setCompactBookmarks] = useState(false);

  // Measure browser container width to collapse bookmarks at narrow sizes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    const updateWidth = () => {
      const width = el.getBoundingClientRect().width;
      if (width > 0) {
        setCompactBookmarks(width < COMPACT_BOOKMARKS_WIDTH_PX);
      }
    };
    updateWidth();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateWidth);
      observer.observe(el);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    ensureBrowser(windowId);
  }, [ensureBrowser, windowId]);

  useEffect(() => {
    if (focusedWindowId === windowId && !isMinimized) {
      setActiveBrowserWindowId(windowId);
    }
  }, [focusedWindowId, isMinimized, setActiveBrowserWindowId, windowId]);

  // Play modem handshake once per browser window open, skippable on key/click/Escape
  useEffect(() => {
    if (hydrating || modemPlayedForWindows.has(windowId)) {
      return;
    }
    modemPlayedForWindows.add(windowId);
    if (modemSound) {
      audioEngine.playSound('modem_handshake');
    }

    const abortModem = () => {
      audioEngine.stopModemSound();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || !event.metaKey) {
        abortModem();
      }
    };
    window.addEventListener('pointerdown', abortModem, { once: true });
    window.addEventListener('keydown', onKeyDown, { once: true });
    const cleanupTimer = window.setTimeout(() => {
      window.removeEventListener('pointerdown', abortModem);
      window.removeEventListener('keydown', onKeyDown);
    }, 2700);

    return () => {
      window.clearTimeout(cleanupTimer);
      window.removeEventListener('pointerdown', abortModem);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [hydrating, modemSound, windowId]);

  // Clear modem tracking and stop music if Browser window closes (unmounts)
  useEffect(() => {
    return () => {
      if (!useWindowsStore.getState().windows[windowId]) {
        modemPlayedForWindows.delete(windowId);
      }
      audioEngine.stopModemSound();
      audioEngine.stopMusic();
    };
  }, [windowId]);

  const activeTab = useMemo(
    () => tab ?? createInitialBrowserState(HOME_URL),
    [tab]
  );

  const currentUrl = getCurrentUrl(activeTab);
  const resolution = useMemo(
    () => resolveWithProgress(currentUrl, GAME_REGISTRY, facts),
    [currentUrl, facts]
  );

  useEffect(() => {
    if (resolution.status === 'ok') {
      if (resolution.newFacts.length > 0) {
        addFacts(resolution.newFacts);
      }
      markPageDiscovered(resolution.page.url);
    }
  }, [addFacts, markPageDiscovered, resolution]);

  const activeTrack = useMemo(() => {
    if (resolution.status !== 'ok') {
      return null;
    }
    return getTrackForUrl(resolution.page.url);
  }, [resolution]);

  // Sync procedural site music when URL changes, Browser minimizes/closes, or hydrates
  useEffect(() => {
    if (hydrating || isMinimized) {
      audioEngine.stopMusic();
      return;
    }
    if (resolution.status === 'ok') {
      audioEngine.syncTrackForUrl(resolution.page.url);
    } else {
      audioEngine.stopMusic();
    }
  }, [hydrating, isMinimized, resolution]);

  const currentPage = useMemo(() => {
    if (resolution.status === 'ok') {
      return resolution.page;
    }
    if (resolution.status === 'locked' && resolution.page.lockedNotice) {
      return createNotFoundPage(currentUrl, resolution.page.lockedNotice);
    }
    return createNotFoundPage(currentUrl);
  }, [currentUrl, resolution]);

  const handleOpenSource = useCallback(() => {
    setSourceViewTarget({
      browserWindowId: windowId,
      url: currentPage.url,
      title: currentPage.title,
      html: currentPage.html,
    });
    if (resolution.status === 'ok') {
      emitShellEvent({ type: 'source_viewed', url: resolution.page.url });
    }
    openWindow('source');
  }, [
    currentPage.html,
    currentPage.title,
    currentPage.url,
    openWindow,
    resolution,
    setSourceViewTarget,
    windowId,
  ]);

  const handleOpenHistory = useCallback(() => {
    setActiveBrowserWindowId(windowId);
    openWindow('history');
  }, [openWindow, setActiveBrowserWindowId, windowId]);

  const handlePageLoaded = useCallback((title: string) => {
    emitShellEvent({
      type: 'os/announce',
      message: `Loaded: ${title}`,
    });
  }, []);

  // Keyboard shortcuts active when this browser window is focused
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (useWindowsStore.getState().focusedId !== windowId) {
        return;
      }

      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        back(windowId);
        return;
      }

      if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault();
        forward(windowId);
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        addressInputRef.current?.focus();
        addressInputRef.current?.select();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'u') {
        event.preventDefault();
        handleOpenSource();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        toggleBookmark(windowId, currentUrl);
        return;
      }

      if (event.key === 'F5') {
        event.preventDefault();
        reload(windowId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [back, currentUrl, forward, handleOpenSource, reload, toggleBookmark, windowId]);

  const isBookmarked = activeTab.bookmarks.includes(currentUrl);

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-0 flex-col"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <BrowserToolbar
        currentUrl={currentUrl}
        canBack={canGoBack(activeTab)}
        canForward={canGoForward(activeTab)}
        isBookmarked={isBookmarked}
        addressInputRef={addressInputRef}
        onBack={() => back(windowId)}
        onForward={() => forward(windowId)}
        onReload={() => reload(windowId)}
        onHome={() => goHome(windowId)}
        onNavigate={(url) => navigate(windowId, url)}
        onToggleBookmark={() => toggleBookmark(windowId, currentUrl)}
        onOpenSource={handleOpenSource}
        onOpenHistory={handleOpenHistory}
      />

      <BookmarksBar
        bookmarks={activeTab.bookmarks}
        currentUrl={currentUrl}
        compact={compactBookmarks}
        onNavigate={(url) => navigate(windowId, url)}
      />

      <PageViewport
        page={currentPage}
        reloadToken={activeTab.reloadToken}
        onNavigate={(url) => navigate(windowId, url)}
        onHoverLink={setHoveredUrl}
        onLoadingChange={setIsLoading}
        onPageLoaded={handlePageLoaded}
      />

      <StatusBar
        hoveredUrl={hoveredUrl}
        isLoading={isLoading}
        trackTitle={activeTrack?.title ?? null}
      />
    </div>
  );
}
