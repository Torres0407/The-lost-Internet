import { useEffect, useRef } from 'react';
import { emitShellEvent } from '../events/eventBus';
import { useSaveStatusStore } from '../state/persistence/persistenceController';
import { useWindowsStore } from '../state/windowsStore';

const ANNOUNCEMENT_COOLDOWN_MS = 30_000;

function DiskIcon({ color }: { color: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className="pixelated shrink-0"
    >
      <rect x="1" y="1" width="11" height="12" fill={color} />
      <rect x="12" y="2" width="1" height="11" fill={color} />
      <rect x="3" y="1" width="6" height="4" fill="#0b1418" />
      <rect x="7" y="2" width="1" height="2" fill={color} />
      <rect x="3" y="7" width="8" height="5" fill="#0b1418" />
      <rect x="4" y="8" width="6" height="1" fill="#e8e4d8" />
      <rect x="4" y="10" width="4" height="1" fill="#e8e4d8" />
    </svg>
  );
}

export function SaveStatusIndicator() {
  const status = useSaveStatusStore((state) => state.status);
  const hasUnsavedChanges = useSaveStatusStore((state) => state.hasUnsavedChanges);
  const errorMessage = useSaveStatusStore((state) => state.errorMessage);
  const lastSavedAt = useSaveStatusStore((state) => state.lastSavedAt);
  const openWindow = useWindowsStore((state) => state.openWindow);

  const lastAnnouncedAtRef = useRef<number>(0);
  const prevStateRef = useRef<string>('');

  const label =
    status === 'saving'
      ? 'Saving...'
      : status === 'error' || hasUnsavedChanges || lastSavedAt === null
        ? 'Not saved'
        : 'Saved';

  const color =
    status === 'error'
      ? 'var(--color-magenta)'
      : status === 'saving'
        ? 'var(--color-amber)'
        : label === 'Saved'
          ? 'var(--color-phosphor)'
          : 'var(--color-paper-muted)';

  useEffect(() => {
    const signature = `${status}|${label}|${errorMessage ?? ''}`;
    if (signature === prevStateRef.current) {
      return;
    }
    prevStateRef.current = signature;

    if (status === 'error') {
      emitShellEvent({
        type: 'os/announce',
        message: errorMessage ? `Save error: ${errorMessage}` : 'Save failed: Not saved.',
      });
      return;
    }

    if (label === 'Saved' || label === 'Saving...') {
      const now = Date.now();
      if (now - lastAnnouncedAtRef.current >= ANNOUNCEMENT_COOLDOWN_MS) {
        lastAnnouncedAtRef.current = now;
        emitShellEvent({
          type: 'os/announce',
          message: `Save status: ${label}`,
        });
      }
    }
  }, [errorMessage, label, status]);

  const accessibleName =
    status === 'error' && errorMessage
      ? `Save status: Not saved (${errorMessage}). Open Settings`
      : `Save status: ${label}. Open Settings`;

  return (
    <button
      type="button"
      onClick={() => openWindow('settings')}
      aria-label={accessibleName}
      title={errorMessage ?? `Save status: ${label}`}
      className="os-bevel-sunken os-focus-ring flex h-8 shrink-0 cursor-pointer items-center gap-1.5 px-2.5 whitespace-nowrap"
      style={{ backgroundColor: 'var(--color-panel-deep)' }}
    >
      <DiskIcon color={color} />
      <span
        className="font-chrome text-[12px] tracking-[0.02em]"
        style={{ color }}
      >
        {label}
      </span>
    </button>
  );
}
