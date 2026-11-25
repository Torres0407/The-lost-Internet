import { describe, expect, it } from 'vitest';
import { CONNECTION_DEFS } from '../connections';
import { matchClues } from '../../engine/clues';
import { evaluateLink } from '../../engine/connections';
import { GAME_REGISTRY } from '../../engine/gameRegistry';
import { addClue, addLink, createInitialNotebookState } from '../../engine/notebook';
import { createNotFoundPage } from '../../engine/pages';
import { validateContent } from '../../engine/registry';
import { resolveWithProgress } from '../../engine/resolve';
import { applyGrants } from '../../engine/unlock';
import { normalizeMeridianUrl } from '../../engine/url';
import { BACKROOM_SITE } from './backroom';
import { ALL_SITES, CLUE_DEFS } from './index';
import { LAMPLIGHTER_SITE } from './lamplighter';
import { NIGHTCRAWLER_SITE } from './nightcrawler';
import { RING_HUB_SITE } from './ringHub';
import { TUMBLEWEED_SITE } from './tumbleweed';

const INTENTIONAL_UNRECOVERED_URLS = new Set<string>([
  'meridian://lamplighter/',
]);

function extractMeridianHrefs(html: string): string[] {
  const matches = html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi);
  const hrefs: string[] = [];
  for (const match of matches) {
    hrefs.push(match[1]);
  }
  return hrefs;
}

describe('NightCrawler.net, Lamplighter log, and connection_deliberate', () => {
  it('passes full content validation across all sites with zero errors', () => {
    const problems = validateContent(ALL_SITES, CLUE_DEFS, CONNECTION_DEFS);
    const errors = problems.filter((p) => p.level === 'error');
    expect(errors).toEqual([]);
  });

  it('preserves the 11/09 puzzle chain end to end and renders the full log text', () => {
    let facts = new Set<string>();

    const dateMatch = matchClues(
      'meridian://delphines-garden/guestbook',
      'keep the light on - 11/09',
      CLUE_DEFS,
      facts
    );
    expect(dateMatch.newFacts).toEqual(['date_1109']);
    facts = applyGrants(dateMatch.newFacts, facts);

    const tw = resolveWithProgress('meridian://tumbleweed/support', GAME_REGISTRY, facts);
    expect(tw.status).toBe('ok');
    if (tw.status === 'ok') {
      facts = applyGrants(tw.newFacts, facts);
    }

    let nb = createInitialNotebookState();
    const c1 = addClue(nb, {
      id: 'c1',
      text: 'keep the light on - 11/09',
      sourceUrl: 'meridian://delphines-garden/guestbook',
      sourceTitle: "Delphine's Guestbook",
    });
    nb = c1.state;
    const c2 = addClue(nb, {
      id: 'c2',
      text: 'maintenance window starting on 11/09/2002 at 23:00',
      sourceUrl: 'meridian://tumbleweed/support',
      sourceTitle: 'Tumbleweed Support',
    });
    nb = c2.state;
    const linked = addLink(nb, 'c1', 'c2');
    nb = linked.state;
    const evalRes = evaluateLink(nb, linked.link!.id, CONNECTION_DEFS, facts);
    expect(evalRes.newFacts).toEqual(['connection_1109']);
    facts = applyGrants(evalRes.newFacts, facts);

    const logRes = resolveWithProgress('meridian://lamplighter/log_0911', GAME_REGISTRY, facts);
    expect(logRes.status).toBe('ok');
    if (logRes.status === 'ok') {
      expect(logRes.newFacts).toEqual(['lamplighter_log_1']);
      expect(logRes.page.html).toContain('Log, 11/09/2002');
      expect(logRes.page.html).toContain('11/09/2002, 22:41');
      expect(logRes.page.html).toContain("I've left the porch light on at Wren's place.");
      expect(extractMeridianHrefs(logRes.page.html)).toEqual([]);
    }
  });

  it('enforces NightCrawler gating cleanly and hides locked pages like 404s', () => {
    const empty = new Set<string>();
    const lockedHome = resolveWithProgress('meridian://nightcrawler/', GAME_REGISTRY, empty);
    expect(lockedHome.status).toBe('locked');
    if (lockedHome.status === 'locked') {
      // No custom lockedNotice so BrowserApp renders identical 404 output to an unknown URL
      expect(lockedHome.page.lockedNotice).toBeUndefined();
      expect(createNotFoundPage('meridian://nightcrawler/').html).toEqual(
        createNotFoundPage('meridian://nightcrawler/').html
      );
    }

    const withLog = new Set<string>(['lamplighter_log_1']);
    const publicPaths = [
      'meridian://nightcrawler/',
      'meridian://nightcrawler/about',
      'meridian://nightcrawler/projects',
      'meridian://nightcrawler/counter',
      'meridian://nightcrawler/guestbook',
    ];
    for (const url of publicPaths) {
      const res = resolveWithProgress(url, GAME_REGISTRY, withLog);
      expect(res.status, `Expected ${url} to unlock with lamplighter_log_1`).toBe('ok');
    }

    const homeOk = resolveWithProgress('meridian://nightcrawler/', GAME_REGISTRY, withLog);
    expect(homeOk.status).toBe('ok');
    if (homeOk.status === 'ok') {
      expect(homeOk.newFacts).toEqual(['visited_nightcrawler']);
    }

    const projectsOk = resolveWithProgress(
      'meridian://nightcrawler/projects',
      GAME_REGISTRY,
      withLog
    );
    expect(projectsOk.status).toBe('ok');
    if (projectsOk.status === 'ok') {
      expect(projectsOk.newFacts).toEqual(['halcyon_is_bot']);
    }

    // /files/ and /files/readme_if_found.txt require halcyon_is_bot
    expect(resolveWithProgress('meridian://nightcrawler/files/', GAME_REGISTRY, withLog).status).toBe(
      'locked'
    );
    expect(
      resolveWithProgress(
        'meridian://nightcrawler/files/readme_if_found.txt',
        GAME_REGISTRY,
        withLog
      ).status
    ).toBe('locked');

    const withBot = new Set<string>(['lamplighter_log_1', 'halcyon_is_bot']);
    expect(resolveWithProgress('meridian://nightcrawler/files/', GAME_REGISTRY, withBot).status).toBe(
      'ok'
    );
    const readmeOk = resolveWithProgress(
      'meridian://nightcrawler/files/readme_if_found.txt',
      GAME_REGISTRY,
      withBot
    );
    expect(readmeOk.status).toBe('ok');
    if (readmeOk.status === 'ok') {
      expect(readmeOk.newFacts).toEqual(['found_readme']);
    }

    // /porchlight requires BOTH found_readme and connection_deliberate
    expect(
      resolveWithProgress(
        'meridian://nightcrawler/porchlight',
        GAME_REGISTRY,
        new Set(['found_readme'])
      ).status
    ).toBe('locked');
    expect(
      resolveWithProgress(
        'meridian://nightcrawler/porchlight',
        GAME_REGISTRY,
        new Set(['connection_deliberate'])
      ).status
    ).toBe('locked');

    const porchlightOk = resolveWithProgress(
      'meridian://nightcrawler/porchlight',
      GAME_REGISTRY,
      new Set(['found_readme', 'connection_deliberate'])
    );
    expect(porchlightOk.status).toBe('ok');
    if (porchlightOk.status === 'ok') {
      expect(porchlightOk.newFacts).toEqual(['halcyon_fragment_1']);
      expect(porchlightOk.page.html).toContain('fragment 1 of 7:');
    }
  });

  it('evaluates connection_deliberate in either clue order and ignores unrelated pairs', () => {
    const buildAndEval = (textA: string, textB: string) => {
      let nb = createInitialNotebookState();
      nb = addClue(nb, {
        id: 'a',
        text: textA,
        sourceUrl: 'meridian://tumbleweed/tickets',
        sourceTitle: 'Tickets',
      }).state;
      nb = addClue(nb, {
        id: 'b',
        text: textB,
        sourceUrl: 'meridian://backroom/general',
        sourceTitle: 'General Chat',
      }).state;
      const linked = addLink(nb, 'a', 'b');
      return evaluateLink(linked.state, linked.link!.id, CONNECTION_DEFS, new Set());
    };

    const forward = buildAndEval('Bulk account removal, shared group 4', 'Thanks for everything, Ring');
    expect(forward.newFacts).toEqual(['connection_deliberate']);
    expect(forward.insight?.insightTitle).toBe('Nobody did this to them');

    const reverse = buildAndEval('Thanks for everything, Ring', 'Bulk account removal, shared group 4');
    expect(reverse.newFacts).toEqual(['connection_deliberate']);
    expect(reverse.insight?.insightTitle).toBe('Nobody did this to them');

    const unrelated = buildAndEval('Tomato Chutney recipe', 'Maple Street Apiary');
    expect(unrelated.insight).toBeNull();
    expect(unrelated.newFacts).toEqual([]);
  });

  it('enforces URL discovery rules for /files/, readme, /porchlight, and lamplighter log', () => {
    for (const site of ALL_SITES) {
      for (const page of site.pages) {
        const lowerHtml = page.html.toLowerCase();
        const hrefs = extractMeridianHrefs(page.html).map((h) => normalizeMeridianUrl(h));

        // Never link to /files, /porchlight, or lamplighter/log_0911
        expect(hrefs).not.toContain('meridian://nightcrawler/files');
        expect(hrefs).not.toContain('meridian://nightcrawler/porchlight');
        expect(hrefs).not.toContain('meridian://lamplighter/log_0911');

        // "/porchlight" and full /files URL must not appear in any page HTML
        expect(lowerHtml).not.toContain('/porchlight');
        expect(lowerHtml).not.toMatch(/meridian:\/\/nightcrawler\/files(?!\/readme_if_found\.txt)/);

        // readme URL must appear ONLY on the /files/ listing page
        if (page.url === 'meridian://nightcrawler/files/') {
          expect(hrefs).toContain('meridian://nightcrawler/files/readme_if_found.txt');
        } else {
          expect(lowerHtml).not.toContain('meridian://nightcrawler/files/readme_if_found.txt');
          expect(hrefs).not.toContain('meridian://nightcrawler/files/readme_if_found.txt');
        }
      }
    }

    // Also verify none of Hub, Tumbleweed, Backroom, NightCrawler, or Lamplighter mention log_0911
    for (const site of [
      RING_HUB_SITE,
      TUMBLEWEED_SITE,
      BACKROOM_SITE,
      NIGHTCRAWLER_SITE,
      LAMPLIGHTER_SITE,
    ]) {
      for (const page of site.pages) {
        expect(page.html.toLowerCase()).not.toContain('lamplighter/log_0911');
      }
    }
  });

  it('resolves every internal meridian:// link across all sites except the unrecovered allowlist', () => {
    for (const site of ALL_SITES) {
      for (const page of site.pages) {
        const hrefs = extractMeridianHrefs(page.html);
        for (const rawHref of hrefs) {
          const normalized = normalizeMeridianUrl(rawHref);
          expect(normalized, `Invalid href "${rawHref}" on ${page.url}`).not.toBeNull();
          if (normalized) {
            const ok =
              GAME_REGISTRY.pagesByUrl.has(normalized) ||
              INTENTIONAL_UNRECOVERED_URLS.has(normalized);
            expect(ok, `Unresolved link "${normalized}" on ${page.url}`).toBe(true);
          }
        }
      }
    }
  });

  it('contains no <script, http://, or https:// in any page across all sites and keeps Hub at 40 rows', () => {
    for (const site of ALL_SITES) {
      for (const page of site.pages) {
        const lower = page.html.toLowerCase();
        expect(lower).not.toContain('<script');
        expect(lower).not.toContain('http://');
        expect(lower).not.toContain('https://');
      }
    }

    const membersPage = RING_HUB_SITE.pages.find(
      (p) => p.url === 'meridian://ring-hub/members'
    );
    expect(membersPage).toBeDefined();
    const tbodyMatch = membersPage!.html.match(/<tbody>([\s\S]*?)<\/tbody>/i);
    expect(tbodyMatch).not.toBeNull();
    const rows = tbodyMatch![1].match(/<tr\b/gi) ?? [];
    expect(rows).toHaveLength(40);
  });
});
