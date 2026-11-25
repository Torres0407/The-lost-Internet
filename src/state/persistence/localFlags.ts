export const TLI_LAST_SAVED_AT_KEY = 'tli:lastSavedAt';
export const TLI_STORAGE_WARNING_DISMISSED_KEY = 'tli:storageWarningDismissed';

export function readLastSavedAtFlag(): number | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    const raw = window.localStorage.getItem(TLI_LAST_SAVED_AT_KEY);
    if (!raw) {
      return null;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function writeLastSavedAtFlag(timestamp: number | null): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    if (timestamp === null) {
      window.localStorage.removeItem(TLI_LAST_SAVED_AT_KEY);
    } else {
      window.localStorage.setItem(TLI_LAST_SAVED_AT_KEY, String(timestamp));
    }
  } catch {
    // Ignore localStorage access failures in restricted environments
  }
}

export function readStorageWarningDismissedFlag(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    return window.localStorage.getItem(TLI_STORAGE_WARNING_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeStorageWarningDismissedFlag(dismissed: boolean): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    if (dismissed) {
      window.localStorage.setItem(TLI_STORAGE_WARNING_DISMISSED_KEY, '1');
    } else {
      window.localStorage.removeItem(TLI_STORAGE_WARNING_DISMISSED_KEY);
    }
  } catch {
    // Ignore localStorage access failures
  }
}
