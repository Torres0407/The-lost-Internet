import { Bookmark, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../audio/audioEngine';
import { GAME_REGISTRY } from '../engine/gameRegistry';
import { resolveWithProgress } from '../engine/resolve';
import { selectFacts, useProgressStore } from '../state/progressStore';

interface BookmarksBarProps {
  bookmarks: string[];
  currentUrl: string;
  compact?: boolean;
  onNavigate: (url: string) => void;
}

function formatBookmarkLabel(url: string, knownFacts: ReadonlySet<string>): string {
  const result = resolveWithProgress(url, GAME_REGISTRY, knownFacts);
  if (result.status === 'ok') {
    return result.page.title;
  }
  return url.replace(/^meridian:\/\//i, '').replace(/\/$/, '') || url;
}

export function BookmarksBar({
  bookmarks,
  currentUrl,
  compact = false,
  onNavigate,
}: BookmarksBarProps) {
  const facts = useProgressStore(selectFacts);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  if (bookmarks.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <nav
        ref={menuRef}
        aria-label="Bookmarks"
        className="relative flex shrink-0 items-center border-b px-2 py-1"
        style={{
          backgroundColor: 'var(--color-panel-deep)',
          borderBottomColor: 'var(--bevel-dark)',
        }}
      >
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => {
            audioEngine.playSound('ui_click');
            setMenuOpen((prev) => !prev);
          }}
          className="os-bevel-raised os-focus-ring font-chrome flex h-8 cursor-pointer items-center gap-1.5 px-2.5 text-[0.75rem] max-lg:h-11"
          style={{
            backgroundColor: 'var(--color-panel-elevated)',
            color: 'var(--color-paper)',
          }}
        >
          <Bookmark size={12} aria-hidden="true" style={{ color: 'var(--color-amber)' }} />
          <span>Bookmarks ({bookmarks.length})</span>
          <ChevronDown size={13} aria-hidden="true" />
        </button>

        {menuOpen && (
          <div
            role="menu"
            aria-label="Saved bookmarks"
            className="os-bevel-raised absolute top-full left-2 z-30 mt-1 flex min-w-[14rem] max-w-[calc(100%-1rem)] flex-col p-1 shadow-xl"
            style={{ backgroundColor: 'var(--color-panel)' }}
          >
            {bookmarks.map((url) => {
              const isCurrent = url === currentUrl;
              return (
                <button
                  key={url}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    audioEngine.playSound('ui_click');
                    setMenuOpen(false);
                    onNavigate(url);
                  }}
                  className="os-focus-ring font-body flex min-h-9 w-full cursor-pointer items-center gap-2 px-2.5 py-1.5 text-left text-[0.8125rem] hover:bg-[#25484e] max-lg:min-h-11"
                  style={{
                    color: isCurrent ? 'var(--color-phosphor)' : 'var(--color-paper)',
                  }}
                >
                  <Bookmark
                    size={12}
                    aria-hidden="true"
                    className="shrink-0"
                    style={{ color: 'var(--color-amber)' }}
                  />
                  <span className="truncate">{formatBookmarkLabel(url, facts)}</span>
                </button>
              );
            })}
          </div>
        )}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Bookmarks"
      className="flex shrink-0 flex-wrap items-center gap-1.5 border-b px-2 py-1"
      style={{
        backgroundColor: 'var(--color-panel-deep)',
        borderBottomColor: 'var(--bevel-dark)',
      }}
    >
      {bookmarks.map((url) => {
        const isCurrent = url === currentUrl;
        return (
          <button
            key={url}
            type="button"
            onClick={() => {
              audioEngine.playSound('ui_click');
              onNavigate(url);
            }}
            title={url}
            className="os-focus-ring font-body flex h-7 shrink-0 cursor-pointer items-center gap-1.5 px-2 text-[0.75rem] whitespace-nowrap transition-colors hover:bg-[#1d3a3f] max-lg:h-10"
            style={{
              color: isCurrent ? 'var(--color-phosphor)' : 'var(--color-paper)',
              backgroundColor: isCurrent ? 'var(--color-panel)' : 'transparent',
            }}
          >
            <Bookmark
              size={12}
              aria-hidden="true"
              style={{ color: 'var(--color-amber)' }}
            />
            <span className="max-w-[11.25rem] truncate">{formatBookmarkLabel(url, facts)}</span>
          </button>
        );
      })}
    </nav>
  );
}
