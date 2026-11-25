import { GAME_REGISTRY } from '../engine/gameRegistry';
import { resolveWithProgress } from '../engine/resolve';
import { useBrowserStore } from '../state/browserStore';
import { selectFacts, useProgressStore } from '../state/progressStore';
import { useWindowsStore } from '../state/windowsStore';

export function HistoryApp() {
  const tabs = useBrowserStore((state) => state.tabs);
  const facts = useProgressStore(selectFacts);
  const activeBrowserWindowId = useBrowserStore(
    (state) => state.activeBrowserWindowId
  );
  const navigate = useBrowserStore((state) => state.navigate);
  const focusWindow = useWindowsStore((state) => state.focusWindow);
  const openWindow = useWindowsStore((state) => state.openWindow);

  const targetBrowserId =
    (activeBrowserWindowId && tabs[activeBrowserWindowId] ? activeBrowserWindowId : null) ??
    Object.keys(tabs)[0] ??
    'win-browser';

  const tab = tabs[targetBrowserId];
  const entries = tab ? [...tab.history].map((url, idx) => ({ url, idx })).reverse() : [];

  const handleSelectEntry = (url: string) => {
    navigate(targetBrowserId, url);
    if (useWindowsStore.getState().windows[targetBrowserId]) {
      focusWindow(targetBrowserId);
    } else {
      openWindow('browser');
    }
  };

  if (entries.length === 0) {
    return (
      <div className="p-5">
        <p className="font-body text-[14px]" style={{ color: 'var(--color-paper-muted)' }}>
          No browsing history recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-paper)' }}
    >
      <div
        className="shrink-0 border-b px-3 py-2"
        style={{
          backgroundColor: 'var(--color-panel)',
          borderBottomColor: 'var(--bevel-dark)',
        }}
      >
        <p className="font-body text-[0.75rem]" style={{ color: 'var(--color-paper-muted)' }}>
          Select an entry to open it in the browser.
        </p>
      </div>

      <ul className="min-h-0 flex-1 divide-y overflow-y-auto" style={{ borderColor: 'var(--bevel-dark)' }}>
        {entries.map(({ url, idx }) => {
          const result = resolveWithProgress(url, GAME_REGISTRY, facts);
          const title =
            result.status === 'ok' ? result.page.title : '404 — Node Not Recovered';
          const isCurrent = tab ? idx === tab.index : false;

          return (
            <li key={`${idx}-${url}`}>
              <button
                type="button"
                onClick={() => handleSelectEntry(url)}
                className="os-focus-ring flex w-full cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-[var(--color-panel-deep)]"
              >
                <div className="min-w-0">
                  <div
                    className="font-body truncate text-[13px] font-medium"
                    style={{
                      color: isCurrent ? 'var(--color-phosphor)' : 'var(--color-paper)',
                    }}
                  >
                    {title}
                  </div>
                  <div
                    className="font-mono-tabular truncate text-[11px]"
                    style={{ color: 'var(--color-paper-muted)' }}
                  >
                    {url}
                  </div>
                </div>
                {isCurrent && (
                  <span
                    className="font-chrome shrink-0 text-[11px]"
                    style={{ color: 'var(--color-amber)' }}
                  >
                    Current
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
