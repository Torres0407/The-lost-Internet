import { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../audio/audioEngine';
import { textScaleToMultiplier } from '../engine/settings';
import { saveClueToNotebook } from '../events/clues';
import type { Page } from '../engine/pages';
import {
  selectResolvedMotion,
  useSettingsStore,
} from '../state/settingsStore';
import { buildSanitizedShadowNodes } from './sanitizePageHtml';

interface PageViewportProps {
  page: Page;
  reloadToken: number;
  onNavigate: (url: string) => void;
  onHoverLink: (url: string | null) => void;
  onLoadingChange: (loading: boolean) => void;
  onPageLoaded: (title: string) => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  selectedText: string;
}

function getShadowSelectionText(shadowRoot: ShadowRoot): string {
  const shadowWithSelection = shadowRoot as ShadowRoot & {
    getSelection?: () => Selection | null;
  };
  if (typeof shadowWithSelection.getSelection === 'function') {
    const sel = shadowWithSelection.getSelection();
    if (sel) {
      return sel.toString().trim();
    }
  }
  return window.getSelection()?.toString().trim() ?? '';
}

export function PageViewport({
  page,
  reloadToken,
  onNavigate,
  onHoverLink,
  onLoadingChange,
  onPageLoaded,
}: PageViewportProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const shadowHostRef = useRef<HTMLDivElement | null>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);

  const textScale = useSettingsStore((state) => state.textScale);
  const resolvedMotion = useSettingsStore(selectResolvedMotion);

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(100);
  const [externalNotice, setExternalNotice] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [savedNotice, setSavedNotice] = useState<'clue' | 'insight' | 'duplicate' | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const onNavigateRef = useRef(onNavigate);
  const onHoverLinkRef = useRef(onHoverLink);
  const onLoadingChangeRef = useRef(onLoadingChange);
  const onPageLoadedRef = useRef(onPageLoaded);

  onNavigateRef.current = onNavigate;
  onHoverLinkRef.current = onHoverLink;
  onLoadingChangeRef.current = onLoadingChange;
  onPageLoadedRef.current = onPageLoaded;

  // Keep Shadow DOM zoom synced with display Text Size (100% / 125% / 150%)
  useEffect(() => {
    const host = shadowHostRef.current;
    if (!host) {
      return;
    }
    const scaleFactor = textScaleToMultiplier(textScale);
    (host.style as CSSStyleDeclaration & { zoom?: string }).zoom = String(scaleFactor);
  }, [textScale]);

  // Attach Shadow DOM once and wire delegated link & contextmenu handlers
  useEffect(() => {
    const host = shadowHostRef.current;
    if (!host) {
      return;
    }

    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    shadowRootRef.current = shadow;

    const handleClick = (event: Event) => {
      setContextMenu(null);
      const target = event.target as Element | null;
      const anchor = target?.closest('a');
      if (!anchor) {
        return;
      }

      event.preventDefault();
      const href = anchor.getAttribute('href')?.trim() ?? '';
      if (!href) {
        return;
      }

      if (href.toLowerCase().startsWith('meridian://')) {
        setExternalNotice(null);
        // Normal link clicks inside authored pages never trigger ui_click
        onNavigateRef.current(href);
        return;
      }

      const blockedMsg = 'This link leads outside the archive.';
      setExternalNotice(blockedMsg);
      audioEngine.playSound('error_buzz', { visualCue: blockedMsg });
    };

    const handlePointerOver = (event: Event) => {
      const target = event.target as Element | null;
      const anchor = target?.closest('a');
      onHoverLinkRef.current(anchor?.getAttribute('href') ?? null);
    };

    const handlePointerOut = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      const related = mouseEvent.relatedTarget as Element | null;
      if (!related || !related.closest('a')) {
        onHoverLinkRef.current(null);
      }
    };

    const handleContextMenu = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      const selectedText = getShadowSelectionText(shadow);
      if (!selectedText) {
        setContextMenu(null);
        return;
      }

      mouseEvent.preventDefault();
      const containerRect = wrapperRef.current?.getBoundingClientRect();
      const localX = containerRect
        ? Math.max(8, Math.min(mouseEvent.clientX - containerRect.left, containerRect.width - 170))
        : 12;
      const localY = containerRect
        ? Math.max(8, Math.min(mouseEvent.clientY - containerRect.top, containerRect.height - 48))
        : 12;

      setContextMenu({
        x: localX,
        y: localY,
        selectedText,
      });
    };

    shadow.addEventListener('click', handleClick);
    shadow.addEventListener('mouseover', handlePointerOver);
    shadow.addEventListener('mouseout', handlePointerOut);
    shadow.addEventListener('focusin', handlePointerOver);
    shadow.addEventListener('focusout', handlePointerOut);
    shadow.addEventListener('contextmenu', handleContextMenu);

    return () => {
      shadow.removeEventListener('click', handleClick);
      shadow.removeEventListener('mouseover', handlePointerOver);
      shadow.removeEventListener('mouseout', handlePointerOut);
      shadow.removeEventListener('focusin', handlePointerOver);
      shadow.removeEventListener('focusout', handlePointerOut);
      shadow.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Dismiss context menu on outside click or Escape
  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    const dismiss = () => setContextMenu(null);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextMenu(null);
      }
    };

    window.addEventListener('pointerdown', dismiss);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('pointerdown', dismiss);
      window.removeEventListener('keydown', handleKey);
    };
  }, [contextMenu]);

  // Staged ~400ms page load (skipped when resolved motion is reduced)
  useEffect(() => {
    const shadow = shadowRootRef.current;
    if (!shadow) {
      return;
    }

    setExternalNotice(null);
    setContextMenu(null);
    onHoverLinkRef.current(null);

    const renderPageIntoShadow = () => {
      const nodes = buildSanitizedShadowNodes(page.html, shadow.ownerDocument);
      const baseStyle = shadow.ownerDocument.createElement('style');
      baseStyle.textContent =
        ':host { display: block; min-height: 100%; } *, *::before, *::after { box-sizing: border-box; }';
      shadow.replaceChildren(baseStyle, ...nodes);
      if (wrapperRef.current) {
        wrapperRef.current.scrollTop = 0;
      }
      onPageLoadedRef.current(page.title);
    };

    if (resolvedMotion === 'reduced') {
      setIsLoading(false);
      setProgress(100);
      onLoadingChangeRef.current(false);
      renderPageIntoShadow();
      return;
    }

    setIsLoading(true);
    setProgress(28);
    onLoadingChangeRef.current(true);

    const midTimer = window.setTimeout(() => {
      setProgress(74);
    }, 150);

    const doneTimer = window.setTimeout(() => {
      renderPageIntoShadow();
      setProgress(100);
      setIsLoading(false);
      onLoadingChangeRef.current(false);
    }, 400);

    return () => {
      window.clearTimeout(midTimer);
      window.clearTimeout(doneTimer);
    };
  }, [page, reloadToken, resolvedMotion]);

  const handleSaveClue = () => {
    if (!contextMenu) {
      return;
    }
    const outcome = saveClueToNotebook(
      contextMenu.selectedText,
      page.url,
      page.title
    );
    setContextMenu(null);
    if (outcome.saved) {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      setSavedNotice(
        outcome.grantedFacts.length > 0
          ? 'insight'
          : outcome.duplicate
            ? 'duplicate'
            : 'clue'
      );
      toastTimerRef.current = window.setTimeout(() => setSavedNotice(null), 2200);
    }
  };

  return (
    <div
      ref={wrapperRef}
      role="region"
      aria-label={page.title}
      className="relative min-h-0 flex-1 overflow-auto"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* Staged loading bar */}
      {isLoading && (
        <div
          aria-hidden="true"
          className="sticky top-0 left-0 z-20 h-[3px] w-full"
          style={{ backgroundColor: 'var(--color-panel-deep)' }}
        >
          <div
            className="h-full transition-[width] duration-150 ease-out"
            style={{
              width: `${progress}%`,
              backgroundColor: 'var(--color-phosphor)',
            }}
          />
        </div>
      )}

      {/* External link blocked notice */}
      {externalNotice && (
        <div
          role="alert"
          className="sticky top-2 right-2 left-2 z-20 mx-3 mt-2 flex items-center justify-between gap-3 border px-3 py-2 text-[0.8125rem]"
          style={{
            backgroundColor: 'var(--color-panel-deep)',
            borderColor: 'var(--color-amber)',
            color: 'var(--color-paper)',
          }}
        >
          <span className="font-body">{externalNotice}</span>
          <button
            type="button"
            aria-label="Dismiss notice"
            onClick={() => setExternalNotice(null)}
            className="os-bevel-raised os-focus-ring font-chrome cursor-pointer px-2 py-0.5 text-[0.75rem]"
            style={{ color: 'var(--color-amber)' }}
          >
            OK
          </button>
        </div>
      )}

      {/* Subtle clue-saved / new-insight / duplicate toast */}
      {savedNotice && (
        <div
          aria-hidden="true"
          className="font-body fixed right-6 bottom-14 z-30 border px-3 py-1.5 text-[0.75rem] font-medium"
          style={{
            backgroundColor: 'var(--color-panel)',
            borderColor:
              savedNotice === 'insight'
                ? 'var(--color-amber)'
                : savedNotice === 'duplicate'
                  ? 'var(--color-paper-muted)'
                  : 'var(--color-phosphor)',
            color:
              savedNotice === 'insight'
                ? 'var(--color-amber)'
                : savedNotice === 'duplicate'
                  ? 'var(--color-paper)'
                  : 'var(--color-phosphor)',
          }}
        >
          {savedNotice === 'insight'
            ? 'New insight'
            : savedNotice === 'duplicate'
              ? 'Already in your notebook'
              : 'Clue saved'}
        </div>
      )}

      {/* Shadow DOM mount point */}
      <div ref={shadowHostRef} className="min-h-full w-full" />

      {/* Custom right-click menu for selected text */}
      {contextMenu && (
        <div
          role="menu"
          onPointerDown={(event) => event.stopPropagation()}
          className="os-bevel-raised absolute z-30 p-1 shadow-lg"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            backgroundColor: 'var(--color-panel)',
          }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleSaveClue}
            className="os-focus-ring font-body cursor-pointer px-3 py-1.5 text-[0.8125rem] whitespace-nowrap hover:bg-[#25484e]"
            style={{ color: 'var(--color-phosphor)' }}
          >
            Save to Notebook
          </button>
        </div>
      )}
    </div>
  );
}
