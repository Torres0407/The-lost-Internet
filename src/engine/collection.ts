import type { AchievementDef, ArtifactDef, Trigger } from '../content/collection';
import type { Site, SiteRegistry, ValidationProblem } from './types';
import { isUnlocked } from './unlock';
import { normalizeMeridianUrl } from './url';

export interface CollectionInput {
  facts: ReadonlySet<string>;
  discoveredPages: readonly string[];
  clueCount: number;
  insightCount: number;
  sourceViewedUrls: readonly string[];
}

export interface AlreadyUnlockedCollection {
  artifacts: ReadonlySet<string>;
  achievements: ReadonlySet<string>;
}

export interface CollectionEvaluationResult {
  newArtifacts: string[];
  newAchievements: string[];
}

export interface SiteRecoverySummary {
  siteId: string;
  name: string;
  homeUrl: string;
  discoveredCount: number;
  visibleTotal: number;
  recovered: boolean;
}

export interface OverallRecoverySummary {
  sites: SiteRecoverySummary[];
  sitesRecovered: number;
  ringSlots: number;
  percent: number;
}

const RING_SLOTS = 40;

function toNormalizedUrlSet(urls: readonly string[]): Set<string> {
  const result = new Set<string>();
  for (const url of urls) {
    result.add(normalizeMeridianUrl(url) ?? url);
  }
  return result;
}

export function isTriggerMet(trigger: Trigger, input: CollectionInput): boolean {
  switch (trigger.type) {
    case 'page': {
      const target = normalizeMeridianUrl(trigger.url) ?? trigger.url;
      const discovered = toNormalizedUrlSet(input.discoveredPages);
      return discovered.has(target);
    }
    case 'allPages': {
      if (trigger.urls.length === 0) {
        return false;
      }
      const discovered = toNormalizedUrlSet(input.discoveredPages);
      return trigger.urls.every((url) => {
        const target = normalizeMeridianUrl(url) ?? url;
        return discovered.has(target);
      });
    }
    case 'fact':
      return input.facts.has(trigger.id);
    case 'count': {
      switch (trigger.metric) {
        case 'clues':
          return input.clueCount >= trigger.atLeast;
        case 'insights':
          return input.insightCount >= trigger.atLeast;
        case 'pagesDiscovered':
          return toNormalizedUrlSet(input.discoveredPages).size >= trigger.atLeast;
        case 'sourceViews':
          return toNormalizedUrlSet(input.sourceViewedUrls).size >= trigger.atLeast;
      }
    }
  }
}

export function evaluateCollection(
  artifacts: readonly ArtifactDef[],
  achievements: readonly AchievementDef[],
  input: CollectionInput,
  alreadyUnlocked: AlreadyUnlockedCollection
): CollectionEvaluationResult {
  const newArtifacts: string[] = [];
  for (const artifact of artifacts) {
    if (alreadyUnlocked.artifacts.has(artifact.id)) {
      continue;
    }
    if (isTriggerMet(artifact.trigger, input)) {
      newArtifacts.push(artifact.id);
    }
  }

  const newAchievements: string[] = [];
  for (const achievement of achievements) {
    if (alreadyUnlocked.achievements.has(achievement.id)) {
      continue;
    }
    if (isTriggerMet(achievement.trigger, input)) {
      newAchievements.push(achievement.id);
    }
  }

  return { newArtifacts, newAchievements };
}

export function recoverySummary(
  sites: readonly Site[],
  discoveredPages: readonly string[],
  facts: ReadonlySet<string>
): OverallRecoverySummary {
  const discoveredSet = toNormalizedUrlSet(discoveredPages);
  const siteSummaries: SiteRecoverySummary[] = sites.map((site) => {
    let discoveredCount = 0;
    let visibleTotal = 0;
    let firstDiscoveredUrl: string | null = null;
    let firstVisibleUrl: string | null = null;

    for (const page of site.pages) {
      const normalized = normalizeMeridianUrl(page.url) ?? page.url;
      const isDiscovered = discoveredSet.has(normalized);
      const isVisible = (!page.hidden && isUnlocked(page, facts)) || isDiscovered;

      if (isDiscovered) {
        discoveredCount += 1;
        if (!firstDiscoveredUrl) {
          firstDiscoveredUrl = normalized;
        }
      }

      if (isVisible) {
        visibleTotal += 1;
        if (!firstVisibleUrl) {
          firstVisibleUrl = normalized;
        }
      }
    }

    const fallbackUrl =
      site.pages.length > 0
        ? (normalizeMeridianUrl(site.pages[0].url) ?? site.pages[0].url)
        : `meridian://${site.id}/`;

    return {
      siteId: site.id,
      name: site.name,
      homeUrl: firstVisibleUrl ?? firstDiscoveredUrl ?? fallbackUrl,
      discoveredCount,
      visibleTotal,
      recovered: discoveredCount > 0,
    };
  });

  const sitesRecovered = siteSummaries.filter((s) => s.recovered).length;
  const percent = Math.round((sitesRecovered / RING_SLOTS) * 100);

  return {
    sites: siteSummaries,
    sitesRecovered,
    ringSlots: RING_SLOTS,
    percent,
  };
}

function validateTrigger(
  trigger: Trigger,
  ownerLabel: string,
  registry: SiteRegistry,
  problems: ValidationProblem[]
): void {
  if (trigger.type === 'page') {
    const normalized = normalizeMeridianUrl(trigger.url);
    if (!normalized || !registry.pagesByUrl.has(normalized)) {
      problems.push({
        level: 'error',
        message: `${ownerLabel} references unknown trigger page URL "${trigger.url}".`,
        url: trigger.url,
      });
    }
    return;
  }

  if (trigger.type === 'allPages') {
    if (trigger.urls.length === 0) {
      problems.push({
        level: 'error',
        message: `${ownerLabel} has an empty allPages trigger.`,
      });
    }
    for (const rawUrl of trigger.urls) {
      const normalized = normalizeMeridianUrl(rawUrl);
      if (!normalized || !registry.pagesByUrl.has(normalized)) {
        problems.push({
          level: 'error',
          message: `${ownerLabel} references unknown trigger page URL "${rawUrl}".`,
          url: rawUrl,
        });
      }
    }
    return;
  }

  if (trigger.type === 'fact') {
    if (!registry.allGrantedFacts.has(trigger.id)) {
      problems.push({
        level: 'error',
        message: `${ownerLabel} requires fact "${trigger.id}" which is never granted anywhere.`,
        factId: trigger.id,
      });
    }
  }
}

export function validateCollection(
  artifacts: readonly ArtifactDef[],
  achievements: readonly AchievementDef[],
  registry: SiteRegistry
): ValidationProblem[] {
  const problems: ValidationProblem[] = [];

  if (artifacts.length !== 10) {
    problems.push({
      level: 'error',
      message: `Expected exactly 10 artifacts, found ${artifacts.length}.`,
    });
  }

  if (achievements.length !== 8) {
    problems.push({
      level: 'error',
      message: `Expected exactly 8 achievements, found ${achievements.length}.`,
    });
  }

  const seenArtifactIds = new Set<string>();
  for (const artifact of artifacts) {
    if (seenArtifactIds.has(artifact.id)) {
      problems.push({
        level: 'error',
        message: `Duplicate artifact id "${artifact.id}".`,
      });
    } else {
      seenArtifactIds.add(artifact.id);
    }

    validateTrigger(artifact.trigger, `Artifact "${artifact.id}"`, registry, problems);

    if (artifact.sprite.length !== 12) {
      problems.push({
        level: 'error',
        message: `Artifact "${artifact.id}" sprite must have 12 rows (found ${artifact.sprite.length}).`,
      });
    }

    artifact.sprite.forEach((row, rowIndex) => {
      if (row.length !== 12) {
        problems.push({
          level: 'error',
          message: `Artifact "${artifact.id}" sprite row ${rowIndex} must have length 12 (found ${row.length}).`,
        });
      }
      for (const ch of row) {
        if (ch !== '.' && !(ch in artifact.palette)) {
          problems.push({
            level: 'error',
            message: `Artifact "${artifact.id}" sprite uses character "${ch}" missing from palette.`,
          });
        }
      }
    });
  }

  const seenAchievementIds = new Set<string>();
  for (const achievement of achievements) {
    if (seenAchievementIds.has(achievement.id)) {
      problems.push({
        level: 'error',
        message: `Duplicate achievement id "${achievement.id}".`,
      });
    } else {
      seenAchievementIds.add(achievement.id);
    }

    validateTrigger(
      achievement.trigger,
      `Achievement "${achievement.id}"`,
      registry,
      problems
    );
  }

  return problems;
}
