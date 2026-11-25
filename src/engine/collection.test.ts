import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ACHIEVEMENTS,
  ARTIFACTS,
  type AchievementDef,
  type ArtifactDef,
} from '../content/collection';
import { CONNECTION_DEFS } from '../content/connections';
import { ALL_SITES, CLUE_DEFS } from '../content/sites';
import { emitShellEvent, subscribeCollectionEvent } from '../events/eventBus';
import { useCollectionStore, toPersistedCollection } from '../state/collectionStore';
import { toPersistedNotebook, useNotebookStore } from '../state/notebookStore';
import { inMemorySavePersistence } from '../state/progressPersistence';
import { toPersistedProgress, useProgressStore } from '../state/progressStore';
import {
  evaluateCollection,
  isTriggerMet,
  recoverySummary,
  validateCollection,
  type CollectionInput,
} from './collection';
import { GAME_REGISTRY } from './gameRegistry';
import { resolveWithProgress } from './resolve';

function createEmptyInput(overrides: Partial<CollectionInput> = {}): CollectionInput {
  return {
    facts: new Set<string>(),
    discoveredPages: [],
    clueCount: 0,
    insightCount: 0,
    sourceViewedUrls: [],
    ...overrides,
  };
}

describe('collection engine', () => {
  it('evaluates page triggers with Meridian URL normalization', () => {
    const input = createEmptyInput({
      discoveredPages: ['meridian://delphines-garden/'],
    });
    expect(isTriggerMet({ type: 'page', url: 'meridian://DELPHINES-GARDEN' }, input)).toBe(true);
    expect(isTriggerMet({ type: 'page', url: 'meridian://delphines-garden/#top?x=1' }, input)).toBe(true);
    expect(isTriggerMet({ type: 'page', url: 'meridian://delphines-garden/diary' }, input)).toBe(false);
  });

  it('evaluates allPages triggers as false on empty or partial sets and true when all pages are discovered', () => {
    const urls = [
      'meridian://delphines-garden/guestbook',
      'meridian://delphines-garden/guestbook/2',
    ];
    expect(isTriggerMet({ type: 'allPages', urls: [] }, createEmptyInput())).toBe(false);
    expect(
      isTriggerMet(
        { type: 'allPages', urls },
        createEmptyInput({ discoveredPages: ['meridian://delphines-garden/guestbook'] })
      )
    ).toBe(false);
    expect(
      isTriggerMet(
        { type: 'allPages', urls },
        createEmptyInput({
          discoveredPages: [
            'meridian://delphines-garden/guestbook',
            'meridian://delphines-garden/guestbook/2',
          ],
        })
      )
    ).toBe(true);
  });

  it('evaluates fact triggers', () => {
    expect(
      isTriggerMet(
        { type: 'fact', id: 'lamplighter_log_1' },
        createEmptyInput({ facts: new Set(['date_1109']) })
      )
    ).toBe(false);
    expect(
      isTriggerMet(
        { type: 'fact', id: 'lamplighter_log_1' },
        createEmptyInput({ facts: new Set(['lamplighter_log_1']) })
      )
    ).toBe(true);
  });

  it('evaluates count triggers for clues, insights, pagesDiscovered, and distinct sourceViews', () => {
    expect(
      isTriggerMet(
        { type: 'count', metric: 'clues', atLeast: 5 },
        createEmptyInput({ clueCount: 4 })
      )
    ).toBe(false);
    expect(
      isTriggerMet(
        { type: 'count', metric: 'clues', atLeast: 5 },
        createEmptyInput({ clueCount: 5 })
      )
    ).toBe(true);

    expect(
      isTriggerMet(
        { type: 'count', metric: 'insights', atLeast: 1 },
        createEmptyInput({ insightCount: 1 })
      )
    ).toBe(true);

    expect(
      isTriggerMet(
        { type: 'count', metric: 'pagesDiscovered', atLeast: 2 },
        createEmptyInput({
          discoveredPages: [
            'meridian://ring-hub/',
            'meridian://RING-HUB/?ref=1',
          ],
        })
      )
    ).toBe(false);

    expect(
      isTriggerMet(
        { type: 'count', metric: 'sourceViews', atLeast: 5 },
        createEmptyInput({
          sourceViewedUrls: [
            'meridian://ring-hub/',
            'meridian://RING-HUB/#source',
            'meridian://delphines-garden/',
            'meridian://tumbleweed/',
            'meridian://backroom/',
          ],
        })
      )
    ).toBe(false);

    expect(
      isTriggerMet(
        { type: 'count', metric: 'sourceViews', atLeast: 5 },
        createEmptyInput({
          sourceViewedUrls: [
            'meridian://ring-hub/',
            'meridian://delphines-garden/',
            'meridian://tumbleweed/',
            'meridian://backroom/',
            'meridian://ring-hub/start',
          ],
        })
      )
    ).toBe(true);
  });

  it('evaluates unlocks once and skips already unlocked items', () => {
    const input = createEmptyInput({
      discoveredPages: ['meridian://delphines-garden/', 'meridian://ring-hub/start'],
      clueCount: 5,
    });

    const first = evaluateCollection(ARTIFACTS, ACHIEVEMENTS, input, {
      artifacts: new Set(),
      achievements: new Set(),
    });
    expect(first.newArtifacts).toEqual(['flower_banner', 'ring_badge']);
    expect(first.newAchievements).toEqual(['first_dialup', 'clue_collector']);

    const second = evaluateCollection(ARTIFACTS, ACHIEVEMENTS, input, {
      artifacts: new Set(first.newArtifacts),
      achievements: new Set(first.newAchievements),
    });
    expect(second.newArtifacts).toEqual([]);
    expect(second.newAchievements).toEqual([]);
  });
});

describe('recoverySummary', () => {
  it('returns 40 ring slots and 0% when no pages are discovered', () => {
    const summary = recoverySummary(ALL_SITES, [], new Set());
    expect(summary.ringSlots).toBe(40);
    expect(summary.sitesRecovered).toBe(0);
    expect(summary.percent).toBe(0);
    expect(summary.sites).toHaveLength(ALL_SITES.length);
  });

  it('does not leak locked or hidden pages before they are discovered', () => {
    const emptySummary = recoverySummary(ALL_SITES, [], new Set());
    const lamplighter = emptySummary.sites.find((s) => s.siteId === 'lamplighter');
    const nightcrawler = emptySummary.sites.find((s) => s.siteId === 'nightcrawler');
    const delphine = emptySummary.sites.find((s) => s.siteId === 'delphines-garden');

    expect(lamplighter?.visibleTotal).toBe(0);
    expect(lamplighter?.recovered).toBe(false);
    expect(nightcrawler?.visibleTotal).toBe(0);
    expect(nightcrawler?.recovered).toBe(false);
    expect(delphine?.visibleTotal).toBe(7);

    // Even if facts are known, hidden pages stay uncounted until discovered
    const factsOnly = recoverySummary(
      ALL_SITES,
      [],
      new Set(['date_1109', 'maintenance_window_known', 'connection_1109'])
    );
    expect(factsOnly.sites.find((s) => s.siteId === 'lamplighter')?.visibleTotal).toBe(0);
  });

  it('counts discovered hidden/locked pages and computes rounded ring percentage', () => {
    const summary = recoverySummary(
      ALL_SITES,
      ['meridian://ring-hub/', 'meridian://lamplighter/log_0911'],
      new Set(['lamplighter_log_1'])
    );
    expect(summary.sitesRecovered).toBe(2);
    expect(summary.percent).toBe(Math.round((2 / 40) * 100));

    const lamplighter = summary.sites.find((s) => s.siteId === 'lamplighter');
    expect(lamplighter?.recovered).toBe(true);
    expect(lamplighter?.discoveredCount).toBe(1);
    expect(lamplighter?.visibleTotal).toBe(1);
    expect(lamplighter?.homeUrl).toBe('meridian://lamplighter/log_0911');
  });
});

describe('validateCollection', () => {
  it('passes with zero errors or warnings on the authored collection', () => {
    const problems = validateCollection(ARTIFACTS, ACHIEVEMENTS, GAME_REGISTRY);
    expect(problems).toEqual([]);
  });

  it('detects wrong counts and duplicate ids', () => {
    const duplicateArtifacts: ArtifactDef[] = [
      ...ARTIFACTS.slice(0, 9),
      { ...ARTIFACTS[0] },
    ];
    const extraAchievements: AchievementDef[] = [
      ...ACHIEVEMENTS,
      { ...ACHIEVEMENTS[0] },
    ];
    const problems = validateCollection(duplicateArtifacts, extraAchievements, GAME_REGISTRY);
    expect(problems.some((p) => p.message.includes('Expected exactly 8 achievements'))).toBe(true);
    expect(problems.some((p) => p.message.includes('Duplicate artifact id'))).toBe(true);
    expect(problems.some((p) => p.message.includes('Duplicate achievement id'))).toBe(true);

    const fewerArtifacts = ARTIFACTS.slice(0, 9);
    const countProblems = validateCollection(fewerArtifacts, ACHIEVEMENTS, GAME_REGISTRY);
    expect(countProblems.some((p) => p.message.includes('Expected exactly 10 artifacts'))).toBe(true);
  });

  it('detects unknown trigger URLs, never-granted facts, bad sprite dimensions, and missing palette chars', () => {
    const badArtifacts: ArtifactDef[] = [
      {
        ...ARTIFACTS[0],
        trigger: { type: 'page', url: 'meridian://missing/page' },
        sprite: ['............'],
      },
      {
        ...ARTIFACTS[1],
        trigger: { type: 'fact', id: 'fact_that_never_exists' },
        sprite: Array.from({ length: 12 }, (_, idx) =>
          idx === 0 ? 'zzzzzzzzzzzz' : '............'
        ),
      },
      ...ARTIFACTS.slice(2),
    ];

    const badAchievements: AchievementDef[] = [
      {
        ...ACHIEVEMENTS[0],
        trigger: { type: 'allPages', urls: ['meridian://unknown/ghost'] },
      },
      ...ACHIEVEMENTS.slice(1),
    ];

    const problems = validateCollection(badArtifacts, badAchievements, GAME_REGISTRY);
    expect(problems.some((p) => p.message.includes('meridian://missing/page'))).toBe(true);
    expect(problems.some((p) => p.message.includes('fact_that_never_exists'))).toBe(true);
    expect(problems.some((p) => p.message.includes('sprite must have 12 rows'))).toBe(true);
    expect(problems.some((p) => p.message.includes('missing from palette'))).toBe(true);
    expect(problems.some((p) => p.message.includes('meridian://unknown/ghost'))).toBe(true);
  });
});

describe('collectionStore, events, persistence, and story progression', () => {
  beforeEach(() => {
    useProgressStore.getState().resetProgress();
    useNotebookStore.getState().clearNotebook();
    useCollectionStore.getState().resetCollection();
  });

  it('deduplicates distinct source views and unlocks Source Enthusiast on 5 distinct pages', () => {
    const events: string[] = [];
    const unsubscribe = subscribeCollectionEvent('achievement_unlocked', (payload) => {
      events.push(payload.id);
    });

    const store = useCollectionStore.getState();
    store.recordSourceView('meridian://ring-hub/');
    store.recordSourceView('meridian://RING-HUB/#anchor');
    store.recordSourceView('meridian://delphines-garden/');
    store.recordSourceView('meridian://tumbleweed/');
    store.recordSourceView('meridian://backroom/');
    expect(useCollectionStore.getState().sourceViewedUrls).toHaveLength(4);
    expect(events).not.toContain('source_enthusiast');

    emitShellEvent({ type: 'source_viewed', url: 'meridian://ring-hub/start' });
    expect(useCollectionStore.getState().sourceViewedUrls).toHaveLength(5);
    expect(events).toContain('source_enthusiast');

    unsubscribe();
  });

  it('emits artifact_unlocked and achievement_unlocked payloads once per unlock and queues toasts', () => {
    const artifactPayloads: Array<{ game: string; id: string; type: string; timestamp: number }> = [];
    const achievementPayloads: Array<{ game: string; id: string; type: string; timestamp: number }> = [];

    const unsubA = subscribeCollectionEvent('artifact_unlocked', (p) => artifactPayloads.push(p));
    const unsubC = subscribeCollectionEvent('achievement_unlocked', (p) => achievementPayloads.push(p));

    useProgressStore.getState().markPageDiscovered('meridian://delphines-garden/');
    useProgressStore.getState().markPageDiscovered('meridian://delphines-garden/');

    expect(artifactPayloads).toHaveLength(1);
    expect(artifactPayloads[0]).toMatchObject({
      game: 'the-lost-internet',
      id: 'flower_banner',
      type: 'artifact',
    });
    expect(typeof artifactPayloads[0].timestamp).toBe('number');

    expect(achievementPayloads).toHaveLength(1);
    expect(achievementPayloads[0]).toMatchObject({
      game: 'the-lost-internet',
      id: 'first_dialup',
      type: 'achievement',
    });

    expect(useCollectionStore.getState().toastQueue.map((t) => t.message)).toEqual([
      "Artifact recovered: Delphine's Flower Banner",
      'Achievement: First Dial-Up',
    ]);

    useCollectionStore.getState().dismissActiveToast();
    expect(useCollectionStore.getState().toastQueue.map((t) => t.message)).toEqual([
      'Achievement: First Dial-Up',
    ]);

    unsubA();
    unsubC();
  });

  it('unlocks all artifacts/achievements via debug actions and resets cleanly', () => {
    const spy = vi.fn();
    const unsub = subscribeCollectionEvent('artifact_unlocked', spy);

    const store = useCollectionStore.getState();
    store.unlockAllArtifacts();
    store.unlockAllArtifacts();
    expect(spy).toHaveBeenCalledTimes(10);
    expect(useCollectionStore.getState().unlockedArtifacts).toHaveLength(10);

    store.unlockAllAchievements();
    expect(useCollectionStore.getState().unlockedAchievements).toHaveLength(8);

    store.setSpoilersHidden(true);
    expect(useCollectionStore.getState().spoilersHidden).toBe(true);

    store.resetCollection();
    const reset = useCollectionStore.getState();
    expect(reset.unlockedArtifacts).toEqual([]);
    expect(reset.unlockedAchievements).toEqual([]);
    expect(reset.sourceViewedUrls).toEqual([]);
    expect(reset.toastQueue).toEqual([]);
    expect(reset.spoilersHidden).toBe(false);

    unsub();
  });

  it('persists collection state alongside progress and notebook in a JSON-safe snapshot', async () => {
    useProgressStore.getState().markPageDiscovered('meridian://ring-hub/start');
    useCollectionStore.getState().recordSourceView('meridian://ring-hub/start');
    useCollectionStore.getState().setSpoilersHidden(true);

    const saved = toPersistedProgress(
      useProgressStore.getState(),
      toPersistedNotebook(useNotebookStore.getState()),
      toPersistedCollection(useCollectionStore.getState())
    );
    await inMemorySavePersistence.save(saved);
    const loaded = await inMemorySavePersistence.load();

    expect(loaded).not.toBeNull();
    expect(loaded?.collection.unlockedArtifacts.map((a) => a.id)).toContain('ring_badge');
    expect(loaded?.collection.sourceViewedUrls).toEqual(['meridian://ring-hub/start']);
    expect(loaded?.collection.spoilersHidden).toBe(true);
    expect(() => JSON.stringify(loaded)).not.toThrow();
  });

  it('preserves the 11/09 Lamplighter progression chain and unlocks its artifact and achievement', () => {
    useProgressStore.getState().addFacts(['date_1109', 'maintenance_window_known']);

    const { clue: clueA } = useNotebookStore.getState().addClue({
      text: '11/09',
      sourceUrl: 'meridian://delphines-garden/guestbook',
      sourceTitle: "Delphine's Guestbook",
    });
    const { clue: clueB } = useNotebookStore.getState().addClue({
      text: 'maintenance window',
      sourceUrl: 'meridian://tumbleweed/support',
      sourceTitle: 'Tumbleweed Support',
    });

    const linkResult = useNotebookStore.getState().addLink(clueA.id, clueB.id);
    expect(linkResult.insight?.id).toBe('conn_1109_maintenance');
    expect(useProgressStore.getState().facts.has('connection_1109')).toBe(true);

    const logRes = resolveWithProgress(
      'meridian://lamplighter/log_0911',
      GAME_REGISTRY,
      useProgressStore.getState().facts
    );
    expect(logRes.status).toBe('ok');
    if (logRes.status === 'ok') {
      useProgressStore.getState().addFacts(logRes.newFacts);
      useProgressStore.getState().markPageDiscovered(logRes.page.url);
    }

    const artifactIds = useCollectionStore.getState().unlockedArtifacts.map((a) => a.id);
    const achievementIds = useCollectionStore.getState().unlockedAchievements.map((a) => a.id);
    expect(artifactIds).toContain('porch_light');
    expect(achievementIds).toContain('behind_curtain');
    expect(achievementIds).toContain('connect_dots');
  });

  it('preserves the NightCrawler & Porchlight progression chain and unlocks its collection items', () => {
    useProgressStore.getState().addFacts(['lamplighter_log_1']);

    const ncHome = resolveWithProgress(
      'meridian://nightcrawler/',
      GAME_REGISTRY,
      useProgressStore.getState().facts
    );
    expect(ncHome.status).toBe('ok');
    if (ncHome.status === 'ok') {
      useProgressStore.getState().addFacts(ncHome.newFacts);
      useProgressStore.getState().markPageDiscovered(ncHome.page.url);
    }

    const botPage = resolveWithProgress(
      'meridian://nightcrawler/projects',
      GAME_REGISTRY,
      useProgressStore.getState().facts
    );
    expect(botPage.status).toBe('ok');
    if (botPage.status === 'ok') {
      useProgressStore.getState().addFacts(botPage.newFacts);
    }

    const readmePage = resolveWithProgress(
      'meridian://nightcrawler/files/readme_if_found.txt',
      GAME_REGISTRY,
      useProgressStore.getState().facts
    );
    if (readmePage.status === 'ok') {
      useProgressStore.getState().addFacts(readmePage.newFacts);
    }

    const { clue: clueA } = useNotebookStore.getState().addClue({
      text: 'bulk account removal',
      sourceUrl: 'meridian://tumbleweed/tickets/4418',
      sourceTitle: 'Ticket 4418',
    });
    const { clue: clueB } = useNotebookStore.getState().addClue({
      text: 'thanks for everything',
      sourceUrl: 'meridian://backroom/thread/goodbye',
      sourceTitle: 'Backroom Goodbye',
    });
    useNotebookStore.getState().addLink(clueA.id, clueB.id);

    const porchlight = resolveWithProgress(
      'meridian://nightcrawler/porchlight',
      GAME_REGISTRY,
      useProgressStore.getState().facts
    );
    expect(porchlight.status).toBe('ok');
    if (porchlight.status === 'ok') {
      useProgressStore.getState().addFacts(porchlight.newFacts);
      useProgressStore.getState().markPageDiscovered(porchlight.page.url);
    }

    const artifactIds = useCollectionStore.getState().unlockedArtifacts.map((a) => a.id);
    const achievementIds = useCollectionStore.getState().unlockedAchievements.map((a) => a.id);
    expect(artifactIds).toEqual(
      expect.arrayContaining(['scanline_skin', 'readme_file', 'fragment_1'])
    );
    expect(achievementIds).toEqual(
      expect.arrayContaining(['nobody_did_this', 'keep_light_on'])
    );
  });

  it('keeps all authored site and collection strings free of script tags and http/https URLs', () => {
    const texts: string[] = [];

    for (const site of ALL_SITES) {
      texts.push(site.name);
      for (const page of site.pages) {
        texts.push(page.title, page.html, page.url);
        if (page.lockedNotice) {
          texts.push(page.lockedNotice);
        }
      }
    }
    for (const clue of CLUE_DEFS) {
      texts.push(clue.text, clue.pageUrl);
    }
    for (const conn of CONNECTION_DEFS) {
      texts.push(conn.insightTitle, conn.insightText, ...conn.clueMatchers);
    }
    for (const artifact of ARTIFACTS) {
      texts.push(artifact.name, artifact.description, artifact.hint, artifact.sourceSite);
    }
    for (const achievement of ACHIEVEMENTS) {
      texts.push(achievement.name, achievement.description, achievement.hint);
    }

    for (const text of texts) {
      expect(text.toLowerCase()).not.toContain('<script');
      expect(text.toLowerCase()).not.toContain('http://');
      expect(text.toLowerCase()).not.toContain('https://');
    }
  });
});
