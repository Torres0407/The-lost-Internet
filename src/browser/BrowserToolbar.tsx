import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Menu,
  RotateCw,
  Star,
} from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';

interface BrowserToolbarProps {
  currentUrl: string;
  canBack: boolean;
  canForward: boolean;
  isBookmarked: boolean;
  addressInputRef: RefObject<HTMLInputElement | null>;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onHome: () => void;
  onNavigate: (inputUrl: string) => void;
  onToggleBookmark: () => void;
  onOpenSource: () => void;
  onOpenHistory: () => void;
}

export function BrowserToolbar({
  currentUrl,
  canBack,
  canForward,
  isBookmarked,
  addressInputRef,
  onBack,
  onForward,
  onReload,
  onHome,
  onNavigate,
  onToggleBookmark,
  onOpenSource,
  onOpenHistory,
}: BrowserToolbarProps) {
  const [draftUrl, setDraftUrl] = useState(currentUrl);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  const addressInputId = useId();

  useEffect(() => {
    setDraftUrl(currentUrl);
  }, [currentUrl]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    audioEngine.playSound('ui_click');
    onNavigate(draftUrl);
  };

  return (
    <div
      className="flex shrink-0 flex-wrap items-center gap-1.5 border-b px-2 py-1.5"
      style={{
        backgroundColor: 'var(--color-panel)',
        borderBottomColor: 'var(--bevel-dark)',
      }}
    >
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label="Back"
          disabled={!canBack}
          onClick={() => {
            audioEngine.playSound('ui_click');
            onBack();
          }}
          className="os-bevel-raised os-focus-ring flex h-8 w-8 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-40 max-lg:h-11 max-lg:w-11"
          style={{ color: 'var(--color-paper)' }}
        >
          <ArrowLeft size={15} aria-hidden="true" />
        </button>

        <button
          type="button"
          aria-label="Forward"
          disabled={!canForward}
          onClick={() => {
            audioEngine.playSound('ui_click');
            onForward();
          }}
          className="os-bevel-raised os-focus-ring flex h-8 w-8 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-40 max-lg:h-11 max-lg:w-11"
          style={{ color: 'var(--color-paper)' }}
        >
          <ArrowRight size={15} aria-hidden="true" />
        </button>

        <button
          type="button"
          aria-label="Reload page"
          onClick={() => {
            audioEngine.playSound('ui_click');
            onReload();
          }}
          className="os-bevel-raised os-focus-ring flex h-8 w-8 cursor-pointer items-center justify-center max-lg:h-11 max-lg:w-11"
          style={{ color: 'var(--color-paper)' }}
        >
          <RotateCw size={14} aria-hidden="true" />
        </button>

        <button
          type="button"
          aria-label="Home"
          onClick={() => {
            audioEngine.playSound('ui_click');
            onHome();
          }}
          className="os-bevel-raised os-focus-ring flex h-8 w-8 cursor-pointer items-center justify-center max-lg:h-11 max-lg:w-11"
          style={{ color: 'var(--color-paper)' }}
        >
          <Home size={15} aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex min-w-[10rem] flex-1 items-center gap-1.5">
        <label htmlFor={addressInputId} className="sr-only">
          Address bar
        </label>
        <input
          ref={addressInputRef}
          id={addressInputId}
          type="text"
          value={draftUrl}
          onChange={(event) => setDraftUrl(event.target.value)}
          onFocus={(event) => event.currentTarget.select()}
          spellCheck={false}
          autoComplete="off"
          placeholder="meridian://ring-hub/"
          className="os-bevel-sunken os-focus-ring font-mono-tabular min-h-8 w-full min-w-0 px-2.5 text-[0.8125rem] max-lg:min-h-11"
          style={{
            backgroundColor: 'var(--color-bg)',
            color: 'var(--color-phosphor)',
          }}
        />
        <button
          type="submit"
          aria-label="Go to URL"
          className="os-bevel-raised os-focus-ring font-chrome h-8 shrink-0 cursor-pointer px-2.5 text-[0.8125rem] whitespace-nowrap max-lg:h-11 max-lg:px-3.5"
          style={{ color: 'var(--color-paper)' }}
        >
          Go
        </button>
      </form>

      <div className="relative flex shrink-0 items-center gap-1" ref={menuContainerRef}>
        <button
          type="button"
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
          aria-pressed={isBookmarked}
          onClick={() => {
            audioEngine.playSound('ui_click');
            onToggleBookmark();
          }}
          className="os-bevel-raised os-focus-ring flex h-8 w-8 cursor-pointer items-center justify-center max-lg:h-11 max-lg:w-11"
          style={{
            color: isBookmarked ? 'var(--color-amber)' : 'var(--color-paper)',
          }}
        >
          <Star
            size={15}
            fill={isBookmarked ? 'currentColor' : 'none'}
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          aria-label="Browser menu"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => {
            audioEngine.playSound('ui_click');
            setMenuOpen((prev) => !prev);
          }}
          className="os-bevel-raised os-focus-ring flex h-8 w-8 cursor-pointer items-center justify-center max-lg:h-11 max-lg:w-11"
          style={{ color: 'var(--color-paper)' }}
        >
          <Menu size={15} aria-hidden="true" />
        </button>

        {menuOpen && (
          <div
            role="menu"
            aria-label="Browser tools"
            className="os-bevel-raised absolute top-full right-0 z-30 mt-1 flex min-w-[10.5rem] flex-col p-1 shadow-lg"
            style={{ backgroundColor: 'var(--color-panel)' }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                audioEngine.playSound('ui_click');
                setMenuOpen(false);
                onOpenSource();
              }}
              className="os-focus-ring font-body flex min-h-9 w-full cursor-pointer items-center justify-between gap-4 px-3 py-2 text-left text-[0.8125rem] whitespace-nowrap hover:bg-[#25484e] max-lg:min-h-11"
              style={{ color: 'var(--color-paper)' }}
            >
              <span>View Source</span>
              <span
                className="font-mono-tabular text-[0.6875rem]"
                style={{ color: 'var(--color-paper-muted)' }}
              >
                Ctrl+U
              </span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                audioEngine.playSound('ui_click');
                setMenuOpen(false);
                onOpenHistory();
              }}
              className="os-focus-ring font-body flex min-h-9 w-full cursor-pointer items-center justify-between gap-4 px-3 py-2 text-left text-[0.8125rem] whitespace-nowrap hover:bg-[#25484e] max-lg:min-h-11"
              style={{ color: 'var(--color-paper)' }}
            >
              <span>History</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
