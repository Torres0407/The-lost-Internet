import { useState, type FormEvent } from 'react';
import { audioEngine } from '../audio/audioEngine';
import { GAME_REGISTRY } from '../engine/gameRegistry';
import { useCollectionStore } from '../state/collectionStore';
import { useNotebookStore } from '../state/notebookStore';
import {
  buildCurrentSaveData,
  persistenceController,
} from '../state/persistence/persistenceController';
import { selectDiscoveredPages, selectFacts, useProgressStore } from '../state/progressStore';
import { useSettingsStore } from '../state/settingsStore';

function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return new URLSearchParams(window.location.search).get('debug') === '1';
}

function DebugSystemControls() {
  const triggerBootReplay = useSettingsStore((state) => state.triggerBootReplay);
  const resetSettings = useSettingsStore((state) => state.resetSettings);
  const toggleForcedHighContrastOverride = useSettingsStore(
    (state) => state.toggleForcedHighContrastOverride
  );
  const forcedHighContrastOverride = useSettingsStore(
    (state) => state.forcedHighContrastOverride
  );

  return (
    <div className="space-y-1.5">
      <p
        className="font-body text-[0.6875rem]"
        style={{ color: 'var(--color-paper-muted)' }}
      >
        Boot, Audio &amp; Display
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={triggerBootReplay}
          className="os-bevel-raised os-focus-ring font-chrome h-7 cursor-pointer px-1.5 text-[0.6875rem]"
          style={{ color: 'var(--color-phosphor)' }}
        >
          Show boot again
        </button>
        <button
          type="button"
          onClick={resetSettings}
          className="os-bevel-raised os-focus-ring font-chrome h-7 cursor-pointer px-1.5 text-[0.6875rem]"
          style={{ color: 'var(--color-amber)' }}
        >
          Reset settings
        </button>
        <button
          type="button"
          onClick={() => audioEngine.playAllSoundsDebug()}
          className="os-bevel-raised os-focus-ring font-chrome h-7 cursor-pointer px-1.5 text-[0.6875rem]"
          style={{ color: 'var(--color-phosphor)' }}
        >
          Play every sound
        </button>
        <button
          type="button"
          onClick={toggleForcedHighContrastOverride}
          aria-pressed={forcedHighContrastOverride}
          className="os-bevel-raised os-focus-ring font-chrome h-7 cursor-pointer px-1.5 text-[0.6875rem]"
          style={{ color: 'var(--color-paper)' }}
        >
          {forcedHighContrastOverride ? 'Contrast: Forced' : 'Toggle forced high contrast'}
        </button>
      </div>
    </div>
  );
}

export function DebugProgressPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const [factInput, setFactInput] = useState('');

  const facts = useProgressStore(selectFacts);
  const discoveredPages = useProgressStore(selectDiscoveredPages);
  const addFacts = useProgressStore((state) => state.addFacts);
  const removeFact = useProgressStore((state) => state.removeFact);
  const resetProgress = useProgressStore((state) => state.resetProgress);
  const clueCount = useNotebookStore((state) => state.clues.length);
  const addSampleClues = useNotebookStore((state) => state.addSampleClues);
  const clearNotebook = useNotebookStore((state) => state.clearNotebook);
  const unlockedArtifactsCount = useCollectionStore(
    (state) => state.unlockedArtifacts.length
  );
  const unlockedAchievementsCount = useCollectionStore(
    (state) => state.unlockedAchievements.length
  );
  const unlockAllArtifacts = useCollectionStore((state) => state.unlockAllArtifacts);
  const unlockAllAchievements = useCollectionStore(
    (state) => state.unlockAllAchievements
  );
  const resetCollection = useCollectionStore((state) => state.resetCollection);

  if (!isDebugEnabled()) {
    return null;
  }

  const factList = Array.from(facts);
  const knownGameFacts = Array.from(GAME_REGISTRY.allGrantedFacts);

  const handleAddSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = factInput.trim();
    if (!trimmed) {
      return;
    }
    addFacts([trimmed]);
    setFactInput('');
  };

  return (
    <aside
      aria-label="Progress debug panel"
      onClick={(event) => event.stopPropagation()}
      className="os-bevel-raised fixed top-3 right-3 z-40 max-h-[calc(100dvh-5rem)] w-[17.5rem] overflow-y-auto p-2.5 shadow-xl"
      style={{ backgroundColor: 'var(--color-panel)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          className="font-chrome text-[0.8125rem] font-semibold"
          style={{ color: 'var(--color-amber)' }}
        >
          Debug Progress
        </h2>
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-expanded={!collapsed}
          className="os-bevel-raised os-focus-ring font-chrome cursor-pointer px-2 py-0.5 text-[0.6875rem]"
          style={{ color: 'var(--color-paper)' }}
        >
          {collapsed ? 'Expand' : 'Hide'}
        </button>
      </div>

      {!collapsed && (
        <div className="mt-2.5 space-y-2.5">
          <div>
            <p
              className="font-body mb-1 text-[0.6875rem]"
              style={{ color: 'var(--color-paper-muted)' }}
            >
              Known facts ({factList.length}) · Pages ({discoveredPages.length})
            </p>
            {factList.length === 0 ? (
              <p
                className="font-mono-tabular text-[0.6875rem]"
                style={{ color: 'var(--color-paper-muted)' }}
              >
                None
              </p>
            ) : (
              <ul className="max-h-28 space-y-1 overflow-y-auto">
                {factList.map((factId) => (
                  <li
                    key={factId}
                    className="os-bevel-sunken flex items-center justify-between gap-2 px-2 py-1"
                  >
                    <span
                      className="font-mono-tabular truncate text-[0.6875rem]"
                      style={{ color: 'var(--color-phosphor)' }}
                    >
                      {factId}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove fact ${factId}`}
                      onClick={() => removeFact(factId)}
                      className="os-focus-ring font-chrome cursor-pointer px-1 text-[0.75rem]"
                      style={{ color: 'var(--color-magenta)' }}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={handleAddSubmit} className="flex items-center gap-1.5">
            <label htmlFor="debug-fact-input" className="sr-only">
              Fact id
            </label>
            <input
              id="debug-fact-input"
              type="text"
              value={factInput}
              onChange={(event) => setFactInput(event.target.value)}
              placeholder="fact_id"
              list="debug-known-facts"
              className="os-bevel-sunken os-focus-ring font-mono-tabular h-7 min-w-0 flex-1 px-2 text-[0.75rem]"
              style={{
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-paper)',
              }}
            />
            <datalist id="debug-known-facts">
              {knownGameFacts.map((id) => (
                <option key={id} value={id} />
              ))}
            </datalist>
            <button
              type="submit"
              className="os-bevel-raised os-focus-ring font-chrome h-7 cursor-pointer px-2 text-[0.6875rem]"
              style={{ color: 'var(--color-phosphor)' }}
            >
              Add
            </button>
          </form>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={addSampleClues}
              className="os-bevel-raised os-focus-ring font-chrome h-7 cursor-pointer px-2 text-[0.6875rem]"
              style={{ color: 'var(--color-phosphor)' }}
            >
              Add sample clues
            </button>
            <button
              type="button"
              onClick={clearNotebook}
              className="os-bevel-raised os-focus-ring font-chrome h-7 cursor-pointer px-2 text-[0.6875rem]"
              style={{ color: 'var(--color-amber)' }}
            >
              Clear notebook ({clueCount})
            </button>
          </div>

          <div className="space-y-1.5">
            <p
              className="font-body text-[0.6875rem]"
              style={{ color: 'var(--color-paper-muted)' }}
            >
              Collection · Artifacts ({unlockedArtifactsCount}/10) · Achievements (
              {unlockedAchievementsCount}/8)
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={unlockAllArtifacts}
                className="os-bevel-raised os-focus-ring font-chrome h-7 cursor-pointer px-1.5 text-[0.6875rem]"
                style={{ color: 'var(--color-phosphor)' }}
              >
                Unlock all artifacts
              </button>
              <button
                type="button"
                onClick={unlockAllAchievements}
                className="os-bevel-raised os-focus-ring font-chrome h-7 cursor-pointer px-1.5 text-[0.6875rem]"
                style={{ color: 'var(--color-phosphor)' }}
              >
                Unlock all achievements
              </button>
            </div>
            <button
              type="button"
              onClick={resetCollection}
              className="os-bevel-raised os-focus-ring font-chrome h-7 w-full cursor-pointer text-[0.6875rem]"
              style={{ color: 'var(--color-amber)' }}
            >
              Clear collection
            </button>
          </div>

          <div className="space-y-1.5">
            <p
              className="font-body text-[0.6875rem]"
              style={{ color: 'var(--color-paper-muted)' }}
            >
              Persistence
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => void persistenceController.saveNow()}
                className="os-bevel-raised os-focus-ring font-chrome h-7 cursor-pointer px-1.5 text-[0.6875rem]"
                style={{ color: 'var(--color-phosphor)' }}
              >
                Force save
              </button>
              <button
                type="button"
                onClick={() => void persistenceController.corruptMainSave()}
                className="os-bevel-raised os-focus-ring font-chrome h-7 cursor-pointer px-1.5 text-[0.6875rem]"
                style={{ color: 'var(--color-magenta)' }}
              >
                Corrupt main save
              </button>
              <button
                type="button"
                onClick={() => persistenceController.simulateIndexedDbFailure()}
                className="os-bevel-raised os-focus-ring font-chrome h-7 cursor-pointer px-1.5 text-[0.6875rem]"
                style={{ color: 'var(--color-amber)' }}
              >
                Simulate IndexedDB failure
              </button>
              <button
                type="button"
                onClick={() => {
                  const json = JSON.stringify(buildCurrentSaveData(), null, 2);
                  console.log('[The Lost Internet Save JSON]', json);
                }}
                className="os-bevel-raised os-focus-ring font-chrome h-7 cursor-pointer px-1.5 text-[0.6875rem]"
                style={{ color: 'var(--color-paper)' }}
              >
                Print save JSON
              </button>
            </div>
          </div>

          <DebugSystemControls />

          <button
            type="button"
            onClick={resetProgress}
            className="os-bevel-raised os-focus-ring font-chrome h-7 w-full cursor-pointer text-[0.75rem]"
            style={{ color: 'var(--color-magenta)' }}
          >
            Reset progress
          </button>
        </div>
      )}
    </aside>
  );
}
