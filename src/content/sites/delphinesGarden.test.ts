import { describe, expect, it } from 'vitest';
import { CONNECTION_DEFS } from '../connections';
import { matchClues } from '../../engine/clues';
import { GAME_REGISTRY } from '../../engine/gameRegistry';
import { validateContent } from '../../engine/registry';
import { resolveWithProgress } from '../../engine/resolve';
import { normalizeMeridianUrl } from '../../engine/url';
import { ALL_SITES, CLUE_DEFS } from './index';
import { DELPHINES_GARDEN_SITE } from './delphinesGarden';

const INTENTIONAL_UNRECOVERED_URLS = new Set<string>([
  'meridian://nightcrawler/',
]);

function extractMeridianHrefs(html: string): string[] {
  const matches = html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi);
  const hrefs: string[] = [];
  for (const match of matches) {
    hrefs.push(match[1]);
  }
  return hrefs;
}

describe("Delphine's Garden content validation", () => {
  it('contains all 7 expected pages', () => {
    const urls = DELPHINES_GARDEN_SITE.pages.map((p) => p.url);
    expect(urls).toEqual([
      'meridian://delphines-garden/',
      'meridian://delphines-garden/about',
      'meridian://delphines-garden/recipes',
      'meridian://delphines-garden/diary',
      'meridian://delphines-garden/links',
      'meridian://delphines-garden/guestbook',
      'meridian://delphines-garden/guestbook/2',
    ]);
  });

  it('passes registry validation with zero errors', () => {
    const problems = validateContent(ALL_SITES, CLUE_DEFS, CONNECTION_DEFS);
    const errors = problems.filter((p) => p.level === 'error');
    expect(errors).toEqual([]);
  });

  it('resolves every meridian:// link to a registered page or intentional unrecovered allowlist', () => {
    for (const page of DELPHINES_GARDEN_SITE.pages) {
      const hrefs = extractMeridianHrefs(page.html);
      expect(hrefs.length).toBeGreaterThan(0);

      for (const rawHref of hrefs) {
        const normalized = normalizeMeridianUrl(rawHref);
        expect(normalized, `Invalid meridian link "${rawHref}" on ${page.url}`).not.toBeNull();
        if (normalized) {
          const isRegistered = GAME_REGISTRY.pagesByUrl.has(normalized);
          const isAllowlisted = INTENTIONAL_UNRECOVERED_URLS.has(normalized);
          expect(
            isRegistered || isAllowlisted,
            `Unresolved link "${normalized}" found on ${page.url}`
          ).toBe(true);
        }
      }
    }
  });

  it('contains exactly 32 guestbook entries across 2 pages and one lamplighter 11/09 line', () => {
    const page1 = DELPHINES_GARDEN_SITE.pages.find(
      (p) => p.url === 'meridian://delphines-garden/guestbook'
    );
    const page2 = DELPHINES_GARDEN_SITE.pages.find(
      (p) => p.url === 'meridian://delphines-garden/guestbook/2'
    );
    expect(page1).toBeDefined();
    expect(page2).toBeDefined();

    const p1Articles = page1!.html.match(/<article\b/gi) ?? [];
    const p2Articles = page2!.html.match(/<article\b/gi) ?? [];
    expect(p1Articles).toHaveLength(16);
    expect(p2Articles).toHaveLength(16);
    expect(p1Articles.length + p2Articles.length).toBe(32);

    const combinedGuestbookHtml = `${page1!.html}\n${page2!.html}`;
    const lamplighterMatches = combinedGuestbookHtml.match(/keep the light on - 11\/09/g) ?? [];
    expect(lamplighterMatches).toHaveLength(1);
  });

  it('contains no script tags or http:// / https:// URLs in any page HTML', () => {
    for (const page of DELPHINES_GARDEN_SITE.pages) {
      const lower = page.html.toLowerCase();
      expect(lower).not.toContain('<script');
      expect(lower).not.toContain('http://');
      expect(lower).not.toContain('https://');
    }
  });

  it('preserves existing clue puzzle and grants page facts cleanly', () => {
    const home = resolveWithProgress(
      'meridian://delphines-garden/',
      GAME_REGISTRY,
      new Set()
    );
    expect(home.status).toBe('ok');
    if (home.status === 'ok') {
      expect(home.newFacts).toEqual(['visited_delphines_garden']);
    }

    const guestbook = resolveWithProgress(
      'meridian://delphines-garden/guestbook',
      GAME_REGISTRY,
      new Set()
    );
    expect(guestbook.status).toBe('ok');
    if (guestbook.status === 'ok') {
      expect(guestbook.newFacts).toEqual(['read_guestbook']);
    }

    const clueMatch = matchClues(
      'meridian://delphines-garden/guestbook',
      'keep the light on - 11/09',
      CLUE_DEFS,
      new Set()
    );
    expect(clueMatch.newFacts).toEqual(['date_1109']);
  });
});
