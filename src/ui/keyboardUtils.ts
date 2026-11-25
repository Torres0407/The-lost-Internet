export function isEditableEventTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== 'object') {
    return false;
  }
  const el = target as {
    tagName?: string;
    isContentEditable?: boolean;
  };
  const tag = typeof el.tagName === 'string' ? el.tagName.toUpperCase() : '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }
  return Boolean(el.isContentEditable);
}

export function isHelpShortcutKeyEvent(event: {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  target?: EventTarget | null;
  composedPath?: () => EventTarget[];
}): boolean {
  if (event.key !== '?' || event.ctrlKey || event.metaKey || event.altKey) {
    return false;
  }
  if (isEditableEventTarget(event.target ?? null)) {
    return false;
  }
  if (typeof event.composedPath === 'function') {
    for (const node of event.composedPath()) {
      if (isEditableEventTarget(node)) {
        return false;
      }
    }
  }
  if (typeof document !== 'undefined' && isEditableEventTarget(document.activeElement)) {
    return false;
  }
  return true;
}
