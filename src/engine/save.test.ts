import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, ARTIFACTS } from '../content/collection';
import { ALL_SITES } from '../content/sites';
import { GAME_REGISTRY } from '../engine/gameRegistry';
import {
  applySaveMigrations,
  CURRENT_SAVE_VERSION,
  deserializeState,
  formatSaveSummary,
  importSave,
  MAX_SAVE_FILE_BYTES,
  serializeState,
  validateSave,
  type SaveData,
  type StoreSnapshots,
} from './save';

const VALIDATION_CONTENT = {
  registry: GAME_REGISTRY,
  artifacts: ARTIFACTS,
  achievements: ACHIEVEMENTS,
};

function makeSampleSnapshots(): StoreSnapshots {
  return {
    progress: {
      facts: new Set(['date_1109', 'maintenance_window_known']),
      discoveredPages: [
        'meridian://ring-hub/',
        'meridian://delphines-garden/guestbook',
      ],
    },
    notebook: {
      clues: [
        {
          id: 'clue-1',
          text: '11/09',
          sourceUrl: 'meridian://delphines-garden/guestbook',
          sourceTitle: "Delphine's Guestbook",
          savedAt: 1700000001000,
          note: 'Mentioned by lamplighter',
          tags: ['date'],
          x: 24,
          y: 48,
        },
      ],
      links: [
        {
          id: 'link-clue-1--clue-2',
          fromClueId: 'clue-1',
          toClueId: 'clue-2',
        },
      ],
      freeNotes: 'Check Tumbleweed support bulletin.',
      insights: [
        {
          id: 'conn_1109_maintenance',
          title: 'The 23:00 Window',
          text: 'Matched dates.',
          unlockedAt: 1700000005000,
        },
      ],
    },
    collection: {
      unlockedArtifacts: [{ id: 'flower_banner', unlockedAt: 1700000002000 }],
      unlockedAchievements: [{ id: 'first_dialup', unlockedAt: 1700000003000 }],
      sourceViewedUrls: ['meridian://ring-hub/'],
      spoilersHidden: true,
    },
    browser: {
      bookmarks: ['meridian://ring-hub/', 'meridian://delphines-garden/'],
    },
  };
}

describe('save engine: serialization & round-trip', () => {
  it('round-trips snapshots between Sets and JSON-safe arrays without loss', () => {
    const original = makeSampleSnapshots();
    const serialized = serializeState(original, 1700000010000);

    expect(serialized.saveVersion).toBe(CURRENT_SAVE_VERSION);
    expect(serialized.savedAt).toBe(1700000010000);
    expect(Array.isArray(serialized.progress.facts)).toBe(true);

    const jsonRoundTrip = JSON.parse(JSON.stringify(serialized)) as SaveData;
    const restored = deserializeState(jsonRoundTrip);

    expect(restored.progress.facts).toBeInstanceOf(Set);
    expect(Array.from(restored.progress.facts)).toEqual(
      Array.from(original.progress.facts)
    );
    expect(restored.progress.discoveredPages).toEqual(original.progress.discoveredPages);
    expect(restored.notebook).toEqual(original.notebook);
    expect(restored.collection).toEqual(original.collection);
    expect(restored.browser).toEqual(original.browser);

    const reSerialized = serializeState(restored, 1700000010000);
    expect(reSerialized).toEqual(serialized);
  });

  it('produces JSON free of script tags and http/https URLs', () => {
    const serialized = serializeState(makeSampleSnapshots(), 1700000010000);
    const json = JSON.stringify(serialized).toLowerCase();
    expect(json).not.toContain('<script');
    expect(json).not.toContain('http://');
    expect(json).not.toContain('https://');
  });
});

describe('save engine: migrations & validation', () => {
  it('migrates an explicitly versioned v0 save object up to v1', () => {
    const v0Save = {
      saveVersion: 0,
      savedAt: 1700000000000,
      progress: {
        facts: ['date_1109'],
        discoveredPages: ['meridian://ring-hub/'],
      },
      notebook: { clues: [], links: [], freeNotes: 'legacy', insights: [] },
      collection: {
        unlockedArtifacts: [],
        unlockedAchievements: [],
        sourceViewedUrls: [],
        spoilersHidden: false,
      },
    };

    const result = validateSave(v0Save, VALIDATION_CONTENT);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.saveVersion).toBe(1);
      expect(result.data.progress.facts).toEqual(['date_1109']);
      expect(result.data.notebook.freeNotes).toBe('legacy');
      expect(result.data.browser.bookmarks).toEqual([]);
    }
  });

  it('migrates an unversioned legacy save object without saveVersion', () => {
    const legacyObject = {
      facts: ['visited_ring_hub'],
      discoveredPages: ['meridian://ring-hub/'],
      notebook: {
        clues: [],
        links: [],
        freeNotes: 'from pre-versioned build',
        insights: [],
      },
      collection: {
        unlockedArtifacts: [{ id: 'ring_badge', unlockedAt: 1000 }],
        unlockedAchievements: [],
        sourceViewedUrls: ['meridian://ring-hub/start'],
        spoilersHidden: true,
      },
    };

    const migrated = applySaveMigrations(legacyObject);
    expect(migrated.ok).toBe(true);

    const result = validateSave(legacyObject, VALIDATION_CONTENT);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.saveVersion).toBe(1);
      expect(result.data.progress.facts).toEqual(['visited_ring_hub']);
      expect(result.data.notebook.freeNotes).toBe('from pre-versioned build');
      expect(result.data.collection.unlockedArtifacts.map((a) => a.id)).toEqual([
        'ring_badge',
      ]);
      expect(result.data.browser.bookmarks).toEqual([]);
    }
  });

  it('rejects unknown future saveVersion with a clear error message', () => {
    const future = {
      ...serializeState(makeSampleSnapshots(), 1000),
      saveVersion: CURRENT_SAVE_VERSION + 4,
    };

    const result = validateSave(future, VALIDATION_CONTENT);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/newer than/i);
    }
  });

  it('sanitizes removed facts, unknown page urls, and missing artifact/achievement ids while preserving valid items', () => {
    const dirtySave = {
      saveVersion: 1,
      savedAt: 5000,
      progress: {
        facts: ['date_1109', 'deleted_fact_xyz', 'date_1109'],
        discoveredPages: [
          'meridian://RING-HUB/',
          'meridian://removed-site/old-page',
          'meridian://ring-hub/#frag',
        ],
      },
      notebook: {
        clues: [],
        links: [],
        freeNotes: 'keep notes',
        insights: [],
      },
      collection: {
        unlockedArtifacts: [
          { id: 'flower_banner', unlockedAt: 10 },
          { id: 'removed_artifact', unlockedAt: 20 },
          { id: 'flower_banner', unlockedAt: 30 },
        ],
        unlockedAchievements: [
          { id: 'first_dialup', unlockedAt: 15 },
          { id: 'removed_achievement', unlockedAt: 25 },
        ],
        sourceViewedUrls: ['meridian://ring-hub/', 'meridian://deleted-site/page'],
        spoilersHidden: false,
      },
      browser: {
        bookmarks: ['meridian://delphines-garden/', 'meridian://nonexistent/page'],
      },
    };

    const result = validateSave(dirtySave, VALIDATION_CONTENT);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.progress.facts).toEqual(['date_1109']);
      expect(result.data.progress.discoveredPages).toEqual(['meridian://ring-hub/']);
      expect(result.data.collection.unlockedArtifacts).toEqual([
        { id: 'flower_banner', unlockedAt: 10 },
      ]);
      expect(result.data.collection.unlockedAchievements).toEqual([
        { id: 'first_dialup', unlockedAt: 15 },
      ]);
      expect(result.data.collection.sourceViewedUrls).toEqual(['meridian://ring-hub/']);
      expect(result.data.browser.bookmarks).toEqual(['meridian://delphines-garden/']);
      expect(result.data.notebook.freeNotes).toBe('keep notes');
    }
  });

  it('drops unknown extra keys on top-level and nested records', () => {
    const withExtras = {
      ...serializeState(makeSampleSnapshots(), 9999),
      extraRootProp: 'drop-me',
      note: 'human note dropped internally',
      progress: {
        facts: ['date_1109'],
        discoveredPages: ['meridian://ring-hub/'],
        extraProgress: true,
      },
      notebook: {
        ...serializeState(makeSampleSnapshots(), 9999).notebook,
        extraNotebook: 123,
      },
      collection: {
        ...serializeState(makeSampleSnapshots(), 9999).collection,
        extraCollection: 'abc',
      },
      browser: {
        bookmarks: ['meridian://ring-hub/'],
        extraBrowser: [],
      },
    };

    const result = validateSave(withExtras, VALIDATION_CONTENT);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect('extraRootProp' in result.data).toBe(false);
      expect('note' in result.data).toBe(false);
      expect('extraProgress' in result.data.progress).toBe(false);
      expect('extraNotebook' in result.data.notebook).toBe(false);
      expect('extraCollection' in result.data.collection).toBe(false);
      expect('extraBrowser' in result.data.browser).toBe(false);
    }
  });

  const invalidCases: Array<[string, (base: Record<string, unknown>) => unknown]> = [
    ['non-object root', () => ['not', 'an', 'object']],
    ['negative saveVersion', (b) => ({ ...b, saveVersion: -1 })],
    ['non-numeric savedAt', (b) => ({ ...b, savedAt: 'today' })],
    ['non-object progress', (b) => ({ ...b, progress: null })],
    [
      'non-array progress.facts',
      (b) => ({ ...b, progress: { ...(b.progress as object), facts: 'date_1109' } }),
    ],
    [
      'non-string element in progress.discoveredPages',
      (b) => ({
        ...b,
        progress: { ...(b.progress as object), discoveredPages: [42] },
      }),
    ],
    ['non-object notebook', (b) => ({ ...b, notebook: 'bad' })],
    [
      'non-array notebook.clues',
      (b) => ({ ...b, notebook: { ...(b.notebook as object), clues: {} } }),
    ],
    [
      'clue with non-numeric x',
      (b) => {
        const nb = b.notebook as SaveData['notebook'];
        return {
          ...b,
          notebook: { ...nb, clues: [{ ...nb.clues[0], x: '10' }] },
        };
      },
    ],
    [
      'link with non-string fromClueId',
      (b) => {
        const nb = b.notebook as SaveData['notebook'];
        return {
          ...b,
          notebook: { ...nb, links: [{ ...nb.links[0], fromClueId: 99 }] },
        };
      },
    ],
    [
      'non-string notebook.freeNotes',
      (b) => ({ ...b, notebook: { ...(b.notebook as object), freeNotes: 123 } }),
    ],
    [
      'insight with NaN unlockedAt',
      (b) => {
        const nb = b.notebook as SaveData['notebook'];
        return {
          ...b,
          notebook: { ...nb, insights: [{ ...nb.insights[0], unlockedAt: Number.NaN }] },
        };
      },
    ],
    ['non-object collection', (b) => ({ ...b, collection: [] })],
    [
      'artifact record with non-numeric unlockedAt',
      (b) => ({
        ...b,
        collection: {
          ...(b.collection as object),
          unlockedArtifacts: [{ id: 'flower_banner', unlockedAt: 'yesterday' }],
        },
      }),
    ],
    [
      'non-boolean collection.spoilersHidden',
      (b) => ({
        ...b,
        collection: { ...(b.collection as object), spoilersHidden: 'yes' },
      }),
    ],
    [
      'non-array collection.sourceViewedUrls',
      (b) => ({
        ...b,
        collection: { ...(b.collection as object), sourceViewedUrls: 'meridian://ring-hub/' },
      }),
    ],
    ['non-object browser', (b) => ({ ...b, browser: false })],
    [
      'non-array browser.bookmarks',
      (b) => ({ ...b, browser: { bookmarks: 'meridian://ring-hub/' } }),
    ],
  ];

  it.each(invalidCases)('rejects wrong field type: %s', (_label, mutate) => {
    const base = serializeState(makeSampleSnapshots(), 1700000010000) as unknown as Record<
      string,
      unknown
    >;
    const result = validateSave(mutate(base), VALIDATION_CONTENT);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});

describe('save engine: importSave & summary', () => {
  it('parses, validates, and summarizes valid JSON save files', () => {
    const serialized = serializeState(makeSampleSnapshots(), 1700000010000);
    const result = importSave(
      JSON.stringify({ note: 'export note', ...serialized }),
      VALIDATION_CONTENT
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const summary = formatSaveSummary(result.data, ALL_SITES);
      expect(summary).toContain('1 clue');
      expect(summary).toContain('1 artifact');
      expect(summary).toContain('% recovered');
    }
  });

  it('rejects malformed JSON without throwing', () => {
    const result = importSave('{ broken json', VALIDATION_CONTENT);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/parse/i);
    }
  });

  it('rejects save files exceeding the 2 MB limit', () => {
    const oversized = 'a'.repeat(MAX_SAVE_FILE_BYTES + 10);
    const result = importSave(oversized, VALIDATION_CONTENT);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/2 MB/i);
    }
  });
});
