import { describe, expect, it } from 'vitest';
import { CONNECTION_DEFS } from '../connections';
import { GAME_REGISTRY } from '../../engine/gameRegistry';
import { validateContent } from '../../engine/registry';
import { resolveWithProgress } from '../../engine/resolve';
import { normalizeMeridianUrl } from '../../engine/url';
import { BACKROOM_SITE } from './backroom';
import { ALL_SITES, CLUE_DEFS } from './index';
import { RING_HUB_SITE } from './ringHub';
import { TUMBLEWEED_SITE } from './tumbleweed';

const INTENTIONAL_UNRECOVERED_URLS = new Set<string>([
  'meridian://lamplighter/',
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

describe('Tumbleweed Hosting & The Backroom Forum content validation', () => {
  it('passes content validation across all registered sites with zero errors', () => {
    const problems = validateContent(ALL_SITES, CLUE_DEFS, CONNECTION_DEFS);
    const errors = problems.filter((p) => p.level === 'error');
    expect(errors).toEqual([]);
  });

  it('contains all 8 expected Tumbleweed Hosting pages', () => {
    expect(TUMBLEWEED_SITE.pages.map((p) => p.url)).toEqual([
      'meridian://tumbleweed/',
      'meridian://tumbleweed/support',
      'meridian://tumbleweed/status',
      'meridian://tumbleweed/faq',
      'meridian://tumbleweed/terms',
      'meridian://tumbleweed/contact',
      'meridian://tumbleweed/tickets',
      'meridian://tumbleweed/tickets/20417',
    ]);
  });

  it('contains at least 8 Backroom thread pages and all 4 profile pages', () => {
    const urls = BACKROOM_SITE.pages.map((p) => p.url);
    const threadPages = urls.filter((u) => u.startsWith('meridian://backroom/thread/'));
    expect(threadPages.length).toBeGreaterThanOrEqual(8);

    expect(urls).toContain('meridian://backroom/user/lamplighter');
    expect(urls).toContain('meridian://backroom/user/nightcrawler_wren');
    expect(urls).toContain('meridian://backroom/user/xX_DarkPixel_Xx');
    expect(urls).toContain('meridian://backroom/user/GlitterGirl_99');
    expect(urls).toContain('meridian://backroom/search');
  });

  it('resolves every internal meridian:// link in Tumbleweed and Backroom to registered pages or explicit unrecovered allowlist', () => {
    const sitesToCheck = [TUMBLEWEED_SITE, BACKROOM_SITE];
    for (const site of sitesToCheck) {
      for (const page of site.pages) {
        const hrefs = extractMeridianHrefs(page.html);
        expect(hrefs.length).toBeGreaterThan(0);

        for (const rawHref of hrefs) {
          const normalized = normalizeMeridianUrl(rawHref);
          expect(
            normalized,
            `Invalid meridian link "${rawHref}" on ${page.url}`
          ).not.toBeNull();
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
    }
  });

  it('preserves the maintenance window text and maintenance_window_known grant on meridian://tumbleweed/support', () => {
    const support = resolveWithProgress(
      'meridian://tumbleweed/support',
      GAME_REGISTRY,
      new Set()
    );
    expect(support.status).toBe('ok');
    if (support.status === 'ok') {
      expect(support.newFacts).toEqual(['maintenance_window_known']);
      const plainText = support.page.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      expect(plainText.toLowerCase()).toContain('maintenance window');
      expect(plainText).toContain('11/09/2002');
      expect(plainText).toContain('23:00');
    }
  });

  it('grants visited_tumbleweed, read_ticket_20417, and visited_backroom cleanly', () => {
    const twHome = resolveWithProgress('meridian://tumbleweed/', GAME_REGISTRY, new Set());
    expect(twHome.status).toBe('ok');
    if (twHome.status === 'ok') {
      expect(twHome.newFacts).toEqual(['visited_tumbleweed']);
    }

    const ticket = resolveWithProgress(
      'meridian://tumbleweed/tickets/20417',
      GAME_REGISTRY,
      new Set()
    );
    expect(ticket.status).toBe('ok');
    if (ticket.status === 'ok') {
      expect(ticket.newFacts).toEqual(['read_ticket_20417']);
    }

    const brHome = resolveWithProgress('meridian://backroom/', GAME_REGISTRY, new Set());
    expect(brHome.status).toBe('ok');
    if (brHome.status === 'ok') {
      expect(brHome.newFacts).toEqual(['visited_backroom']);
    }
  });

  it('never mentions meridian://lamplighter/log_0911 in Tumbleweed or Backroom HTML', () => {
    for (const site of [TUMBLEWEED_SITE, BACKROOM_SITE]) {
      for (const page of site.pages) {
        expect(page.html.toLowerCase()).not.toContain('lamplighter/log_0911');
      }
    }
  });

  it('keeps the Hub members table at exactly 40 rows', () => {
    const membersPage = RING_HUB_SITE.pages.find(
      (p) => p.url === 'meridian://ring-hub/members'
    );
    expect(membersPage).toBeDefined();
    const tbodyMatch = membersPage!.html.match(/<tbody>([\s\S]*?)<\/tbody>/i);
    expect(tbodyMatch).not.toBeNull();
    const rows = tbodyMatch![1].match(/<tr\b/gi) ?? [];
    expect(rows).toHaveLength(40);
  });

  it('contains no <script, http://, or https:// in Tumbleweed or Backroom page HTML', () => {
    for (const site of [TUMBLEWEED_SITE, BACKROOM_SITE]) {
      for (const page of site.pages) {
        const lower = page.html.toLowerCase();
        expect(lower).not.toContain('<script');
        expect(lower).not.toContain('http://');
        expect(lower).not.toContain('https://');
      }
    }
  });
});
