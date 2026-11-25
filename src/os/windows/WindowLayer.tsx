import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { audioEngine } from '../../audio/audioEngine';
import { emitShellEvent } from '../../events/eventBus';
import { useCollectionStore } from '../../state/collectionStore';
import { useWindowsStore } from '../../state/windowsStore';
import { APPS_REGISTRY } from '../apps';
import type { WindowRecord } from './types';
import { isSingleWindowPhoneViewport } from './windowReducer';
import { Window } from './Window';

export function WindowLayer() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const windows = useWindowsStore((state) => state.windows);
  const focusedId = useWindowsStore((state) => state.focusedId);
  const viewport = useWindowsStore((state) => state.viewport);
  const setViewport = useWindowsStore((state) => state.setViewport);
  const focusWindow = useWindowsStore((state) => state.focusWindow);
  const closeWindow = useWindowsStore((state) => state.closeWindow);
  const minimizeWindow = useWindowsStore((state) => state.minimizeWindow);
  const toggleMaximize = useWindowsStore((state) => state.toggleMaximize);
  const moveWindow = useWindowsStore((state) => state.moveWindow);
  const resizeWindow = useWindowsStore((state) => state.resizeWindow);
  const cycleWindowFocus = useWindowsStore((state) => state.cycleWindowFocus);

  const prevWindowsRef = useRef<Record<string, WindowRecord>>({});

  // Track available desktop workspace bounds above the taskbar
  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setViewport({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
      }
    };

    updateSize();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateSize);
      observer.observe(el);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [setViewport]);

  // Global keyboard shortcut: Ctrl+` cycles open windows; Escape never closes windows
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && (event.key === '`' || event.code === 'Backquote')) {
        event.preventDefault();
        cycleWindowFocus(event.shiftKey ? -1 : 1);
        const nextId = useWindowsStore.getState().focusedId;
        if (nextId) {
          requestAnimationFrame(() => {
            const target = document.querySelector<HTMLElement>(
              `[data-window-id="${nextId}"]`
            );
            target?.focus({ preventScroll: true });
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycleWindowFocus]);

  // Screen reader announcements, window open/close sound effects, and focus return
  useEffect(() => {
    const prev = prevWindowsRef.current;
    const messages: string[] = [];
    const hydrating = useCollectionStore.getState().hydrating;

    let openedAny = false;
    let closedWin: WindowRecord | null = null;
    let minimizedWin: WindowRecord | null = null;

    for (const [id, win] of Object.entries(windows)) {
      const oldWin = prev[id];
      if (!oldWin) {
        messages.push(`Window opened: ${win.title}`);
        openedAny = true;
      } else if (!oldWin.minimized && win.minimized) {
        messages.push(`Window minimized: ${win.title}`);
        minimizedWin = win;
      } else if (oldWin.minimized && !win.minimized) {
        messages.push(`Window opened: ${win.title}`);
        openedAny = true;
      }
    }

    for (const [id, oldWin] of Object.entries(prev)) {
      if (!windows[id]) {
        messages.push(`Window closed: ${oldWin.title}`);
        closedWin = oldWin;
      }
    }

    prevWindowsRef.current = windows;

    if (!hydrating) {
      if (openedAny) {
        audioEngine.playSound('window_open');
      }
      if (closedWin) {
        audioEngine.playSound('window_close');
      }
    }

    if (messages.length > 0) {
      emitShellEvent({
        type: 'os/announce',
        message: messages.join('. '),
      });
    }

    // Restore focus cleanly when closing or minimizing and no top window remains
    if ((closedWin || minimizedWin) && !useWindowsStore.getState().focusedId) {
      const sourceAppId = (closedWin ?? minimizedWin)?.appId;
      requestAnimationFrame(() => {
        if (minimizedWin) {
          const taskbarBtn = document.querySelector<HTMLElement>(
            `[data-taskbar-window="${minimizedWin.id}"]`
          );
          if (taskbarBtn) {
            taskbarBtn.focus({ preventScroll: true });
            return;
          }
        }
        if (sourceAppId) {
          const iconBtn = document.querySelector<HTMLElement>(
            `[data-desktop-icon="${sourceAppId}"]`
          );
          if (iconBtn) {
            iconBtn.focus({ preventScroll: true });
            return;
          }
        }
        const fallbackBtn = document.querySelector<HTMLElement>('[data-desktop-icon]');
        fallbackBtn?.focus({ preventScroll: true });
      });
    }
  }, [windows]);

  const allWindows = Object.values(windows);
  const phoneMode = isSingleWindowPhoneViewport(viewport);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-x-0 top-0 bottom-[var(--taskbar-height)] z-15 overflow-hidden"
    >
      <AnimatePresence>
        {allWindows.map((win) => {
          const AppComponent = APPS_REGISTRY[win.appId].component;
          return (
            <Window
              key={win.id}
              win={win}
              isFocused={focusedId === win.id && !win.minimized}
              isPhoneMode={phoneMode}
              onFocus={focusWindow}
              onClose={closeWindow}
              onMinimize={minimizeWindow}
              onToggleMaximize={toggleMaximize}
              onMove={moveWindow}
              onResize={resizeWindow}
            >
              <AppComponent windowId={win.id} />
            </Window>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
