import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { audioEngine } from '../../audio/audioEngine';
import { ALL_SITES } from '../../content/sites';
import {
  formatSaveSummary,
  importSave,
  type SaveData,
} from '../../engine/save';
import { emitShellEvent } from '../../events/eventBus';
import {
  buildCurrentSaveData,
  DEFAULT_VALIDATION_CONTENT,
  persistenceController,
  useSaveStatusStore,
} from '../../state/persistence/persistenceController';
import { ModalDialog } from '../../ui/ModalDialog';
import { triggerSaveFileDownload } from './saveExport';

function formatLastSavedTimestamp(lastSavedAt: number | null): string {
  if (lastSavedAt === null) {
    return 'Not saved yet';
  }
  try {
    return new Date(lastSavedAt).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return String(lastSavedAt);
  }
}

export function SaveDataTab() {
  const fileInputId = useId();
  const restartInputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const status = useSaveStatusStore((state) => state.status);
  const lastSavedAt = useSaveStatusStore((state) => state.lastSavedAt);
  const storageKind = useSaveStatusStore((state) => state.storageKind);
  const hasUnsavedChanges = useSaveStatusStore((state) => state.hasUnsavedChanges);
  const errorMessage = useSaveStatusStore((state) => state.errorMessage);

  const [feedback, setFeedback] = useState<{
    kind: 'info' | 'error';
    lines: string[];
  } | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    data: SaveData;
    summary: string;
    fileName: string;
  } | null>(null);
  const [restartOpen, setRestartOpen] = useState(false);
  const [restartConfirmText, setRestartConfirmText] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const storageDescription =
    storageKind === 'indexeddb'
      ? 'IndexedDB (persistent local browser storage)'
      : 'In-memory fallback (temporary for this tab)';

  const statusText =
    status === 'saving'
      ? 'Saving...'
      : status === 'error'
        ? 'Error saving'
        : hasUnsavedChanges || lastSavedAt === null
          ? 'Not saved'
          : 'Saved';

  const handleSaveNow = async () => {
    setFeedback(null);
    setIsBusy(true);
    const prevSavedAt = useSaveStatusStore.getState().lastSavedAt;
    const prevStatus = useSaveStatusStore.getState().status;
    const ok = await persistenceController.saveNow();
    setIsBusy(false);

    const nextState = useSaveStatusStore.getState();
    if (ok) {
      const msg = 'Progress saved to browser storage.';
      setFeedback({ kind: 'info', lines: [msg] });
      emitShellEvent({ type: 'os/announce', message: msg });
      if (nextState.lastSavedAt === prevSavedAt && prevStatus === 'saved') {
        audioEngine.playSound('save_tick', { visualCue: msg });
      }
    } else {
      const msg =
        nextState.errorMessage ??
        'Could not save progress to browser storage.';
      setFeedback({ kind: 'error', lines: [msg] });
      emitShellEvent({ type: 'os/announce', message: msg });
      if (prevStatus === 'error') {
        audioEngine.playSound('error_buzz', { visualCue: msg });
      }
    }
  };

  const handleExport = () => {
    const saveData = buildCurrentSaveData(Date.now());
    const filename = triggerSaveFileDownload(saveData);
    const msg = `Exported save file ${filename}.`;
    setFeedback({ kind: 'info', lines: [msg] });
    emitShellEvent({ type: 'os/announce', message: msg });
    audioEngine.playSound('save_tick', { visualCue: msg });
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    setFeedback(null);

    try {
      const rawText = await file.text();
      const result = importSave(rawText, DEFAULT_VALIDATION_CONTENT);
      if (!result.ok) {
        const listed = result.errors.slice(0, 3);
        setFeedback({
          kind: 'error',
          lines: listed,
        });
        const errMsg = `Import failed: ${listed[0] ?? 'Invalid save file.'}`;
        emitShellEvent({ type: 'os/announce', message: errMsg });
        audioEngine.playSound('error_buzz', { visualCue: errMsg });
        return;
      }

      const summary = formatSaveSummary(result.data, ALL_SITES);
      setPendingImport({
        data: result.data,
        summary,
        fileName: file.name,
      });
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Unable to read the selected file.';
      setFeedback({ kind: 'error', lines: [msg] });
      emitShellEvent({ type: 'os/announce', message: `Import failed: ${msg}` });
      audioEngine.playSound('error_buzz', { visualCue: `Import failed: ${msg}` });
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingImport) {
      return;
    }
    const target = pendingImport;
    setIsBusy(true);
    const ok = await persistenceController.replaceWithSave(target.data);
    setIsBusy(false);
    setPendingImport(null);

    const msg = ok
      ? `Save imported (${target.summary}) and saved.`
      : `Save imported (${target.summary}), though saving to disk reported an error.`;
    setFeedback({ kind: ok ? 'info' : 'error', lines: [msg] });
    emitShellEvent({ type: 'os/announce', message: msg });
  };

  const handleOpenRestart = () => {
    setRestartConfirmText('');
    setRestartOpen(true);
  };

  const handleConfirmRestart = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (restartConfirmText.trim() !== 'RESTART') {
      return;
    }
    setIsBusy(true);
    setRestartOpen(false);
    setRestartConfirmText('');
    emitShellEvent({
      type: 'os/announce',
      message: 'All progress cleared. Returning to boot screen.',
    });
    await persistenceController.startOver();
    setIsBusy(false);
  };

  const restartReady = restartConfirmText.trim() === 'RESTART';

  return (
    <>
      <section
        aria-labelledby="settings-save-heading"
        className="os-bevel-raised p-4"
        style={{ backgroundColor: 'var(--color-panel)' }}
      >
        <h2
          id="settings-save-heading"
          className="font-chrome border-b pb-2 text-[1.0625rem] font-bold tracking-[0.02em]"
          style={{
            color: 'var(--color-phosphor)',
            borderBottomColor: 'var(--bevel-dark)',
          }}
        >
          Save Data
        </h2>

        <dl
          className="os-bevel-sunken mt-3 grid grid-cols-1 gap-2 p-3 sm:grid-cols-[8.5rem_1fr]"
          style={{ backgroundColor: 'var(--color-panel-deep)' }}
        >
          <dt
            className="font-chrome text-[0.75rem]"
            style={{ color: 'var(--color-paper-muted)' }}
          >
            Storage mode
          </dt>
          <dd className="font-body text-[0.8125rem]" style={{ color: 'var(--color-paper)' }}>
            {storageDescription}
          </dd>

          <dt
            className="font-chrome text-[0.75rem]"
            style={{ color: 'var(--color-paper-muted)' }}
          >
            Save status
          </dt>
          <dd
            className="font-mono-tabular text-[0.8125rem]"
            style={{
              color:
                status === 'error'
                  ? 'var(--color-magenta)'
                  : status === 'saving'
                    ? 'var(--color-amber)'
                    : 'var(--color-phosphor)',
            }}
          >
            {statusText}
            {errorMessage ? ` — ${errorMessage}` : ''}
          </dd>

          <dt
            className="font-chrome text-[0.75rem]"
            style={{ color: 'var(--color-paper-muted)' }}
          >
            Last saved
          </dt>
          <dd
            className="font-mono-tabular text-[0.8125rem]"
            style={{ color: 'var(--color-paper)' }}
          >
            {formatLastSavedTimestamp(lastSavedAt)}
          </dd>
        </dl>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => void handleSaveNow()}
            className="os-bevel-raised os-focus-ring font-chrome h-9 cursor-pointer px-3.5 text-[0.8125rem] whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              backgroundColor: 'var(--color-panel-elevated)',
              color: 'var(--color-phosphor)',
            }}
          >
            Save now
          </button>

          <button
            type="button"
            disabled={isBusy}
            onClick={handleExport}
            className="os-bevel-raised os-focus-ring font-chrome h-9 cursor-pointer px-3.5 text-[0.8125rem] whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              backgroundColor: 'var(--color-panel-elevated)',
              color: 'var(--color-paper)',
            }}
          >
            Export save
          </button>

          <div>
            <label htmlFor={fileInputId} className="sr-only">
              Import save JSON file
            </label>
            <input
              ref={fileInputRef}
              id={fileInputId}
              type="file"
              accept=".json,application/json"
              tabIndex={-1}
              onChange={(e) => void handleFileChange(e)}
              className="sr-only"
            />
            <button
              type="button"
              disabled={isBusy}
              onClick={() => fileInputRef.current?.click()}
              className="os-bevel-raised os-focus-ring font-chrome h-9 cursor-pointer px-3.5 text-[0.8125rem] whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                backgroundColor: 'var(--color-panel-elevated)',
                color: 'var(--color-amber)',
              }}
            >
              Import save
            </button>
          </div>
        </div>

        {feedback && (
          <div
            role={feedback.kind === 'error' ? 'alert' : 'status'}
            className="os-bevel-sunken mt-3 border p-3"
            style={{
              backgroundColor: 'var(--color-bg)',
              borderColor:
                feedback.kind === 'error'
                  ? 'var(--color-magenta)'
                  : 'var(--color-phosphor)',
            }}
          >
            {feedback.kind === 'error' ? (
              <>
                <p
                  className="font-chrome text-[0.75rem] font-bold"
                  style={{ color: 'var(--color-magenta)' }}
                >
                  Could not complete save operation:
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-[0.75rem]">
                  {feedback.lines.map((line, index) => (
                    <li key={index} style={{ color: 'var(--color-paper)' }}>
                      {line}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="font-body text-[0.8125rem]" style={{ color: 'var(--color-paper)' }}>
                {feedback.lines[0]}
              </p>
            )}
          </div>
        )}

        <div
          className="mt-5 border-t pt-4"
          style={{ borderTopColor: 'var(--bevel-dark)' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3
                className="font-chrome text-[0.875rem] font-semibold"
                style={{ color: 'var(--color-magenta)' }}
              >
                Reset Workstation
              </h3>
              <p
                className="font-body mt-0.5 text-[0.75rem]"
                style={{ color: 'var(--color-paper-muted)' }}
              >
                Erase saved slots and backups from this browser and return to boot.
              </p>
            </div>
            <button
              type="button"
              disabled={isBusy}
              onClick={handleOpenRestart}
              className="os-bevel-raised os-focus-ring font-chrome h-9 shrink-0 cursor-pointer px-3.5 text-[0.8125rem] whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                backgroundColor: 'var(--color-panel-deep)',
                color: 'var(--color-magenta)',
              }}
            >
              Start over
            </button>
          </div>
        </div>
      </section>

      <ModalDialog
        open={pendingImport !== null}
        title="Replace your current progress?"
        accentColor="var(--color-amber)"
        onCancel={() => {
          setPendingImport(null);
          emitShellEvent({ type: 'os/announce', message: 'Import canceled.' });
        }}
      >
        {pendingImport && (
          <div className="space-y-3">
            <p className="font-body text-[0.8125rem]" style={{ color: 'var(--color-paper)' }}>
              File <strong className="font-mono-tabular">{pendingImport.fileName}</strong>{' '}
              is valid and ready to load:
            </p>
            <p
              className="os-bevel-sunken font-mono-tabular p-2.5 text-[0.8125rem]"
              style={{
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-phosphor)',
              }}
            >
              {pendingImport.summary}
            </p>
            <p
              className="font-body text-[0.75rem]"
              style={{ color: 'var(--color-paper-muted)' }}
            >
              Loading this file will replace your current progress, notebook clues,
              bookmarks, and collection unlocks.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setPendingImport(null);
                  emitShellEvent({ type: 'os/announce', message: 'Import canceled.' });
                }}
                className="os-bevel-raised os-focus-ring font-chrome h-9 cursor-pointer px-3.5 text-[0.8125rem] whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--color-panel-elevated)',
                  color: 'var(--color-paper)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => void handleConfirmImport()}
                className="os-bevel-raised os-focus-ring font-chrome h-9 cursor-pointer px-3.5 text-[0.8125rem] whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--color-panel-deep)',
                  color: 'var(--color-amber)',
                }}
              >
                Replace current progress
              </button>
            </div>
          </div>
        )}
      </ModalDialog>

      <ModalDialog
        open={restartOpen}
        title="Start over and erase progress?"
        accentColor="var(--color-magenta)"
        onCancel={() => {
          setRestartOpen(false);
          setRestartConfirmText('');
          emitShellEvent({ type: 'os/announce', message: 'Start over canceled.' });
        }}
      >
        <form onSubmit={(e) => void handleConfirmRestart(e)} className="space-y-3">
          <p className="font-body text-[0.8125rem]" style={{ color: 'var(--color-paper)' }}>
            This deletes your saved progress and rolling backup from browser storage,
            resets every app, and returns to the boot screen.
          </p>

          <div
            className="os-bevel-sunken flex flex-wrap items-center justify-between gap-2 p-2.5"
            style={{ backgroundColor: 'var(--color-bg)' }}
          >
            <span
              className="font-body text-[0.75rem]"
              style={{ color: 'var(--color-paper)' }}
            >
              Export a copy before you start over?
            </span>
            <button
              type="button"
              onClick={handleExport}
              className="os-bevel-raised os-focus-ring font-chrome h-8 cursor-pointer px-3 text-[0.75rem] whitespace-nowrap"
              style={{
                backgroundColor: 'var(--color-panel-elevated)',
                color: 'var(--color-phosphor)',
              }}
            >
              Export backup copy
            </button>
          </div>

          <div>
            <label
              htmlFor={restartInputId}
              className="font-chrome block text-[0.75rem]"
              style={{ color: 'var(--color-paper)' }}
            >
              Type RESTART to confirm
            </label>
            <input
              id={restartInputId}
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={restartConfirmText}
              onChange={(event) => setRestartConfirmText(event.target.value)}
              placeholder="RESTART"
              className="os-bevel-sunken os-focus-ring font-mono-tabular mt-1 h-9 w-full px-2.5 text-[0.8125rem]"
              style={{
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-paper)',
              }}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setRestartOpen(false);
                setRestartConfirmText('');
                emitShellEvent({
                  type: 'os/announce',
                  message: 'Start over canceled.',
                });
              }}
              className="os-bevel-raised os-focus-ring font-chrome h-9 cursor-pointer px-3.5 text-[0.8125rem] whitespace-nowrap"
              style={{
                backgroundColor: 'var(--color-panel-elevated)',
                color: 'var(--color-paper)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!restartReady || isBusy}
              className="os-bevel-raised os-focus-ring font-chrome h-9 cursor-pointer px-3.5 text-[0.8125rem] whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-panel-deep)',
                color: 'var(--color-magenta)',
              }}
            >
              Erase &amp; start over
            </button>
          </div>
        </form>
      </ModalDialog>
    </>
  );
}
