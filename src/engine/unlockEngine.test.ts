import { describe, expect, it } from 'vitest';
import { CONNECTION_DEFS } from '../content/connections';
import { ALL_SITES, CLUE_DEFS } from '../content/sites';
import { matchClues } from './clues';
import { evaluateLink } from './connections';
import { addClue, addLink, createInitialNotebookState } from './notebook';
import { buildRegistry, validateContent } from './registry';
import { resolveWithProgress } from './resolve';
import type { Site } from './types';
import { applyGrants, getMissingFacts, getNewGrants, isUnlocked } from './unlock';

describe('unlock helpers', () => {
  it('treats pages with 0 required facts as unlocked', () => {
    const empty = new Set<string>();
    expect(isUnlocked({}, empty)).toBe(true);
    expect(isUnlocked({ requires: [] }, empty)).toBe(true);
    expect(getMissingFacts({ requires: [] }, empty)).toEqual([]);
  });

  it('checks single required fact accurately', () => {
    const page = { requires: ['fact_a'] };
    expect(isUnlocked(page, new Set())).toBe(false);
    expect(getMissingFacts(page, new Set())).toEqual(['fact_a']);
    expect(isUnlocked(page, new Set(['fact_a']))).toBe(true);
    expect(getMissingFacts(page, new Set(['fact_a']))).toEqual([]);
  });

  it('checks multiple required facts and reports all missing facts', () => {
    const page = { requires: ['fact_a', 'fact_b', 'fact_c'] };
    const partial = new Set(['fact_b']);
    expect(isUnlocked(page, partial)).toBe(false);
    expect(getMissingFacts(page, partial)).toEqual(['fact_a', 'fact_c']);

    const full = new Set(['fact_a', 'fact_b', 'fact_c']);
    expect(isUnlocked(page, full)).toBe(true);
    expect(getMissingFacts(page, full)).toEqual([]);
  });

  it('applies grants immutably without mutating the original Set', () => {
    const original = new Set(['fact_a']);
    const updated = applyGrants(['fact_b', 'fact_c'], original);

    expect(Array.from(original)).toEqual(['fact_a']);
    expect(Array.from(updated)).toEqual(['fact_a', 'fact_b', 'fact_c']);
    expect(updated).not.toBe(original);
  });

  it('computes only newly granted facts so grants apply once', () => {
    const known = new Set(['fact_a']);
    expect(getNewGrants(['fact_a', 'fact_b', 'fact_b'], known)).toEqual(['fact_b']);
    expect(getNewGrants(['fact_a'], known)).toEqual([]);
  });
});

describe('registry validation and buildRegistry', () => {
  it('validates the authored game content with zero errors', () => {
    const problems = validateContent(ALL_SITES, CLUE_DEFS, CONNECTION_DEFS);
    const errors = problems.filter((p) => p.level === 'error');
    expect(errors).toEqual([]);
  });

  it('builds the game registry without throwing', () => {
    const registry = buildRegistry(ALL_SITES, CLUE_DEFS, CONNECTION_DEFS);
    expect(registry.pagesByUrl.has('meridian://ring-hub/')).toBe(true);
    expect(registry.pagesByUrl.has('meridian://tumbleweed/support')).toBe(true);
    expect(registry.pagesByUrl.has('meridian://lamplighter/log_0911')).toBe(true);
  });

  it('detects and throws on duplicate normalized URLs', () => {
    const duplicateSites: Site[] = [
      {
        id: 'site-a',
        name: 'Site A',
        pages: [{ url: 'meridian://dup-host/', title: 'A', html: '<p>A</p>' }],
      },
      {
        id: 'site-b',
        name: 'Site B',
        pages: [{ url: 'meridian://DUP-HOST', title: 'B', html: '<p>B</p>' }],
      },
    ];

    const problems = validateContent(duplicateSites);
    expect(problems.some((p) => p.level === 'error' && p.message.includes('Duplicate'))).toBe(
      true
    );
    expect(() => buildRegistry(duplicateSites)).toThrow(/Duplicate/i);
  });

  it('detects and throws on required facts that are never granted anywhere', () => {
    const badSites: Site[] = [
      {
        id: 'site-a',
        name: 'Site A',
        pages: [
          {
            url: 'meridian://locked/',
            title: 'Locked',
            html: '<p>Secret</p>',
            requires: ['ghost_fact'],
          },
        ],
      },
    ];

    const problems = validateContent(badSites);
    expect(
      problems.some((p) => p.level === 'error' && p.factId === 'ghost_fact')
    ).toBe(true);
    expect(() => buildRegistry(badSites)).toThrow(/ghost_fact/);
  });

  it('throws on empty fact ids in grants or requires', () => {
    const emptyFactSites: Site[] = [
      {
        id: 'site-a',
        name: 'Site A',
        pages: [
          {
            url: 'meridian://empty-grant/',
            title: 'Empty',
            html: '<p>Hi</p>',
            grants: ['  '],
          },
        ],
      },
    ];

    expect(() => buildRegistry(emptyFactSites)).toThrow(/Empty grant/);
  });

  it('emits warnings for facts that are granted but never required', () => {
    const warnSites: Site[] = [
      {
        id: 'site-a',
        name: 'Site A',
        pages: [
          {
            url: 'meridian://one/',
            title: 'One',
            html: '<p>One</p>',
            grants: ['unused_fact'],
          },
        ],
      },
    ];

    const problems = validateContent(warnSites);
    expect(problems).toContainEqual(
      expect.objectContaining({
        level: 'warning',
        factId: 'unused_fact',
      })
    );
  });
});

describe('resolveWithProgress and puzzle chain', () => {
  const registry = buildRegistry(ALL_SITES, CLUE_DEFS, CONNECTION_DEFS);

  it('returns not_found for unknown or non-meridian URLs', () => {
    const facts = new Set<string>();
    expect(resolveWithProgress('meridian://does-not-exist/', registry, facts)).toEqual({
      status: 'not_found',
    });
    expect(resolveWithProgress('https://example.com/', registry, facts)).toEqual({
      status: 'not_found',
    });
  });

  it('returns locked for hidden page when facts are missing, distinct from not_found', () => {
    const facts = new Set<string>();
    const locked = resolveWithProgress('meridian://lamplighter/log_0911', registry, facts);
    expect(locked.status).toBe('locked');
    if (locked.status === 'locked') {
      expect(locked.missing).toEqual([
        'date_1109',
        'maintenance_window_known',
        'connection_1109',
      ]);
    }
  });

  it('grants page facts only once across repeated visits', () => {
    let facts = new Set<string>();
    const firstVisit = resolveWithProgress('meridian://tumbleweed/support', registry, facts);
    expect(firstVisit.status).toBe('ok');
    if (firstVisit.status === 'ok') {
      expect(firstVisit.newFacts).toEqual(['maintenance_window_known']);
      facts = applyGrants(firstVisit.newFacts, facts);
    }

    const secondVisit = resolveWithProgress('meridian://tumbleweed/support', registry, facts);
    expect(secondVisit.status).toBe('ok');
    if (secondVisit.status === 'ok') {
      expect(secondVisit.newFacts).toEqual([]);
    }
  });

  it('matches clues case-insensitively and completes the lamplighter puzzle chain via connection', () => {
    let facts = new Set<string>();

    // Step 1: Capture "11/09" from guestbook
    const nonMatching = matchClues(
      'meridian://delphines-garden/guestbook',
      'ginger tea recipe',
      CLUE_DEFS,
      facts
    );
    expect(nonMatching.newFacts).toEqual([]);

    const matchedDate = matchClues(
      'meridian://delphines-garden/guestbook',
      '  keep the light on - 11/09 ',
      CLUE_DEFS,
      facts
    );
    expect(matchedDate.newFacts).toEqual(['date_1109']);
    facts = applyGrants(matchedDate.newFacts, facts);

    // Step 2: Visit Tumbleweed support bulletin
    const support = resolveWithProgress('meridian://tumbleweed/support', registry, facts);
    expect(support.status).toBe('ok');
    if (support.status === 'ok') {
      facts = applyGrants(support.newFacts, facts);
    }

    // Still locked without linking the two clues into connection_1109
    const partial = resolveWithProgress('meridian://lamplighter/log_0911', registry, facts);
    expect(partial.status).toBe('locked');
    if (partial.status === 'locked') {
      expect(partial.missing).toEqual(['connection_1109']);
    }

    // Step 3: Link clues on the board to grant connection_1109
    let nb = createInitialNotebookState();
    const r1 = addClue(nb, {
      id: 'c1',
      text: 'keep the light on - 11/09',
      sourceUrl: 'meridian://delphines-garden/guestbook',
      sourceTitle: "Delphine's Guestbook",
    });
    nb = r1.state;
    const r2 = addClue(nb, {
      id: 'c2',
      text: 'maintenance window starting on 11/09 at 23:00',
      sourceUrl: 'meridian://tumbleweed/support',
      sourceTitle: 'Tumbleweed Hosting — Support Bulletin',
    });
    nb = r2.state;
    const linked = addLink(nb, 'c1', 'c2');
    nb = linked.state;
    const evalRes = evaluateLink(nb, linked.link!.id, CONNECTION_DEFS, facts);
    expect(evalRes.newFacts).toEqual(['connection_1109']);
    facts = applyGrants(evalRes.newFacts, facts);

    // Step 4: Hidden log page now resolves and grants lamplighter_log_1
    const unlockedLog = resolveWithProgress('meridian://lamplighter/log_0911', registry, facts);
    expect(unlockedLog.status).toBe('ok');
    if (unlockedLog.status === 'ok') {
      expect(unlockedLog.page.hidden).toBe(true);
      expect(unlockedLog.newFacts).toEqual(['lamplighter_log_1']);
    }
  });
});
