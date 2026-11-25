import { Volume2, VolumeX } from 'lucide-react';
import { useSettingsStore } from '../state/settingsStore';

interface StatusBarProps {
  hoveredUrl: string | null;
  isLoading: boolean;
  trackTitle?: string | null;
}

export function StatusBar({ hoveredUrl, isLoading, trackTitle }: StatusBarProps) {
  const audioEnabled = useSettingsStore((state) => state.audioEnabled);
  const sessionMusicMuted = useSettingsStore((state) => state.sessionMusicMuted);
  const toggleSessionMusicMuted = useSettingsStore(
    (state) => state.toggleSessionMusicMuted
  );

  const statusText = hoveredUrl
    ? hoveredUrl
    : isLoading
      ? 'Loading meridian node...'
      : 'Done';

  return (
    <div
      className="flex min-h-7 shrink-0 flex-wrap items-center justify-between gap-2 border-t px-2.5 py-0.5"
      style={{
        backgroundColor: 'var(--color-panel)',
        borderTopColor: 'var(--bevel-light)',
      }}
    >
      <span
        className="font-mono-tabular min-w-0 flex-1 truncate text-[0.6875rem]"
        style={{
          color: hoveredUrl ? 'var(--color-phosphor)' : 'var(--color-paper-muted)',
        }}
      >
        {statusText}
      </span>

      {trackTitle && (
        <div className="flex shrink-0 items-center gap-2">
          <span
            className="font-mono-tabular truncate text-[0.6875rem]"
            style={{
              color:
                audioEnabled && !sessionMusicMuted
                  ? 'var(--color-phosphor)'
                  : 'var(--color-paper-muted)',
            }}
          >
            {sessionMusicMuted
              ? `Now playing: ${trackTitle} (muted)`
              : audioEnabled
                ? `Now playing: ${trackTitle}`
                : `Track: ${trackTitle} (audio off)`}
          </span>
          <button
            type="button"
            aria-pressed={sessionMusicMuted}
            aria-label={sessionMusicMuted ? 'Unmute site music' : 'Mute site music'}
            onClick={toggleSessionMusicMuted}
            className="os-bevel-raised os-focus-ring font-chrome inline-flex h-6 cursor-pointer items-center gap-1 px-2 text-[0.6875rem] whitespace-nowrap max-lg:h-9"
            style={{
              backgroundColor: 'var(--color-panel-elevated)',
              color: sessionMusicMuted
                ? 'var(--color-amber)'
                : 'var(--color-phosphor)',
            }}
          >
            {sessionMusicMuted ? (
              <VolumeX size={12} aria-hidden="true" />
            ) : (
              <Volume2 size={12} aria-hidden="true" />
            )}
            <span>{sessionMusicMuted ? 'Unmute' : 'Mute'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
