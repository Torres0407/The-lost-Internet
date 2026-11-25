import { useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { X } from 'lucide-react';
import { CollectionToastHost } from '../apps/archiveIndex/CollectionToastHost';
import { emitShellEvent } from '../events/eventBus';
import { useDesktopStore } from '../state/desktopStore';
import {
  selectResolvedMotion,
  useSettingsStore,
} from '../state/settingsStore';
import { useWindowsStore } from '../state/windowsStore';
import { isHelpShortcutKeyEvent } from '../ui/keyboardUtils';
import { DebugProgressPanel } from './DebugProgressPanel';
import { DESKTOP_ICONS } from './desktopIcons';
import { DesktopGrid } from './DesktopGrid';
import { PersistenceBanners } from './PersistenceBanners';
import { Taskbar } from './Taskbar';
import { Wallpaper } from './Wallpaper';
import { isSingleWindowPhoneViewport } from './windows/windowReducer';
import { WindowLayer } from './windows/WindowLayer';

const PHONE_NOTICE_SESSION_KEY = 'tli:phone-notice-dismissed';

function readPhoneNoticeDismissed(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return window.sessionStorage.getItem(PHONE_NOTICE_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function DesktopScreen() {
  const selectedIconId = useDesktopStore((state) => state.selectedIconId);
  const lastActivatedIconId = useDesktopStore((state) => state.lastActivatedIconId);
  const clearSelection = useDesktopStore((state) => state.clearSelection);
  const viewport = useWindowsStore((state) => state.viewport);
  const openWindow = useWindowsStore((state) => state.openWindow);

  const resolvedMotion = useSettingsStore(selectResolvedMotion);
  const requestSettingsTab = useSettingsStore((state) => state.requestSettingsTab);

  const [phoneNoticeDismissed, setPhoneNoticeDismissed] = useState(
    readPhoneNoticeDismissed
  );

  // Announce desktop icon focus/activation through the single root polite live region
  useEffect(() => {
    const selectedLabel = DESKTOP_ICONS.find((icon) => icon.id === selectedIconId)?.label;
    const activatedLabel = DESKTOP_ICONS.find(
      (icon) => icon.id === lastActivatedIconId
    )?.label;

    const announcement = activatedLabel
      ? `${activatedLabel} selected`
      : selectedLabel
        ? `${selectedLabel} focused`
        : '';

    if (announcement) {
      emitShellEvent({ type: 'os/announce', message: announcement });
    }
  }, [lastActivatedIconId, selectedIconId]);

  // Global '?' (Shift+/) shortcut opens Settings -> Accessibility when not typing
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isHelpShortcutKeyEvent(event)) {
        return;
      }
      event.preventDefault();
      requestSettingsTab('accessibility');
      openWindow('settings');
      emitShellEvent({ type: 'settings/open-tab', tab: 'accessibility' });
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openWindow, requestSettingsTab]);

  const handleDesktopBackgroundClick = () => {
    clearSelection();
    emitShellEvent({ type: 'desktop/icon-selected', iconId: null });
  };

  const handleDismissPhoneNotice = () => {
    setPhoneNoticeDismissed(true);
    try {
      window.sessionStorage.setItem(PHONE_NOTICE_SESSION_KEY, '1');
    } catch {
      // Ignore sessionStorage failures
    }
  };

  const showPhoneNotice =
    isSingleWindowPhoneViewport(viewport) && !phoneNoticeDismissed;

  return (
    <MotionConfig reducedMotion={resolvedMotion === 'reduced' ? 'always' : 'never'}>
      <div
        data-os-root="true"
        data-os-desktop-surface="true"
        className="relative flex h-dvh w-screen flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        {/* Skip links positioned first in keyboard tab order */}
        <a
          href="#desktop-icons"
          onClick={(event) => {
            event.preventDefault();
            const firstIcon =
              document.querySelector<HTMLElement>('[data-desktop-icon]') ??
              document.getElementById('desktop-icons');
            firstIcon?.focus();
          }}
          className="os-bevel-raised os-focus-ring font-chrome sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2 focus:text-[0.8125rem]"
          style={{
            backgroundColor: 'var(--color-panel)',
            color: 'var(--color-phosphor)',
          }}
        >
          Skip to desktop
        </a>
        <a
          href="#os-taskbar"
          onClick={(event) => {
            event.preventDefault();
            const taskbarTarget =
              document.querySelector<HTMLElement>('#os-taskbar button') ??
              document.getElementById('os-taskbar');
            taskbarTarget?.focus();
          }}
          className="os-bevel-raised os-focus-ring font-chrome sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-44 focus:z-50 focus:px-3 focus:py-2 focus:text-[0.8125rem]"
          style={{
            backgroundColor: 'var(--color-panel)',
            color: 'var(--color-phosphor)',
          }}
        >
          Skip to taskbar
        </a>

        <main
          aria-label="Desktop"
          onClick={handleDesktopBackgroundClick}
          className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <Wallpaper />

          {showPhoneNotice && (
            <div
              role="status"
              onClick={(event) => event.stopPropagation()}
              className="os-bevel-raised relative z-30 mx-2 mt-2 flex items-center justify-between gap-2 border px-3 py-2"
              style={{
                backgroundColor: 'var(--color-panel-deep)',
                borderColor: 'var(--color-amber)',
                color: 'var(--color-paper)',
              }}
            >
              <p className="font-body text-[0.75rem] leading-snug">
                The Lost Internet works best on a tablet or desktop. Handheld mode is
                coming later.
              </p>
              <button
                type="button"
                aria-label="Dismiss handheld notice"
                onClick={handleDismissPhoneNotice}
                className="os-bevel-raised os-focus-ring flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center"
                style={{ color: 'var(--color-amber)' }}
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          )}

          <DesktopGrid />
          <WindowLayer />
          <PersistenceBanners />
          <CollectionToastHost />
          <DebugProgressPanel />
        </main>

        <Taskbar />
      </div>
    </MotionConfig>
  );
}
