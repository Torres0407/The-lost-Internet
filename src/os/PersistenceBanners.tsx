import { X } from 'lucide-react';
import { useSaveStatusStore } from '../state/persistence/persistenceController';

interface BannerItem {
  id: string;
  tone: 'warning' | 'info' | 'error';
  text: string;
  onDismiss: () => void;
}

export function PersistenceBanners() {
  const fallbackWarningVisible = useSaveStatusStore(
    (state) => state.fallbackWarningVisible
  );
  const multiTabWarningVisible = useSaveStatusStore(
    (state) => state.multiTabWarningVisible
  );
  const backupNotice = useSaveStatusStore((state) => state.backupNotice);
  const timeoutNotice = useSaveStatusStore((state) => state.timeoutNotice);
  const dismissFallbackWarning = useSaveStatusStore(
    (state) => state.dismissFallbackWarning
  );
  const dismissMultiTabWarning = useSaveStatusStore(
    (state) => state.dismissMultiTabWarning
  );
  const dismissBackupNotice = useSaveStatusStore((state) => state.dismissBackupNotice);
  const dismissTimeoutNotice = useSaveStatusStore(
    (state) => state.dismissTimeoutNotice
  );

  const banners: BannerItem[] = [];

  if (fallbackWarningVisible) {
    banners.push({
      id: 'fallback',
      tone: 'warning',
      text: 'Saving is unavailable in this browser mode. Use Export Save to keep your progress.',
      onDismiss: dismissFallbackWarning,
    });
  }

  if (multiTabWarningVisible) {
    banners.push({
      id: 'multi-tab',
      tone: 'warning',
      text: 'The game is open in another tab. Saving from two tabs can overwrite progress.',
      onDismiss: dismissMultiTabWarning,
    });
  }

  if (backupNotice) {
    banners.push({
      id: 'backup',
      tone: 'info',
      text: backupNotice,
      onDismiss: dismissBackupNotice,
    });
  }

  if (timeoutNotice) {
    banners.push({
      id: 'timeout',
      tone: 'info',
      text: timeoutNotice,
      onDismiss: dismissTimeoutNotice,
    });
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <div
      aria-label="Storage notices"
      onClick={(event) => event.stopPropagation()}
      className="pointer-events-none fixed top-2.5 left-1/2 z-30 flex w-full max-w-[560px] -translate-x-1/2 flex-col gap-1.5 px-3"
    >
      {banners.map((banner) => {
        const accentColor =
          banner.tone === 'warning'
            ? 'var(--color-amber)'
            : banner.tone === 'error'
              ? 'var(--color-magenta)'
              : 'var(--color-phosphor)';

        return (
          <div
            key={banner.id}
            role={banner.tone === 'warning' ? 'alert' : 'status'}
            className="os-bevel-raised pointer-events-auto flex items-start justify-between gap-3 border px-3 py-2 shadow-lg"
            style={{
              backgroundColor: 'var(--color-panel-deep)',
              borderColor: accentColor,
              color: 'var(--color-paper)',
            }}
          >
            <p className="font-body text-[12px] leading-snug">
              <strong className="font-chrome mr-1.5" style={{ color: accentColor }}>
                {banner.tone === 'warning' ? 'Notice:' : 'Archive:'}
              </strong>
              {banner.text}
            </p>
            <button
              type="button"
              onClick={banner.onDismiss}
              aria-label={`Dismiss notice: ${banner.text}`}
              className="os-bevel-raised os-focus-ring flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center"
              style={{ color: 'var(--color-paper)' }}
            >
              <X size={13} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
