import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../audio/audioEngine';
import { SOUND_REGISTRY } from '../audio/soundRegistry';
import { useSoundLogStore } from '../audio/soundLogStore';
import { emitShellEvent } from '../events/eventBus';
import { useDesktopStore } from '../state/desktopStore';
import { useSettingsStore } from '../state/settingsStore';
import { useWindowsStore } from '../state/windowsStore';
import { PixelIcon } from '../ui/PixelIcon';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { TaskbarClock } from './TaskbarClock';

export function Taskbar() {
  const clearSelection = useDesktopStore((state) => state.clearSelection);
  const windows = useWindowsStore((state) => state.windows);
  const focusedId = useWindowsStore((state) => state.focusedId);
  const focusWindow = useWindowsStore((state) => state.focusWindow);
  const minimizeWindow = useWindowsStore((state) => state.minimizeWindow);
  const openWindow = useWindowsStore((state) => state.openWindow);

  const audioEnabled = useSettingsStore((state) => state.audioEnabled);
  const soundLogVisible = useSettingsStore((state) => state.soundLogVisible);
  const soundLogEntries = useSoundLogStore((state) => state.entries);

  const [trayOpen, setTrayOpen] = useState(false);
  const trayRef = useRef<HTMLDivElement | null>(null);

  const openWindows = Object.values(windows);

  useEffect(() => {
    if (!trayOpen) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (trayRef.current && !trayRef.current.contains(event.target as Node)) {
        setTrayOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setTrayOpen(false);
      }
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [trayOpen]);

  const handleDesktopButton = () => {
    audioEngine.playSound('ui_click');
    clearSelection();
    emitShellEvent({ type: 'desktop/icon-selected', iconId: null });
  };

  const handleWindowButtonClick = (id: string, isFocused: boolean, isMinimized: boolean) => {
    audioEngine.playSound('ui_click');
    if (isFocused && !isMinimized) {
      minimizeWindow(id);
      return;
    }
    focusWindow(id);
  };

  return (
    <nav
      id="os-taskbar"
      tabIndex={-1}
      aria-label="Taskbar"
      onClick={(event) => event.stopPropagation()}
      className="relative z-20 flex w-full shrink-0 items-center justify-between gap-2 border-t-2 px-2.5 pb-[env(safe-area-inset-bottom)] outline-none"
      style={{
        minHeight: 'var(--taskbar-height)',
        backgroundColor: 'var(--color-panel)',
        borderTopColor: 'var(--bevel-light)',
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1">
        <button
          type="button"
          onClick={handleDesktopButton}
          className="os-bevel-raised os-focus-ring font-chrome flex h-8 min-h-8 shrink-0 cursor-pointer items-center px-3 text-[0.875rem] font-semibold tracking-[0.02em] whitespace-nowrap transition-transform active:translate-y-[1px] max-lg:h-11 max-lg:min-h-[2.75rem]"
          style={{ color: 'var(--color-phosphor)' }}
        >
          The Lost Internet
        </button>

        {openWindows.length > 0 && (
          <div
            role="toolbar"
            aria-label="Open windows"
            className="flex min-w-0 items-center gap-1.5"
          >
            {openWindows.map((win) => {
              const isFocused = focusedId === win.id && !win.minimized;
              const stateLabel = win.minimized
                ? 'minimized'
                : isFocused
                  ? 'focused'
                  : 'open';

              return (
                <button
                  key={win.id}
                  type="button"
                  data-taskbar-window={win.id}
                  aria-pressed={isFocused}
                  aria-label={`${win.title} (${stateLabel})`}
                  onClick={() => handleWindowButtonClick(win.id, isFocused, win.minimized)}
                  className={`${isFocused ? 'os-bevel-sunken' : 'os-bevel-raised'} os-focus-ring flex h-8 max-w-[11.25rem] min-w-[6.5rem] shrink-0 cursor-pointer items-center gap-2 px-2.5 text-left whitespace-nowrap max-lg:h-11 max-lg:min-w-[4.5rem]`}
                  style={{
                    borderColor: isFocused ? 'var(--color-phosphor)' : undefined,
                    backgroundColor: isFocused
                      ? 'var(--color-panel-deep)'
                      : win.minimized
                        ? 'var(--color-bg)'
                        : 'var(--color-panel)',
                  }}
                >
                  <PixelIcon id={win.appId} size={16} />
                  <span
                    className="font-chrome truncate text-[0.8125rem] tracking-[0.02em]"
                    style={{
                      color: isFocused
                        ? 'var(--color-phosphor)'
                        : win.minimized
                          ? 'var(--color-paper-muted)'
                          : 'var(--color-paper)',
                    }}
                  >
                    {win.title}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative flex shrink-0 items-center gap-2 py-1" ref={trayRef}>
        {soundLogVisible && (
          <button
            type="button"
            aria-label={`Sound Log (${soundLogEntries.length} cues)`}
            aria-haspopup="dialog"
            aria-expanded={trayOpen}
            onClick={() => {
              audioEngine.playSound('ui_click');
              setTrayOpen((prev) => !prev);
            }}
            className="os-bevel-sunken os-focus-ring flex h-8 shrink-0 cursor-pointer items-center gap-1.5 px-2 whitespace-nowrap max-lg:h-11 max-lg:min-w-[2.75rem]"
            style={{
              backgroundColor: 'var(--color-panel-deep)',
              color: audioEnabled ? 'var(--color-phosphor)' : 'var(--color-paper-muted)',
            }}
          >
            {audioEnabled ? (
              <Volume2 size={14} aria-hidden="true" />
            ) : (
              <VolumeX size={14} aria-hidden="true" />
            )}
            <span className="font-chrome text-[0.75rem] max-sm:hidden">
              Log ({soundLogEntries.length})
            </span>
          </button>
        )}

        {trayOpen && (
          <div
            role="dialog"
            aria-label="Sound Log tray menu"
            className="os-bevel-raised absolute right-0 bottom-full z-40 mb-2 w-[20rem] max-w-[calc(100vw-1rem)] p-2.5 shadow-2xl"
            style={{ backgroundColor: 'var(--color-panel)' }}
          >
            <div
              className="mb-2 flex items-center justify-between gap-2 border-b pb-1.5"
              style={{ borderBottomColor: 'var(--bevel-dark)' }}
            >
              <span
                className="font-chrome text-[0.8125rem] font-semibold"
                style={{ color: 'var(--color-phosphor)' }}
              >
                Recent Sound Cues
              </span>
              <button
                type="button"
                onClick={() => {
                  setTrayOpen(false);
                  openWindow('sound-log');
                }}
                className="os-bevel-raised os-focus-ring font-chrome h-7 cursor-pointer px-2 text-[0.75rem]"
                style={{
                  backgroundColor: 'var(--color-panel-elevated)',
                  color: 'var(--color-amber)',
                }}
              >
                Pop out
              </button>
            </div>

            {soundLogEntries.length === 0 ? (
              <p
                className="font-body py-2 text-[0.75rem]"
                style={{ color: 'var(--color-paper-muted)' }}
              >
                No informational cues logged yet.
              </p>
            ) : (
              <ul className="max-h-56 space-y-1.5 overflow-y-auto">
                {soundLogEntries.map((entry) => (
                  <li
                    key={entry.id}
                    className="os-bevel-sunken px-2 py-1.5"
                    style={{ backgroundColor: 'var(--color-panel-deep)' }}
                  >
                    <p
                      className="font-chrome text-[0.6875rem] font-semibold"
                      style={{ color: 'var(--color-phosphor)' }}
                    >
                      {SOUND_REGISTRY[entry.soundId].label}
                    </p>
                    <p className="font-body text-[0.75rem]" style={{ color: 'var(--color-paper)' }}>
                      {entry.text}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <SaveStatusIndicator />
        <TaskbarClock />
      </div>
    </nav>
  );
}
