import { Volume2, VolumeX } from 'lucide-react';
import { SOUND_REGISTRY } from '../../audio/soundRegistry';
import { useSoundLogStore } from '../../audio/soundLogStore';
import { useSettingsStore } from '../../state/settingsStore';

function formatLogTime(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return String(timestamp);
  }
}

export function SoundLogApp() {
  const entries = useSoundLogStore((state) => state.entries);
  const clearEntries = useSoundLogStore((state) => state.clearEntries);
  const audioEnabled = useSettingsStore((state) => state.audioEnabled);

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-paper)',
      }}
    >
      <header
        className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-2"
        style={{
          backgroundColor: 'var(--color-panel-deep)',
          borderBottomColor: 'var(--bevel-dark)',
        }}
      >
        <div className="flex items-center gap-2">
          {audioEnabled ? (
            <Volume2 size={15} aria-hidden="true" style={{ color: 'var(--color-phosphor)' }} />
          ) : (
            <VolumeX size={15} aria-hidden="true" style={{ color: 'var(--color-amber)' }} />
          )}
          <span className="font-chrome text-[0.8125rem]" style={{ color: 'var(--color-paper)' }}>
            {audioEnabled ? 'Audio ON' : 'Audio muted (cues still logged)'}
          </span>
        </div>

        <button
          type="button"
          onClick={clearEntries}
          disabled={entries.length === 0}
          className="os-bevel-raised os-focus-ring font-chrome h-8 cursor-pointer px-2.5 text-[0.75rem] whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            backgroundColor: 'var(--color-panel-elevated)',
            color: 'var(--color-paper)',
          }}
        >
          Clear log
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {entries.length === 0 ? (
          <div
            className="border p-3"
            style={{
              backgroundColor: 'var(--color-panel-deep)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <p className="font-body text-[0.8125rem]" style={{ color: 'var(--color-paper)' }}>
              No informational sound cues logged yet. Archive notifications, insights,
              artifact discoveries, modem handshakes, and track changes appear here even
              when sound is turned off.
            </p>
          </div>
        ) : (
          <ul className="space-y-2" aria-label="Recent sound cues">
            {entries.map((entry) => {
              const def = SOUND_REGISTRY[entry.soundId];
              return (
                <li
                  key={entry.id}
                  className="os-bevel-sunken flex flex-col gap-1 border px-3 py-2"
                  style={{
                    backgroundColor: 'var(--color-panel-deep)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="font-chrome text-[0.75rem] font-semibold"
                      style={{ color: 'var(--color-phosphor)' }}
                    >
                      {def.label}
                    </span>
                    <time
                      className="font-mono-tabular text-[0.6875rem]"
                      style={{ color: 'var(--color-paper-muted)' }}
                    >
                      {formatLogTime(entry.timestamp)}
                    </time>
                  </div>
                  <p className="font-body text-[0.8125rem]" style={{ color: 'var(--color-paper)' }}>
                    {entry.text}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
