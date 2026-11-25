import { describe, expect, it } from 'vitest';
import { CONNECTION_DEFS } from '../connections';
import { GAME_REGISTRY } from '../../engine/gameRegistry';
import { validateContent } from '../../engine/registry';
import { resolveWithProgress } from '../../engine/resolve';
import { normalizeMeridianUrl } from '../../engine/url';
import { ALL_SITES, CLUE_DEFS } from './index';
import { RING_HUB_SITE } from './ringHub';

const INTENTIONAL_UNRECOVERED_URLS = new Set<string>();

function extractMeridianHrefs(html: string): string[] {
  const matches = html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi);
  const hrefs: string[] = [];
  for (const match of matches) {
    hrefs.push(match[1]);
  }
  return hrefs;
}

describe('Meridian Ring Hub content validation', () => {
  it('contains all 6 expected pages', () => {
    const urls = RING_HUB_SITE.pages.map((p) => p.url);
    expect(urls).toEqual([
      'meridian://ring-hub/',
      'meridian://ring-hub/members',
      'meridian://ring-hub/news',
      'meridian://ring-hub/rules',
      'meridian://ring-hub/join',
      'meridian://ring-hub/start',
    ]);
  });

  it('passes registry validation with zero errors', () => {
    const problems = validateContent(ALL_SITES, CLUE_DEFS, CONNECTION_DEFS);
    const errors = problems.filter((p) => p.level === 'error');
    expect(errors).toEqual([]);
  });

  it('resolves every meridian:// link in Hub pages to a registered page or intentional unrecovered allowlist', () => {
    for (const page of RING_HUB_SITE.pages) {
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

  it('has exactly 40 rows in the members table with expected cross-reference handles', () => {
    const membersPage = RING_HUB_SITE.pages.find(
      (p) => p.url === 'meridian://ring-hub/members'
    );
    expect(membersPage).toBeDefined();

    const tbodyMatch = membersPage!.html.match(/<tbody>([\s\S]*?)<\/tbody>/i);
    expect(tbodyMatch).not.toBeNull();
    const rows = tbodyMatch![1].match(/<tr\b/gi) ?? [];
    expect(rows).toHaveLength(40);

    // Only Delphine's Garden, The Backroom Forum, and Tumbleweed Hosting should be linked inside the table
    const tableHrefs = extractMeridianHrefs(tbodyMatch![1]).map((u) =>
      normalizeMeridianUrl(u)
    );
    expect(tableHrefs).toEqual([
      'meridian://delphines-garden/',
      'meridian://backroom/',
      'meridian://tumbleweed/',
    ]);

    expect(membersPage!.html).toContain('nightcrawler_wren');
    expect(membersPage!.html).toContain('NightCrawler.net');
    expect(membersPage!.html).toContain('lamplighter');
    expect(membersPage!.html).toContain("Lamplighter's Log");
    expect(membersPage!.html).toContain('xX_DarkPixel_Xx');
    expect(membersPage!.html).toContain('GlitterGirl_99');
  });

  it('has 6 dated 2002 announcements on the news page', () => {
    const newsPage = RING_HUB_SITE.pages.find(
      (p) => p.url === 'meridian://ring-hub/news'
    );
    expect(newsPage).toBeDefined();
    const articles = newsPage!.html.match(/<article\b/gi) ?? [];
    expect(articles).toHaveLength(6);
    expect(newsPage!.html).toContain('11/07/2002');
  });

  it('never mentions the hidden lamplighter log URL in any Hub page HTML', () => {
    for (const page of RING_HUB_SITE.pages) {
      expect(page.html.toLowerCase()).not.toContain('lamplighter/log_0911');
    }
  });

  it('contains no script tags or http:// / https:// URLs in any Hub page HTML', () => {
    for (const page of RING_HUB_SITE.pages) {
      const lower = page.html.toLowerCase();
      expect(lower).not.toContain('<script');
      expect(lower).not.toContain('http://');
      expect(lower).not.toContain('https://');
    }
  });

  it('grants visited_ring_hub and read_recovery_notes cleanly on first visit', () => {
    const home = resolveWithProgress('meridian://ring-hub/', GAME_REGISTRY, new Set());
    expect(home.status).toBe('ok');
    if (home.status === 'ok') {
      expect(home.newFacts).toEqual(['visited_ring_hub']);
    }

    const start = resolveWithProgress(
      'meridian://ring-hub/start',
      GAME_REGISTRY,
      new Set()
    );
    expect(start.status).toBe('ok');
    if (start.status === 'ok') {
      expect(start.newFacts).toEqual(['read_recovery_notes']);
    }
  });
});
