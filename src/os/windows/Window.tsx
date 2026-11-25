import {
  useEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { motion } from 'motion/react';
import { getCurrentUrl } from '../../browser/browserHistory';
import { useBrowserStore } from '../../state/browserStore';
import { useCollectionStore } from '../../state/collectionStore';
import { selectFacts, useProgressStore } from '../../state/progressStore';
import { Glitch } from '../../ui/Glitch';
import { PixelIcon } from '../../ui/PixelIcon';
import type { WindowRecord } from './types';
import { MIN_WINDOW_HEIGHT, MIN_WINDOW_WIDTH } from './windowMath';

const HALCYON_FRAGMENT_URL = 'meridian://nightcrawler/porchlight';

const FOCUSABLE_CONTENT_SELECTOR = [
  'button:not([disabled]):not([tabindex="-1"])',
  '[href]:not([tabindex="-1"])',
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface WindowProps {
  win: WindowRecord;
  isFocused: boolean;
  isPhoneMode?: boolean;
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onToggleMaximize: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  children: ReactNode;
}

interface DragSession {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
}

interface ResizeSession {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originWidth: number;
  originHeight: number;
}

export function Window({
  win,
  isFocused,
  isPhoneMode = false,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onMove,
  onResize,
  children,
}: WindowProps) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const dragSessionRef = useRef<DragSession | null>(null);
  const resizeSessionRef = useRef<ResizeSession | null>(null);
  const prevFocusedRef = useRef(false);

  const browserTab = useBrowserStore((state) =>
    win.appId === 'browser' ? state.tabs[win.id] : undefined
  );
  const facts = useProgressStore(selectFacts);
  const hydrating = useCollectionStore((state) => state.hydrating);

  const currentBrowserUrl = browserTab ? getCurrentUrl(browserTab) : null;
  const isHalcyonWindow =
    !hydrating &&
    win.appId === 'browser' &&
    currentBrowserUrl === HALCYON_FRAGMENT_URL &&
    facts.has('halcyon_fragment_1');

  // Keep minimized windows out of keyboard and assistive-technology trees
  useEffect(() => {
    const el = dialogRef.current as (HTMLElement & { inert: boolean }) | null;
    if (el && 'inert' in el) {
      el.inert = win.minimized;
    }
  }, [win.minimized]);

  // Focus first meaningful control inside window on open / restore / focus activation
  useEffect(() => {
    const becameFocused = isFocused && !prevFocusedRef.current;
    prevFocusedRef.current = isFocused && !win.minimized;

    if (!isFocused || win.minimized || !becameFocused) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      if (!dialog || dialog.contains(document.activeElement)) {
        return;
      }
      const firstControl = contentRef.current?.querySelector<HTMLElement>(
        FOCUSABLE_CONTENT_SELECTOR
      );
      if (firstControl) {
        firstControl.focus({ preventScroll: true });
      } else {
        dialog.focus({ preventScroll: true });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isFocused, win.minimized]);

  const handleWindowPointerDown = () => {
    onFocus(win.id);
  };

  const handleTitlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest('button')) {
      return;
    }
    onFocus(win.id);
    if (win.maximized) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragSessionRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: win.x,
      originY: win.y,
    };
  };

  const handleTitlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) {
      return;
    }
    const dx = event.clientX - session.startClientX;
    const dy = event.clientY - session.startClientY;
    onMove(win.id, session.originX + dx, session.originY + dy);
  };

  const handleTitlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const session = dragSessionRef.current;
    if (session && session.pointerId === event.pointerId) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      dragSessionRef.current = null;
    }
  };

  const handleTitleDoubleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('button')) {
      return;
    }
    onToggleMaximize(win.id);
  };

  const handleResizePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') {
      return;
    }
    event.stopPropagation();
    onFocus(win.id);
    if (win.maximized) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    resizeSessionRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originWidth: win.width,
      originHeight: win.height,
    };
  };

  const handleResizePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const session = resizeSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) {
      return;
    }
    const dx = event.clientX - session.startClientX;
    const dy = event.clientY - session.startClientY;
    onResize(
      win.id,
      Math.max(MIN_WINDOW_WIDTH, session.originWidth + dx),
      Math.max(MIN_WINDOW_HEIGHT, session.originHeight + dy)
    );
  };

  const handleResizePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const session = resizeSessionRef.current;
    if (session && session.pointerId === event.pointerId) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      resizeSessionRef.current = null;
    }
  };

  const positionStyle = win.maximized
    ? {
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
      }
    : {
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
      };

  const windowBody = (
    <div
      ref={contentRef}
      className="os-bevel-sunken relative h-full min-h-0 flex-1 overflow-auto"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {children}
    </div>
  );

  return (
    <motion.section
      ref={dialogRef}
      role="dialog"
      aria-label={win.title}
      data-window-id={win.id}
      hidden={win.minimized}
      aria-hidden={win.minimized ? true : undefined}
      tabIndex={win.minimized ? undefined : -1}
      onPointerDown={handleWindowPointerDown}
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{
        opacity: win.minimized ? 0 : 1,
        scale: win.minimized ? 0.96 : 1,
        y: win.minimized ? 12 : 0,
      }}
      exit={{ opacity: 0, scale: 0.96, y: 12 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      className={`os-bevel-raised os-focus-ring pointer-events-auto absolute flex-col overflow-hidden p-[3px] ${
        win.minimized ? 'hidden' : 'flex'
      }`}
      style={{
        ...positionStyle,
        zIndex: win.zIndex,
        boxShadow: isFocused
          ? '0 12px 32px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(56, 242, 176, 0.45)'
          : '0 8px 20px rgba(0, 0, 0, 0.45)',
      }}
    >
      {/* Title bar: touch-action none for smooth dragging */}
      <div
        onPointerDown={handleTitlePointerDown}
        onPointerMove={handleTitlePointerMove}
        onPointerUp={handleTitlePointerEnd}
        onPointerCancel={handleTitlePointerEnd}
        onDoubleClick={handleTitleDoubleClick}
        className="flex shrink-0 touch-none items-center justify-between gap-2 px-2 select-none"
        style={{
          minHeight: 'var(--window-titlebar-height)',
          backgroundColor: isFocused ? 'var(--color-panel-elevated)' : 'var(--color-panel-deep)',
          borderBottom: isFocused
            ? '1px solid var(--selection-border)'
            : '1px solid var(--bevel-dark)',
          cursor: win.maximized ? 'default' : 'grab',
        }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <PixelIcon id={win.appId} size={18} />
          <h2
            className="font-chrome truncate text-[0.9375rem] font-semibold tracking-[0.02em]"
            style={{
              color: isFocused ? 'var(--color-phosphor)' : 'var(--color-paper-muted)',
            }}
          >
            {win.title}
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={`Minimize ${win.title}`}
            onClick={(event) => {
              event.stopPropagation();
              onMinimize(win.id);
            }}
            className="os-bevel-raised os-focus-ring font-chrome flex h-7 w-8 cursor-pointer items-center justify-center text-[0.875rem] leading-none max-lg:h-11 max-lg:w-11"
            style={{ color: 'var(--color-paper)' }}
          >
            <span aria-hidden="true">_</span>
          </button>

          {!isPhoneMode && (
            <button
              type="button"
              aria-label={win.maximized ? `Restore ${win.title}` : `Maximize ${win.title}`}
              onClick={(event) => {
                event.stopPropagation();
                onToggleMaximize(win.id);
              }}
              className="os-bevel-raised os-focus-ring font-chrome flex h-7 w-8 cursor-pointer items-center justify-center text-[0.8125rem] leading-none max-lg:h-11 max-lg:w-11"
              style={{ color: 'var(--color-paper)' }}
            >
              <span aria-hidden="true">{win.maximized ? '❐' : '□'}</span>
            </button>
          )}

          <button
            type="button"
            aria-label={`Close ${win.title}`}
            onClick={(event) => {
              event.stopPropagation();
              onClose(win.id);
            }}
            className="os-bevel-raised os-focus-ring font-chrome flex h-7 w-8 cursor-pointer items-center justify-center text-[0.875rem] leading-none max-lg:h-11 max-lg:w-11"
            style={{ color: 'var(--color-magenta)' }}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </div>

      {/* Content slot wrapped in Glitch only for halcyon_fragment_1 page */}
      {isHalcyonWindow ? (
        <Glitch
          active={isHalcyonWindow}
          triggerKey={`${win.id}:${currentBrowserUrl}`}
          className="flex min-h-0 flex-1 flex-col"
        >
          {windowBody}
        </Glitch>
      ) : (
        windowBody
      )}

      {/* Bottom-right resize grip: >= 24px visible handle and >= 44px hit target on tablet */}
      {!win.maximized && (
        <div
          aria-hidden="true"
          data-window-resize-handle="true"
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerEnd}
          onPointerCancel={handleResizePointerEnd}
          className="absolute right-0 bottom-0 z-10 flex h-6 w-6 touch-none cursor-nwse-resize items-end justify-end p-1 max-lg:h-11 max-lg:w-11 max-lg:p-1.5"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 12 12"
            shapeRendering="crispEdges"
            aria-hidden="true"
            className="max-lg:h-6 max-lg:w-6"
          >
            <rect x="9" y="3" width="2" height="2" fill="var(--color-phosphor)" opacity="0.8" />
            <rect x="6" y="6" width="2" height="2" fill="var(--color-phosphor)" opacity="0.8" />
            <rect x="9" y="6" width="2" height="2" fill="var(--color-paper)" opacity="0.9" />
            <rect x="3" y="9" width="2" height="2" fill="var(--color-phosphor)" opacity="0.8" />
            <rect x="6" y="9" width="2" height="2" fill="var(--color-paper)" opacity="0.9" />
            <rect x="9" y="9" width="2" height="2" fill="var(--color-paper)" />
          </svg>
        </div>
      )}
    </motion.section>
  );
}
