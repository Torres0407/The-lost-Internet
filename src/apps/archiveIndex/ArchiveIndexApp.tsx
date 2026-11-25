import { AnimatePresence, motion } from 'motion/react';
import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { audioEngine } from '../../audio/audioEngine';
import { ALL_SITES } from '../../content/sites';
import { recoverySummary } from '../../engine/collection';
import { useBrowserStore } from '../../state/browserStore';
import { useCollectionStore } from '../../state/collectionStore';
import { selectDiscoveredPages, selectFacts, useProgressStore } from '../../state/progressStore';
import { useWindowsStore } from '../../state/windowsStore';
import { AchievementsTab } from './AchievementsTab';
import { ArtifactsTab } from './ArtifactsTab';
import { RecoveryTab } from './RecoveryTab';

type ArchiveTabId = 'recovery' | 'artifacts' | 'achievements';

const TABS: ReadonlyArray<{ id: ArchiveTabId; label: string }> = [
  { id: 'recovery', label: 'Recovery' },
  { id: 'artifacts', label: 'Artifacts' },
  { id: 'achievements', label: 'Achievements' },
];

export function ArchiveIndexApp() {
  const [activeTab, setActiveTab] = useState<ArchiveTabId>('recovery');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const baseId = useId();

  const facts = useProgressStore(selectFacts);
  const discoveredPages = useProgressStore(selectDiscoveredPages);
  const unlockedArtifacts = useCollectionStore((state) => state.unlockedArtifacts);
  const unlockedAchievements = useCollectionStore((state) => state.unlockedAchievements);
  const spoilersHidden = useCollectionStore((state) => state.spoilersHidden);
  const toggleSpoilersHidden = useCollectionStore((state) => state.toggleSpoilersHidden);

  const summary = useMemo(
    () => recoverySummary(ALL_SITES, discoveredPages, facts),
    [discoveredPages, facts]
  );

  const handleOpenSite = (url: string) => {
    const windowsState = useWindowsStore.getState();
    const browserState = useBrowserStore.getState();
    const existingBrowserWin = Object.values(windowsState.windows).find(
      (win) => win.appId === 'browser'
    );

    if (existingBrowserWin) {
      browserState.navigate(existingBrowserWin.id, url);
      windowsState.focusWindow(existingBrowserWin.id);
    } else {
      windowsState.openWindow('browser');
      const opened = Object.values(useWindowsStore.getState().windows).find(
        (win) => win.appId === 'browser'
      );
      if (opened) {
        browserState.navigate(opened.id, url);
      }
    }
  };

  const handleTabKeyDown =
    (index: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
      let nextIndex: number | null = null;
      if (event.key === 'ArrowRight') {
        nextIndex = (index + 1) % TABS.length;
      } else if (event.key === 'ArrowLeft') {
        nextIndex = (index - 1 + TABS.length) % TABS.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = TABS.length - 1;
      }

      if (nextIndex !== null) {
        event.preventDefault();
        setActiveTab(TABS[nextIndex].id);
        audioEngine.playSound('ui_click');
        tabRefs.current[nextIndex]?.focus();
      }
    };

  const progressText = `${summary.sitesRecovered} of ${summary.ringSlots} Ring sites recovered, ${summary.percent}%`;

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <header
        className="shrink-0 border-b px-3 py-2.5"
        style={{
          backgroundColor: 'var(--color-panel-deep)',
          borderBottomColor: 'var(--bevel-dark)',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p
              className="font-mono-tabular text-[12px] font-semibold"
              style={{ color: 'var(--color-paper)' }}
            >
              {progressText}
            </p>
            <div
              role="progressbar"
              aria-label="Overall Meridian Ring recovery"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={summary.percent}
              aria-valuetext={progressText}
              className="os-bevel-sunken mt-1.5 h-3 w-full overflow-hidden p-0.5"
              style={{ backgroundColor: 'var(--color-bg)' }}
            >
              <div
                className="h-full transition-[width] duration-150"
                style={{
                  width: `${summary.percent}%`,
                  backgroundColor: 'var(--color-phosphor)',
                }}
              />
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={spoilersHidden}
            onClick={toggleSpoilersHidden}
            className="os-bevel-raised os-focus-ring font-chrome flex h-8 shrink-0 cursor-pointer items-center gap-2 px-2.5 text-[12px] whitespace-nowrap"
            style={{
              backgroundColor: spoilersHidden
                ? 'var(--color-bg)'
                : 'var(--color-panel-elevated)',
              color: spoilersHidden
                ? 'var(--color-amber)'
                : 'var(--color-paper)',
            }}
          >
            <span>Hide spoilers:</span>
            <span className="font-mono-tabular font-bold">
              {spoilersHidden ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </header>

      <div
        role="tablist"
        aria-label="Archive Index sections"
        className="flex shrink-0 items-center gap-1 border-b px-2 pt-2"
        style={{
          backgroundColor: 'var(--color-panel)',
          borderBottomColor: 'var(--bevel-dark)',
        }}
      >
        {TABS.map((tab, index) => {
          const isSelected = activeTab === tab.id;
          const tabDomId = `${baseId}-tab-${tab.id}`;
          const panelDomId = `${baseId}-panel-${tab.id}`;
          const countLabel =
            tab.id === 'artifacts'
              ? ` (${unlockedArtifacts.length}/10)`
              : tab.id === 'achievements'
                ? ` (${unlockedAchievements.length}/8)`
                : '';

          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              id={tabDomId}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={panelDomId}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => {
                setActiveTab(tab.id);
                audioEngine.playSound('ui_click');
              }}
              onKeyDown={handleTabKeyDown(index)}
              className={`${isSelected ? 'os-bevel-sunken' : 'os-bevel-raised'} os-focus-ring font-chrome h-8 cursor-pointer px-3.5 text-[13px] whitespace-nowrap`}
              style={{
                color: isSelected ? 'var(--color-phosphor)' : 'var(--color-paper)',
                backgroundColor: isSelected
                  ? 'var(--color-bg)'
                  : 'var(--color-panel-elevated)',
              }}
            >
              {tab.label}
              {countLabel}
            </button>
          );
        })}
      </div>

      <div
        id={`${baseId}-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${activeTab}`}
        className="min-h-0 flex-1 overflow-hidden"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="h-full min-h-0"
          >
            {activeTab === 'recovery' && (
              <RecoveryTab summary={summary} onOpenSite={handleOpenSite} />
            )}

            {activeTab === 'artifacts' && (
              <ArtifactsTab
                unlockedArtifacts={unlockedArtifacts}
                spoilersHidden={spoilersHidden}
              />
            )}

            {activeTab === 'achievements' && (
              <AchievementsTab
                unlockedAchievements={unlockedAchievements}
                spoilersHidden={spoilersHidden}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
