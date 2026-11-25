import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { audioEngine } from '../../audio/audioEngine';
import { useBrowserStore } from '../../state/browserStore';
import { useNotebookStore } from '../../state/notebookStore';
import { useWindowsStore } from '../../state/windowsStore';
import { BoardTab } from './BoardTab';
import { CluesTab } from './CluesTab';
import { NotesTab } from './NotesTab';

type NotebookTabId = 'clues' | 'board' | 'notes';

const TABS: ReadonlyArray<{ id: NotebookTabId; label: string }> = [
  { id: 'clues', label: 'Clues' },
  { id: 'board', label: 'Board' },
  { id: 'notes', label: 'Notes' },
];

export function NotebookApp() {
  const [activeTab, setActiveTab] = useState<NotebookTabId>('clues');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const baseId = useId();

  const clues = useNotebookStore((state) => state.clues);
  const links = useNotebookStore((state) => state.links);
  const freeNotes = useNotebookStore((state) => state.freeNotes);
  const insights = useNotebookStore((state) => state.insights);
  const updateClueNote = useNotebookStore((state) => state.updateClueNote);
  const removeClue = useNotebookStore((state) => state.removeClue);
  const moveClue = useNotebookStore((state) => state.moveClue);
  const addLink = useNotebookStore((state) => state.addLink);
  const removeLink = useNotebookStore((state) => state.removeLink);
  const hasLink = useNotebookStore((state) => state.hasLink);
  const updateFreeNotes = useNotebookStore((state) => state.updateFreeNotes);

  const handleOpenSourceUrl = (url: string) => {
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

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div
        role="tablist"
        aria-label="Notebook sections"
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
          const countSuffix =
            tab.id === 'clues' && clues.length > 0 ? ` (${clues.length})` : '';

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
              {countSuffix}
            </button>
          );
        })}
      </div>

      <div
        id={`${baseId}-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${activeTab}`}
        className="min-h-0 flex-1"
      >
        {activeTab === 'clues' && (
          <CluesTab
            clues={clues}
            onOpenSourceUrl={handleOpenSourceUrl}
            onUpdateNote={updateClueNote}
            onDeleteClue={removeClue}
          />
        )}

        {activeTab === 'board' && (
          <BoardTab
            clues={clues}
            links={links}
            hasLink={hasLink}
            onMoveClue={moveClue}
            onCreateLink={addLink}
            onRemoveLink={removeLink}
          />
        )}

        {activeTab === 'notes' && (
          <NotesTab
            freeNotes={freeNotes}
            insights={insights}
            onSaveNotes={updateFreeNotes}
          />
        )}
      </div>
    </div>
  );
}
