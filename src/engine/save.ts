import type { AchievementDef, ArtifactDef } from '../content/collection';
import { recoverySummary } from './collection';
import type { Clue, Link } from './notebook';
import type { Site, SiteRegistry } from './types';
import { normalizeMeridianUrl } from './url';

export const CURRENT_SAVE_VERSION = 1;
export const MAX_SAVE_FILE_BYTES = 2 * 1024 * 1024;

export type Insight = {
  id: string;
  title: string;
  text: string;
  unlockedAt: number;
};

export type CollectionUnlockRecord = {
  id: string;
  unlockedAt: number;
};

export type SaveData = {
  saveVersion: number;
  savedAt: number;
  progress: {
    facts: string[];
    discoveredPages: string[];
  };
  notebook: {
    clues: Clue[];
    links: Link[];
    freeNotes: string;
    insights: Insight[];
  };
  collection: {
    unlockedArtifacts: CollectionUnlockRecord[];
    unlockedAchievements: CollectionUnlockRecord[];
    sourceViewedUrls: string[];
    spoilersHidden: boolean;
  };
  browser: {
    bookmarks: string[];
  };
};

export interface StoreSnapshots {
  progress: {
    facts: ReadonlySet<string>;
    discoveredPages: readonly string[];
  };
  notebook: {
    clues: readonly Clue[];
    links: readonly Link[];
    freeNotes: string;
    insights: readonly Insight[];
  };
  collection: {
    unlockedArtifacts: readonly CollectionUnlockRecord[];
    unlockedAchievements: readonly CollectionUnlockRecord[];
    sourceViewedUrls: readonly string[];
    spoilersHidden: boolean;
  };
  browser: {
    bookmarks: readonly string[];
  };
}

export interface SaveValidationContent {
  registry: Pick<SiteRegistry, 'allGrantedFacts' | 'pagesByUrl'>;
  artifacts: readonly Pick<ArtifactDef, 'id'>[];
  achievements: readonly Pick<AchievementDef, 'id'>[];
}

export type SaveValidationResult =
  | { ok: true; data: SaveData }
  | { ok: false; errors: string[] };

export function utf8ByteLength(text: string): number {
  let bytes = 0;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code <= 0x7f) {
      bytes += 1;
    } else if (code <= 0x7ff) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        bytes += 4;
        i += 1;
      } else {
        bytes += 3;
      }
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function cloneClue(clue: Clue): Clue {
  return {
    id: clue.id,
    text: clue.text,
    sourceUrl: clue.sourceUrl,
    sourceTitle: clue.sourceTitle,
    savedAt: clue.savedAt,
    ...(clue.note !== undefined ? { note: clue.note } : {}),
    tags: [...clue.tags],
    x: clue.x,
    y: clue.y,
  };
}

function cloneLink(link: Link): Link {
  return {
    id: link.id,
    fromClueId: link.fromClueId,
    toClueId: link.toClueId,
  };
}

function cloneInsight(insight: Insight): Insight {
  return {
    id: insight.id,
    title: insight.title,
    text: insight.text,
    unlockedAt: insight.unlockedAt,
  };
}

function cloneUnlockRecord(item: CollectionUnlockRecord): CollectionUnlockRecord {
  return {
    id: item.id,
    unlockedAt: item.unlockedAt,
  };
}

/**
 * Migration map keyed by source save version.
 * Version 0 represents an unversioned legacy save (such as earlier progress-only
 * or missing-browser snapshots) upgraded to saveVersion 1.
 */
export const migrations: Record<number, (old: unknown) => unknown> = {
  0: (old: unknown): unknown => {
    if (!isPlainObject(old)) {
      return old;
    }

    const legacyProgress = isPlainObject(old.progress)
      ? old.progress
      : {
          facts: 'facts' in old ? old.facts : [],
          discoveredPages: 'discoveredPages' in old ? old.discoveredPages : [],
        };

    const legacyNotebook = isPlainObject(old.notebook)
      ? {
          clues: 'clues' in old.notebook ? old.notebook.clues : [],
          links: 'links' in old.notebook ? old.notebook.links : [],
          freeNotes: 'freeNotes' in old.notebook ? old.notebook.freeNotes : '',
          insights: 'insights' in old.notebook ? old.notebook.insights : [],
        }
      : 'notebook' in old
        ? old.notebook
        : { clues: [], links: [], freeNotes: '', insights: [] };

    const legacyCollection = isPlainObject(old.collection)
      ? {
          unlockedArtifacts:
            'unlockedArtifacts' in old.collection
              ? old.collection.unlockedArtifacts
              : [],
          unlockedAchievements:
            'unlockedAchievements' in old.collection
              ? old.collection.unlockedAchievements
              : [],
          sourceViewedUrls:
            'sourceViewedUrls' in old.collection
              ? old.collection.sourceViewedUrls
              : [],
          spoilersHidden:
            'spoilersHidden' in old.collection
              ? old.collection.spoilersHidden
              : false,
        }
      : 'collection' in old
        ? old.collection
        : {
            unlockedArtifacts: [],
            unlockedAchievements: [],
            sourceViewedUrls: [],
            spoilersHidden: false,
          };

    const legacyBrowser = isPlainObject(old.browser)
      ? {
          bookmarks: 'bookmarks' in old.browser ? old.browser.bookmarks : [],
        }
      : 'browser' in old
        ? old.browser
        : { bookmarks: [] };

    return {
      saveVersion: 1,
      savedAt: 'savedAt' in old ? old.savedAt : 0,
      progress: legacyProgress,
      notebook: legacyNotebook,
      collection: legacyCollection,
      browser: legacyBrowser,
    };
  },
};

export function applySaveMigrations(
  raw: unknown
): { ok: true; data: unknown } | { ok: false; errors: string[] } {
  if (!isPlainObject(raw)) {
    return { ok: false, errors: ['Save payload must be a JSON object.'] };
  }

  let version: number;
  if (raw.saveVersion === undefined) {
    version = 0;
  } else if (
    typeof raw.saveVersion !== 'number' ||
    !Number.isInteger(raw.saveVersion) ||
    raw.saveVersion < 0
  ) {
    return {
      ok: false,
      errors: ['saveVersion must be a non-negative integer.'],
    };
  } else {
    version = raw.saveVersion;
  }

  if (version > CURRENT_SAVE_VERSION) {
    return {
      ok: false,
      errors: [
        `Save version ${version} is newer than this version of The Lost Internet supports (current version is ${CURRENT_SAVE_VERSION}).`,
      ],
    };
  }

  let current: unknown = raw;
  while (version < CURRENT_SAVE_VERSION) {
    const migrate = migrations[version];
    if (!migrate) {
      return {
        ok: false,
        errors: [`Missing migration path from save version ${version}.`],
      };
    }
    current = migrate(current);
    version += 1;
  }

  return { ok: true, data: current };
}

export function serializeState(
  snapshots: StoreSnapshots,
  savedAt: number = Date.now()
): SaveData {
  return {
    saveVersion: CURRENT_SAVE_VERSION,
    savedAt,
    progress: {
      facts: Array.from(snapshots.progress.facts),
      discoveredPages: [...snapshots.progress.discoveredPages],
    },
    notebook: {
      clues: snapshots.notebook.clues.map(cloneClue),
      links: snapshots.notebook.links.map(cloneLink),
      freeNotes: snapshots.notebook.freeNotes,
      insights: snapshots.notebook.insights.map(cloneInsight),
    },
    collection: {
      unlockedArtifacts: snapshots.collection.unlockedArtifacts.map(cloneUnlockRecord),
      unlockedAchievements: snapshots.collection.unlockedAchievements.map(cloneUnlockRecord),
      sourceViewedUrls: [...snapshots.collection.sourceViewedUrls],
      spoilersHidden: snapshots.collection.spoilersHidden,
    },
    browser: {
      bookmarks: [...snapshots.browser.bookmarks],
    },
  };
}

export function deserializeState(save: SaveData): StoreSnapshots {
  return {
    progress: {
      facts: new Set(save.progress.facts),
      discoveredPages: [...save.progress.discoveredPages],
    },
    notebook: {
      clues: save.notebook.clues.map(cloneClue),
      links: save.notebook.links.map(cloneLink),
      freeNotes: save.notebook.freeNotes,
      insights: save.notebook.insights.map(cloneInsight),
    },
    collection: {
      unlockedArtifacts: save.collection.unlockedArtifacts.map(cloneUnlockRecord),
      unlockedAchievements: save.collection.unlockedAchievements.map(cloneUnlockRecord),
      sourceViewedUrls: [...save.collection.sourceViewedUrls],
      spoilersHidden: save.collection.spoilersHidden,
    },
    browser: {
      bookmarks: [...save.browser.bookmarks],
    },
  };
}

export function getCanonicalSaveKey(save: SaveData): string {
  const { savedAt: _ignored, ...rest } = save;
  return JSON.stringify(rest);
}

function validateStringArray(
  value: unknown,
  path: string,
  errors: string[]
): string[] | null {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array of strings.`);
    return null;
  }
  const out: string[] = [];
  for (let i = 0; i < value.length; i += 1) {
    if (!isNonEmptyString(value[i])) {
      errors.push(`${path}[${i}] must be a string.`);
    } else {
      out.push(value[i] as string);
    }
  }
  return errors.length === 0 ? out : null;
}

function validateClue(
  raw: unknown,
  index: number,
  errors: string[]
): Clue | null {
  const prefix = `notebook.clues[${index}]`;
  if (!isPlainObject(raw)) {
    errors.push(`${prefix} must be an object.`);
    return null;
  }

  let valid = true;
  if (typeof raw.id !== 'string') {
    errors.push(`${prefix}.id must be a string.`);
    valid = false;
  }
  if (typeof raw.text !== 'string') {
    errors.push(`${prefix}.text must be a string.`);
    valid = false;
  }
  if (typeof raw.sourceUrl !== 'string') {
    errors.push(`${prefix}.sourceUrl must be a string.`);
    valid = false;
  }
  if (typeof raw.sourceTitle !== 'string') {
    errors.push(`${prefix}.sourceTitle must be a string.`);
    valid = false;
  }
  if (!isFiniteNumber(raw.savedAt)) {
    errors.push(`${prefix}.savedAt must be a finite number.`);
    valid = false;
  }
  if (raw.note !== undefined && typeof raw.note !== 'string') {
    errors.push(`${prefix}.note must be a string when provided.`);
    valid = false;
  }
  if (!Array.isArray(raw.tags) || raw.tags.some((t) => typeof t !== 'string')) {
    errors.push(`${prefix}.tags must be an array of strings.`);
    valid = false;
  }
  if (!isFiniteNumber(raw.x)) {
    errors.push(`${prefix}.x must be a finite number.`);
    valid = false;
  }
  if (!isFiniteNumber(raw.y)) {
    errors.push(`${prefix}.y must be a finite number.`);
    valid = false;
  }

  if (!valid) {
    return null;
  }

  return {
    id: raw.id as string,
    text: raw.text as string,
    sourceUrl: raw.sourceUrl as string,
    sourceTitle: raw.sourceTitle as string,
    savedAt: raw.savedAt as number,
    ...(raw.note !== undefined ? { note: raw.note as string } : {}),
    tags: [...(raw.tags as string[])],
    x: raw.x as number,
    y: raw.y as number,
  };
}

function validateLink(
  raw: unknown,
  index: number,
  errors: string[]
): Link | null {
  const prefix = `notebook.links[${index}]`;
  if (!isPlainObject(raw)) {
    errors.push(`${prefix} must be an object.`);
    return null;
  }

  let valid = true;
  if (typeof raw.id !== 'string') {
    errors.push(`${prefix}.id must be a string.`);
    valid = false;
  }
  if (typeof raw.fromClueId !== 'string') {
    errors.push(`${prefix}.fromClueId must be a string.`);
    valid = false;
  }
  if (typeof raw.toClueId !== 'string') {
    errors.push(`${prefix}.toClueId must be a string.`);
    valid = false;
  }

  if (!valid) {
    return null;
  }

  return {
    id: raw.id as string,
    fromClueId: raw.fromClueId as string,
    toClueId: raw.toClueId as string,
  };
}

function validateInsight(
  raw: unknown,
  index: number,
  errors: string[]
): Insight | null {
  const prefix = `notebook.insights[${index}]`;
  if (!isPlainObject(raw)) {
    errors.push(`${prefix} must be an object.`);
    return null;
  }

  let valid = true;
  if (typeof raw.id !== 'string') {
    errors.push(`${prefix}.id must be a string.`);
    valid = false;
  }
  if (typeof raw.title !== 'string') {
    errors.push(`${prefix}.title must be a string.`);
    valid = false;
  }
  if (typeof raw.text !== 'string') {
    errors.push(`${prefix}.text must be a string.`);
    valid = false;
  }
  if (!isFiniteNumber(raw.unlockedAt)) {
    errors.push(`${prefix}.unlockedAt must be a finite number.`);
    valid = false;
  }

  if (!valid) {
    return null;
  }

  return {
    id: raw.id as string,
    title: raw.title as string,
    text: raw.text as string,
    unlockedAt: raw.unlockedAt as number,
  };
}

function validateUnlockRecord(
  raw: unknown,
  path: string,
  errors: string[]
): CollectionUnlockRecord | null {
  if (!isPlainObject(raw)) {
    errors.push(`${path} must be an object.`);
    return null;
  }

  let valid = true;
  if (typeof raw.id !== 'string') {
    errors.push(`${path}.id must be a string.`);
    valid = false;
  }
  if (!isFiniteNumber(raw.unlockedAt)) {
    errors.push(`${path}.unlockedAt must be a finite number.`);
    valid = false;
  }

  if (!valid) {
    return null;
  }

  return {
    id: raw.id as string,
    unlockedAt: raw.unlockedAt as number,
  };
}

function deduplicateStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values));
}

function sanitizePageUrls(
  urls: readonly string[],
  pagesByUrl: ReadonlyMap<string, unknown>
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const normalized = normalizeMeridianUrl(raw);
    if (normalized && pagesByUrl.has(normalized) && !seen.has(normalized)) {
      seen.add(normalized);
      out.push(normalized);
    }
  }
  return out;
}

function sanitizeUnlockRecords(
  items: readonly CollectionUnlockRecord[],
  validIds: ReadonlySet<string>
): CollectionUnlockRecord[] {
  const seen = new Set<string>();
  const out: CollectionUnlockRecord[] = [];
  for (const item of items) {
    if (validIds.has(item.id) && !seen.has(item.id)) {
      seen.add(item.id);
      out.push({ id: item.id, unlockedAt: item.unlockedAt });
    }
  }
  return out;
}

export function validateSave(
  raw: unknown,
  content: SaveValidationContent
): SaveValidationResult {
  const migrated = applySaveMigrations(raw);
  if (!migrated.ok) {
    return migrated;
  }

  const candidate = migrated.data;
  if (!isPlainObject(candidate)) {
    return { ok: false, errors: ['Save payload must be a JSON object.'] };
  }

  const errors: string[] = [];

  if (candidate.saveVersion !== CURRENT_SAVE_VERSION) {
    errors.push(`saveVersion must equal ${CURRENT_SAVE_VERSION}.`);
  }

  if (!isFiniteNumber(candidate.savedAt) || candidate.savedAt < 0) {
    errors.push('savedAt must be a non-negative finite number.');
  }

  // progress
  let rawFacts: string[] = [];
  let rawDiscoveredPages: string[] = [];
  if (!isPlainObject(candidate.progress)) {
    errors.push('progress must be an object.');
  } else {
    const prevErrCount = errors.length;
    const facts = validateStringArray(
      candidate.progress.facts,
      'progress.facts',
      errors
    );
    if (facts && errors.length === prevErrCount) {
      rawFacts = facts;
    }

    const beforePagesCount = errors.length;
    const pages = validateStringArray(
      candidate.progress.discoveredPages,
      'progress.discoveredPages',
      errors
    );
    if (pages && errors.length === beforePagesCount) {
      rawDiscoveredPages = pages;
    }
  }

  // notebook
  const clues: Clue[] = [];
  const links: Link[] = [];
  let freeNotes = '';
  const insights: Insight[] = [];

  if (!isPlainObject(candidate.notebook)) {
    errors.push('notebook must be an object.');
  } else {
    if (!Array.isArray(candidate.notebook.clues)) {
      errors.push('notebook.clues must be an array.');
    } else {
      candidate.notebook.clues.forEach((item, index) => {
        const clean = validateClue(item, index, errors);
        if (clean) {
          clues.push(clean);
        }
      });
    }

    if (!Array.isArray(candidate.notebook.links)) {
      errors.push('notebook.links must be an array.');
    } else {
      candidate.notebook.links.forEach((item, index) => {
        const clean = validateLink(item, index, errors);
        if (clean) {
          links.push(clean);
        }
      });
    }

    if (typeof candidate.notebook.freeNotes !== 'string') {
      errors.push('notebook.freeNotes must be a string.');
    } else {
      freeNotes = candidate.notebook.freeNotes;
    }

    if (!Array.isArray(candidate.notebook.insights)) {
      errors.push('notebook.insights must be an array.');
    } else {
      candidate.notebook.insights.forEach((item, index) => {
        const clean = validateInsight(item, index, errors);
        if (clean) {
          insights.push(clean);
        }
      });
    }
  }

  // collection
  const unlockedArtifacts: CollectionUnlockRecord[] = [];
  const unlockedAchievements: CollectionUnlockRecord[] = [];
  let rawSourceViewedUrls: string[] = [];
  let spoilersHidden = false;

  if (!isPlainObject(candidate.collection)) {
    errors.push('collection must be an object.');
  } else {
    if (!Array.isArray(candidate.collection.unlockedArtifacts)) {
      errors.push('collection.unlockedArtifacts must be an array.');
    } else {
      candidate.collection.unlockedArtifacts.forEach((item, index) => {
        const clean = validateUnlockRecord(
          item,
          `collection.unlockedArtifacts[${index}]`,
          errors
        );
        if (clean) {
          unlockedArtifacts.push(clean);
        }
      });
    }

    if (!Array.isArray(candidate.collection.unlockedAchievements)) {
      errors.push('collection.unlockedAchievements must be an array.');
    } else {
      candidate.collection.unlockedAchievements.forEach((item, index) => {
        const clean = validateUnlockRecord(
          item,
          `collection.unlockedAchievements[${index}]`,
          errors
        );
        if (clean) {
          unlockedAchievements.push(clean);
        }
      });
    }

    const beforeUrlsCount = errors.length;
    const urls = validateStringArray(
      candidate.collection.sourceViewedUrls,
      'collection.sourceViewedUrls',
      errors
    );
    if (urls && errors.length === beforeUrlsCount) {
      rawSourceViewedUrls = urls;
    }

    if (typeof candidate.collection.spoilersHidden !== 'boolean') {
      errors.push('collection.spoilersHidden must be a boolean.');
    } else {
      spoilersHidden = candidate.collection.spoilersHidden;
    }
  }

  // browser
  let rawBookmarks: string[] = [];
  if (!isPlainObject(candidate.browser)) {
    errors.push('browser must be an object.');
  } else {
    const beforeCount = errors.length;
    const bookmarks = validateStringArray(
      candidate.browser.bookmarks,
      'browser.bookmarks',
      errors
    );
    if (bookmarks && errors.length === beforeCount) {
      rawBookmarks = bookmarks;
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const validArtifactIds = new Set(content.artifacts.map((a) => a.id));
  const validAchievementIds = new Set(content.achievements.map((a) => a.id));

  const cleanData: SaveData = {
    saveVersion: CURRENT_SAVE_VERSION,
    savedAt: candidate.savedAt as number,
    progress: {
      facts: deduplicateStrings(
        rawFacts.filter((factId) => content.registry.allGrantedFacts.has(factId))
      ),
      discoveredPages: sanitizePageUrls(
        rawDiscoveredPages,
        content.registry.pagesByUrl
      ),
    },
    notebook: {
      clues,
      links,
      freeNotes,
      insights,
    },
    collection: {
      unlockedArtifacts: sanitizeUnlockRecords(unlockedArtifacts, validArtifactIds),
      unlockedAchievements: sanitizeUnlockRecords(
        unlockedAchievements,
        validAchievementIds
      ),
      sourceViewedUrls: sanitizePageUrls(
        rawSourceViewedUrls,
        content.registry.pagesByUrl
      ),
      spoilersHidden,
    },
    browser: {
      bookmarks: sanitizePageUrls(rawBookmarks, content.registry.pagesByUrl),
    },
  };

  return { ok: true, data: cleanData };
}

export function importSave(
  rawText: string,
  content: SaveValidationContent
): SaveValidationResult {
  if (typeof rawText !== 'string') {
    return { ok: false, errors: ['Save input must be text.'] };
  }

  if (utf8ByteLength(rawText) > MAX_SAVE_FILE_BYTES) {
    return {
      ok: false,
      errors: ['Save file exceeds the 2 MB size limit.'],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON syntax.';
    return {
      ok: false,
      errors: [`Could not parse save JSON: ${message}`],
    };
  }

  return validateSave(parsed, content);
}

export function formatSaveSummary(
  save: SaveData,
  sites: readonly Site[]
): string {
  const summary = recoverySummary(
    sites,
    save.progress.discoveredPages,
    new Set(save.progress.facts)
  );
  const clueCount = save.notebook.clues.length;
  const artifactCount = save.collection.unlockedArtifacts.length;
  return `Found ${clueCount} ${clueCount === 1 ? 'clue' : 'clues'}, ${artifactCount} ${artifactCount === 1 ? 'artifact' : 'artifacts'}, ${summary.percent}% recovered`;
}
