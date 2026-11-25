import { normalizeMeridianUrl } from './url';

export type Clue = {
  id: string;
  text: string;
  sourceUrl: string;
  sourceTitle: string;
  savedAt: number;
  note?: string;
  tags: string[];
  x: number;
  y: number;
};

export type Link = {
  id: string;
  fromClueId: string;
  toClueId: string;
};

export type NotebookState = {
  clues: Clue[];
  links: Link[];
  freeNotes: string;
};

export interface AddClueInput {
  id?: string;
  text: string;
  sourceUrl: string;
  sourceTitle: string;
  savedAt?: number;
  note?: string;
  tags?: string[];
  x?: number;
  y?: number;
}

export interface AddClueResult {
  state: NotebookState;
  clue: Clue;
  duplicate: boolean;
}

export interface AddLinkResult {
  state: NotebookState;
  link: Link | null;
  created: boolean;
}

export function createInitialNotebookState(): NotebookState {
  return {
    clues: [],
    links: [],
    freeNotes: '',
  };
}

export function normalizeNotebookText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

function normalizeSourceUrl(url: string): string {
  return normalizeMeridianUrl(url) ?? url.trim();
}

function defaultCardPosition(index: number): { x: number; y: number } {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return {
    x: 28 + col * 240,
    y: 28 + row * 170,
  };
}

export function addClue(
  state: NotebookState,
  input: AddClueInput
): AddClueResult {
  const normalizedText = normalizeNotebookText(input.text);
  const normalizedUrl = normalizeSourceUrl(input.sourceUrl);

  const existing = state.clues.find(
    (item) =>
      normalizeNotebookText(item.text) === normalizedText &&
      normalizeSourceUrl(item.sourceUrl) === normalizedUrl
  );

  if (existing) {
    return {
      state,
      clue: existing,
      duplicate: true,
    };
  }

  const fallbackPos = defaultCardPosition(state.clues.length);
  const id =
    input.id ??
    `clue-${state.clues.length + 1}-${Math.abs(hashString(`${normalizedUrl}|${normalizedText}`))}`;

  const clue: Clue = {
    id,
    text: normalizedText,
    sourceUrl: normalizedUrl,
    sourceTitle: input.sourceTitle.trim() || normalizedUrl,
    savedAt: input.savedAt ?? Date.now(),
    ...(input.note !== undefined ? { note: input.note } : {}),
    tags: input.tags ? [...input.tags] : [],
    x: input.x ?? fallbackPos.x,
    y: input.y ?? fallbackPos.y,
  };

  return {
    state: {
      ...state,
      clues: [...state.clues, clue],
    },
    clue,
    duplicate: false,
  };
}

export function removeClue(state: NotebookState, id: string): NotebookState {
  const exists = state.clues.some((c) => c.id === id);
  if (!exists) {
    return state;
  }

  return {
    ...state,
    clues: state.clues.filter((c) => c.id !== id),
    links: state.links.filter(
      (link) => link.fromClueId !== id && link.toClueId !== id
    ),
  };
}

export function updateClueNote(
  state: NotebookState,
  id: string,
  note: string
): NotebookState {
  let changed = false;
  const nextClues = state.clues.map((clue) => {
    if (clue.id !== id) {
      return clue;
    }
    if (clue.note === note) {
      return clue;
    }
    changed = true;
    return {
      ...clue,
      note,
    };
  });

  if (!changed) {
    return state;
  }

  return {
    ...state,
    clues: nextClues,
  };
}

export function moveClue(
  state: NotebookState,
  id: string,
  x: number,
  y: number
): NotebookState {
  const clampedX = Math.max(0, Math.round(x));
  const clampedY = Math.max(0, Math.round(y));

  let changed = false;
  const nextClues = state.clues.map((clue) => {
    if (clue.id !== id) {
      return clue;
    }
    if (clue.x === clampedX && clue.y === clampedY) {
      return clue;
    }
    changed = true;
    return {
      ...clue,
      x: clampedX,
      y: clampedY,
    };
  });

  if (!changed) {
    return state;
  }

  return {
    ...state,
    clues: nextClues,
  };
}

export function hasLink(state: NotebookState, a: string, b: string): boolean {
  if (a === b) {
    return false;
  }
  return state.links.some(
    (link) =>
      (link.fromClueId === a && link.toClueId === b) ||
      (link.fromClueId === b && link.toClueId === a)
  );
}

export function addLink(
  state: NotebookState,
  a: string,
  b: string
): AddLinkResult {
  if (!a || !b || a === b) {
    return { state, link: null, created: false };
  }

  const hasA = state.clues.some((c) => c.id === a);
  const hasB = state.clues.some((c) => c.id === b);
  if (!hasA || !hasB) {
    return { state, link: null, created: false };
  }

  const existing = state.links.find(
    (link) =>
      (link.fromClueId === a && link.toClueId === b) ||
      (link.fromClueId === b && link.toClueId === a)
  );
  if (existing) {
    return { state, link: existing, created: false };
  }

  const [first, second] = a < b ? [a, b] : [b, a];
  const link: Link = {
    id: `link-${first}--${second}`,
    fromClueId: a,
    toClueId: b,
  };

  return {
    state: {
      ...state,
      links: [...state.links, link],
    },
    link,
    created: true,
  };
}

export function removeLink(state: NotebookState, id: string): NotebookState {
  const exists = state.links.some((l) => l.id === id);
  if (!exists) {
    return state;
  }
  return {
    ...state,
    links: state.links.filter((l) => l.id !== id),
  };
}

export function updateFreeNotes(
  state: NotebookState,
  freeNotes: string
): NotebookState {
  if (state.freeNotes === freeNotes) {
    return state;
  }
  return {
    ...state,
    freeNotes,
  };
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return hash;
}
