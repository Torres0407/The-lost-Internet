import type { SaveData } from '../../engine/save';

export const EXPORT_SAVE_NOTE =
  'The Lost Internet local save file. Contains only in-game progress, notebook entries, bookmarks, and collection milestones.';

export interface ExportedSavePayload extends SaveData {
  note: string;
}

export function formatSaveDateSlug(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildExportFilename(date: Date = new Date()): string {
  return `the-lost-internet-save-${formatSaveDateSlug(date)}.json`;
}

export function buildExportSavePayload(save: SaveData): ExportedSavePayload {
  return {
    note: EXPORT_SAVE_NOTE,
    saveVersion: save.saveVersion,
    savedAt: save.savedAt,
    progress: save.progress,
    notebook: save.notebook,
    collection: save.collection,
    browser: save.browser,
  };
}

export function triggerSaveFileDownload(save: SaveData, date: Date = new Date()): string {
  const filename = buildExportFilename(date);
  const payload = buildExportSavePayload(save);
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const objectUrl = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 0);
  }

  return filename;
}
